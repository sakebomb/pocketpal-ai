import React, {useRef} from 'react';

import {toJS, runInAction} from 'mobx';

import {chatSessionRepository} from '../repositories/ChatSessionRepository';

import {randId} from '../utils';
import {L10nContext} from '../utils';
import {chatSessionStore, modelStore, palStore, uiStore} from '../store';

import {MessageType, User} from '../utils/types';
import {createMultimodalWarning} from '../utils/errors';
import {resolveSystemMessages} from '../utils/systemPromptResolver';
import {convertToChatMessages, removeThinkingParts} from '../utils/chat';
import {activateKeepAwake, deactivateKeepAwake} from '../utils/keepAwake';
import {
  toApiCompletionParams,
  CompletionParams,
} from '../utils/completionTypes';
import {getToolsForPal} from '../utils/tools';
import {hasMemoryCapability} from '../utils/pal-capabilities';
import {memoryRepository} from '../repositories/MemoryRepository';
import {documentRepository} from '../repositories/DocumentRepository';

// Helper function to prepare completion parameters using OpenAI-compatible messages API
const prepareCompletion = async ({
  imageUris,
  message,
  systemMessages,
  context,
  assistant,
  conversationIdRef,
  isMultimodalEnabled,
  l10n,
  currentMessages,
}: {
  imageUris: string[];
  message: MessageType.PartialText;
  systemMessages: Array<{role: 'system'; content: string}>;
  context: any;
  assistant: User;
  conversationIdRef: string;
  isMultimodalEnabled: boolean;
  l10n: any;
  currentMessages: MessageType.Any[];
}) => {
  const sessionCompletionSettings =
    await chatSessionStore.getCurrentCompletionSettings();
  const stopWords = toJS(modelStore.activeModel?.stopWords);

  // Check if we have images and if multimodal is enabled
  const hasImages = imageUris && imageUris.length > 0;

  // Create user message content - use array format only for multimodal, string for text-only
  let userMessageContent: any;

  if (hasImages && isMultimodalEnabled) {
    // Multimodal: use array format with text and images
    userMessageContent = [
      {
        type: 'text',
        text: message.text,
      },
      ...imageUris.map(path => ({
        type: 'image_url',
        image_url: {url: path}, // llama.rn handles file:// prefix removal
      })),
    ];
  } else {
    // Text-only: use simple string format
    userMessageContent = message.text;

    // Show warning if user tried to send images but multimodal is not enabled
    if (hasImages && !isMultimodalEnabled) {
      uiStore.setChatWarning(
        createMultimodalWarning(l10n.chat.multimodalNotEnabled),
      );
    }
  }

  // Convert chat session messages to llama.rn format
  let chatMessages = convertToChatMessages(
    currentMessages.filter(msg => msg.type !== 'image'),
    isMultimodalEnabled,
  );

  // Check if we should include thinking parts in the context
  const includeThinkingInContext =
    (sessionCompletionSettings as CompletionParams)
      ?.include_thinking_in_context !== false;

  // If the user has disabled including thinking parts, remove them from assistant messages
  if (!includeThinkingInContext) {
    chatMessages = chatMessages.map(msg => {
      if (msg.role === 'assistant' && typeof msg.content === 'string') {
        return {
          ...msg,
          content: removeThinkingParts(msg.content),
        };
      }
      return msg;
    });
  }

  // Create the messages array for llama.rn - same format for all cases
  const messages = [
    ...systemMessages,
    ...chatMessages,
    {
      role: 'user',
      content: userMessageContent,
    },
  ];

  // Create completion params with app-specific properties
  const completionParamsWithAppProps = {
    ...sessionCompletionSettings,
    messages,
    stop: stopWords,
  };

  // Strip app-specific properties before passing to llama.rn
  const cleanCompletionParams = toApiCompletionParams(
    completionParamsWithAppProps as CompletionParams,
  );

  // If enable_thinking is true, set reasoning_format to 'auto'
  // This returns the reasoning content in a separate field (reasoning_content)
  if (cleanCompletionParams.enable_thinking) {
    cleanCompletionParams.reasoning_format = 'auto';
  }

  // Create empty assistant message in both database and store
  const createdAt = Date.now();
  const emptyMessage: MessageType.Text = {
    author: assistant,
    createdAt: createdAt,
    id: '', // Will be set by addMessageToCurrentSession
    text: '',
    type: 'text',
    metadata: {
      contextId: context.id,
      conversationId: conversationIdRef,
      copyable: true,
      multimodal: hasImages, // Simple check based on presence of images
    },
  };

  // Use store method to ensure message is added to both database AND MobX observable store
  await chatSessionStore.addMessageToCurrentSession(emptyMessage);

  const messageInfo = {
    createdAt,
    id: emptyMessage.id, // This is now set by addMessageToCurrentSession
    sessionId: chatSessionStore.activeSessionId!,
  };

  return {cleanCompletionParams, messageInfo};
};

