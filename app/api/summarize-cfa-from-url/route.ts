// app/api/summarize-cfa-from-url/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  summarizeCfaArticle,
  type SummaryLevel,
} from "../../lib/summarizeCfaArticle";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = body?.url as string | undefined;
    const levelRaw = body?.level as string | undefined;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'url'." },
        { status: 400 }
      );
    }

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

    const MAX_CHARS = 20000;
    const trimmed =
      html.length > MAX_CHARS ? html.slice(0, MAX_CHARS) : html;

    const allowedLevels: SummaryLevel[] = ["base", "more", "max"];
    const level: SummaryLevel = allowedLevels.includes(levelRaw as SummaryLevel)
      ? (levelRaw as SummaryLevel)
      : "base";

    const summary = await summarizeCfaArticle(trimmed, level);

    return NextResponse.json(summary, { status: 200 });
  } catch (err: any) {
    console.error("summarize-cfa-from-url error:", err);
    return NextResponse.json(
      {
        error: "Failed to summarize URL",
        details: err?.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}
