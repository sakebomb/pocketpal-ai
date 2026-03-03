import axios from 'axios';

import {apiKeyStore} from '../../../store/ApiKeyStore';
import type {RegisteredTool} from '../types';

const TAVILY_SEARCH_URL = 'https://api.tavily.com/search';

export const webSearchTool: RegisteredTool = {
  definition: {
    type: 'function',
    function: {
      name: 'web_search',
      description:
        'Search the web for current information. Use this when you need up-to-date facts, news, or information beyond your training data.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query to look up.',
          },
          max_results: {
            type: 'string',
            description:
              'Maximum number of results to return (1-5). Defaults to 3.',
          },
        },
        required: ['query'],
      },
    },
  },
  handler: async (args: Record<string, unknown>): Promise<string> => {
    const apiKey = apiKeyStore.tavilyApiKey;
    if (!apiKey) {
      return JSON.stringify({
        error: 'Web search is not configured. Please add a Tavily API key in Settings.',
      });
    }

    const query = String(args.query ?? '');
    const maxResults = Math.min(
      Math.max(1, parseInt(String(args.max_results ?? '3'), 10) || 3),
      5,
    );

    try {
      const response = await axios.post(
        TAVILY_SEARCH_URL,
        {
          api_key: apiKey,
          query,
          search_depth: 'basic',
          include_answer: true,
          include_images: false,
          max_results: maxResults,
        },
        {timeout: 10000},
      );

      const {results = [], answer} = response.data;
      const formatted = results.map(
        (r: {title: string; url: string; content: string}) => ({
          title: r.title,
          url: r.url,
          snippet: r.content?.slice(0, 400),
        }),
      );

      return JSON.stringify({answer: answer ?? null, results: formatted});
    } catch (error) {
      const msg =
        axios.isAxiosError(error) && error.response
          ? `Search failed: ${error.response.status} ${error.response.statusText}`
          : 'Search failed. Please check your internet connection.';
      return JSON.stringify({error: msg});
    }
  },
};
