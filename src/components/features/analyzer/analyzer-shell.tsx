"use client";

import { startTransition, useDeferredValue, useEffect, useState } from "react";

import { ChannelHeader } from "@/components/features/analyzer/channel-header";
import { ChannelForm } from "@/components/features/analyzer/channel-form";
import { FiltersBar } from "@/components/features/analyzer/filters-bar";
import { InsightsPanel } from "@/components/features/analyzer/insights-panel";
import { PerformanceChart } from "@/components/features/analyzer/performance-chart";
import { ResultsSkeleton } from "@/components/features/analyzer/results-skeleton";
import { SignalCharts } from "@/components/features/analyzer/signal-charts";
import { SummaryCards } from "@/components/features/analyzer/summary-cards";
import { VideoTable } from "@/components/features/analyzer/video-table";
import { Panel } from "@/components/ui/panel";
import { buildVideosCsv } from "@/lib/csv";
import { normalizeYouTubeChannelInput } from "@/lib/channel-url";
import { formatCompactNumber } from "@/lib/formatters";
import {
  clampPage,
  defaultPaginationState,
  paginateItems,
  type PaginationState,
} from "@/lib/pagination";
import {
  buildAnalysisSearchParams,
  parsePaginationFromSearchParams,
  parseVideoFiltersFromSearchParams,
} from "@/lib/url-state";
import {
  ANALYZE_INTENT_HEADER,
  ANALYZE_INTENT_VALUE,
} from "@/lib/request-security";
import { pickFastestMover } from "@/lib/topics";
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
type SummaryPreset = "winners" | "views" | "fresh" | "velocity" | "breakout";
type QuickPreset = "momentum" | "fresh" | "velocity" | "reach";

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

function getSortLabel(sort: VideoFilters["sort"]) {
  if (sort === "views") {
    return "total views";
  }

  if (sort === "viewsPerDay") {
    return "views per day";
  }

  if (sort === "recency") {
    return "recency";
  }

  if (sort === "performance") {
    return "performance score";
  }

  return "momentum score";
}

function getSegmentLabel(segment: VideoFilters["segment"]) {
  if (segment === "winners") {
    return "winner set";
  }

  if (segment === "breakout") {
    return "breakout set";
  }

  return "filtered set";
}

function isBasePresetState(filters: VideoFilters) {
  return filters.search.trim() === "" && filters.minViews === 0;
}

function getActiveSummaryPreset(filters: VideoFilters): SummaryPreset | null {
  if (!isBasePresetState(filters)) {
    return null;
  }

  if (
    filters.segment === "winners" &&
    filters.dateRange === "30d" &&
    filters.sort === "momentum"
  ) {
    return "winners";
  }

  if (
    filters.segment === "breakout" &&
    filters.dateRange === "30d" &&
    filters.sort === "viewsPerDay"
  ) {
    return "breakout";
  }

  if (
    filters.segment === "all" &&
    filters.dateRange === "30d" &&
    filters.sort === "views"
  ) {
    return "views";
  }

  if (
    filters.segment === "all" &&
    filters.dateRange === "7d" &&
    filters.sort === "recency"
  ) {
    return "fresh";
  }

  if (
    filters.segment === "all" &&
    filters.dateRange === "30d" &&
    filters.sort === "viewsPerDay"
  ) {
    return "velocity";
  }

  return null;
}

function getActiveQuickPreset(filters: VideoFilters): QuickPreset | null {
  if (!isBasePresetState(filters) || filters.segment !== "all") {
    return null;
  }

  if (filters.dateRange === "30d" && filters.sort === "momentum") {
    return "momentum";
  }

  if (filters.dateRange === "7d" && filters.sort === "recency") {
    return "fresh";
  }

  if (filters.dateRange === "30d" && filters.sort === "viewsPerDay") {
    return "velocity";
  }

  if (filters.dateRange === "30d" && filters.sort === "views") {
    return "reach";
  }

  return null;
}

