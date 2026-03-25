"use client";

import { startTransition, useDeferredValue, useEffect, useState } from "react";

import { ChannelHeader } from "@/components/features/analyzer/channel-header";
import { ChannelForm } from "@/components/features/analyzer/channel-form";
import { FiltersBar } from "@/components/features/analyzer/filters-bar";
import { InsightsPanel } from "@/components/features/analyzer/insights-panel";
import { PerformanceChart } from "@/components/features/analyzer/performance-chart";
import { ResultsSkeleton } from "@/components/features/analyzer/results-skeleton";
import { SummaryCards } from "@/components/features/analyzer/summary-cards";
import { VideoTable } from "@/components/features/analyzer/video-table";
import { Panel } from "@/components/ui/panel";
import { buildVideosCsv } from "@/lib/csv";
import { normalizeYouTubeChannelInput } from "@/lib/channel-url";
import { formatCompactNumber } from "@/lib/formatters";
import { applyVideoFilters, defaultVideoFilters, type VideoFilters } from "@/lib/video-filters";
import type { AnalyzeChannelResponse, ChannelAnalysis } from "@/types/youtube";

const sampleChannels = [
  "https://www.youtube.com/@GoogleDevelopers",
  "https://www.youtube.com/@Webflow",
  "https://www.youtube.com/@GoogleCloudTech",
];

