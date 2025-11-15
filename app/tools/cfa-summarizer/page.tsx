"use client";

import React, { useState } from "react";

interface ArticleSummary {
  title?: string;
  keyTakeaways: string[];
  keyPoints: string[];
  rawText: string;
}

export default function CfaSummarizerPage() {
  const [articleText, setArticleText] = useState("");
  const [summary, setSummary] = useState<ArticleSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const charCount = articleText.length;
  const maxChars = 20000;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSummary(null);
    setCopied(false);

    if (!articleText.trim()) {
      setError("Please paste some article text.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/summarize-cfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleText }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.details || data?.error || `Request failed`);
      }

      const data = (await res.json()) as ArticleSummary;
      setSummary(data);
    } catch (err: any) {
      console.error(err);
      setError("Unable to generate summary.");
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setArticleText("");
    setSummary(null);
    setError(null);
    setCopied(false);
  }

  async function handleCopySummary() {
    if (!summary) return;

    const lines: string[] = [];

    if (summary.title) lines.push(`Title: ${summary.title}\n`);
    if (summary.keyTakeaways?.length) {
      lines.push("Key Takeaways:");
      summary.keyTakeaways.forEach((t) => lines.push(`- ${t}`));
      lines.push("");
    }
    if (summary.keyPoints?.length) {
      lines.push("Key Points:");
      summary.keyPoints.forEach((p) => lines.push(`- ${p}`));
    }

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  function handleUseSample() {
    const sample = `Time-Varying Spending Targets

The withdrawal budget formula allows for a nonconstant sequence of withdrawal targets...`;
    setArticleText(sample);
    setSummary(null);
    setError(null);
    setCopied(false);
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
          Research Summarizer
        </h1>
        <p className="text-sm text-gray-700 max-w-3xl">
          Paste text from a CFA or academic article to generate key takeaways
          and key points.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 md:items-start">
        {/* LEFT: INPUT */}
        <section className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">
                Article text
              </span>
              <span className="text-xs text-gray-500">
                {charCount.toLocaleString()} / {maxChars.toLocaleString()}
              </span>
            </div>

            <textarea
              className="w-full min-h-[260px] rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm leading-relaxed text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
              placeholder="Paste article text here..."
              value={articleText}
              maxLength={maxChars}
              onChange={(e) => setArticleText(e.target.value)}
            />

            {error && (
              <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-800 disabled:opacity-60"
              >
                {loading ? "Summarizing..." : "Summarize"}
              </button>

              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={handleUseSample}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Sample
              </button>
            </div>
          </form>
        </section>

        {/* RIGHT: SUMMARY */}
        <section className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 md:p-5 shadow-sm min-h-[260px] flex flex-col">
            {loading && (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
                <div className="animate-pulse text-base font-medium text-gray-800">
                  Generating summary…
                </div>
              </div>
            )}

            {!loading && summary && (
              <div className="space-y-4 flex-1">
                {summary.title && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {summary.title}
                    </h2>
                  </div>
                )}

                {summary.keyTakeaways?.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Key Takeaways
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      {summary.keyTakeaways.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {summary.keyPoints?.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Key Points
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      {summary.keyPoints.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {!loading && !summary && (
              <div className="flex-1" />
            )}

            {summary && !loading && (
              <div className="mt-4 flex justify-end text-[11px]">
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
