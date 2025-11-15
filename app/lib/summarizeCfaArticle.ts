// app/lib/summarizeCfaArticle.ts
import OpenAI from "openai";

export type SummaryLevel = "base" | "more" | "max";

export interface ArticleSummary {
  title?: string;
  keyTakeaways: string[]; // UI: Highlights
  keyPoints: string[];    // UI: Details
  rawText: string;
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function summarizeCfaArticle(
  articleText: string,
  level: SummaryLevel = "base"
): Promise<ArticleSummary> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const modeInstruction =
    level === "base"
      ? `
Create a concise summary.

Requirements:
- "keyTakeaways": 3–5 high-level bullet points.
- "keyPoints": 5–8 more detailed bullet points.
- Focus only on the most essential information.
`
      : level === "more"
      ? `
Create a more detailed summary.

Requirements:
- "keyTakeaways": 6–10 bullet points with clear highlights.
- "keyPoints": 10–18 bullet points with more depth.
- Cover main idea, methodology, key results, implications, and key limitations.
`
      : `
Create a very detailed and exhaustive summary.

Requirements:
- "keyTakeaways": 8–12 bullet points capturing all important highlights.
- "keyPoints": 16–25 bullet points with deep detail.
- Cover:
  - Motivation and problem setup
  - Data and methodology
  - Core results
  - Robustness or sensitivity points
  - Limitations and caveats
  - Practical or conceptual implications
- Include smaller yet relevant insights as separate bullets.
`;

  const systemPrompt = `
You summarize finance and research articles.
You MUST respond ONLY with valid JSON and nothing else.
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
- "keyPoints"   = deeper details, supporting analysis, and nuance.

Article:
"""${articleText}"""
`.trim();

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: level === "base" ? 0.2 : level === "more" ? 0.4 : 0.5,
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
  } catch (err) {
    console.error("Failed to parse JSON from model:", err, "Raw:", content);
    throw new Error("Failed to parse model JSON.");
  }

  return {
    title: parsed.title || undefined,
    keyTakeaways: parsed.keyTakeaways ?? [],
    keyPoints: parsed.keyPoints ?? [],
    rawText: content,
  };
}
