import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function extractTextFromHtml(html: string): string {
  // Strip scripts/styles first
  let cleaned = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  cleaned = cleaned.replace(/<style[\s\S]*?<\/style>/gi, "");

  // Remove all tags
  cleaned = cleaned.replace(/<[^>]+>/g, " ");

  // Collapse whitespace
  cleaned = cleaned.replace(/\s+/g, " ");

  return cleaned.trim();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = body?.url as string | undefined;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'url'." },
        { status: 400 }
      );
    }

    // Basic safety: only http(s)
    if (!/^https?:\/\//i.test(url)) {
      return NextResponse.json(
        { error: "URL must start with http:// or https://." },
        { status: 400 }
      );
    }

    const res = await fetch(url);

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL (status ${res.status}).` },
        { status: 500 }
      );
    }

    const html = await res.text();
    const text = extractTextFromHtml(html);

    // Hard cap to keep it reasonable
    const MAX_CHARS = 20000;
    const trimmed = text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) : text;

    return NextResponse.json({ text: trimmed }, { status: 200 });
  } catch (err: any) {
    console.error("fetch-article-text error:", err);
    return NextResponse.json(
      {
        error: "Failed to fetch or parse article.",
        details: err?.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}
