import { NextRequest, NextResponse } from "next/server";
import { summarizeCfaArticle } from "../../lib/summarizeCfaArticle";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const articleText = body?.articleText;
    const detail = Boolean(body?.detail);

    if (!articleText || typeof articleText !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'articleText'." },
        { status: 400 }
      );
    }

    const trimmedText =
      articleText.length > 20000
        ? articleText.slice(0, 20000)
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
