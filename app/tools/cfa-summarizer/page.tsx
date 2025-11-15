"use client";

import React, { useState } from "react";

interface ArticleSummary {
  title?: string;
  keyTakeaways: string[]; // UI: Highlights
  keyPoints: string[];    // UI: Details
  rawText: string;
}

type SummaryLevel = "base" | "more" | "max";

const MAX_CHARS = 20000;

async function extractTextFromFile(file: File): Promise<string> {
  const lowerName = file.name.toLowerCase();

  if (file.type === "application/pdf" || lowerName.endsWith(".pdf")) {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Convert to base64
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    const res = await fetch("/api/pdf-to-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: base64 }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(
        data?.error || data?.details || "Failed to extract text from PDF."
      );
    }

    return String(data?.text || "");
  }

  // Non-PDF → plain text
  return await file.text();
}



export default function SummarizerPage() {
  const [articleText, setArticleText] = useState("");
  const [summary, setSummary] = useState<ArticleSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runSummary(level: SummaryLevel) {
    setError(null);
    setSummary(null);
    setCopied(false);

    if (!articleText.trim()) {
      setError("Please provide article text.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/summarize-cfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleText, level }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.details || data?.error || "Request failed");
      }

      const json = (await res.json()) as ArticleSummary;
      setSummary(json);
    } catch (err) {
      console.error(err);
      setError("Unable to generate summary.");
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setArticleText("");
    setSummary(null);
    setCopied(false);
    setError(null);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await extractTextFromFile(file);
      let truncated = text;
      let msg: string | null = null;

      if (text.length > MAX_CHARS) {
        truncated = text.slice(0, MAX_CHARS);
        msg = "Input truncated to first 20,000 characters.";
      }

      setArticleText(truncated);
      setSummary(null);
      setCopied(false);
      setError(msg);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Unable to read file.");
    }
  }

  async function handleCopySummary() {
    if (!summary) return;

    const lines: string[] = [];
    if (summary.title) lines.push(`Title: ${summary.title}\n`);
    if (summary.keyTakeaways?.length) {
      lines.push("Highlights:");
      summary.keyTakeaways.forEach((t) => lines.push(`- ${t}`));
      lines.push("");
    }
    if (summary.keyPoints?.length) {
      lines.push("Details:");
      summary.keyPoints.forEach((p) => lines.push(`- ${p}`));
    }

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  async function handleExportPdf() {
    if (!summary) return;

    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    let y = 10;

    if (summary.title) {
      doc.setFontSize(14);
      doc.text(summary.title, 10, y);
      y += 8;
    }

    if (summary.keyTakeaways?.length) {
      doc.setFontSize(12);
      doc.text("Highlights", 10, y);
      y += 6;
      doc.setFontSize(10);
      summary.keyTakeaways.forEach((t) => {
        const lines = doc.splitTextToSize("• " + t, 180);
        doc.text(lines, 10, y);
        y += lines.length * 5;
        if (y > 280) {
          doc.addPage();
          y = 10;
        }
      });
    }

    if (summary.keyPoints?.length) {
      y += 4;
      if (y > 280) {
        doc.addPage();
        y = 10;
      }
      doc.setFontSize(12);
      doc.text("Details", 10, y);
      y += 6;
      doc.setFontSize(10);
      summary.keyPoints.forEach((p) => {
        const lines = doc.splitTextToSize("• " + p, 180);
        doc.text(lines, 10, y);
        y += lines.length * 5;
        if (y > 280) {
          doc.addPage();
          y = 10;
        }
      });
    }

    doc.save((summary.title || "summary") + ".pdf");
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
        Summary Tool
      </h1>

      <div className="grid gap-6 md:grid-cols-2 md:items-start">
        {/* LEFT: input */}
        <section>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 md:p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">Article</span>
              <span className="text-xs text-gray-500">
                {articleText.length.toLocaleString()} /{" "}
                {MAX_CHARS.toLocaleString()}
              </span>
            </div>

            <textarea
              className="w-full min-h-[220px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm leading-relaxed text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              placeholder="Paste article text here…"
              value={articleText}
              maxLength={MAX_CHARS}
              onChange={(e) => setArticleText(e.target.value)}
            />

            <div className="flex flex-col gap-2 text-xs text-gray-600">
              <label className="inline-flex items-center gap-2">
                <span>Upload (txt / md / text):</span>
                <input
                  type="file"
                  accept=".txt,.md,.text,application/pdf"
                  onChange={handleFileUpload}
                  className="text-xs"
                />
              </label>
            </div>

            {error && (
              <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => runSummary("base")}
                disabled={loading}
                className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-800 disabled:opacity-60"
              >
                {loading ? "Working..." : "Summarize"}
              </button>
              <button
                onClick={() => runSummary("more")}
                disabled={loading}
                className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-300 disabled:opacity-60"
              >
                More detail
              </button>
              <button
                onClick={() => runSummary("max")}
                disabled={loading}
                className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-300 disabled:opacity-60"
              >
                Even more detail
              </button>
              <button
                onClick={handleClear}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            </div>
          </div>
        </section>

        {/* RIGHT: summary */}
        <section>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 md:p-5 shadow-sm min-h-[260px] flex flex-col">
            {loading && (
              <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
                <div className="animate-pulse">Generating summary…</div>
              </div>
            )}

            {!loading && summary && (
              <div className="space-y-4 flex-1">
                {summary.title && (
                  <h2 className="text-lg font-semibold text-gray-900">
                    {summary.title}
                  </h2>
                )}

                {summary.keyTakeaways?.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Highlights
                    </h3>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      {summary.keyTakeaways.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {summary.keyPoints?.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Details
                    </h3>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      {summary.keyPoints.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {!loading && summary && (
              <div className="mt-4 flex justify-end gap-3 text-xs">
                <button
                  onClick={handleCopySummary}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  onClick={handleExportPdf}
                  className="text-gray-700 hover:text-gray-900 font-medium"
                >
                  Export PDF
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
