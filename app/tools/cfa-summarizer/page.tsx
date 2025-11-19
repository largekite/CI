"use client";

import React, { useState } from "react";
import Link from "next/link";

interface ArticleSummary {
  title?: string;
  keyTakeaways: string[]; // UI: Highlights
  keyPoints: string[];    // UI: Details
  rawText: string;
}

type SummaryLevel = "base" | "more" | "max";

const MAX_CHARS = 20000;

export default function SummarizerPage() {
  const [articleText, setArticleText] = useState("");
  const [articleUrl, setArticleUrl] = useState("");
  const [summary, setSummary] = useState<ArticleSummary | null>(null);

  const [loadingText, setLoadingText] = useState(false);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function summarizeText(level: SummaryLevel) {
    setError(null);
    setSummary(null);
    setCopied(false);

    if (!articleText.trim()) {
      setError("Please provide article text.");
      return;
    }

    setLoadingText(true);
    try {
      const res = await fetch("/api/summarize-cfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleText, level }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.details || data?.error || "Request failed");
      }

      setSummary(data as ArticleSummary);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Unable to generate summary.");
    } finally {
      setLoadingText(false);
    }
  }

  async function summarizeUrl(level: SummaryLevel) {
    setError(null);
    setSummary(null);
    setCopied(false);

    const url = articleUrl.trim();
    if (!url) {
      setError("Please enter an article URL.");
      return;
    }

    setLoadingUrl(true);
    try {
      const res = await fetch("/api/summarize-cfa-from-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, level }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.details || data?.error || "Failed to summarize URL.");
      }

      setSummary(data as ArticleSummary);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to summarize URL.");
    } finally {
      setLoadingUrl(false);
    }
  }

  function handleClearText() {
    setArticleText("");
    setSummary(null);
    setCopied(false);
    setError(null);
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
    <>
      <header className="nav">
        <div className="brand">
          <Link href="/">LargeKite<span>Capital</span></Link>
        </div>
      </header>
      
      <div className="space-y-8" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
          Summary Tool
        </h1>

        <div className="grid gap-6 md:grid-cols-2 md:items-start">
          <section>
            <div className="rounded-2xl border border-gray-200 bg-white p-4 md:p-5 shadow-sm space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">
                  Article URL (optional)
                </label>
                <input
                  type="url"
                  value={articleUrl}
                  onChange={(e) => setArticleUrl(e.target.value)}
                  placeholder="https://example.com/article..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
              <div className="flex flex-wrap gap-2 text-xs mt-1">
                <button
                  type="button"
                  onClick={() => summarizeUrl("base")}
                  disabled={loadingUrl}
                  className="rounded-lg bg-gray-200 px-3 py-1.5 font-medium text-gray-900 hover:bg-gray-300 disabled:opacity-60"
                >
                  {loadingUrl ? "Summarizing..." : "Summarize URL"}
                </button>
                <button
                  type="button"
                  onClick={() => summarizeUrl("more")}
                  disabled={loadingUrl}
                  className="rounded-lg bg-gray-200 px-3 py-1.5 font-medium text-gray-900 hover:bg-gray-300 disabled:opacity-60"
                >
                  More detail
                </button>
                <button
                  type="button"
                  onClick={() => summarizeUrl("max")}
                  disabled={loadingUrl}
                  className="rounded-lg bg-gray-200 px-3 py-1.5 font-medium text-gray-900 hover:bg-gray-300 disabled:opacity-60"
                >
                  Max detail
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    Article text
                  </span>
                  <span className="text-xs text-gray-500">
                    {articleText.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
                  </span>
                </div>

                <textarea
                  className="w-full min-h-[220px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm leading-relaxed text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  placeholder="Paste article text here, if you prefer text instead of URL…"
                  value={articleText}
                  maxLength={MAX_CHARS}
                  onChange={(e) => setArticleText(e.target.value)}
                />

                <div className="flex items-center gap-3 flex-wrap mt-2">
                  <button
                    type="button"
                    onClick={() => summarizeText("base")}
                    disabled={loadingText}
                    className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-800 disabled:opacity-60"
                  >
                    {loadingText ? "Working..." : "Summarize text"}
                  </button>
                  <button
                    type="button"
                    onClick={() => summarizeText("more")}
                    disabled={loadingText}
                    className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-300 disabled:opacity-60"
                  >
                    More detail
                  </button>
                  <button
                    type="button"
                    onClick={() => summarizeText("max")}
                    disabled={loadingText}
                    className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-300 disabled:opacity-60"
                  >
                    Max detail
                  </button>
                  <button
                    type="button"
                    onClick={handleClearText}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear text
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
            </div>
          </section>

          <section>
            <div className="rounded-2xl border border-gray-200 bg-white p-4 md:p-5 shadow-sm min-h-[260px] flex flex-col">
              {(loadingText || loadingUrl) && (
                <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
                  <div className="animate-pulse">Generating summary…</div>
                </div>
              )}

              {!loadingText && !loadingUrl && summary && (
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

              {!loadingText && !loadingUrl && summary && (
                <div className="mt-4 flex justify-end gap-3 text-xs">
                  <button
                    type="button"
                    onClick={handleCopySummary}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <button
                    type="button"
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
    </>
  );
}