type ViewState = "idle" | "loading" | "success" | "error";

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function AnalyzerShell() {
  const [channelUrl, setChannelUrl] = useState("");
  const [analysis, setAnalysis] = useState<ChannelAnalysis | null>(null);
  const [filters, setFilters] = useState<VideoFilters>(defaultVideoFilters);
  const [viewState, setViewState] = useState<ViewState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [copyLabel, setCopyLabel] = useState("Copy brief");
  const deferredSearch = useDeferredValue(filters.search);

  useEffect(() => {
    if (copyLabel === "Copy brief") {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setCopyLabel("Copy brief");
    }, 1800);

    return () => window.clearTimeout(timeout);
  }, [copyLabel]);

  const visibleVideos = analysis
    ? applyVideoFilters(analysis.videos, {
        ...filters,
        search: deferredSearch,
      })
    : [];
  const chartVideos = visibleVideos.length
    ? visibleVideos.slice(0, 6)
    : analysis?.videos.slice(0, 6) ?? [];

  async function runAnalysis(nextChannelUrl: string) {
    const normalized = normalizeYouTubeChannelInput(nextChannelUrl);

    if (!normalized.ok) {
      setViewState("error");
      setError(normalized.error);
      return;
    }

    setViewState("loading");
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channelUrl: normalized.normalizedUrl,
        }),
      });
      const payload = (await response.json()) as AnalyzeChannelResponse;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.ok ? "Unable to analyze this channel." : payload.error);
      }

      startTransition(() => {
        setAnalysis(payload.data);
        setFilters({
          ...defaultVideoFilters,
          dateRange: payload.data.defaultDateRange,
        });
      });

      setChannelUrl(normalized.normalizedUrl);
      setViewState("success");
    } catch (caughtError) {
      setViewState("error");
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to analyze this channel right now.",
      );
    }
  }

  async function handleCopyBrief() {
    if (!analysis) {
      return;
    }

    const leader = analysis.videos[0];
    const summary = `${analysis.channel.name} has ${analysis.metrics.monthlyWinners} current winners this month. Top video: ${leader.title} at ${formatCompactNumber(leader.viewsPerDay)} views/day. Source: ${analysis.channel.url}`;

    try {
      await navigator.clipboard.writeText(summary);
      setCopyLabel("Copied");
    } catch {
      setCopyLabel("Retry copy");
    }
  }

  function handleExport() {
    if (!visibleVideos.length || !analysis) {
      return;
    }

    const csv = buildVideosCsv(visibleVideos);
    const filename = `${analysis.channel.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")}-winners.csv`;

    downloadCsv(filename, csv);
  }

  return (
    <div className="app-shell">
      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <header className="fade-up flex flex-col gap-4 rounded-[30px] border border-black/8 bg-white/46 px-5 py-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-black/42">
              Channel Pulse
            </p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Competitor YouTube intelligence for startup teams.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-medium text-black/62">
            <span className="rounded-full border border-black/8 px-3 py-1.5">
              Next.js App Router
            </span>
            <span className="rounded-full border border-black/8 px-3 py-1.5">
              Tailwind only
            </span>
            <span className="rounded-full border border-black/8 px-3 py-1.5">
              Real YouTube data
            </span>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.92fr]">
          <Panel className="fade-up rounded-[36px] px-6 py-7 sm:px-8 sm:py-9">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-black/42">
              Competitor channel analysis
            </p>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-[-0.08em] text-[var(--ink)] sm:text-5xl lg:text-[3.8rem]">
              See which videos are winning this month and why.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--muted)] sm:text-lg">
              Paste a competitor&apos;s YouTube channel URL to surface breakout uploads,
              views-per-day momentum, sortable performance signals, and fast lessons
              your team can reuse next week.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[24px] border border-black/8 bg-white/60 p-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-black/38">
                  Winning now
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  Find the uploads pulling the most daily attention, not just legacy hits.
                </p>
              </div>
              <div className="rounded-[24px] border border-black/8 bg-white/60 p-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-black/38">
                  Momentum
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  Rank by velocity, recency, and an outperformance proxy to catch lift early.
                </p>
              </div>
              <div className="rounded-[24px] border border-black/8 bg-white/60 p-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-black/38">
                  Learn fast
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  Convert patterns into a concrete read on what this competitor is repeating.
                </p>
              </div>
            </div>

            <ChannelForm
              value={channelUrl}
              isLoading={viewState === "loading"}
              error={error}
              onChange={setChannelUrl}
              onSubmit={(event) => {
                event.preventDefault();
                void runAnalysis(channelUrl);
              }}
              onExampleSelect={(value) => {
                setChannelUrl(value);
                void runAnalysis(value);
              }}
              examples={sampleChannels}
            />
          </Panel>

          <Panel className="fade-up rounded-[36px] px-6 py-7 sm:px-8 sm:py-9">
            <div className="flex items-center justify-between">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-black/42">
                Signal model
              </p>
              <span className="rounded-full border border-black/8 px-3 py-1 text-xs font-medium text-black/60">
                Swiss-style dashboard
              </span>
            </div>

            <div className="mt-6 rounded-[28px] border border-black/8 bg-[var(--surface-strong)] p-5">
              <p className="text-sm font-medium text-[var(--ink)]">
                Performance score
              </p>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                Reach, views/day, engagement proxy, a velocity proxy, and recency are
                blended into a single signal so you can answer, quickly, which uploads
                deserve attention right now.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  "Views reach",
                  "Views / day",
                  "Velocity proxy",
                  "Engagement proxy",
                  "Recency",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-black/8 bg-white/72 px-4 py-3 text-sm text-[var(--muted)]"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-[28px] border border-black/8 bg-black/[0.02] p-5">
              <p className="text-sm font-medium text-[var(--ink)]">Questions this app answers</p>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--muted)]">
                <li>Which competitor videos are outperforming the monthly baseline?</li>
                <li>Which topics are accelerating instead of cooling off?</li>
                <li>What publishing patterns should your team steal next?</li>
              </ul>
            </div>
          </Panel>
        </section>

        {viewState === "loading" && !analysis ? <ResultsSkeleton /> : null}

        {!analysis && viewState !== "loading" ? (
          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Panel className="fade-up rounded-[32px] px-6 py-6 sm:px-8 sm:py-7">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-black/42">
                What shows up after analysis
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
                A real product surface, not a one-screen mock.
              </h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  "Channel overview and monthly KPI cards",
                  "Views/day velocity chart",
                  "Search, sort, and date filters",
                  "Responsive ranked video table",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-[24px] border border-black/8 bg-white/58 p-4 text-sm leading-6 text-[var(--muted)]"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </Panel>

            <Panel className="fade-up rounded-[32px] px-6 py-6 sm:px-8 sm:py-7">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-black/42">
                Built for launch speed
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
                Clean boundaries now, real API later.
              </h2>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                The app separates the route handler, YouTube ingestion service,
                scoring logic, filter utilities, and UI components so we can add
                persistence or historical snapshots without rewriting the frontend.
              </p>
            </Panel>
          </section>
        ) : null}

        {analysis ? (
          <div className="grid gap-6">
            {viewState === "loading" ? (
              <div className="fade-up rounded-[24px] border border-black/8 bg-white/58 px-5 py-4 text-sm text-[var(--muted)]">
                Refreshing the analysis with the latest channel input...
              </div>
            ) : null}

            <ChannelHeader
              analysis={analysis}
              onCopyBrief={handleCopyBrief}
              copyLabel={copyLabel}
            />

            <SummaryCards analysis={analysis} />

            <div className="grid gap-6 xl:grid-cols-[1.22fr_0.98fr]">
              <PerformanceChart videos={chartVideos} />
              <InsightsPanel analysis={analysis} />
            </div>

            <FiltersBar
              filters={filters}
              totalCount={analysis.videos.length}
              visibleCount={visibleVideos.length}
              onChange={(patch) =>
                setFilters((currentFilters) => ({
                  ...currentFilters,
                  ...patch,
                }))
              }
              onReset={() =>
                setFilters({
                  ...defaultVideoFilters,
                  dateRange: analysis.defaultDateRange,
                })
              }
              onExport={handleExport}
              exportDisabled={!visibleVideos.length}
            />

            <VideoTable videos={visibleVideos} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
