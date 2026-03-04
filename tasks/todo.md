# Active Tasks

## Completed

### PR 1: Agentic tool loop + getCurrentTime
- Pluggable tool registry in src/utils/tools/
- MAX_TOOL_ITERATIONS=8 loop in useChatSession.ts
- jinja:true injection, tool_calls dispatch, tool result appending
- uiStore.activeToolCall + inline "Using <tool>..." indicator in ChatScreen
- getCurrentTime builtin tool

### PR 2: Web Search (Tavily)
- src/store/ApiKeyStore.ts — Tavily key stored in react-native-keychain
- src/utils/tools/builtins/webSearch.ts — Tavily search tool (axios, 10s timeout)
- Registry: web_search gated by pal.capabilities.web === true
- PalSheet: capabilities section with toggles (Tools / Web / Memory)
  - Web and Memory disabled unless Tools is on
- SettingsScreen: "API Keys" card with Tavily key input (masked), save/remove

### PR 3: Persistent Memory
- DB schema v6: memories table (pal_id, content, created_at)
- Migration v5→v6 added
- src/database/models/Memory.ts
- src/repositories/MemoryRepository.ts (get/add/clear per pal)
- src/utils/tools/builtins/memoryStore.ts — memory_store tool (factory, bound to palId)
- Registry: memory_store gated by pal.capabilities.memory === true
- useChatSession.ts: loads memories from DB, injects into system prompt before completion

### PR 4: Document / RAG context
- Schema v7: documents + document_chunks tables (pal_id indexed)
- Migration v6→v7 added
- src/database/models/Document.ts + DocumentChunk.ts
- src/repositories/DocumentRepository.ts (add/list/delete docs, getRelevantChunks)
- src/utils/documentChunker.ts — 1500-char chunks, 200-char overlap, keyword scoring
- DocumentsSection component in PalSheet (edit mode only), file picker + delete list
- useChatSession.ts: injects top-5 relevant chunks before prepareCompletion
- Always available on all Pals (no capability gate — purely additive context)

### PR 5: Streaming fix + Calculator tool
- useChatSession.ts: `hasExecutedAnyTool` flag — streams first call, clears partial on tool invoke
- src/utils/tools/builtins/calculate.ts — hand-rolled recursive descent parser (no deps)
- Registry: calculate added to BASE_REGISTRY (available to all tool-capable Pals)

### PR 6: Prompt Library
- DB schema v8: prompts table (title, content, created_at)
- Migration v7→v8 added
- src/database/models/Prompt.ts
- src/repositories/PromptRepository.ts (getAll/add/delete)
- src/components/PromptPickerSheet/ — browse/add/delete prompts, tap to select
- ChatInput: onPromptPickerPress prop → bookmark icon in left controls
- ChatScreen: PromptPickerSheet wired, selected text injected via initialInputText mechanism

### PR 7: Message edit + regenerate (F) + Context window indicator (G)
- F: Already fully implemented — long-press any user msg → Edit; long-press assistant msg → Regenerate / Regenerate With [model]
  - useMessageActions.ts: handleEdit, handleTryAgain, handleTryAgainWith
  - ChatView.tsx: commitEdit on send, exitEditMode on cancel, context menu wired
- G: Context window indicator in chat header
  - UIStore: lastPromptTokens + lastPromptTokensSessionId (not persisted)
  - useChatSession.ts: clears tokens at send start, sets after completion from result.usage?.prompt_tokens ?? result.timings?.prompt_n
  - ChatHeaderTitle.tsx: shows "Xk / Yk ctx" label below model name (session-scoped, hidden when null)

## Completed

### PR 7: Message edit + regenerate (F) + Context window indicator (G)
- F: Already fully implemented — long-press any user msg → Edit; long-press assistant msg → Regenerate / Regenerate With [model]
  - useMessageActions.ts: handleEdit, handleTryAgain, handleTryAgainWith
  - ChatView.tsx: commitEdit on send, exitEditMode on cancel, context menu wired
- G: Context window indicator in chat header
  - UIStore: lastPromptTokens + lastPromptTokensSessionId (not persisted)
  - useChatSession.ts: clears tokens at send start, sets after completion from result.usage?.prompt_tokens ?? result.timings?.prompt_n
  - ChatHeaderTitle.tsx: shows "Xk / Yk ctx" label below model name (session-scoped, hidden when null)

### PR 8: Artifacts (D)
- react-native-webview native dep (user must: yarn add react-native-webview && cd ios && pod install)
- ArtifactModal component (src/components/ArtifactModal/) — full-screen modal with WebView
  - Renders html/htm/svg code blocks; auto-detects <!DOCTYPE/<html/<svg content
  - SVG wrapped in minimal HTML; bare HTML wrapped if missing doctype
- CodeBlockHeader: onRenderPress? prop — shows PlayIcon button when language is renderable
- MarkdownView: artifact useState, renderers memo passes setArtifact callback, renders ArtifactModal

### PR 9: Auto-title + Context warning
- Auto-title: useChatSession.ts — after first exchange (session.messages.length === 2), fires context.completion() with n_predict:15, temperature:0.3 to generate a 4-6 word title; updates via updateSessionTitleBySessionId(); fire-and-forget, never blocks UI
- Export: Already fully implemented in HeaderRight.tsx via exportUtils.ts (react-native-share, JSON format)
- Context warning: ChatScreen.tsx — inline IIFE checks lastPromptTokens/nCtx > 0.85, shows amber banner "Context nearly full (X%) — consider starting a new chat"

### PR 10: Markdown export + Token estimate + Pal templates + Session search
- Markdown export: exportUtils.ts — exportChatSessionAsMarkdown(), shareJsonData() gains mimeType param; HeaderRight.tsx adds "Export as Markdown" submenu item
- Token estimate: ChatInput.tsx — estimateTokens() helper (~4 chars/token), shows "~Xk" label in rightControls when text is non-empty; tokenEstimate style in styles.ts
- Pal templates: pal-templates.ts — PAL_TEMPLATES array (5 built-ins: Coding, Writing, Research, Brainstorm, Language Tutor); AddPalMenu: "From Template" submenu; BottomActionBar + PalsScreen wired via onCreateFromTemplate
- Session search: SidebarContent.tsx — searchQuery state, filteredSections useMemo, search TextInput with SearchIcon/CloseIcon above session list; searchContainer/searchInput styles in styles.ts

## Completed

### PR 11: Message search within a chat (#603)
- UIStore: chatSearchQuery observable (null=off, string=query) + setChatSearch action
- HeaderRight: search icon button; shows X when active, toggles uiStore.chatSearchQuery
- ChatView: search bar below header (autoFocus TextInput + match count); filters raw messages before calculateChatMessages; clears on session change
- jest.config.js + __mocks__/external/react-native-webview.js: mock added, unblocks all test suites

## Completed

### PR 12: Draft autosave (#604)
- ChatSessionStore.draftTexts: Map<sessionId, text> (ephemeral, MobX-observed)
- Session switch: saves outgoing draft, restores incoming
- Send: clears draft
- onChangeText in ChatView keeps draft in sync

### PR 13: Quick generation settings panel (#605)
- QuickGenSettingsSheet: compact Sheet with InputSlider for temperature/top-p/max-tokens
- Temperature pill in ChatInput left controls (shows T: X.X, only when session active + model loaded)
- Saves to session via updateSessionCompletionSettings, marks session as 'custom'
- Reset to defaults button

## Pending

### Blocked: TTS output (H)
- Needs `react-native-tts` native dep

### Future: Voice input / STT (I)
- On-device Whisper via llama.rn audio pipeline
