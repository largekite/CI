// app/tools/cfa-summarizer/page.tsx
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSummary(null);

    if (!articleText.trim()) {
      setError("Please paste the article text first.");
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
        throw new Error(data?.error || `Request failed with ${res.status}`);
      }

      const data = (await res.json()) as ArticleSummary;
      setSummary(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">
          CFA Research Article Summarizer
        </h1>
        <p className="text-sm text-gray-600">
          Paste a CFA Institute / Financial Analysts Journal article (text only),
          and LargeKite Capital will generate key takeaways and practitioner
          points for you.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-medium">
          Article Text
          <textarea
            className="mt-1 w-full min-h-[220px] rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-500/40"
            placeholder="Paste the article text here (e.g., from PDF copy)..."
            value={articleText}
            onChange={(e) => setArticleText(e.target.value)}
          />
        </label>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
          >
            {loading ? "Summarizing..." : "Summarize Article"}
          </button>
          {error && (
            <span className="text-sm text-red-600">
              {error}
            </span>
          )}
        </div>
      </form>

      {summary && (
        <div className="space-y-6 border rounded-2xl p-5 bg-white shadow-sm">
          {summary.title && (
            <div>
              <h2 className="text-xl font-semibold">{summary.title}</h2>
            </div>
          )}

          {summary.keyTakeaways?.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Key Takeaways</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {summary.keyTakeaways.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          )}

          {summary.keyPoints?.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Key Points</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {summary.keyPoints.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
