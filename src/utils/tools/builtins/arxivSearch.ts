import axios from 'axios';

import type {RegisteredTool} from '../types';

function extractTag(text: string, tag: string): string {
  const open = `<${tag}`;
  const close = `</${tag}>`;
  const startIdx = text.indexOf(open);
  if (startIdx === -1) {
    return '';
  }
  const contentStart = text.indexOf('>', startIdx);
  if (contentStart === -1) {
    return '';
  }
  const endIdx = text.indexOf(close, contentStart);
  if (endIdx === -1) {
    return '';
  }
  return text.slice(contentStart + 1, endIdx).trim();
}

function extractAllNameTags(text: string): string[] {
  const results: string[] = [];
  let cursor = 0;
  while (cursor < text.length) {
    const open = text.indexOf('<name>', cursor);
    if (open === -1) {
      break;
    }
    const close = text.indexOf('</name>', open + 6);
    if (close === -1) {
      break;
    }
    results.push(text.slice(open + 6, close).trim());
    cursor = close + 7;
  }
  return results;
}

function splitEntries(xml: string): string[] {
  const entries: string[] = [];
  let cursor = 0;
  while (cursor < xml.length) {
    const open = xml.indexOf('<entry>', cursor);
    if (open === -1) {
      break;
    }
    const close = xml.indexOf('</entry>', open + 7);
    if (close === -1) {
      break;
    }
    entries.push(xml.slice(open + 7, close));
    cursor = close + 8;
  }
  return entries;
}

export const arxivSearchTool: RegisteredTool = {
  definition: {
    type: 'function',
    function: {
      name: 'arxiv_search',
      description:
        'Search recent research papers on arXiv by topic, author, or keywords.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search terms, topic, or author name.',
          },
          max_results: {
            type: 'string',
            description: 'Number of results to return (1-5). Defaults to 3.',
          },
          category: {
            type: 'string',
            description:
              'arXiv category filter (e.g. "cs.AI", "physics", "math").',
          },
        },
        required: ['query'],
      },
    },
  },
  handler: async (args: Record<string, unknown>): Promise<string> => {
    const query = String(args.query ?? '').trim();
    const maxResults = Math.min(
      Math.max(1, parseInt(String(args.max_results ?? '3'), 10) || 3),
      5,
    );
    const category = args.category ? String(args.category).trim() : null;

    const searchQuery = category
      ? `cat:${category} AND all:${query}`
      : `all:${query}`;

    try {
      const res = await axios.get('https://export.arxiv.org/api/query', {
        params: {
          search_query: searchQuery,
          max_results: maxResults,
          sortBy: 'submittedDate',
          sortOrder: 'descending',
        },
        timeout: 10000,
      });

      const xml: string = res.data ?? '';
      const entryBodies = splitEntries(xml);

      const results = entryBodies.map(entry => {
        const title = extractTag(entry, 'title').replace(/\s+/g, ' ');
        const summary = extractTag(entry, 'summary')
          .replace(/\s+/g, ' ')
          .slice(0, 400);
        const published = extractTag(entry, 'published');
        const url = extractTag(entry, 'id');
        const authors = extractAllNameTags(entry);

        return {title, authors, summary, published, url};
      });

      return JSON.stringify({results});
    } catch (error) {
      const msg =
        axios.isAxiosError(error) && error.response
          ? `Request failed: ${error.response.status}`
          : 'Request failed. Check internet connection.';
      return JSON.stringify({error: msg});
    }
  },
};
