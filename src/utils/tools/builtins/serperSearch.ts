import axios from 'axios';

import {apiKeyStore} from '../../../store/ApiKeyStore';
import type {RegisteredTool} from '../types';

export const serperSearchTool: RegisteredTool = {
  definition: {
    type: 'function',
    function: {
      name: 'serper_search',
      description:
        'Search Google via Serper for highly relevant results. Use for current events and factual lookups.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query.',
          },
          num: {
            type: 'string',
            description: 'Number of results to return (1-10). Defaults to 5.',
          },
        },
        required: ['query'],
      },
    },
  },
  handler: async (args: Record<string, unknown>): Promise<string> => {
    const apiKey = apiKeyStore.serperApiKey;
    if (!apiKey) {
      return JSON.stringify({
        error:
          'Serper API key not configured. Add it in Settings → API Keys.',
      });
    }

    const query = String(args.query ?? '').trim();
    const num = Math.min(
      Math.max(1, parseInt(String(args.num ?? '5'), 10) || 5),
      10,
    );

    try {
      const res = await axios.post(
        'https://google.serper.dev/search',
        {q: query, num},
        {
          headers: {
            'X-API-KEY': apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      const organic: Array<{
        title: string;
        link: string;
        snippet?: string;
      }> = res.data?.organic ?? [];

      const results = organic.slice(0, num).map(r => ({
        title: r.title,
        url: r.link,
        snippet: r.snippet?.slice(0, 400),
      }));

      const kg = res.data?.knowledgeGraph
        ? {
            title: res.data.knowledgeGraph.title,
            description: res.data.knowledgeGraph.description,
          }
        : null;

      return JSON.stringify({query, knowledge_graph: kg, results});
    } catch (error) {
      const msg =
        axios.isAxiosError(error) && error.response
          ? `Request failed: ${error.response.status}`
          : 'Request failed. Check internet connection.';
      return JSON.stringify({error: msg});
    }
  },
};
