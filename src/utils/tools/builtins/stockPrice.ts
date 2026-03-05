import axios from 'axios';

import type {RegisteredTool} from '../types';

export const stockPriceTool: RegisteredTool = {
  definition: {
    type: 'function',
    function: {
      name: 'stock_price',
      description:
        'Get current stock price and daily change for a ticker symbol. Examples: AAPL, TSLA, MSFT, NVDA.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'Stock ticker symbol (e.g. "AAPL", "TSLA").',
          },
        },
        required: ['symbol'],
      },
    },
  },
  handler: async (args: Record<string, unknown>): Promise<string> => {
    const symbol = String(args.symbol ?? '').trim().toUpperCase();
    if (!/^[A-Z0-9.^=]{1,10}$/.test(symbol)) {
      return JSON.stringify({error: 'Invalid ticker symbol.'});
    }

    try {
      const res = await axios.get(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
        {
          params: {interval: '1d', range: '1d'},
          timeout: 8000,
        },
      );

      const result = res.data?.chart?.result;
      if (!result || result.length === 0) {
        return JSON.stringify({error: `Symbol not found: ${symbol}`});
      }

      const meta = result[0].meta;
      const change = meta.regularMarketPrice - meta.chartPreviousClose;
      const changePct = (
        (change / meta.chartPreviousClose) *
        100
      ).toFixed(2);

      return JSON.stringify({
        symbol,
        name: meta.longName ?? meta.shortName,
        price: meta.regularMarketPrice,
        currency: meta.currency,
        change,
        change_pct: changePct,
        market_state: meta.marketState,
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
