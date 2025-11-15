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
      setError("Please paste some article text first.");
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
      setError(err.message || "Something went wrong while summarizing.");
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
    const textLines: string[] = [];

    if (summary.title) {
      textLines.push(`Title: ${summary.title}`, "");
    }
    if (summary.keyTakeaways?.length) {
      textLines.push("Key Takeaways:");
      summary.keyTakeaways.forEach((t) => textLines.push(`- ${t}`));
      textLines.push("");
    }
    if (summary.keyPoints?.length) {
      textLines.push("Key Points:");
      summary.keyPoints.forEach((p) => textLines.push(`- ${p}`));
    }

    const finalText = textLines.join("\n");

    try {
      await navigator.clipboard.writeText(finalText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore clipboard failures
    }
  }

  function handleUseSample() {
    const sample = `Time-Varying Spending Targets

The withdrawal budget formula allows for a nonconstant sequence of withdrawal targets. A specific example of non-constant withdrawals would be to plan for an income stream with the shape of Blanchett (2014)’s “retirement spending smile.” He found that spending is highest in the early, healthiest, most active years of retirement, then declining over several years as the retiree becomes more sedentary before increasing again to satisfy greater healthcare needs.`;
    setArticleText(sample);
    setSummary(null);
    setError(null);
    setCopied(false);
  }

  return (
    <div className="space-y-8">
      {/* Header – matches main site tone */}
      <header className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-blue-700">
          LargeKite Capital · Research Tool
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
          Research Summarizer for CFA & Academic Articles
        </h1>
        <p className="text-sm text-gray-700 max-w-3xl">
          We use this tool to convert dense retirement, factor, and portfolio
          research into concise, practitioner-ready takeaways. AI does the first
          pass; <span className="font-medium">final judgment remains human.</span>
        </p>
      </header>

      {/* Two-column layout */}
      <div className="grid gap-6 md:grid-cols-2 md:items-start">
        {/* Left: input */}
        <section className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">
                Article text
              </span>
              <span className="text-xs text-gray-500">
                {charCount.toLocaleString()} / {maxChars.toLocaleString()} chars
              </span>
            </div>

            <textarea
              className="w-full min-h-[260px] rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm leading-relaxed text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
              placeholder="Paste the article text here (e.g., abstract + main body from a CFA Institute / FAJ paper)..."
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
                {loading ? "Summarizing..." : "Summarize article"}
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
                Use sample text
              </button>
            </div>
          </form>

          <div className="space-y-1 text-[11px] text-gray-500">
            <p>
              For best results, include at least the abstract and main body. We
              typically skip references and footnotes.
            </p>
            <p>
              Internally, we pair this with the original PDF and a human review
              before incorporating any idea into portfolios or client work.
            </p>
          </div>
        </section>

        {/* Right: summary */}
        <section className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 md:p-5 shadow-sm min-h-[260px] flex flex-col">
            {!summary && !loading && !error && (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-sm text-gray-500 px-4">
                <div className="mb-2 text-base font-medium text-gray-800">
                  Summary will appear here
                </div>
                <p>
                  Paste an article on the left and click{" "}
                  <span className="font-medium text-gray-900">
                    Summarize article
                  </span>{" "}
                  to see key takeaways and practitioner points.
                </p>
              </div>
            )}

            {loading && (
              <div className="flex-1 flex flex-col items-center justify-center text-sm text-gray-500">
                <div className="animate-pulse mb-2 text-base font-medium text-gray-800">
                  Generating summary…
                </div>
                <p>Extracting spending rules, risk insights, and trade-offs.</p>
              </div>
            )}

            {summary && !loading && (
              <div className="space-y-4 flex-1">
                {summary.title && (
                  <div className="border-b border-gray-100 pb-3">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {summary.title}
                    </h2>
                    <p className="mt-1 text-xs text-gray-500">
                      Model-generated summary. We always cross-check with the
                      original paper.
                    </p>
                  </div>
                )}

                {summary.keyTakeaways?.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Key takeaways
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
                      Key points
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

            <div className="mt-4 flex items-center justify-between text-[11px] text-gray-500">
              <div>
                This tool summarizes research for discussion. It is not
                investment advice or a recommendation to act.
              </div>

              {summary && !loading && (
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="text-[11px] font-medium text-blue-600 hover:text-blue-700"
                >
                  {copied ? "Copied" : "Copy summary"}
                </button>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-700">
              How we use this in practice
            </h3>
            <ul className="text-[11px] text-gray-600 space-y-1 list-disc list-inside">
              <li>
                <span className="font-medium">Pre-meeting prep:</span> skim new
                retirement and portfolio papers before client or IC
                conversations.
              </li>
              <li>
                <span className="font-medium">Idea triage:</span> decide which
                research merits a full read and model replication.
              </li>
              <li>
                <span className="font-medium">Risk discussion support:</span>{" "}
                pull out key risk, assumption, and limitation language to frame
                trade-offs clearly.
              </li>
            </ul>
            <p className="text-[11px] text-gray-500">
              LargeKite Capital is human-led. AI helps us read faster; it does
              not replace analysis, judgment, or suitability work.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
