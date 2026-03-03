import type {RegisteredTool} from '../types';

export const getCurrentTimeTool: RegisteredTool = {
  definition: {
    type: 'function',
    function: {
      name: 'get_current_time',
      description: 'Get the current date and time on the device.',
      parameters: {
        type: 'object',
        properties: {
          timezone: {
            type: 'string',
            description:
              'IANA timezone name (e.g. "America/New_York"). Omit to use the device timezone.',
          },
        },
        required: [],
      },
    },
  },
  handler: async (_args: Record<string, unknown>): Promise<string> => {
    const now = new Date();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return JSON.stringify({
      iso: now.toISOString(),
      local: now.toLocaleString(),
      timezone: tz,
    });
  },
};
