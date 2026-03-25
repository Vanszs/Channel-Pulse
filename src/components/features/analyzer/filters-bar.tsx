"use client";

import type { VideoFilters } from "@/lib/video-filters";

type FiltersBarProps = {
  filters: VideoFilters;
  totalCount: number;
  visibleCount: number;
  onChange: (patch: Partial<VideoFilters>) => void;
  onReset: () => void;
  onExport: () => void;
  exportDisabled: boolean;
};

export function FiltersBar({
  filters,
  totalCount,
  visibleCount,
  onChange,
  onReset,
  onExport,
  exportDisabled,
}: FiltersBarProps) {
  return (
    <div className="fade-up panel rounded-[32px] px-6 py-6 sm:px-8 sm:py-7">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-black/42">
            Sort and filter
          </p>
          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
            Trim the list to what matters now
          </h3>
        </div>
        <p className="text-sm leading-6 text-[var(--muted)]">
          Showing {visibleCount} of {totalCount} videos after filtering.
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_0.8fr_0.8fr_0.9fr_auto]">
        <label className="grid gap-2">
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-black/38">
            Search title
          </span>
          <input
            type="search"
            placeholder="Find a winning title or theme"
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

        <div className="flex items-end gap-3">
          <button
            type="button"
            onClick={onExport}
            disabled={exportDisabled}
            className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--ink)] px-5 text-sm font-medium text-white transition hover:bg-black/86 disabled:cursor-not-allowed disabled:bg-black/55"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-12 items-center justify-center rounded-full border border-black/10 bg-white/72 px-5 text-sm font-medium text-[var(--ink)] transition hover:border-black/18 hover:bg-white"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
