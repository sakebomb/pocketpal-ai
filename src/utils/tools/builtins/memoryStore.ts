import {memoryRepository} from '../../../repositories/MemoryRepository';
import type {RegisteredTool} from '../types';

/**
 * Factory that creates a memory_store tool bound to a specific Pal.
 * The model calls this tool to persist facts across sessions.
 */
export function createMemoryStoreTool(palId: string): RegisteredTool {
  return {
    definition: {
      type: 'function',
      function: {
        name: 'memory_store',
        description:
          'Save an important fact or piece of information to remember in future conversations. Use this when the user shares something personal, sets a preference, or mentions something worth remembering.',
        parameters: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description:
                'The fact to remember, written as a concise statement (e.g. "User\'s name is Alex" or "User prefers responses in bullet points").',
            },
          },
          required: ['content'],
        },
      },
    },
    handler: async (args: Record<string, unknown>): Promise<string> => {
      const content = String(args.content ?? '').trim();
      if (!content) {
        return JSON.stringify({error: 'content must not be empty'});
      }
      try {
        await memoryRepository.addMemory(palId, content);
        return JSON.stringify({success: true});
      } catch (e) {
        return JSON.stringify({error: String(e)});
      }
    },
  };
}
