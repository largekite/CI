// app/lib/summarizeCfaArticle.ts
import OpenAI from "openai";

export interface ArticleSummary {
  title?: string;
  keyTakeaways: string[]; // UI label: "Highlights"
  keyPoints: string[];    // UI label: "Details"
  rawText: string;        // raw JSON from the model (for debugging if needed)
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
    ? "Provide more depth and nuance, with more specific points and slightly longer explanations."
    : "Keep the summary concise and focused on the most important points.";

  const systemPrompt = `
You summarize finance and research articles for a busy reader.

You MUST respond ONLY with valid JSON.
`.trim();

  const userPrompt = `
${modeInstruction}

Return STRICT JSON with this shape:

{
  "title": string,
  "keyTakeaways": string[],
  "keyPoints": string[]
}

- "keyTakeaways" should be a short list of the most important highlights.
- "keyPoints" can go into more detail and include additional points.

Article:
"""${articleText}"""
`.trim();

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini", // adjust if you prefer another model
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
