import { TrendBadge } from "@/components/ui/trend-badge";
import { formatCompactNumber, formatDate, formatRelativeDays } from "@/lib/formatters";
import type { VideoAnalysis } from "@/types/youtube";

type VideoTableProps = {
  videos: VideoAnalysis[];
};

function formatEngagement(value: number | undefined) {
  if (!value) {
    return "--";
  }

  return formatCompactNumber(value);
}

export function VideoTable({ videos }: VideoTableProps) {
  if (!videos.length) {
    return (
      <div className="fade-up panel rounded-[32px] px-6 py-8 text-center sm:px-8">
        <p className="text-lg font-medium text-[var(--ink)]">No videos match the current filters.</p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Widen the date window, lower the minimum views, or clear the title search.
        </p>
      </div>
    );
  }

  return (
    <div className="fade-up">
      <div className="panel overflow-hidden rounded-[32px]">
        <div className="border-b border-black/8 px-6 py-6 sm:px-8">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-black/42">
            Winning videos
          </p>
          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
            Ranked competitor uploads
          </h3>
        </div>

        <div className="lg:hidden">
          <div className="space-y-4 px-4 py-4 sm:px-6">
            {videos.map((video) => (
              <article
                key={video.id}
                className="rounded-[28px] border border-black/8 bg-white/62 p-4"
              >
                <div className="flex gap-4">
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="h-20 w-28 rounded-[18px] object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="mono-data text-xs uppercase tracking-[0.22em] text-black/38">
                        #{video.rank}
                      </span>
                      <TrendBadge trend={video.trend} lifecycle={video.lifecycle} />
                    </div>
                    <h4 className="mt-2 text-sm font-medium leading-6 text-[var(--ink)]">
                      {video.title}
                    </h4>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {formatDate(video.publishedAt)} · {formatRelativeDays(video.ageDays)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-black/38">
                      Views
                    </p>
                    <p className="mt-1 font-medium text-[var(--ink)]">
                      {formatCompactNumber(video.views)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-black/38">
                      Views / day
                    </p>
                    <p className="mt-1 font-medium text-[var(--ink)]">
                      {formatCompactNumber(video.viewsPerDay)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-black/38">
                      Performance
                    </p>
                    <p className="mt-1 font-medium text-[var(--ink)]">
                      {video.performanceScore}/100
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-black/38">
                      Momentum
                    </p>
                    <p className="mt-1 font-medium text-[var(--ink)]">
                      {video.momentumScore}/100
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-black/38">
                      Likes
                    </p>
                    <p className="mt-1 font-medium text-[var(--ink)]">
                      {formatEngagement(video.likes)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-black/38">
                      Comments
                    </p>
                    <p className="mt-1 font-medium text-[var(--ink)]">
                      {formatEngagement(video.comments)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <div className="min-w-[1180px]">
            <div className="grid grid-cols-[68px_3fr_1.2fr_1fr_1fr_0.9fr_0.9fr_1.15fr_1fr] gap-4 border-b border-black/8 px-8 py-4 text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-black/40">
              <span>Rank</span>
              <span>Video</span>
              <span>Published</span>
              <span>Views</span>
              <span>Engagement</span>
              <span>Perf</span>
              <span>Momentum</span>
              <span>Trend</span>
              <span>Views/day</span>
            </div>

            {videos.map((video) => (
              <div
                key={video.id}
                className="grid grid-cols-[68px_3fr_1.2fr_1fr_1fr_0.9fr_0.9fr_1.15fr_1fr] gap-4 border-b border-black/6 px-8 py-5 last:border-b-0"
              >
                <div className="mono-data text-sm font-medium text-[var(--ink)]">
                  #{video.rank}
                </div>

                <div className="flex gap-4">
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="h-20 w-32 rounded-[18px] object-cover"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-6 text-[var(--ink)]">
                      {video.title}
                    </p>
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      {video.durationMinutes}m runtime
                    </p>
                  </div>
                </div>

                <div className="text-sm text-[var(--muted)]">
                  <p className="font-medium text-[var(--ink)]">
                    {formatDate(video.publishedAt)}
                  </p>
                  <p className="mt-1">{formatRelativeDays(video.ageDays)}</p>
                </div>

                <div className="text-sm font-medium text-[var(--ink)]">
                  {formatCompactNumber(video.views)}
                </div>

                <div className="text-sm text-[var(--muted)]">
                  <p>{formatEngagement(video.likes)} likes</p>
                  <p className="mt-1">{formatEngagement(video.comments)} comments</p>
                </div>

                <div className="mono-data text-sm font-medium text-[var(--ink)]">
                  {video.performanceScore}
                </div>

                <div className="mono-data text-sm font-medium text-[var(--ink)]">
                  {video.momentumScore}
                </div>

                <div>
                  <TrendBadge trend={video.trend} lifecycle={video.lifecycle} />
                </div>

                <div className="mono-data text-sm font-medium text-[var(--ink)]">
                  {formatCompactNumber(video.viewsPerDay)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
