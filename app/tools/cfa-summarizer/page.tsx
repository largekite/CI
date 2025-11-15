"use client";

import React, { useState } from "react";
import jsPDF from "jspdf";

interface ArticleSummary {
  title?: string;
  keyTakeaways: string[]; // Highlights
  keyPoints: string[];    // Details
  rawText: string;
}

type SummaryLevel = "base" | "more" | "max";

const MAX_CHARS = 20000;

async function extractTextFromFile(file: File): Promise<string> {
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    // Basic PDF text extraction using pdfjs-dist
    const arrayBuffer = await file.arrayBuffer();
    const pdfjsLib = await import("pdfjs-dist/build/pdf");

    // @ts-ignore - pdfjs types are a bit messy
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;

    let fullText = "";
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const strings = content.items.map((item: any) => item.str || "").join(" ");
      fullText += strings + "\n\n";
    }
    return fullText;
  }

  // Fallback: plain text files
  return await file.text();
}

export default function SummarizerPage() {
  const [articleText, setArticleText] = useState("");
  const [summary, setSummary] = useState<ArticleSummary | null>(null);

  const [articleTextB, setArticleTextB] = useState("");
  const [summaryB, setSummaryB] = useState<ArticleSummary | null>(null);
  const [compareMode, setCompareMode] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingCompare, setLoadingCompare] = useState(false);
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

  async function runComparison() {
    setError(null);
    setSummary(null);
    setSummaryB(null);
    setCopied(false);

    if (!articleText.trim() || !articleTextB.trim()) {
      setError("Please provide text for both articles.");
      return;
    }

    setLoadingCompare(true);
    try {
      const [resA, resB] = await Promise.all([
        fetch("/api/summarize-cfa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ articleText, level: "base" }),
        }),
        fetch("/api/summarize-cfa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ articleText: articleTextB, level: "base" }),
        }),
      ]);

      if (!resA.ok || !resB.ok) {
        throw new Error("Comparison request failed.");
      }

      const jsonA = (await resA.json()) as ArticleSummary;
      const jsonB = (await resB.json()) as ArticleSummary;
      setSummary(jsonA);
      setSummaryB(jsonB);
    } catch (err) {
      console.error(err);
      setError("Unable to compare articles.");
    } finally {
      setLoadingCompare(false);
    }
  }

  function handleClearPrimary() {
    setArticleText("");
    setSummary(null);
    setCopied(false);
    setError(null);
  }

  function handleClearSecondary() {
    setArticleTextB("");
    setSummaryB(null);
    setError(null);
  }

  async function handleFileUploadPrimary(e: React.ChangeEvent<HTMLInputElement>) {
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
    } catch (err) {
      console.error(err);
      setError("Unable to read file.");
    }
  }

  async function handleFileUploadSecondary(e: React.ChangeEvent<HTMLInputElement>) {
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

      setArticleTextB(truncated);
      setSummaryB(null);
      setError(msg);
    } catch (err) {
      console.error(err);
      setError("Unable to read file.");
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
    } catch {}
  }

  function handleExportPdf() {
    if (!summary) return;

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
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
        Summary Tool
      </h1>

      {/* PRIMARY INPUT + SUMMARY */}
      <div className="grid gap-6 md:grid-cols-2 md:items-start">
        {/* LEFT: Primary input */}
        <section>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 md:p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">
                Article A
              </span>
              <span className="text-xs text-gray-500">
                {articleText.length.toLocaleString()} /{" "}
                {MAX_CHARS.toLocaleString()}
              </span>
            </div>

            <textarea
              className="w-full min-h-[220px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm leading-relaxed text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              placeholder="Paste text for Article A…"
              value={articleText}
              maxLength={MAX_CHARS}
              onChange={(e) => setArticleText(e.target.value)}
            />

            <div className="flex flex-col gap-2 text-xs text-gray-600">
              <label className="inline-flex items-center gap-2">
                <span>Upload (txt / md / pdf):</span>
                <input
                  type="file"
                  accept=".txt,.md,.text,application/pdf"
                  onChange={handleFileUploadPrimary}
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
                onClick={handleClearPrimary}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            </div>
          </div>
        </section>

        {/* RIGHT: Primary summary */}
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

      {/* COMPARE SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">
            Compare two articles
          </span>
          <label className="inline-flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={compareMode}
              onChange={(e) => setCompareMode(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span>Enable comparison</span>
          </label>
        </div>

        {compareMode && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Article B input */}
            <div className="rounded-2xl border border-gray-200 bg-white p-4 md:p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">
                  Article B
                </span>
                <span className="text-xs text-gray-500">
                  {articleTextB.length.toLocaleString()} /{" "}
                  {MAX_CHARS.toLocaleString()}
                </span>
              </div>

              <textarea
                className="w-full min-h-[180px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm leading-relaxed text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder="Paste text for Article B…"
                value={articleTextB}
                maxLength={MAX_CHARS}
                onChange={(e) => setArticleTextB(e.target.value)}
              />

              <div className="flex flex-col gap-2 text-xs text-gray-600">
                <label className="inline-flex items-center gap-2">
                  <span>Upload (txt / md / pdf):</span>
                  <input
                    type="file"
                    accept=".txt,.md,.text,application/pdf"
                    onChange={handleFileUploadSecondary}
                    className="text-xs"
                  />
                </label>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={runComparison}
                  disabled={loadingCompare}
                  className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-800 disabled:opacity-60"
                >
                  {loadingCompare ? "Comparing..." : "Compare"}
                </button>
                <button
                  onClick={handleClearSecondary}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Comparison summaries */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Article A summary (base) */}
              <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm min-h-[180px]">
                <h3 className="text-xs font-semibold text-gray-900 mb-2">
                  Article A (base)
                </h3>
                {summary && (
                  <div className="space-y-2 text-xs text-gray-700">
                    {summary.title && (
                      <div className="font-medium">{summary.title}</div>
                    )}
                    {summary.keyTakeaways?.length > 0 && (
                      <ul className="list-disc list-inside space-y-1">
                        {summary.keyTakeaways.slice(0, 4).map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* Article B summary */}
              <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm min-h-[180px]">
                <h3 className="text-xs font-semibold text-gray-900 mb-2">
                  Article B (base)
                </h3>
                {summaryB && (
                  <div className="space-y-2 text-xs text-gray-700">
                    {summaryB.title && (
                      <div className="font-medium">{summaryB.title}</div>
                    )}
                    {summaryB.keyTakeaways?.length > 0 && (
                      <ul className="list-disc list-inside space-y-1">
                        {summaryB.keyTakeaways.slice(0, 4).map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
