import type {Pal, PalCapabilities} from '../types/pal';

/**
 * Clean capability detection functions
 * No inference, only explicit capability checks
 */

export const hasVideoCapability = (pal: Pal): boolean => {
  return pal.capabilities?.video === true;
};

export const hasMultimodalCapability = (pal: Pal): boolean => {
  return pal.capabilities?.multimodal === true;
};

export const hasRealtimeCapability = (pal: Pal): boolean => {
  return pal.capabilities?.realtime === true;
};

export const hasAudioCapability = (pal: Pal): boolean => {
  return pal.capabilities?.audio === true;
};

export const hasWebCapability = (pal: Pal): boolean => {
  return pal.capabilities?.web === true;
};

export const hasBraveCapability = (pal: Pal): boolean => {
  return pal.capabilities?.brave === true;
};

export const hasWeatherCapability = (pal: Pal): boolean => {
  return pal.capabilities?.weather === true;
};

export const hasWikipediaCapability = (pal: Pal): boolean => {
  return pal.capabilities?.wikipedia === true;
};

export const hasUrlReaderCapability = (pal: Pal): boolean => {
  return pal.capabilities?.urlReader === true;
};

export const hasCurrencyCapability = (pal: Pal): boolean => {
  return pal.capabilities?.currency === true;
};

export const hasUnitConvertCapability = (pal: Pal): boolean => {
  return pal.capabilities?.unitConvert === true;
};

export const hasDictionaryCapability = (pal: Pal): boolean => {
  return pal.capabilities?.dictionary === true;
};

export const hasTranslateCapability = (pal: Pal): boolean => {
  return pal.capabilities?.translate === true;
};

export const hasHackerNewsCapability = (pal: Pal): boolean => {
  return pal.capabilities?.hackerNews === true;
};

export const hasCodeCapability = (pal: Pal): boolean => {
  return pal.capabilities?.code === true;
};

export const hasMemoryCapability = (pal: Pal): boolean => {
  return pal.capabilities?.memory === true;
};

export const hasCryptoCapability = (pal: Pal): boolean =>
  pal.capabilities?.crypto === true;
export const hasStocksCapability = (pal: Pal): boolean =>
  pal.capabilities?.stocks === true;
export const hasSportsCapability = (pal: Pal): boolean =>
  pal.capabilities?.sports === true;
export const hasRedditCapability = (pal: Pal): boolean =>
  pal.capabilities?.reddit === true;
export const hasFlightsCapability = (pal: Pal): boolean =>
  pal.capabilities?.flights === true;
export const hasMoviesCapability = (pal: Pal): boolean =>
  pal.capabilities?.movies === true;
export const hasBooksCapability = (pal: Pal): boolean =>
  pal.capabilities?.books === true;
export const hasArxivCapability = (pal: Pal): boolean =>
  pal.capabilities?.arxiv === true;
export const hasGithubCapability = (pal: Pal): boolean =>
  pal.capabilities?.github === true;
export const hasTriviaCapability = (pal: Pal): boolean =>
  pal.capabilities?.trivia === true;
export const hasNutritionCapability = (pal: Pal): boolean =>
  pal.capabilities?.nutrition === true;
export const hasRecipeCapability = (pal: Pal): boolean =>
  pal.capabilities?.recipe === true;
export const hasWorldClockCapability = (pal: Pal): boolean =>
  pal.capabilities?.worldClock === true;
export const hasSerperCapability = (pal: Pal): boolean =>
  pal.capabilities?.serper === true;

export const hasToolsCapability = (pal: Pal): boolean => {
  return pal.capabilities?.tools === true;
};

/**
 * Get all active capabilities for a pal
 */
export const getActiveCapabilities = (pal: Pal): string[] => {
  if (!pal.capabilities) {
    return [];
  }

  return Object.entries(pal.capabilities)
    .filter(([_, enabled]) => enabled === true)
    .map(([capability, _]) => capability);
};

/**
 * Check if pal has any capabilities
 */
export const hasAnyCapabilities = (pal: Pal): boolean => {
  return getActiveCapabilities(pal).length > 0;
};

/**
 * Create capabilities object from legacy pal type
 * Clean, explicit mapping with no inference
 */
export const createCapabilitiesFromLegacyType = (
  legacyType: 'assistant' | 'roleplay' | 'video',
): PalCapabilities => {
  switch (legacyType) {
    case 'video':
      return {
        video: true,
        multimodal: true,
      };
    case 'assistant':
    case 'roleplay':
    default:
      return {}; // No special capabilities
  }
};
