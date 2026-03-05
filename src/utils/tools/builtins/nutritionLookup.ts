import axios from 'axios';

import type {RegisteredTool} from '../types';

export const nutritionLookupTool: RegisteredTool = {
  definition: {
    type: 'function',
    function: {
      name: 'nutrition_lookup',
      description:
        'Look up nutritional information for any food item using Open Food Facts database.',
      parameters: {
        type: 'object',
        properties: {
          food: {
            type: 'string',
            description: 'Food name to look up (e.g. "banana", "greek yogurt").',
          },
        },
        required: ['food'],
      },
    },
  },
  handler: async (args: Record<string, unknown>): Promise<string> => {
    const food = String(args.food ?? '').trim();

    try {
      const res = await axios.get(
        'https://world.openfoodfacts.org/cgi/search.pl',
        {
          params: {
            search_terms: food,
            json: 1,
            page_size: 1,
            fields:
              'product_name,nutriments,serving_size,brands',
          },
          timeout: 8000,
        },
      );

      const products: Array<{
        product_name: string;
        brands?: string;
        serving_size?: string;
        nutriments?: Record<string, number | undefined>;
      }> = res.data?.products ?? [];

      if (products.length === 0) {
        return JSON.stringify({
          error: `No nutritional data found for: ${food}`,
        });
      }

      const product = products[0];
      const n = product.nutriments ?? {};

      return JSON.stringify({
        food: product.product_name,
        brand: product.brands?.split(',')[0]?.trim(),
        serving_size: product.serving_size,
        per_100g: {
          calories: n['energy-kcal_100g'],
          protein: n.proteins_100g,
          carbs: n.carbohydrates_100g,
          fat: n.fat_100g,
          fiber: n.fiber_100g,
          sugar: n.sugars_100g,
          sodium: n.sodium_100g,
        },
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
