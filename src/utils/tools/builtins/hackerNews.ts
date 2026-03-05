import axios from 'axios';

import type {RegisteredTool} from '../types';

const HN_BASE = 'https://hacker-news.firebaseio.com/v1';

export const hackerNewsTool: RegisteredTool = {
  definition: {
    type: 'function',
    function: {
      name: 'hacker_news',
      description:
        'Get the top stories from Hacker News. Use for tech news, startup news, or when asked "what\'s trending in tech?".',
      parameters: {
        type: 'object',
        properties: {
          count: {
            type: 'string',
            description: 'Number of top stories to return (1-10). Defaults to 5.',
          },
        },
        required: [],
      },
    },
  },
  handler: async (args: Record<string, unknown>): Promise<string> => {
    const count = Math.min(
      Math.max(1, parseInt(String(args.count ?? '5'), 10) || 5),
      10,
    );

    try {
      const topIds: number[] = (
        await axios.get(`${HN_BASE}/topstories.json`, {timeout: 8000})
      ).data.slice(0, count);

      const stories = await Promise.all(
        topIds.map(id =>
          axios
            .get(`${HN_BASE}/item/${id}.json`, {timeout: 5000})
            .then(r => r.data),
        ),
      );

      const formatted = stories.map((s: any) => ({
        title: s.title,
        url: s.url ?? `https://news.ycombinator.com/item?id=${s.id}`,
        score: s.score,
        comments: s.descendants ?? 0,
        by: s.by,
      }));

      return JSON.stringify({stories: formatted});
    } catch (error) {
      const msg = axios.isAxiosError(error) && error.response
        ? `Hacker News fetch failed: ${error.response.status}`
        : 'Hacker News fetch failed. Check internet connection.';
      return JSON.stringify({error: msg});
    }
  },
};
