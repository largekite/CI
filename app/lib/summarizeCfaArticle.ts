// app/lib/summarizeCfaArticle.ts
import OpenAI from "openai";

export interface ArticleSummary {
  title?: string;
  keyTakeaways: string[];
  keyPoints: string[];
  rawText: string;
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function summarizeCfaArticle(
  articleText: string,
  detail: boolean = false
): Promise<ArticleSummary> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  // ---- Core difference: FORCE higher bullet count ----
  const modeInstruction = detail
    ? `
Create a richer and more comprehensive summary.

Requirements:
- Provide AT LEAST **6–10 bullet points** in "Highlights".
- Provide AT LEAST **10–18 bullet points** in "Details".
- Include deeper explanations and more nuance.
- Cover methodology, assumptions, results, implications, and context.
- Include smaller insights that may not be headline results.
- Be exhaustive but still structured and readable.
`
    : `
Create a concise summary.

Requirements:
- Provide **3–5 bullet points** in "Highlights".
- Provide **5–8 bullet points** in "Details".
- Only include the most essential content.
`;

  const systemPrompt = `
You summarize finance, research, and CFA/FAJ articles.

You MUST return ONLY valid JSON. No commentary.
`.trim();

  const userPrompt = `
${modeInstruction}

Return STRICT JSON with this shape:

{
  "title": string,
  "keyTakeaways": string[],
  "keyPoints": string[]
}

Definitions:
- "keyTakeaways" = high-level highlights
- "keyPoints"   = deeper details / findings / supporting analysis

Article:
"""${articleText}"""
`.trim();

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: detail ? 0.5 : 0.2,
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from OpenAI.");
  }

  let parsed: {
    title?: string;
    keyTakeaways?: string[];
    keyPoints?: string[];
  };

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Failed to parse model JSON.");
  }

  return {
    title: parsed.title || undefined,
    keyTakeaways: parsed.keyTakeaways ?? [],
    keyPoints: parsed.keyPoints ?? [],
    rawText: content,
  };
}
