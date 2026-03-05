import axios from 'axios';

import type {RegisteredTool} from '../types';

export const bookSearchTool: RegisteredTool = {
  definition: {
    type: 'function',
    function: {
      name: 'book_search',
      description:
        'Search for books by title, author, or ISBN using Open Library.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Title, author name, or ISBN.',
          },
          limit: {
            type: 'string',
            description: 'Number of results to return (1-5). Defaults to 3.',
          },
        },
        required: ['query'],
      },
    },
  },
  handler: async (args: Record<string, unknown>): Promise<string> => {
    const query = String(args.query ?? '').trim();
    const limit = Math.min(
      Math.max(1, parseInt(String(args.limit ?? '3'), 10) || 3),
      5,
    );

    try {
      const res = await axios.get('https://openlibrary.org/search.json', {
        params: {
          q: query,
          limit,
          fields:
            'title,author_name,first_publish_year,number_of_pages_median,subject,isbn',
        },
        timeout: 8000,
      });

      const docs: Array<{
        title: string;
        author_name?: string[];
        first_publish_year?: number;
        number_of_pages_median?: number;
        subject?: string[];
        isbn?: string[];
      }> = res.data?.docs ?? [];

      const books = docs.map(d => ({
        title: d.title,
        authors: d.author_name?.join(', '),
        year: d.first_publish_year,
        pages: d.number_of_pages_median,
        subjects: d.subject?.slice(0, 5),
        isbn: d.isbn?.[0],
      }));

      return JSON.stringify({total: res.data?.numFound ?? 0, results: books});
    } catch (error) {
      const msg =
        axios.isAxiosError(error) && error.response
          ? `Request failed: ${error.response.status}`
          : 'Request failed. Check internet connection.';
      return JSON.stringify({error: msg});
    }
  },
};
