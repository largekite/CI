// app/api/summarize-cfa/route.ts
import { NextRequest, NextResponse } from "next/server";
import { summarizeCfaArticle } from "../../lib/summarizeCfaArticle";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const articleText = body?.articleText;
    const detail = Boolean(body?.detail); // <-- read the flag

    if (!articleText || typeof articleText !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'articleText'." },
        { status: 400 }
      );
    }

    // Defensive truncation on the server as well
    const MAX_CHARS = 20000;
    const trimmedText =
      articleText.length > MAX_CHARS
        ? articleText.slice(0, MAX_CHARS)
        : articleText;

    const summary = await summarizeCfaArticle(trimmedText, detail);

    return NextResponse.json(summary, { status: 200 });
  } catch (err: any) {
    console.error("summarize-cfa error:", err);
    return NextResponse.json(
      {
        error: "Failed to summarize article",
        details: err?.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}
