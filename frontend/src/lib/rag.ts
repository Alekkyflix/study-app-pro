// RAG utilities
export function chunkTranscript(transcript: string, chunkSize: number = 500): string[] {
  const sentences = transcript.split(/[.!?]+/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > chunkSize) {
      chunks.push(currentChunk);
      currentChunk = sentence;
    } else {
      currentChunk += sentence + ". ";
    }
  }

  if (currentChunk) chunks.push(currentChunk);
  return chunks;
}

export function calculateSimilarity(query: string, text: string): number {
  const queryWords = new Set(query.toLowerCase().split(/\s+/));
  const textWords = text.toLowerCase().split(/\s+/);
  let matches = 0;

  for (const word of textWords) {
    if (queryWords.has(word)) matches++;
  }

  return matches / Math.max(queryWords.size, textWords.length);
}

export function searchChunks(query: string, chunks: string[], topK: number = 3): string[] {
  const scored = chunks.map((chunk) => ({
    text: chunk,
    score: calculateSimilarity(query, chunk)
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((item) => item.text);
}
