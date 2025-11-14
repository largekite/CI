// lib/summarizeCfaArticle.ts
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
  articleText: string
): Promise<ArticleSummary> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const systemPrompt = `
You are a CFA charterholder and experienced investment practitioner.

Your job is to summarize a CFA Institute / Financial Analysts Journal research article
for a busy portfolio manager who will NOT read the full paper.

Requirements:
- Focus on practice-oriented insight, not academic fluff.
- Be concrete and non-promotional.
- Avoid copying long sentences verbatim from the article.
- Max 450 words in total.
`.trim();

  const userPrompt = `
Summarize the following CFA research article.

Output format (VERY IMPORTANT):
1. A short inferred title (even if the original title isn't given).
2. A "Key Takeaways" section with 3–7 bullets focusing on what practitioners should remember.
3. A "Key Points" section with 5–10 bullets summarizing:
   - core idea
   - high-level methodology (one short phrase)
   - main empirical findings
   - practical implications / limitations

Article:
"""${articleText}"""
`.trim();

  const response = await client.responses.create({
    model: "gpt-5.1-mini", // or "gpt-5.1" if you prefer
    input: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const fullText = (response as any).output_text as string;

  const keyTakeaways: string[] = [];
  const keyPoints: string[] = [];

  const lines = fullText.split("\n").map((l) => l.trim());
  let section: "none" | "takeaways" | "points" = "none";

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.startsWith("key takeaways")) {
      section = "takeaways";
      continue;
    }
    if (lower.startsWith("key points")) {
      section = "points";
      continue;
    }

    const bulletMatch = /^[-*•]\s+(.+)$/.exec(line);
    if (bulletMatch) {
      const text = bulletMatch[1].trim();
      if (section === "takeaways") keyTakeaways.push(text);
      else if (section === "points") keyPoints.push(text);
    }
  }

  // Try to infer a title from the first non-empty line
  const firstNonEmpty = lines.find((l) => l.length > 0) || "";
  const maybeTitle =
    firstNonEmpty.toLowerCase().includes("key takeaway") ||
    firstNonEmpty.toLowerCase().includes("key points") ||
    firstNonEmpty.toLowerCase().includes("summary")
      ? undefined
      : firstNonEmpty;

  return {
    title: maybeTitle,
    keyTakeaways,
    keyPoints,
    rawText: fullText,
  };
}
