import axios from 'axios';

import type {RegisteredTool} from '../types';

export const redditTool: RegisteredTool = {
  definition: {
    type: 'function',
    function: {
      name: 'reddit_posts',
      description:
        'Get top posts from a subreddit, or search within one. Great for community opinions and discussions.',
      parameters: {
        type: 'object',
        properties: {
          subreddit: {
            type: 'string',
            description: 'Subreddit name without the r/ prefix.',
          },
          query: {
            type: 'string',
            description: 'Optional search query within the subreddit.',
          },
          limit: {
            type: 'string',
            description: 'Number of posts to return (1-10). Defaults to 5.',
          },
        },
        required: ['subreddit'],
      },
    },
  },
  handler: async (args: Record<string, unknown>): Promise<string> => {
    const subreddit = String(args.subreddit ?? '').trim();
    if (!/^[a-zA-Z0-9_]{1,50}$/.test(subreddit)) {
      return JSON.stringify({error: 'Invalid subreddit name.'});
    }
    const query = args.query ? String(args.query).trim() : null;
    const limit = Math.min(
      Math.max(1, parseInt(String(args.limit ?? '5'), 10) || 5),
      10,
    );

    const headers = {'User-Agent': 'PocketPal/1.0'};

    try {
      const url = query
        ? `https://www.reddit.com/r/${subreddit}/search.json`
        : `https://www.reddit.com/r/${subreddit}/hot.json`;

      const params = query
        ? {q: query, restrict_sr: true, sort: 'relevance', limit}
        : {limit};

      const res = await axios.get(url, {headers, params, timeout: 8000});

      const posts = (res.data?.data?.children ?? []).map(
        (c: {data: Record<string, unknown>}) => {
          const p = c.data;
          return {
            title: p.title,
            score: p.score,
            comments: p.num_comments,
            url: p.url,
            text: p.selftext
              ? String(p.selftext).slice(0, 300) || null
              : null,
          };
        },
      );

      return JSON.stringify({subreddit, posts});
    } catch (error) {
      const msg =
        axios.isAxiosError(error) && error.response
          ? `Request failed: ${error.response.status}`
          : 'Request failed. Check internet connection.';
      return JSON.stringify({error: msg});
    }
  },
};
