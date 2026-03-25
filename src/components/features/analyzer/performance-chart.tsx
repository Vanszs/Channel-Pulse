import { Panel } from "@/components/ui/panel";
import { TrendBadge } from "@/components/ui/trend-badge";
import { formatCompactNumber, formatDate, formatRelativeDays } from "@/lib/formatters";
import type { VideoAnalysis } from "@/types/youtube";

type PerformanceChartProps = {
  videos: VideoAnalysis[];
  onInspectVideo: (video: VideoAnalysis) => void;
};

function getBarColor(lifecycle: VideoAnalysis["lifecycle"]) {
  if (lifecycle === "Breakout") {
    return "bg-[var(--accent)]";
  }

  if (lifecycle === "Cooling") {
    return "bg-[rgba(17,17,15,0.22)]";
  }

  return "bg-[rgba(217,119,6,0.72)]";
}

export function PerformanceChart({ videos, onInspectVideo }: PerformanceChartProps) {
  const chartVideos = [...videos]
    .sort((left, right) => {
      return (
        right.viewsPerDay - left.viewsPerDay ||
        right.acceleration - left.acceleration ||
        right.momentumScore - left.momentumScore
      );
    })
    .slice(0, 6);
  const maxViewsPerDay = Math.max(...chartVideos.map((video) => video.viewsPerDay), 1);

  return (
    <Panel className="fade-up rounded-[32px] px-6 py-6 sm:px-8 sm:py-7">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-end">
        <div className="max-w-2xl">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-black/42">
            Velocity chart
          </p>
          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
            Which uploads are moving fastest right now
          </h3>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Daily view velocity across the currently visible set. Use this to spot
            fast risers, not just the biggest back-catalog titles. Click a row to
            isolate that upload in the results table.
          </p>
        </div>

        <div className="rounded-[24px] border border-black/8 bg-white/60 px-4 py-4">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-black/38">
            Visible leaders
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
            {chartVideos.length}
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            The fastest movers in your current view. Each row narrows the main table
            to one source video.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {chartVideos.length ? (
          chartVideos.map((video, index) => (
            <button
              type="button"
              key={video.id}
              onClick={() => onInspectVideo(video)}
              className="grid gap-4 rounded-[26px] border border-black/8 bg-white/58 px-4 py-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-black/16 hover:bg-white/82 md:grid-cols-[74px_minmax(0,1.7fr)_minmax(170px,1fr)_auto_auto] md:items-center"
            >
              <div>
                <p className="mono-data text-xs uppercase tracking-[0.22em] text-black/38">
                  Velocity #{index + 1}
                </p>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  {formatRelativeDays(video.ageDays)}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium leading-6 text-[var(--ink)]">
                  {video.title}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Published {formatDate(video.publishedAt)}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-black/6">
                  <div
                    className={`bar-grow h-full rounded-full ${getBarColor(video.lifecycle)}`}
                    style={{
                      width: `${Math.max(12, (video.viewsPerDay / maxViewsPerDay) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="mono-data text-sm font-medium text-[var(--ink)] md:text-base">
                  {formatCompactNumber(video.viewsPerDay)}/day
                </span>
              </div>

              <div className="flex items-center justify-start md:justify-end">
                <TrendBadge trend={video.trend} lifecycle={video.lifecycle} />
              </div>
            </button>
          ))
        ) : (
          <div className="rounded-[24px] border border-black/8 bg-white/58 px-4 py-4 text-sm text-[var(--muted)]">
            No videos match the current filters, so there is no velocity leaderboard to compare yet.
          </div>
        )}
      </div>
    </Panel>
  );
}
