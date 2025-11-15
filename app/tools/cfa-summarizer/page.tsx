"use client";

import React, { useState } from "react";

interface ArticleSummary {
  title?: string;
  keyTakeaways: string[];
  keyPoints: string[];
  rawText: string;
}

export default function SummarizerPage() {
  const [articleText, setArticleText] = useState("");
  const [summary, setSummary] = useState<ArticleSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MAX_CHARS = 20000;

  async function runSummary(detailMode = false) {
    setError(null);
    setSummary(null);
    setCopied(false);

    if (!articleText.trim()) {
      setError("Please paste article text.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/summarize-cfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleText,
          detail: detailMode ? true : false,
        }),
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
    setError(null);
    setCopied(false);
  }

  async function handleCopy() {
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

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();

    let truncated = text;
    if (text.length > MAX_CHARS) {
      truncated = text.substring(0, MAX_CHARS);
      setError("File was too long — truncated to first 20,000 characters.");
    }

    setArticleText(truncated);
    setSummary(null);
    setCopied(false);
  }

  return (
    <div className="space-y-8">
      {/* TITLE */}
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
        Summary Tool
      </h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* LEFT SIDE */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 md:p-5 shadow-sm space-y-4">
          <div className="text-sm font-medium text-gray-900 flex items-center justify-between">
            <span>Article Text</span>
            <span className="text-xs text-gray-500">
              {articleText.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
            </span>
          </div>

          <textarea
            className="w-full min-h-[260px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm leading-relaxed text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            placeholder="Paste text here or upload a file below..."
            value={articleText}
            maxLength={MAX_CHARS}
            onChange={(e) => setArticleText(e.target.value)}
          />

          {/* File Upload */}
          <div>
            <input
              type="file"
              accept=".txt,.md,.pdf,.text"
              onChange={handleFileUpload}
              className="text-xs text-gray-600"
            />
          </div>

          {error && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => runSummary(false)}
              disabled={loading}
              className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60"
            >
              {loading ? "Working..." : "Summarize"}
            </button>

            {/* More detail mode */}
            <button
              onClick={() => runSummary(true)}
              disabled={loading}
              className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-300 disabled:opacity-60"
            >
              More detail
            </button>

            <button
              onClick={handleClear}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          </div>
        </div>

        {/* RIGHT SIDE */}
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
                    Key Takeaways
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
                    Key Points
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
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleCopy}
                className="text-blue-600 hover:text-blue-700 text-xs font-medium"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
