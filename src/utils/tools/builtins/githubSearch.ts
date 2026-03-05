import axios from 'axios';

import type {RegisteredTool} from '../types';

export const githubSearchTool: RegisteredTool = {
  definition: {
    type: 'function',
    function: {
      name: 'github_search',
      description:
        'Search GitHub repositories by topic, language, or keywords. Returns stars, description, and URL.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description:
              'Search query. Can include filters like "language:python" or "topic:machine-learning".',
          },
          limit: {
            type: 'string',
            description: 'Number of results to return (1-5). Defaults to 5.',
          },
          sort: {
            type: 'string',
            description: '"stars" (default) or "updated".',
          },
        },
        required: ['query'],
      },
    },
  },
  handler: async (args: Record<string, unknown>): Promise<string> => {
    const query = String(args.query ?? '').trim();
    const limit = Math.min(
      Math.max(1, parseInt(String(args.limit ?? '5'), 10) || 5),
      5,
    );
    const sort = String(args.sort ?? '') === 'updated' ? 'updated' : 'stars';

    try {
      const res = await axios.get(
        'https://api.github.com/search/repositories',
        {
          headers: {
            'User-Agent': 'PocketPal/1.0',
            Accept: 'application/vnd.github.v3+json',
          },
          params: {
            q: query,
            sort,
            order: 'desc',
            per_page: limit,
          },
          timeout: 8000,
        },
      );

      const items: Array<{
        full_name: string;
        description: string | null;
        stargazers_count: number;
        language: string | null;
        html_url: string;
        updated_at: string;
      }> = res.data?.items ?? [];

      const repos = items.map(r => ({
        name: r.full_name,
        description: r.description?.slice(0, 200),
        stars: r.stargazers_count,
        language: r.language,
        url: r.html_url,
        updated: r.updated_at,
      }));

      return JSON.stringify({total: res.data?.total_count ?? 0, results: repos});
    } catch (error) {
      const msg =
        axios.isAxiosError(error) && error.response
          ? `Request failed: ${error.response.status}`
          : 'Request failed. Check internet connection.';
      return JSON.stringify({error: msg});
    }
  },
};
