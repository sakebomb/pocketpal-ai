import axios from 'axios';

import type {RegisteredTool} from '../types';

const MEAL_BASE = 'https://www.themealdb.com/api/json/v1/1';

interface MealRecord {
  idMeal: string;
  strMeal: string;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  [key: string]: string;
}

function extractIngredients(m: MealRecord): string[] {
  const ingredients: string[] = [];
  for (let i = 1; i <= 10; i++) {
    const ing = m[`strIngredient${i}`];
    if (ing && ing.trim()) {
      ingredients.push(ing.trim());
    }
  }
  return ingredients;
}

function formatMeal(m: MealRecord) {
  return {
    name: m.strMeal,
    category: m.strCategory,
    cuisine: m.strArea,
    instructions: m.strInstructions?.slice(0, 500),
    ingredients: extractIngredients(m),
  };
}

export const recipeSearchTool: RegisteredTool = {
  definition: {
    type: 'function',
    function: {
      name: 'recipe_search',
      description: 'Search for recipes by dish name or ingredient.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Dish name or main ingredient.',
          },
          by: {
            type: 'string',
            description: '"name" (default) or "ingredient".',
          },
        },
        required: ['query'],
      },
    },
  },
  handler: async (args: Record<string, unknown>): Promise<string> => {
    const query = String(args.query ?? '').trim();
    const by = String(args.by ?? 'name').toLowerCase();

    try {
      let meals: MealRecord[] = [];

      if (by === 'ingredient') {
        const filterRes = await axios.get(`${MEAL_BASE}/filter.php`, {
          params: {i: query},
          timeout: 8000,
        });

        const filtered: Array<{idMeal: string}> =
          filterRes.data?.meals ?? [];
        if (filtered.length === 0) {
          return JSON.stringify({error: `No recipes found for: ${query}`});
        }

        const detailPromises = filtered.slice(0, 3).map(item =>
          axios
            .get(`${MEAL_BASE}/lookup.php`, {
              params: {i: item.idMeal},
              timeout: 8000,
            })
            .then(r => r.data?.meals?.[0] as MealRecord | undefined),
        );
        const details = await Promise.all(detailPromises);
        meals = details.filter((m): m is MealRecord => Boolean(m));
      } else {
        const searchRes = await axios.get(`${MEAL_BASE}/search.php`, {
          params: {s: query},
          timeout: 8000,
        });
        meals = (searchRes.data?.meals ?? []).slice(0, 3) as MealRecord[];
      }

      if (meals.length === 0) {
        return JSON.stringify({error: `No recipes found for: ${query}`});
      }

      return JSON.stringify({results: meals.map(formatMeal)});
    } catch (error) {
      const msg =
        axios.isAxiosError(error) && error.response
          ? `Request failed: ${error.response.status}`
          : 'Request failed. Check internet connection.';
      return JSON.stringify({error: msg});
    }
  },
};
