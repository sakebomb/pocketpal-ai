import axios from 'axios';

import type {RegisteredTool} from '../types';

const JINA_BASE = 'https://r.jina.ai/';

export const urlReaderTool: RegisteredTool = {
  definition: {
    type: 'function',
    function: {
      name: 'read_url',
      description:
        'Fetch and read the content of a web page. Use when the user shares a URL and wants it summarized, or when a search result needs to be read in full.',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The full URL to fetch (must start with http:// or https://).',
          },
        },
        required: ['url'],
      },
    },
  },
  handler: async (args: Record<string, unknown>): Promise<string> => {
    const url = String(args.url ?? '').trim();

    // Validate URL structure and restrict to HTTPS
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return JSON.stringify({error: 'Invalid URL format.'});
    }
    if (parsed.protocol !== 'https:') {
      return JSON.stringify({error: 'Only HTTPS URLs are allowed.'});
    }
    // Block private/reserved IP ranges
    const host = parsed.hostname;
    if (
      host === 'localhost' ||
      host.startsWith('127.') ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      host.startsWith('169.254.') ||
      host === '[::1]' ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
      host.endsWith('.local')
    ) {
      return JSON.stringify({error: 'Private/internal URLs are not allowed.'});
    }
    if (url.length > 2048) {
      return JSON.stringify({error: 'URL too long (max 2048 characters).'});
    }

    try {
      const response = await axios.get(`${JINA_BASE}${url}`, {
        headers: {
          Accept: 'application/json',
          'X-Return-Format': 'text',
        },
        timeout: 15000,
      });

      // Jina returns { code, status, data: { title, url, content } }
      const data = response.data?.data ?? response.data;
      const content = (data?.content ?? data?.text ?? String(response.data)).slice(0, 4000);
      const title = data?.title ?? null;

      return JSON.stringify({url, title, content});
    } catch (error) {
      const msg =
        axios.isAxiosError(error) && error.response
          ? `Could not read URL: ${error.response.status} ${error.response.statusText}`
          : 'Could not fetch the URL. Check internet connection.';
      return JSON.stringify({error: msg});
    }
  },
};
