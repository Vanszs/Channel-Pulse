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
import type {
  AnalyzeChannelResponse,
  ChannelAnalysis,
  VideoAnalysis,
} from "@/types/youtube";

const sampleChannels = [
  "https://www.youtube.com/@GoogleDevelopers",
  "https://www.youtube.com/@Webflow",
  "https://www.youtube.com/@GoogleCloudTech",
];

type ViewState = "idle" | "loading" | "success" | "error";

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

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

  function updateFilters(patch: Partial<VideoFilters>) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      ...patch,
    }));
  }

  function applyPreset(
    preset:
      | "winners"
      | "views"
      | "fresh"
      | "velocity"
      | "breakout"
      | "momentum"
      | "reach",
  ) {
    if (!analysis) {
      return;
    }

    if (preset === "winners" || preset === "breakout" || preset === "momentum") {
      setFilters({
        ...defaultVideoFilters,
        dateRange: "30d",
        sort: "momentum",
      });
    } else if (preset === "views" || preset === "reach") {
      setFilters({
        ...defaultVideoFilters,
        dateRange: "30d",
        sort: "views",
      });
    } else if (preset === "fresh") {
      setFilters({
        ...defaultVideoFilters,
        dateRange: "7d",
        sort: "recency",
      });
    } else if (preset === "velocity") {
      setFilters({
        ...defaultVideoFilters,
        dateRange: "30d",
        sort: "viewsPerDay",
      });
    }

    requestAnimationFrame(() => scrollToSection("video-results"));
  }

  function handleTagSelect(tag: string) {
    updateFilters({
      search: tag,
      dateRange: filters.dateRange === "all" ? "30d" : filters.dateRange,
    });
    requestAnimationFrame(() => scrollToSection("video-results"));
  }

  function inspectVideo(video: VideoAnalysis) {
    updateFilters({
      search: video.title,
    });
    requestAnimationFrame(() => scrollToSection("video-results"));
  }

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
        <header className="fade-up rounded-[30px] border border-black/8 bg-white/46 px-5 py-4 backdrop-blur-xl sm:px-6 lg:px-7">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] border border-[var(--accent)]/18 bg-[linear-gradient(135deg,rgba(255,107,74,0.18),rgba(255,255,255,0.96))] text-sm font-semibold tracking-[-0.08em] text-[var(--ink)] shadow-[0_10px_26px_rgba(255,107,74,0.08)]">
                CP
              </div>
              <div>
                <p className="text-sm font-semibold tracking-[-0.03em] text-[var(--ink)]">
                  Channel Pulse
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Competitive YouTube research workspace for strategy and growth teams.
                </p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3 xl:w-[600px]">
              {[
                {
                  title: "Scan public channels",
                  detail: "Turn any competitor URL into a ranked monthly view.",
                },
                {
                  title: "Spot breakout formats",
                  detail: "See which uploads are accelerating beyond the baseline.",
                },
                {
                  title: "Share the brief",
                  detail: "Export a focused set of winners for your next planning cycle.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-[22px] border border-black/8 bg-white/62 px-4 py-3"
                >
                  <p className="text-xs font-medium text-[var(--ink)]">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.92fr]">
          <Panel className="fade-up rounded-[36px] px-6 py-7 sm:px-8 sm:py-9">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-black/42">
              Competitive research workspace
            </p>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-[-0.08em] text-[var(--ink)] sm:text-5xl lg:text-[3.8rem]">
              Turn any YouTube channel into a clear view of what is winning right now.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--muted)] sm:text-lg">
              Paste a public competitor URL to rank recent uploads by momentum,
              compare repeatable themes, and turn the strongest patterns into a brief
              your team can act on this week.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[24px] border border-black/8 bg-white/60 p-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-black/38">
                  Winner board
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  See the uploads outperforming the channel baseline in one ranked view.
                </p>
              </div>
              <div className="rounded-[24px] border border-black/8 bg-white/60 p-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-black/38">
                  Signal view
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  Separate fast risers from legacy hits with velocity, reach, and recency.
                </p>
              </div>
              <div className="rounded-[24px] border border-black/8 bg-white/60 p-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-black/38">
                  Team handoff
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  Filter, isolate, and export the exact set you want to share internally.
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
                How teams use it
              </p>
              <span className="rounded-full border border-black/8 px-3 py-1 text-xs font-medium text-black/60">
                Built for weekly planning
              </span>
            </div>

            <div className="mt-6 rounded-[28px] border border-black/8 bg-[var(--surface-strong)] p-5">
              <p className="text-sm font-medium text-[var(--ink)]">
                What this workspace helps you answer
              </p>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                Use the workspace to identify breakout uploads, understand which
                content formats are compounding, and convert recent winners into a
                focused brief for your team.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  "Find breakout uploads quickly",
                  "Compare titles, topics, and cadence",
                  "Prioritize current winners over legacy hits",
                  "Share a clean working list with the team",
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
              <p className="text-sm font-medium text-[var(--ink)]">
                Fast workflow
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--muted)]">
                <li>Start with Winners This Month to see which uploads are outpacing the current baseline.</li>
                <li>Use tags, chart clicks, and title search to narrow to one pattern worth reacting to.</li>
                <li>Export the filtered table once the result set matches the brief you want to share.</li>
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
                A workspace that gets you from scan to action.
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
                Why the output feels useful
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
                It is organized around the questions a strategist actually asks.
              </h2>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                Which uploads are winning right now, which ones are moving faster
                than the channel baseline, and which topics are repeating enough
                to deserve a response from your team.
              </p>
            </Panel>
          </section>
        ) : null}

        {analysis ? (
          <div className="grid gap-6">
            <nav className="fade-up flex flex-wrap items-center gap-2 rounded-[24px] border border-black/8 bg-white/52 px-4 py-3">
              {[
                { label: "Overview", target: "channel-overview" },
                { label: "KPI summary", target: "kpi-summary" },
                { label: "Insights", target: "insight-panel" },
                { label: "Video results", target: "video-results" },
              ].map((item) => (
                <button
                  key={item.target}
                  type="button"
                  onClick={() => scrollToSection(item.target)}
                  className="rounded-full border border-black/8 bg-white/74 px-3 py-2 text-xs font-medium text-[var(--ink)] transition hover:border-black/18 hover:bg-white"
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {viewState === "loading" ? (
              <div className="fade-up rounded-[24px] border border-black/8 bg-white/58 px-5 py-4 text-sm text-[var(--muted)]">
                Refreshing the analysis with the latest channel input...
              </div>
            ) : null}

            <div id="channel-overview">
              <ChannelHeader
                analysis={analysis}
                onCopyBrief={handleCopyBrief}
                copyLabel={copyLabel}
                onTagSelect={handleTagSelect}
              />
            </div>

            <div id="kpi-summary">
              <SummaryCards
                analysis={analysis}
                onPresetSelect={applyPreset}
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.22fr_0.98fr]">
              <div id="chart-panel">
                <PerformanceChart
                  videos={chartVideos}
                  onInspectVideo={inspectVideo}
                />
              </div>
              <div id="insight-panel">
                <InsightsPanel analysis={analysis} />
              </div>
            </div>

            <FiltersBar
              filters={filters}
              totalCount={analysis.videos.length}
              visibleCount={visibleVideos.length}
              onChange={updateFilters}
              onReset={() =>
                setFilters({
                  ...defaultVideoFilters,
                  dateRange: analysis.defaultDateRange,
                })
              }
              onExport={handleExport}
              exportDisabled={!visibleVideos.length}
              onPresetSelect={applyPreset}
            />

            <div id="video-results">
              <VideoTable
                videos={visibleVideos}
                onTagPick={handleTagSelect}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
