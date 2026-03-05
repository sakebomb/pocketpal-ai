import axios from 'axios';

import type {RegisteredTool} from '../types';

const WIKI_SEARCH_URL =
  'https://en.wikipedia.org/w/api.php';
const WIKI_SUMMARY_URL =
  'https://en.wikipedia.org/api/rest_v1/page/summary';

export const wikipediaTool: RegisteredTool = {
  definition: {
    type: 'function',
    function: {
      name: 'wikipedia_search',
      description:
        'Look up factual information on Wikipedia. Best for: people, places, concepts, history, science. Not suitable for current news or real-time data.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The topic or person to search for.',
          },
        },
        required: ['query'],
      },
    },
  },
  handler: async (args: Record<string, unknown>): Promise<string> => {
    const query = String(args.query ?? '').trim();
    if (!query) {
      return JSON.stringify({error: 'No query provided.'});
    }

    try {
      // Step 1: find the best matching page title
      const searchRes = await axios.get(WIKI_SEARCH_URL, {
        params: {
          action: 'query',
          list: 'search',
          srsearch: query,
          format: 'json',
          srlimit: 1,
          origin: '*',
        },
        timeout: 8000,
      });
      const hit = searchRes.data?.query?.search?.[0];
      if (!hit) {
        return JSON.stringify({error: `No Wikipedia article found for: ${query}`});
      }

      // Step 2: get the page summary
      const title = encodeURIComponent(hit.title.replace(/ /g, '_'));
      const summaryRes = await axios.get(`${WIKI_SUMMARY_URL}/${title}`, {
        timeout: 8000,
      });
      const {title: pageTitle, extract, content_urls} = summaryRes.data;

      return JSON.stringify({
        title: pageTitle,
        summary: extract?.slice(0, 1200),
        url: content_urls?.desktop?.page ?? null,
      });
    } catch (error) {
      const msg =
        axios.isAxiosError(error) && error.response
          ? `Wikipedia lookup failed: ${error.response.status}`
          : 'Wikipedia lookup failed. Check internet connection.';
      return JSON.stringify({error: msg});
    }
  },
};
