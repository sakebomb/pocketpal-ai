const CHUNK_SIZE = 1500; // characters
const CHUNK_OVERLAP = 200; // characters

/**
 * Split text into overlapping fixed-size chunks.
 */
export function chunkText(
  text: string,
  chunkSize: number = CHUNK_SIZE,
  overlap: number = CHUNK_OVERLAP,
): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    if (end === text.length) {
      break;
    }
    start += chunkSize - overlap;
  }

  return chunks;
}

const STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'in', 'it', 'of', 'and', 'or', 'to', 'for',
  'on', 'at', 'by', 'with', 'as', 'be', 'was', 'are', 'were', 'has',
  'have', 'had', 'do', 'does', 'did', 'not', 'but', 'from', 'this',
  'that', 'i', 'you', 'he', 'she', 'we', 'they', 'what', 'which', 'who',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter(t => t.length > 1 && !STOPWORDS.has(t));
}

/**
 * Score chunks against a query using keyword overlap.
 * Returns the top-K chunk contents sorted by relevance.
 */
export function getRelevantChunks(
  chunks: string[],
  query: string,
  topK: number = 5,
): string[] {
  if (chunks.length === 0) {
    return [];
  }

  const queryTokens = new Set(tokenize(query));
  if (queryTokens.size === 0) {
    return chunks.slice(0, topK);
  }

  const scored = chunks.map((chunk, idx) => {
    const chunkTokens = tokenize(chunk);
    let score = 0;
    for (const token of chunkTokens) {
      if (queryTokens.has(token)) {
        score++;
      }
    }
    return {idx, score};
  });

  scored.sort((a, b) => b.score - a.score);

  return scored
    .slice(0, topK)
    .filter(s => s.score > 0)
    .sort((a, b) => a.idx - b.idx) // restore document order for context
    .map(s => chunks[s.idx]);
}
