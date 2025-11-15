// app/lib/summarizeCfaArticle.ts
import OpenAI from "openai";

export interface ArticleSummary {
  title?: string;
  keyTakeaways: string[];
  keyPoints: string[];
  rawText: string; // original model output (for debugging / display)
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function summarizeCfaArticle(
  articleText: string
): Promise<ArticleSummary> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const systemPrompt = `
You are a CFA charterholder and experienced investment practitioner.

Your job is to summarize a CFA Institute / Financial Analysts Journal research article
for a busy portfolio manager who will NOT read the full paper.

Return a JSON object ONLY, no extra text.
`.trim();

  const userPrompt = `
Summarize the following CFA research article excerpt for a practitioner.

Return STRICT JSON with this shape:

{
  "title": string,                       // short inferred title
  "keyTakeaways": string[],              // 3–7 key practitioner takeaways
  "keyPoints": string[]                  // 5–10 bullets: idea, method, findings, implications
}

Do NOT wrap it in markdown. Do NOT add explanations outside the JSON.

Article:
"""${articleText}"""
`.trim();

  // Ask the model to obey JSON format directly
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini", // or "gpt-4o" / "gpt-4.1-mini" etc.
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.2,
    response_format: { type: "json_object" }, // <– force JSON
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned an empty response.");
  }

  let parsed: {
    title?: string;
    keyTakeaways?: string[];
    keyPoints?: string[];
  };

  try {
    parsed = JSON.parse(content);
  } catch (e) {
    // Fallback: if somehow parsing fails, at least surface raw text
    throw new Error(
      "Failed to parse model JSON. Raw content: " + content.toString()
    );
  }

  return {
    title: parsed.title || undefined,
    keyTakeaways: parsed.keyTakeaways ?? [],
    keyPoints: parsed.keyPoints ?? [],
    rawText: content.toString(),
  };
}
