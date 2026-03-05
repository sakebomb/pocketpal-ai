import axios from 'axios';

import {apiKeyStore} from '../../../store/ApiKeyStore';
import type {RegisteredTool} from '../types';

const BRAVE_SEARCH_URL = 'https://api.search.brave.com/res/v1/web/search';

export const braveSearchTool: RegisteredTool = {
  definition: {
    type: 'function',
    function: {
      name: 'brave_search',
      description:
        'Search the web for current information using Brave Search. Use this when you need up-to-date facts, news, or information beyond your training data.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query to look up.',
          },
          count: {
            type: 'string',
            description: 'Number of results to return (1-5). Defaults to 3.',
          },
        },
        required: ['query'],
      },
    },
  },
  handler: async (args: Record<string, unknown>): Promise<string> => {
    const apiKey = apiKeyStore.braveApiKey;
    if (!apiKey) {
      return JSON.stringify({
        error: 'Brave Search is not configured. Please add a Brave API key in Settings.',
      });
    }

    const query = String(args.query ?? '');
    const count = Math.min(Math.max(1, parseInt(String(args.count ?? '3'), 10) || 3), 5);

    try {
      const response = await axios.get(BRAVE_SEARCH_URL, {
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': apiKey,
        },
        params: {q: query, count},
        timeout: 10000,
      });

      const results = (response.data?.web?.results ?? []).map(
        (r: {title: string; url: string; description: string}) => ({
          title: r.title,
          url: r.url,
          snippet: r.description?.slice(0, 400),
        }),
      );

      return JSON.stringify({results});
    } catch (error) {
      const msg =
        axios.isAxiosError(error) && error.response
          ? `Search failed: ${error.response.status} ${error.response.statusText}`
          : 'Search failed. Check your internet connection.';
      return JSON.stringify({error: msg});
    }
  },
};
