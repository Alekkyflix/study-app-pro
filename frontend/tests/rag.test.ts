"""Frontend tests with Vitest"""
import { describe, it, expect } from 'vitest';
import { chunkTranscript, calculateSimilarity, searchChunks } from '../src/lib/rag';

describe('RAG utilities', () => {
  it('chunks transcript correctly', () => {
    const transcript = 'This is sentence one. This is sentence two. This is sentence three.';
    const chunks = chunkTranscript(transcript, 30);
    
    expect(chunks.length).toBeGreaterThan(0);
    chunks.forEach(chunk => {
      expect(chunk.length).toBeLessThanOrEqual(35); // Small buffer for periods
    });
  });

  it('calculates similarity between query and text', () => {
    const query = 'hello world';
    const text = 'hello world test';
    const similarity = calculateSimilarity(query, text);
    
    expect(similarity).toBeGreaterThan(0);
    expect(similarity).toBeLessThanOrEqual(1);
  });

  it('searches chunks and returns top K', () => {
    const query = 'important concept';
    const chunks = [
      'This is an important concept discussed in class',
      'Random text about something else',
      'Another important concept mentioned'
    ];
    
    const results = searchChunks(query, chunks, 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });
});
