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

  const modeInstruction = detail
    ? "Provide more depth and nuance, with more specific key points and slightly longer explanations."
    : "Keep the summary concise and focused on the most important practitioner-facing points.";

  const systemPrompt = `
You are a CFA charterholder and experienced investment practitioner.

Your job is to summarize CFA / academic finance articles for a busy reader.
Return ONLY JSON with the requested fields.
`.trim();

  const userPrompt = `
${modeInstruction}

Return STRICT JSON with this shape:

{
  "title": string,
  "keyTakeaways": string[],
  "keyPoints": string[]
}

Article:
"""${articleText}"""
`.trim();

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini", // or another compatible model
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: detail ? 0.4 : 0.2,
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