export function AnalyzerShell() {
  const [channelUrl, setChannelUrl] = useState("");
  const [activeChannelUrl, setActiveChannelUrl] = useState("");
  const [analysis, setAnalysis] = useState<ChannelAnalysis | null>(null);
  const [filters, setFilters] = useState<VideoFilters>(defaultVideoFilters);
  const [pagination, setPagination] = useState<PaginationState>(defaultPaginationState);
  const [viewState, setViewState] = useState<ViewState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [copyLabel, setCopyLabel] = useState("Copy summary");
  const [shareLabel, setShareLabel] = useState("Copy workspace link");
  const [hasHydratedFromUrl, setHasHydratedFromUrl] = useState(false);
  const deferredSearch = useDeferredValue(filters.search);

  useEffect(() => {
    if (copyLabel === "Copy summary") {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setCopyLabel("Copy summary");
    }, 1800);

    return () => window.clearTimeout(timeout);
  }, [copyLabel]);

  useEffect(() => {
    if (shareLabel === "Copy workspace link") {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setShareLabel("Copy workspace link");
    }, 1800);

    return () => window.clearTimeout(timeout);
  }, [shareLabel]);

  const visibleVideos = analysis
    ? applyVideoFilters(analysis.videos, {
        ...filters,
        search: deferredSearch,
      })
    : [];
  const paginatedResults = paginateItems(visibleVideos, pagination);
  const pageVideos = paginatedResults.items;
  const activeSummaryPreset = getActiveSummaryPreset(filters);
  const activeQuickPreset = getActiveQuickPreset(filters);

  function updateFilters(patch: Partial<VideoFilters>) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      ...patch,
    }));
    setPagination((currentPagination) => ({
      ...currentPagination,
      page: 1,
    }));
  }

  function handlePageChange(page: number) {
    setPagination((currentPagination) => ({
      ...currentPagination,
      page,
    }));
    requestAnimationFrame(() => scrollToSection("video-results"));
  }

  function handlePageSizeChange(pageSize: number) {
    setPagination((currentPagination) => {
      const firstVisibleItemIndex =
        (currentPagination.page - 1) * currentPagination.pageSize;

      return {
        pageSize,
        page: Math.floor(firstVisibleItemIndex / pageSize) + 1,
      };
    });
    requestAnimationFrame(() => scrollToSection("video-results"));
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

    if (preset === "winners") {
      setFilters({
        ...defaultVideoFilters,
        dateRange: "30d",
        sort: "momentum",
        segment: "winners",
      });
    } else if (preset === "breakout") {
      setFilters({
        ...defaultVideoFilters,
        dateRange: "30d",
        sort: "viewsPerDay",
        segment: "breakout",
      });
    } else if (preset === "momentum") {
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
    setPagination((currentPagination) => ({
      ...currentPagination,
      page: 1,
    }));

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

  async function runAnalysis(
    nextChannelUrl: string,
    nextFilterPatch?: Partial<VideoFilters>,
    nextPaginationPatch?: Partial<PaginationState>,
  ) {
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
          [ANALYZE_INTENT_HEADER]: ANALYZE_INTENT_VALUE,
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
          ...nextFilterPatch,
        });
        setPagination({
          ...defaultPaginationState,
          ...nextPaginationPatch,
        });
      });

      setChannelUrl(normalized.normalizedUrl);
      setActiveChannelUrl(normalized.normalizedUrl);
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

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const sharedChannelUrl = searchParams.get("channel");
    const sharedFilters = parseVideoFiltersFromSearchParams(searchParams);
    const sharedPagination = parsePaginationFromSearchParams(searchParams);

    if (sharedChannelUrl) {
      setChannelUrl(sharedChannelUrl);
      void runAnalysis(sharedChannelUrl, sharedFilters, sharedPagination);
    }

    setHasHydratedFromUrl(true);
  }, []);

  useEffect(() => {
    const nextPage = clampPage(
      pagination.page,
      visibleVideos.length,
      pagination.pageSize,
    );

    if (nextPage !== pagination.page) {
      setPagination((currentPagination) => ({
        ...currentPagination,
        page: nextPage,
      }));
    }
  }, [pagination.page, pagination.pageSize, visibleVideos.length]);

  useEffect(() => {
    if (!hasHydratedFromUrl || !analysis || !activeChannelUrl) {
      return;
    }

    const searchParams = buildAnalysisSearchParams(
      activeChannelUrl,
      filters,
      analysis.defaultDateRange,
      pagination,
    );
    const query = searchParams.toString();
    const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;

    window.history.replaceState({}, "", nextUrl);
  }, [activeChannelUrl, analysis, filters, hasHydratedFromUrl, pagination]);

  async function handleCopyBrief() {
    if (!analysis) {
      return;
    }

    const activeSet = visibleVideos;
    const summary = activeSet.length
      ? `Channel Pulse summary for ${analysis.channel.name}: ${activeSet.length} videos are visible in the ${getSegmentLabel(
          filters.segment,
        )}. The workspace is currently ranked by ${getSortLabel(
          filters.sort,
        )}. Top result: ${activeSet[0].title}. Fastest mover in this view: ${
          pickFastestMover(activeSet)?.title ?? activeSet[0].title
        } at ${formatCompactNumber(
          pickFastestMover(activeSet)?.viewsPerDay ?? activeSet[0].viewsPerDay,
        )}/day. Source: ${analysis.channel.url}`
      : `Channel Pulse summary for ${analysis.channel.name}: no videos are visible in the current view. Broaden the date range, lower the minimum views threshold, or clear the search before sharing this workspace. Source: ${analysis.channel.url}`;

    try {
      await navigator.clipboard.writeText(summary);
      setCopyLabel("Summary copied");
    } catch {
      setCopyLabel("Retry copy");
    }
  }

  async function handleCopyShareLink() {
    if (!analysis || !activeChannelUrl) {
      return;
    }

    const searchParams = buildAnalysisSearchParams(
      activeChannelUrl,
      filters,
      analysis.defaultDateRange,
      pagination,
    );
    const query = searchParams.toString();
    const shareUrl = `${window.location.origin}${window.location.pathname}${query ? `?${query}` : ""}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareLabel("Link copied");
    } catch {
      setShareLabel("Retry copy");
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
      .replace(/^-+|-+$/g, "")}-${filters.segment}-${filters.sort}-${filters.dateRange}.csv`;

    downloadCsv(filename, csv);
  }

  return (
    <div className="app-shell">
      <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <header className="fade-up rounded-[30px] border border-black/8 bg-white/46 px-5 py-4 backdrop-blur-xl sm:px-6 lg:px-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] border border-[var(--accent)]/18 bg-[linear-gradient(135deg,rgba(255,107,74,0.18),rgba(255,255,255,0.96))] text-sm font-semibold tracking-[-0.08em] text-[var(--ink)] shadow-[0_10px_26px_rgba(255,107,74,0.08)]">
                CP
              </div>
              <div>
                <p className="text-sm font-semibold tracking-[-0.03em] text-[var(--ink)]">
                  Channel Pulse
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Competitive intelligence for YouTube teams that need clarity fast.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              {["Live channel scan", "Shareable workspace", "CSV export"].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-black/8 bg-white/70 px-3 py-2 text-xs font-medium text-black/62"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.92fr]">
          <Panel className="fade-up rounded-[36px] px-6 py-7 sm:px-8 sm:py-9">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-black/42">
              Competitive intelligence
            </p>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-[-0.08em] text-[var(--ink)] sm:text-5xl lg:text-[3.8rem]">
              Turn any YouTube channel into a weekly competitor brief.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--muted)] sm:text-lg">
              Paste a public competitor URL to surface breakout uploads, compare
              repeatable themes, and leave with a ranked view your team can act on in
              minutes.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[24px] border border-black/8 bg-white/60 p-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-black/38">
                  Winning uploads
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  See which recent uploads are outperforming the channel baseline in one clear shortlist.
                </p>
              </div>
              <div className="rounded-[24px] border border-black/8 bg-white/60 p-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-black/38">
                  Pattern clarity
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  Separate rising videos from legacy hits with velocity, reach, and recency signals.
                </p>
              </div>
              <div className="rounded-[24px] border border-black/8 bg-white/60 p-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-black/38">
                  Team-ready handoff
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  Filter, isolate, and export the exact shortlist you want to circulate internally.
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
                Weekly workflow
              </p>
              <span className="rounded-full border border-black/8 px-3 py-1 text-xs font-medium text-black/60">
                Built for lean teams
              </span>
            </div>

            <div className="mt-6 space-y-3">
              {[
                {
                  step: "01",
                  title: "Scan one channel",
                  detail:
                    "Paste a public YouTube URL and generate one working surface instead of bouncing between tabs.",
                },
                {
                  step: "02",
                  title: "Pressure-test the pattern",
                  detail:
                    "Use KPI presets, filters, and topic shortcuts to isolate the slice that actually matters this week.",
                },
                {
                  step: "03",
                  title: "Share the shortlist",
                  detail:
                    "Copy a focused summary, share the workspace link, or export CSV once the shortlist is ready.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="grid gap-4 rounded-[26px] border border-black/8 bg-white/60 p-4 sm:grid-cols-[52px_minmax(0,1fr)]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--accent)]/18 bg-[var(--accent-soft)] text-sm font-semibold text-[var(--ink)]">
                    {item.step}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--ink)]">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      {item.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[28px] border border-black/8 bg-[var(--surface-strong)] p-5">
              <p className="text-sm font-medium text-[var(--ink)]">
                What you get
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  "Channel snapshot and KPI baseline",
                  "Filters, presets, and shareable state",
                  "Ranked uploads with topic shortcuts",
                  "Signal charts for timing and format",
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
          </Panel>
        </section>

        {viewState === "loading" && !analysis ? <ResultsSkeleton /> : null}

        {analysis ? (
          <div className="grid gap-6">
            <nav className="fade-up sticky top-4 z-20 flex flex-wrap items-center gap-2 rounded-[24px] border border-black/8 bg-white/70 px-4 py-3 shadow-[0_18px_42px_rgba(17,17,15,0.08)] backdrop-blur-xl">
              {[
                { label: "Overview", target: "channel-overview" },
                { label: "Snapshot", target: "kpi-summary" },
                { label: "Filters", target: "filters-panel" },
                { label: "Results", target: "video-results" },
                { label: "Signals", target: "signal-charts" },
                { label: "Insights", target: "insight-panel" },
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
                Refreshing the workspace with the latest channel data...
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
                activePreset={activeSummaryPreset}
              />
            </div>

            <div id="filters-panel">
              <FiltersBar
                filters={filters}
                totalCount={analysis.videos.length}
                visibleCount={visibleVideos.length}
                onChange={updateFilters}
                onReset={() => {
                  setFilters({
                    ...defaultVideoFilters,
                    dateRange: analysis.defaultDateRange,
                  });
                  setPagination(defaultPaginationState);
                }}
                onExport={handleExport}
                onCopyShareLink={handleCopyShareLink}
                exportDisabled={!visibleVideos.length}
                shareLabel={shareLabel}
                onPresetSelect={applyPreset}
                activePreset={activeQuickPreset}
              />
            </div>

            <div id="video-results">
              <VideoTable
                videos={pageVideos}
                totalCount={visibleVideos.length}
                channelName={analysis.channel.name}
                channelHandle={analysis.channel.handle}
                page={paginatedResults.currentPage}
                pageSize={paginatedResults.pageSize}
                totalPages={paginatedResults.totalPages}
                startIndex={paginatedResults.startIndex}
                endIndex={paginatedResults.endIndex}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                onTagPick={handleTagSelect}
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.22fr_0.98fr]">
              <div id="velocity-panel">
                <PerformanceChart
                  videos={visibleVideos}
                  onInspectVideo={inspectVideo}
                />
              </div>
              <div id="insight-panel">
                <InsightsPanel analysis={analysis} activeSort={filters.sort} />
              </div>
            </div>

            <div id="signal-charts">
              <SignalCharts
                videos={visibleVideos}
                channelName={analysis.channel.name}
                channelHandle={analysis.channel.handle}
                onTopicSelect={handleTagSelect}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
