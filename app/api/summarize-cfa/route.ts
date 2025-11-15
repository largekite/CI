// app/api/summarize-cfa/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  summarizeCfaArticle,
  type SummaryLevel,
} from "../../lib/summarizeCfaArticle";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const articleText = body?.articleText as string | undefined;
    const levelRaw = body?.level as string | undefined;

    if (!articleText || typeof articleText !== "string" || !articleText.trim()) {
      return NextResponse.json(
        { error: "Missing or invalid 'articleText'." },
        { status: 400 }
      );
    }

    const MAX_CHARS = 20000;
    const trimmedText =
      articleText.length > MAX_CHARS
        ? articleText.slice(0, MAX_CHARS)
        : articleText;

    const allowedLevels: SummaryLevel[] = ["base", "more", "max"];
    const level: SummaryLevel = allowedLevels.includes(levelRaw as SummaryLevel)
      ? (levelRaw as SummaryLevel)
      : "base";

    const summary = await summarizeCfaArticle(trimmedText, level);

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
