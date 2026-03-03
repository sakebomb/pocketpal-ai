# PocketPal AI — Project Memory

## Goal
Make PocketPal AI as capable as OpenWebUI — a full-featured AI assistant that runs on-device.

## Project Overview
- React Native app (iOS + Android) running SLMs locally via `llama.rn` (0.11.0 / llama.cpp)
- MobX state management, WatermelonDB for persistence, AsyncStorage for settings
- `react-native-keychain` already installed (for secure API key storage)
- `@react-native-documents/picker` already installed (for file/doc picking)

## Key Files
- `src/store/ChatSessionStore.ts` — session/message management (994 lines)
- `src/store/ModelStore.ts` — model loading, inference context
- `src/hooks/useChatSession.ts` — completion call site (439 lines), where the agentic loop goes
- `src/utils/completionTypes.ts` — CompletionParams type (wraps llama.rn)
- `src/types/pal.ts` — Pal interface + PalCapabilities
- `src/utils/pal-capabilities.ts` — capability check helpers (all stubs so far)
- `src/hooks/useStructuredOutput.ts` — json_schema constrained generation

## What Already Exists (Stubs/Infra)
- `PalCapabilities` has: `video`, `multimodal`, `realtime`, `audio`, `web`, `code`, `memory`, `tools`
- `hasMemoryCapability()`, `hasWebCapability()`, `hasToolsCapability()` — defined but no implementations
- llama.rn supports: `tools`, `tool_choice`, `result.tool_calls`, `grammar`, `json_schema` — tested in DevToolsScreen
- `allow_fork` field in WatermelonDB schema — not surfaced in UI yet
- Attachment button + image picker in ChatInput — images only wired to VideoPal, not general chat

## Agentic Loop — DONE (PR 1)
Implemented in `useChatSession.ts`. Key design:
- `getToolsForPal(pal)` in `src/utils/tools/registry.ts` — returns tools for active Pal based on `tools` capability
- Loop runs up to `MAX_TOOL_ITERATIONS=8`, appending tool results as `role: 'tool'` messages
- `jinja: true` injected when tools are present (required by llama.rn for tool call formatting)
- No streaming during tool iterations; final answer set in one shot via `updateMessageStreaming`
- `uiStore.activeToolCall: string | null` drives inline "Using <tool>..." chip in ChatScreen
- To add a new tool: add to `REGISTRY` in `src/utils/tools/registry.ts`
- Note: `as any` casts on `tools`/`tool_choice` since llama.rn types may not expose them yet

## Feature Roadmap (Agreed Priority)
1. ✅ **Agentic loop** — `src/utils/tools/`, `useChatSession.ts` loop, getCurrentTime tool
2. ✅ **Web search (Tavily)** — `src/store/ApiKeyStore.ts`, `webSearch.ts` tool, capabilities UI in PalSheet, Tavily key in SettingsScreen
3. ✅ **Persistent memory** — DB v6 `memories` table, `memory_store` tool (model-driven), system prompt injection
4. ✅ **Document/RAG context** — DB v7 `documents`+`document_chunks` tables, `DocumentRepository`, `documentChunker.ts` (1500-char chunks/200 overlap + keyword scoring), `DocumentsSection` component in PalSheet (edit mode), top-5 chunks injected into system prompt
5. ✅ **General image attachment** — already wired; `+` button shows for non-video pals, gated by model multimodal support
6. ✅ **Streaming on final tool answer** — `hasExecutedAnyTool` flag; streams first call, clears partial text on tool invocation, final answer set in one shot
7. ✅ **Calculator tool** — `calculate.ts` recursive descent parser, no deps, wired into BASE_REGISTRY
8. ✅ **Prompt library** — DB v8 `prompts` table, `PromptRepository`, `PromptPickerSheet` (add/select/delete), bookmark icon in ChatInput left controls, injected via `initialInputText` mechanism
9. ✅ **Artifacts** — `ArtifactModal` (full-screen WebView), `CodeBlockHeader` Play button, `MarkdownView` wired. Needs `react-native-webview` native dep install by user.
10. ✅ **Auto-title + Context warning** — auto-title via fire-and-forget completion after first exchange; amber banner when >85% ctx used
11. ✅ **Markdown export** — `exportChatSessionAsMarkdown()` in exportUtils.ts; "Export as Markdown" in HeaderRight submenu
12. ✅ **Token estimate** — `estimateTokens()` (~4 chars/token) shown as `~Xk` in ChatInput rightControls while typing
13. ✅ **Pal templates** — `PAL_TEMPLATES` (5 built-ins) in pal-templates.ts; "From Template" submenu in AddPalMenu
14. ✅ **Session search** — search bar in SidebarContent with `filteredSections` useMemo filter
15. **TTS output** — needs `react-native-tts` native dep
16. **Voice input (STT)** — on-device Whisper

## Architecture Notes
- **Tool framework** — pluggable registry in `src/utils/tools/registry.ts`. Add a tool: add to REGISTRY or use factory for pal-scoped tools (memory_store pattern)
- **Capability gating** — `tools` enables the loop; `web` adds web_search; `memory` adds memory_store + injects stored facts into system prompt
- **Memory approach** — model-driven (model calls memory_store tool itself), not auto-extracted. Facts stored in WatermelonDB `memories` table per palId
- **Web search** — Tavily API key stored in react-native-keychain via `ApiKeyStore`. Privacy disclaimer needed in PalSheet (TODO)
- **DB versions** — currently v8. memories v6; documents+chunks v7; prompts v8
- **RAG** — `documentRepository.getRelevantChunksForPal(palId, query)` → injected after memory block; keyword scoring in `documentChunker.ts`; always-on (no capability gate)
- **Prompt library** — `PromptPickerSheet` opened via bookmark icon in ChatInput; `onPromptPickerPress` in `ChatInputAdditionalProps`; text injected via `initialInputText`/`onInitialTextConsumed` in ChatView/ChatScreen
- **Streaming fix** — tool loop streams first call; if tools fire, clears partial text + continues silently; final answer set in one shot only when `hasExecutedAnyTool`
- Not all SLMs support function calling — Qwen 2.5, Phi-3.5 Mini, Llama 3.2 work; Gemma 2 less so
- For RAG V1: BM25/keyword is good enough, no vectors needed; V2 can use llama.rn embeddings
- **PalSheet** — capabilities section added with Tool Use / Web Search / Memory toggles. Web+Memory disabled unless Tools is on.
