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
      if (content.length > 500) {
        return JSON.stringify({error: 'Memory content too long (max 500 characters). Be more concise.'});
      }
      try {
        // Enforce per-pal memory limit
        const existing = await memoryRepository.getMemoriesForPal(palId);
        if (existing.length >= 100) {
          return JSON.stringify({error: 'Memory limit reached (100). Remove old memories first.'});
        }
        await memoryRepository.addMemory(palId, content);
        return JSON.stringify({success: true});
      } catch (e) {
        return JSON.stringify({error: String(e)});
      }
    },
  };
}
