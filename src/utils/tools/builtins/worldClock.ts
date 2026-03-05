import type {RegisteredTool} from '../types';

const CITY_MAP: Record<string, string> = {
  tokyo: 'Asia/Tokyo',
  london: 'Europe/London',
  'new york': 'America/New_York',
  paris: 'Europe/Paris',
  sydney: 'Australia/Sydney',
  dubai: 'Asia/Dubai',
  singapore: 'Asia/Singapore',
  berlin: 'Europe/Berlin',
  toronto: 'America/Toronto',
  chicago: 'America/Chicago',
  'los angeles': 'America/Los_Angeles',
  la: 'America/Los_Angeles',
  nyc: 'America/New_York',
  shanghai: 'Asia/Shanghai',
  beijing: 'Asia/Shanghai',
  moscow: 'Europe/Moscow',
  mumbai: 'Asia/Kolkata',
  delhi: 'Asia/Kolkata',
  'hong kong': 'Asia/Hong_Kong',
  seoul: 'Asia/Seoul',
  bangkok: 'Asia/Bangkok',
  cairo: 'Africa/Cairo',
  'sao paulo': 'America/Sao_Paulo',
  'mexico city': 'America/Mexico_City',
  amsterdam: 'Europe/Amsterdam',
  rome: 'Europe/Rome',
  madrid: 'Europe/Madrid',
};

export const worldClockTool: RegisteredTool = {
  definition: {
    type: 'function',
    function: {
      name: 'world_clock',
      description:
        "Get the current time in any city or timezone. Examples: 'Tokyo', 'New York', 'Europe/London', 'America/Los_Angeles'.",
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description:
              'City name or IANA timezone string (e.g. "Tokyo" or "America/New_York").',
          },
        },
        required: ['location'],
      },
    },
  },
  handler: async (args: Record<string, unknown>): Promise<string> => {
    const location = String(args.location ?? '').trim();
    const normalized = location.toLowerCase();
    const timezone = CITY_MAP[normalized] ?? location;

    try {
      const now = new Date();

      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });

      const offsetFormatter = new Intl.DateTimeFormat('en', {
        timeZone: timezone,
        timeZoneName: 'shortOffset',
      });

      const utcOffset =
        offsetFormatter
          .formatToParts(now)
          .find(p => p.type === 'timeZoneName')?.value ?? '';

      return JSON.stringify({
        location,
        timezone,
        datetime: formatter.format(now),
        utc_offset: utcOffset,
      });
    } catch {
      return JSON.stringify({
        error: `Unknown timezone or city: ${location}. Try an IANA timezone like 'America/New_York' or a city name.`,
      });
    }
  },
};
