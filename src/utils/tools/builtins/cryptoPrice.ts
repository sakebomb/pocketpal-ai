import axios from 'axios';

import type {RegisteredTool} from '../types';

export const cryptoPriceTool: RegisteredTool = {
  definition: {
    type: 'function',
    function: {
      name: 'crypto_price',
      description:
        'Get current price, market cap, and 24h change for any cryptocurrency. Examples: bitcoin, ethereum, solana, dogecoin.',
      parameters: {
        type: 'object',
        properties: {
          coin: {
            type: 'string',
            description: 'Coin name or symbol like "bitcoin" or "BTC".',
          },
          currency: {
            type: 'string',
            description: 'Target currency to price in. Defaults to "usd".',
          },
        },
        required: ['coin'],
      },
    },
  },
  handler: async (args: Record<string, unknown>): Promise<string> => {
    const coin = String(args.coin ?? '').trim();
    const currency = String(args.currency ?? 'usd').toLowerCase().trim();

    try {
      const searchRes = await axios.get(
        'https://api.coingecko.com/api/v3/search',
        {params: {query: coin}, timeout: 8000},
      );

      const coins: Array<{id: string; name: string}> =
        searchRes.data?.coins ?? [];
      if (coins.length === 0) {
        return JSON.stringify({error: `Coin not found: ${coin}`});
      }

      const id = coins[0].id;

      const priceRes = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price',
        {
          params: {
            ids: id,
            vs_currencies: currency,
            include_24hr_change: true,
            include_market_cap: true,
          },
          timeout: 8000,
        },
      );

      const data = priceRes.data?.[id];

      return JSON.stringify({
        coin: coins[0].name,
        id,
        price: data?.[currency],
        currency,
        change_24h: data?.[`${currency}_24h_change`],
        market_cap: data?.[`${currency}_market_cap`],
      });
    } catch (error) {
      const msg =
        axios.isAxiosError(error) && error.response
          ? `Request failed: ${error.response.status}`
          : 'Request failed. Check internet connection.';
      return JSON.stringify({error: msg});
    }
  },
};
