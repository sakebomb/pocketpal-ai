import axios from 'axios';

import type {RegisteredTool} from '../types';

const FRANKFURTER_URL = 'https://api.frankfurter.app/latest';

export const currencyTool: RegisteredTool = {
  definition: {
    type: 'function',
    function: {
      name: 'convert_currency',
      description:
        'Convert an amount from one currency to another using live exchange rates. Use for questions like "how much is $100 in euros?" or "what is 50 GBP in USD?".',
      parameters: {
        type: 'object',
        properties: {
          amount: {
            type: 'string',
            description: 'The amount to convert (e.g. "100").',
          },
          from: {
            type: 'string',
            description: 'The source currency code (e.g. "USD", "EUR", "GBP").',
          },
          to: {
            type: 'string',
            description:
              'The target currency code (e.g. "EUR", "JPY"). Can be a comma-separated list for multiple targets.',
          },
        },
        required: ['amount', 'from', 'to'],
      },
    },
  },
  handler: async (args: Record<string, unknown>): Promise<string> => {
    const amount = parseFloat(String(args.amount ?? '1'));
    const from = String(args.from ?? '').toUpperCase().trim();
    const to = String(args.to ?? '')
      .toUpperCase()
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .join(',');

    if (!from || !to) {
      return JSON.stringify({error: 'Please specify both source and target currency codes.'});
    }

    try {
      const res = await axios.get(FRANKFURTER_URL, {
        params: {amount, from, to},
        timeout: 8000,
      });

      const {rates, date} = res.data;
      return JSON.stringify({from, amount, rates, date});
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 422) {
        return JSON.stringify({error: `Unknown currency code: ${from} or ${to}. Use ISO 4217 codes like USD, EUR, GBP, JPY.`});
      }
      const msg = axios.isAxiosError(error) && error.response
        ? `Currency lookup failed: ${error.response.status}`
        : 'Currency lookup failed. Check internet connection.';
      return JSON.stringify({error: msg});
    }
  },
};