export const useChatSession = (
  currentMessageInfo: React.MutableRefObject<{
    createdAt: number;
    id: string;
    sessionId: string;
  } | null>,
  user: User,
  assistant: User,
) => {
  const l10n = React.useContext(L10nContext);
  const conversationIdRef = useRef<string>(randId());

  const addMessage = async (message: MessageType.Any) => {
    await chatSessionStore.addMessageToCurrentSession(message);
  };

  const addSystemMessage = async (text: string, metadata = {}) => {
    const textMessage: MessageType.Text = {
      author: assistant,
      createdAt: Date.now(),
      id: randId(),
      text,
      type: 'text',
      metadata: {system: true, ...metadata},
    };
    await addMessage(textMessage);
  };

  const handleSendPress = async (message: MessageType.PartialText) => {
    const context = modelStore.context;
    if (!context) {
      await addSystemMessage(l10n.chat.modelNotLoaded);
      return;
    }

    // Extract imageUris from the message object
    const imageUris = message.imageUris;
    // Check if we have images in the current message
    const hasImages = imageUris && imageUris.length > 0;

    const isMultimodalEnabled = await modelStore.isMultimodalEnabled();

    // Get the current session messages BEFORE adding the new user message
    // Use toJS to get a snapshot and avoid MobX reactivity issues
    const currentMessages = toJS(chatSessionStore.currentSessionMessages);

    // Create the user message with embedded images
    const textMessage: MessageType.Text = {
      author: user,
      createdAt: Date.now(),
      id: '', // Will be set by the database
      text: message.text,
      type: 'text',
      imageUris: hasImages ? imageUris : undefined, // Include images directly in the text message
      metadata: {
        contextId: context.id,
        conversationId: conversationIdRef.current,
        copyable: true,
        multimodal: hasImages, // Mark as multimodal if it has images
      },
    };
    await addMessage(textMessage);
    modelStore.setInferencing(true);
    modelStore.setIsStreaming(false);
    chatSessionStore.setIsGenerating(true);

    // Keep screen awake during completion
    try {
      activateKeepAwake();
    } catch (error) {
      console.error('Failed to activate keep awake during chat:', error);
      // Continue with chat even if keep awake fails
    }

    const activeSession = chatSessionStore.sessions.find(
      s => s.id === chatSessionStore.activeSessionId,
    );

    // Resolve system messages using utility function
    const pal = activeSession?.activePalId
      ? palStore.pals.find(p => p.id === activeSession.activePalId)
      : null;

    let systemMessages = resolveSystemMessages({
      pal,
      model: modelStore.activeModel,
    });

    // Inject persisted memories into the system prompt for memory-capable Pals
    if (pal && hasMemoryCapability(pal) && pal.id) {
      try {
        const memories = await memoryRepository.getMemoriesForPal(pal.id);
        if (memories.length > 0) {
          const memoryBlock =
            '\n\n## What I remember about the user:\n' +
            memories.map(m => `- ${m}`).join('\n');
          if (systemMessages.length > 0) {
            systemMessages = [
              {
                role: 'system' as const,
                content: systemMessages[0].content + memoryBlock,
              },
            ];
          } else {
            systemMessages = [{role: 'system' as const, content: memoryBlock}];
          }
        }
      } catch (e) {
        // Non-fatal: proceed without memories if DB read fails
        console.error('Failed to load memories:', e);
      }
    }

    // Inject relevant document chunks into the system prompt (RAG)
    if (pal && pal.id) {
      try {
        const relevantChunks = await documentRepository.getRelevantChunksForPal(
          pal.id,
          message.text,
        );
        if (relevantChunks.length > 0) {
          const ragBlock =
            '\n\n## Relevant context from attached documents:\n' +
            relevantChunks.map((c, i) => `### Excerpt ${i + 1}\n${c}`).join('\n\n');
          if (systemMessages.length > 0) {
            systemMessages = [
              {
                role: 'system' as const,
                content: systemMessages[0].content + ragBlock,
              },
            ];
          } else {
            systemMessages = [{role: 'system' as const, content: ragBlock}];
          }
        }
      } catch (e) {
        // Non-fatal: proceed without RAG context if DB read fails
        console.error('Failed to load document chunks:', e);
      }
    }

    // Prepare completion parameters and create message record
    const {cleanCompletionParams, messageInfo} = await prepareCompletion({
      imageUris: imageUris || [],
      message,
      systemMessages,
      context,
      assistant,
      conversationIdRef: conversationIdRef.current,
      isMultimodalEnabled,
      l10n,
      currentMessages,
    });

    currentMessageInfo.current = messageInfo;

    // Maximum number of tool-call → execute → re-prompt iterations
    const MAX_TOOL_ITERATIONS = 8;

    // Get tools for the active Pal (empty lists if Pal has no tools capability)
    const {definitions: toolDefinitions, handlers: toolHandlers} =
      getToolsForPal(pal);
    const hasTools = toolDefinitions.length > 0;

    // Inject tools into completion params when the Pal supports them.
    // jinja: true is required for the model to handle tool call formatting.
    if (hasTools) {
      cleanCompletionParams.tools = toolDefinitions as any;
      cleanCompletionParams.tool_choice = 'auto' as any;
      cleanCompletionParams.jinja = true;
    }

    uiStore.setLastPromptTokens(null, chatSessionStore.activeSessionId);

    try {
      // Track time to first token
      const completionStartTime = Date.now();
      let timeToFirstToken: number | null = null;

      // Streaming callback — used on the first iteration of every completion.
      // If the model invokes a tool, the partial text is cleared and subsequent
      // iterations run silently; the final answer is then set in one shot.
      // If no tools are called, the first (and only) iteration streams normally.
      const streamingCallback = (data: any) => {
        if (currentMessageInfo.current) {
          if (timeToFirstToken === null && (data.token || data.content)) {
            timeToFirstToken = Date.now() - completionStartTime;
          }

          if (!modelStore.isStreaming) {
            modelStore.setIsStreaming(true);
          }

          const {content = '', reasoning_content: reasoningContent} = data;

          if (content || reasoningContent) {
            const update: any = {
              metadata: {
                partialCompletionResult: {
                  reasoning_content: reasoningContent,
                  content: content.replace(/^\s+/, ''),
                },
              },
            };

            if (content) {
              update.text = content.replace(/^\s+/, '');
            }

            chatSessionStore.updateMessageStreaming(
              currentMessageInfo.current.id,
              currentMessageInfo.current.sessionId,
              update,
            );
          }
        }
      };

      // Mutable message list for the tool loop
      let loopMessages = [...(cleanCompletionParams.messages ?? [])];
      let result: any = null;
      // Tracks whether any tool call has been executed this turn.
      // Used to decide streaming strategy: stream until the first tool call,
      // then run silently and set the final answer in one shot.
      let hasExecutedAnyTool = false;

      for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
        // Check if the user stopped generation between iterations
        if (!modelStore.inferencing) {
          break;
        }

        const iterParams = {...cleanCompletionParams, messages: loopMessages};

        // Stream on the first call (no tool executed yet) so the user sees tokens
        // arriving immediately. Once a tool fires, run silently — the final answer
        // will be set in one shot after all tools resolve.
        const shouldStream = !hasExecutedAnyTool;
        const completionPromise = context.completion(
          iterParams,
          shouldStream ? streamingCallback : undefined,
        );

        // Register so releaseContext can wait for the promise to finish
        modelStore.registerCompletionPromise(completionPromise);
        result = await completionPromise;
        modelStore.clearCompletionPromise();

        // No tool calls → this is the final answer, exit the loop
        if (!result.tool_calls || result.tool_calls.length === 0) {
          break;
        }

        // Tool call(s) returned. If we were streaming partial text, clear it —
        // the tool indicator will take over and the final answer comes in one shot.
        if (shouldStream && currentMessageInfo.current) {
          chatSessionStore.updateMessageStreaming(
            currentMessageInfo.current.id,
            currentMessageInfo.current.sessionId,
            {text: ''},
          );
          modelStore.setIsStreaming(false);
        }

        hasExecutedAnyTool = true;

        // Sanitize tool_calls: llama.cpp requires id to be a string, but some
        // models (e.g. Qwen2.5) don't emit IDs and the native bridge returns null.
        const sanitizedToolCalls = result.tool_calls.map(
          (tc: any, idx: number) => ({
            ...tc,
            id: tc.id != null ? tc.id : `call_${idx}`,
          }),
        );

        // Append the assistant's tool-call turn to the message list
        loopMessages = [
          ...loopMessages,
          {
            role: 'assistant' as const,
            content: result.text ?? '',
            tool_calls: sanitizedToolCalls,
          },
        ];

        // Execute each requested tool and append results
        const MAX_TOOL_ARGS_LENGTH = 10000;
        for (const toolCall of sanitizedToolCalls) {
          const toolName: string = toolCall.function?.name ?? 'unknown';
          uiStore.setActiveToolCall(toolName);

          let toolResultContent: string;
          try {
            // Validate tool name against registered handlers
            const handler = toolHandlers[toolName];
            if (!handler) {
              toolResultContent = JSON.stringify({
                error: `Unknown tool: ${toolName}`,
              });
            } else {
              const rawArgs = toolCall.function?.arguments ?? '{}';
              if (rawArgs.length > MAX_TOOL_ARGS_LENGTH) {
                toolResultContent = JSON.stringify({
                  error: 'Tool arguments too large.',
                });
              } else {
                const args = JSON.parse(rawArgs);
                toolResultContent = await handler(args);
              }
            }
          } catch (e) {
            toolResultContent = JSON.stringify({error: String(e)});
          }

          // Wrap tool results in delimiters to reduce prompt injection surface
          loopMessages = [
            ...loopMessages,
            {
              role: 'tool' as const,
              tool_call_id: toolCall.id,
              content: `<tool_result name="${toolName}">\n${toolResultContent}\n</tool_result>`,
            },
          ];
        }
      }

      // Always clear the tool indicator when the loop exits
      uiStore.setActiveToolCall(null);

      // If result is still null (user stopped before any completion), bail out cleanly
      if (!result) {
        modelStore.setInferencing(false);
        modelStore.setIsStreaming(false);
        chatSessionStore.setIsGenerating(false);
        return;
      }

      // If tools were executed, streaming didn't show the final answer —
      // set it in one shot now. If no tools were executed, streaming already
      // populated the message text so nothing to do here.
      if (hasExecutedAnyTool && result.text && currentMessageInfo.current) {
        chatSessionStore.updateMessageStreaming(
          currentMessageInfo.current.id,
          currentMessageInfo.current.sessionId,
          {text: result.text.replace(/^\s+/, '')},
        );
      }

      // Log completion result with time to first token for debugging
      if (__DEV__) {
        console.log('Completion result:', {
          ...result.timings,
          time_to_first_token_ms: timeToFirstToken,
          reasoning_content: result.reasoning_content,
          content: result.content,
          text: result.text,
        });
        console.log('result', result);
      }

      // Update final completion metadata
      await chatSessionStore.updateMessage(
        currentMessageInfo.current.id,
        currentMessageInfo.current.sessionId,
        {
          metadata: {
            timings: {
              ...result.timings,
              time_to_first_token_ms: timeToFirstToken,
            },
            copyable: true,
            // Add multimodal flag if this was a multimodal completion
            multimodal: hasImages && isMultimodalEnabled,
            // Save the final completion result with reasoning_content
            completionResult: {
              reasoning_content: result.reasoning_content,
              content: result.text,
            },
          },
        },
      );
      // Surface prompt token count for context window indicator
      const promptTokens =
        (result as any)?.usage?.prompt_tokens ??
        (result as any)?.timings?.prompt_n ??
        null;
      uiStore.setLastPromptTokens(promptTokens, chatSessionStore.activeSessionId);

      modelStore.setInferencing(false);
      modelStore.setIsStreaming(false);
      chatSessionStore.setIsGenerating(false);

      // Auto-generate session title on the first exchange (2 messages: user + assistant)
      const sessionForTitle = chatSessionStore.activeSessionId
        ? chatSessionStore.sessions.find(
            s => s.id === chatSessionStore.activeSessionId,
          )
        : null;
      if (
        sessionForTitle &&
        sessionForTitle.messages.length === 2 &&
        result?.text &&
        context
      ) {
        const userText = message.text.slice(0, 500);
        const assistantText = result.text.slice(0, 500);
        const titleSessionId = chatSessionStore.activeSessionId!;
        // Fire-and-forget — never blocks the UI
        context
          .completion({
            messages: [
              {
                role: 'user' as const,
                content: `Conversation:\nUser: ${userText}\nAssistant: ${assistantText}\n\nWrite a concise 4-6 word title for this conversation. Output only the title.`,
              },
            ],
            n_predict: 15,
            temperature: 0.3,
            stop: ['\n', '.'],
          })
          .then(titleResult => {
            const title = titleResult?.text
              ?.trim()
              .replace(/^["'`]|["'`]$/g, '');
            if (title && title.length > 2) {
              chatSessionStore.updateSessionTitleBySessionId(
                titleSessionId,
                title,
              );
            }
          })
          .catch(() => {});
      }
    } catch (error) {
      // Clear the promise and tool indicator on error
      modelStore.clearCompletionPromise();
      uiStore.setActiveToolCall(null);
      console.error('Completion error:', error);
      modelStore.setInferencing(false);
      modelStore.setIsStreaming(false);
      chatSessionStore.setIsGenerating(false);

      // Clean up the empty assistant message that was created before the error
      if (currentMessageInfo.current) {
        try {
          await chatSessionRepository.deleteMessage(
            currentMessageInfo.current.id,
          );
          // Also remove from local state
          const session = chatSessionStore.sessions.find(
            s => s.id === currentMessageInfo.current!.sessionId,
          );
          if (session) {
            runInAction(() => {
              session.messages = session.messages.filter(
                msg => msg.id !== currentMessageInfo.current!.id,
              );
            });
          }
        } catch (cleanupError) {
          console.error(
            'Failed to clean up empty message after error:',
            cleanupError,
          );
        }
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('network')) {
        // TODO: This can be removed. We don't use network for chat.
        await addSystemMessage(l10n.common.networkError);
      } else {
        await addSystemMessage(`${l10n.chat.completionFailed}${errorMessage}`);
      }
    } finally {
      // Always try to deactivate keep awake in finally block
      try {
        deactivateKeepAwake();
      } catch (error) {
        console.error('Failed to deactivate keep awake after chat:', error);
      }
    }
  };

  const handleResetConversation = async () => {
    conversationIdRef.current = randId();
    await addSystemMessage(l10n.chat.conversationReset);
  };

  const handleStopPress = async () => {
    const context = modelStore.context;
    if (modelStore.inferencing && context) {
      context.stopCompletion();
    }
    modelStore.setInferencing(false);
    modelStore.setIsStreaming(false);
    chatSessionStore.setIsGenerating(false);

    // Deactivate keep awake when stopping completion
    try {
      deactivateKeepAwake();
    } catch (error) {
      console.error(
        'Failed to deactivate keep awake after stopping chat:',
        error,
      );
    }
  };

  return {
    handleSendPress,
    handleResetConversation,
    handleStopPress,
    // Add a method to check if multimodal is enabled
    isMultimodalEnabled: async () => await modelStore.isMultimodalEnabled(),
  };
};
