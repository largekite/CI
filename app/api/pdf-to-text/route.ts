import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = body?.data as string | undefined;

    if (!data || typeof data !== "string") {
      return NextResponse.json(
        { error: "Missing 'data' (base64-encoded PDF)." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(data, "base64");
    const result = await pdfParse(buffer);

    return NextResponse.json(
      {
        text: result.text || "",
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("pdf-to-text error:", err);
    return NextResponse.json(
      {
        error: "Failed to parse PDF",
        details: err?.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}
