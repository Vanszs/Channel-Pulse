"use client";

import { TrendBadge } from "@/components/ui/trend-badge";
import { formatCompactNumber } from "@/lib/formatters";
import type { VideoFilters } from "@/lib/video-filters";

type FiltersBarProps = {
  filters: VideoFilters;
  totalCount: number;
  visibleCount: number;
  onChange: (patch: Partial<VideoFilters>) => void;
  onReset: () => void;
  onExport: () => void;
  onCopyShareLink: () => void;
  exportDisabled: boolean;
  shareLabel: string;
  onPresetSelect: (
    preset: "momentum" | "fresh" | "velocity" | "reach",
  ) => void;
  activePreset: "momentum" | "fresh" | "velocity" | "reach" | null;
};

export function FiltersBar({
  filters,
  totalCount,
  visibleCount,
  onChange,
  onReset,
  onExport,
  onCopyShareLink,
  exportDisabled,
  shareLabel,
  onPresetSelect,
  activePreset,
}: FiltersBarProps) {
  const hasActiveFilters =
    filters.search.trim() !== "" ||
    filters.dateRange !== "30d" ||
    filters.minViews !== 0 ||
    filters.sort !== "momentum" ||
    filters.segment !== "all";

  const activeChips: Array<{
    label: string;
    onRemove: () => void;
  }> = [
    filters.search.trim()
      ? {
          label: `Search: ${filters.search.trim()}`,
          onRemove: () => onChange({ search: "" }),
        }
      : null,
    filters.dateRange !== "30d"
      ? {
          label:
            filters.dateRange === "7d"
              ? "Last 7 days"
              : filters.dateRange === "90d"
                ? "Last 90 days"
                : "All recent uploads",
          onRemove: () => onChange({ dateRange: "30d" }),
        }
      : null,
    filters.segment !== "all"
      ? {
          label: filters.segment === "winners" ? "Winner set" : "Breakout only",
          onRemove: () => onChange({ segment: "all" }),
        }
      : null,
    filters.minViews > 0
      ? {
          label: `Min views ${formatCompactNumber(filters.minViews)}`,
          onRemove: () => onChange({ minViews: 0 }),
        }
      : null,
    filters.sort !== "momentum"
      ? {
          label:
            filters.sort === "views"
              ? "Sort: Views"
              : filters.sort === "viewsPerDay"
                ? "Sort: Views/day"
                : filters.sort === "recency"
                  ? "Sort: Recency"
                  : "Sort: Performance",
          onRemove: () => onChange({ sort: "momentum" }),
        }
      : null,
  ].filter(
    (
      chip,
    ): chip is {
      label: string;
      onRemove: () => void;
    } => chip !== null,
  );

  return (
    <div className="fade-up panel rounded-[32px] px-6 py-6 sm:px-8 sm:py-7">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-black/42">
            Sort and filter
          </p>
          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
            Shape the result set before you scan details
          </h3>
        </div>
        <p className="text-sm leading-6 text-[var(--muted)]">
          Showing {visibleCount} of {totalCount} videos after filtering.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {[
          { label: "Top momentum", preset: "momentum" as const },
          { label: "Fresh uploads", preset: "fresh" as const },
          { label: "Highest views/day", preset: "velocity" as const },
          { label: "Highest total views", preset: "reach" as const },
        ].map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onPresetSelect(preset.preset)}
            className={`rounded-full border px-3 py-2 text-xs font-medium transition ${
              activePreset === preset.preset
                ? "border-[var(--accent)]/22 bg-[var(--accent-soft)] text-[var(--ink)]"
                : "border-black/10 bg-white/74 text-[var(--ink)] hover:border-black/18 hover:bg-white"
            }`}
          >
            {preset.label}
          </button>
        ))}
        {hasActiveFilters ? (
          <span className="ml-auto text-xs font-medium uppercase tracking-[0.2em] text-black/40">
            Active filters
          </span>
        ) : null}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.55fr_0.85fr_0.95fr_0.85fr_0.95fr]">
        <label className="grid gap-2">
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-black/38">
            Search titles or tags
          </span>
          <input
            type="search"
            placeholder="Find a title, tag, or recurring theme"
            value={filters.search}
            onChange={(event) => onChange({ search: event.target.value })}
            className="h-12 rounded-2xl border border-black/10 bg-white/80 px-4 outline-none transition focus:border-black/22"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-black/38">
            Date range
          </span>
          <select
            value={filters.dateRange}
            onChange={(event) =>
              onChange({
                dateRange: event.target.value as VideoFilters["dateRange"],
              })
            }
            className="h-12 rounded-2xl border border-black/10 bg-white/80 px-4 outline-none transition focus:border-black/22"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All recent uploads</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-black/38">
            Segment
          </span>
          <select
            value={filters.segment}
            onChange={(event) =>
              onChange({
                segment: event.target.value as VideoFilters["segment"],
              })
            }
            className="h-12 rounded-2xl border border-black/10 bg-white/80 px-4 outline-none transition focus:border-black/22"
          >
            <option value="all">All ranked uploads</option>
            <option value="winners">Winner set only</option>
            <option value="breakout">Breakout only</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-black/38">
            Minimum views
          </span>
          <input
            type="number"
            min={0}
            step={1000}
            value={filters.minViews}
            onChange={(event) =>
              onChange({
                minViews: Number.isFinite(event.target.valueAsNumber)
                  ? Math.max(0, event.target.valueAsNumber)
                  : 0,
              })
            }
            className="h-12 rounded-2xl border border-black/10 bg-white/80 px-4 outline-none transition focus:border-black/22"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-black/38">
            Sort by
          </span>
          <select
            value={filters.sort}
            onChange={(event) =>
              onChange({ sort: event.target.value as VideoFilters["sort"] })
            }
            className="h-12 rounded-2xl border border-black/10 bg-white/80 px-4 outline-none transition focus:border-black/22"
          >
            <option value="momentum">Momentum score</option>
            <option value="performance">Performance score</option>
            <option value="views">Views</option>
            <option value="viewsPerDay">Views/day</option>
            <option value="recency">Recency</option>
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-2">
          {activeChips.length ? (
            activeChips.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={chip.onRemove}
                className="rounded-full border border-black/10 bg-white/70 px-3 py-2 text-xs font-medium text-[var(--ink)] transition hover:border-black/18 hover:bg-white"
              >
                {chip.label} ×
              </button>
            ))
          ) : (
            <p className="text-sm text-[var(--muted)]">
              Use presets, explicit filters, or KPI cards to reshape the visible set.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onExport}
            disabled={exportDisabled}
            className="inline-flex h-12 items-center justify-center rounded-full border border-[var(--accent)]/18 bg-[linear-gradient(135deg,rgba(255,107,74,0.16),rgba(255,255,255,0.96))] px-5 text-sm font-medium text-[var(--ink)] shadow-[0_10px_24px_rgba(255,107,74,0.1)] transition hover:-translate-y-0.5 hover:border-[var(--accent)]/28 hover:shadow-[0_14px_30px_rgba(255,107,74,0.14)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={onCopyShareLink}
            className="inline-flex h-12 items-center justify-center rounded-full border border-black/10 bg-white/72 px-5 text-sm font-medium text-[var(--ink)] transition hover:border-black/18 hover:bg-white"
          >
            {shareLabel}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-12 items-center justify-center rounded-full border border-black/10 bg-white/72 px-5 text-sm font-medium text-[var(--ink)] transition hover:border-black/18 hover:bg-white"
          >
            Reset filters
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2 rounded-[24px] border border-black/8 bg-white/56 px-4 py-3">
        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-black/38">
          Trend guide
        </span>
        <TrendBadge trend="up" lifecycle="Breakout" />
        <TrendBadge trend="steady" lifecycle="Steady" />
        <TrendBadge trend="down" lifecycle="Cooling" />
      </div>
    </div>
  );
}
