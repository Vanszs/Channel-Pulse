import { Panel } from "@/components/ui/panel";
import { TrendBadge } from "@/components/ui/trend-badge";
import { formatCompactNumber } from "@/lib/formatters";
import type { VideoAnalysis } from "@/types/youtube";

type PerformanceChartProps = {
  videos: VideoAnalysis[];
};

function getBarColor(lifecycle: VideoAnalysis["lifecycle"]) {
  if (lifecycle === "Breakout") {
    return "bg-[var(--accent)]";
  }

  if (lifecycle === "Cooling") {
    return "bg-black/24";
  }

  return "bg-black/60";
}

export function PerformanceChart({ videos }: PerformanceChartProps) {
  const chartVideos = videos.slice(0, 6);
  const maxViewsPerDay = Math.max(...chartVideos.map((video) => video.viewsPerDay), 1);

  return (
    <Panel className="fade-up rounded-[32px] px-6 py-6 sm:px-8 sm:py-7">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-black/42">
            Velocity chart
          </p>
          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
            Who is moving fastest right now
          </h3>
        </div>
        <p className="max-w-md text-sm leading-6 text-[var(--muted)]">
          Views per day for the currently visible videos. This surfaces fast risers,
          not just the biggest catalog titles.
        </p>
      </div>

      <div className="mt-8 space-y-5">
        {chartVideos.map((video) => (
          <div
            key={video.id}
            className="grid gap-3 border-t border-black/8 pt-5 first:border-t-0 first:pt-0 md:grid-cols-[minmax(0,220px)_1fr_auto]"
          >
            <div>
              <p className="mono-data text-xs uppercase tracking-[0.22em] text-black/38">
                Rank {video.rank}
              </p>
              <p className="mt-1 text-sm font-medium leading-6 text-[var(--ink)]">
                {video.title}
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

            <div className="flex items-center justify-between gap-3 md:justify-end">
              <span className="mono-data text-sm font-medium text-[var(--ink)]">
                {formatCompactNumber(video.viewsPerDay)}/day
              </span>
              <TrendBadge trend={video.trend} lifecycle={video.lifecycle} />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
