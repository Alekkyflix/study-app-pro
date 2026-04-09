// Prompt templates
export const SUMMARY_PROMPT = `
You are an expert academic summarizer. Analyze the following lecture transcript and provide:
1. A 5-bullet executive summary of key concepts
2. 3-5 structured topics with key points under each
3. 5 potential exam questions with answers

Transcript:
{transcript}

Please format your response as JSON with keys: brief, structured_notes, exam_questions
`;

export const RAG_SYSTEM_PROMPT = `
You are a helpful lecture assistant. Answer questions based on the provided lecture context.
Always cite the parts of the lecture you're referencing.
If you're not sure, say so and suggest what information might help.

Lecture Context:
{context}
`;

export const GLOSSARY_PROMPT = `
Extract key terms and definitions from this lecture transcript.
Return as JSON with terms as keys and definitions as values.

Transcript:
{transcript}
`;
