import { Panel } from "@/components/ui/panel";
import { formatCompactNumber, formatPercent } from "@/lib/formatters";
import { buildTopicRows as buildSharedTopicRows } from "@/lib/topics";
import type { VideoAnalysis } from "@/types/youtube";

type SignalChartsProps = {
  videos: VideoAnalysis[];
  channelName: string;
  channelHandle: string;
  onTopicSelect: (topic: string) => void;
};
function buildTopicChartRows(
  videos: VideoAnalysis[],
  channelName: string,
  channelHandle: string,
) {
  return buildSharedTopicRows(videos, channelName, channelHandle).slice(0, 5);
}

function buildLifecycleRows(videos: VideoAnalysis[]) {
  const total = Math.max(videos.length, 1);
  const counts = {
    Breakout: videos.filter((video) => video.lifecycle === "Breakout").length,
    Steady: videos.filter((video) => video.lifecycle === "Steady").length,
    Cooling: videos.filter((video) => video.lifecycle === "Cooling").length,
  };

  return [
    {
      label: "Breakout",
      count: counts.Breakout,
      share: counts.Breakout / total,
      color: "bg-[var(--accent)]",
    },
    {
      label: "Steady",
      count: counts.Steady,
      share: counts.Steady / total,
      color: "bg-[rgba(217,119,6,0.72)]",
    },
    {
      label: "Cooling",
      count: counts.Cooling,
      share: counts.Cooling / total,
      color: "bg-[rgba(17,17,15,0.22)]",
    },
  ];
}

function buildRuntimeRows(videos: VideoAnalysis[]) {
  const buckets = [
    { label: "Under 6m", predicate: (minutes: number) => minutes < 6 },
    { label: "6-12m", predicate: (minutes: number) => minutes >= 6 && minutes < 12 },
    { label: "12-20m", predicate: (minutes: number) => minutes >= 12 && minutes < 20 },
    { label: "20m+", predicate: (minutes: number) => minutes >= 20 },
  ];

  const rows = buckets
    .map((bucket) => {
      const bucketVideos = videos.filter((video) => bucket.predicate(video.durationMinutes));

      if (!bucketVideos.length) {
        return {
          label: bucket.label,
          count: 0,
          averageMomentum: 0,
          averageViewsPerDay: 0,
        };
      }

      const totalMomentum = bucketVideos.reduce(
        (sum, video) => sum + video.momentumScore,
        0,
      );
      const totalViewsPerDay = bucketVideos.reduce(
        (sum, video) => sum + video.viewsPerDay,
        0,
      );

      return {
        label: bucket.label,
        count: bucketVideos.length,
        averageMomentum: Math.round(totalMomentum / bucketVideos.length),
        averageViewsPerDay: Math.round(totalViewsPerDay / bucketVideos.length),
      };
    })
    .filter((bucket) => bucket.count > 0);

  return rows.sort((left, right) => {
    return (
      right.averageViewsPerDay - left.averageViewsPerDay ||
      right.averageMomentum - left.averageMomentum ||
      left.label.localeCompare(right.label)
    );
  });
}

export function SignalCharts({
  videos,
  channelName,
  channelHandle,
  onTopicSelect,
}: SignalChartsProps) {
  const topicRows = buildTopicChartRows(videos, channelName, channelHandle);
  const lifecycleRows = buildLifecycleRows(videos);
  const runtimeRows = buildRuntimeRows(videos);
  const maxTopicMomentum = Math.max(...topicRows.map((row) => row.averageMomentum), 1);
  const maxRuntimeViews = Math.max(...runtimeRows.map((row) => row.averageViewsPerDay), 1);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr_0.92fr]">
      <Panel className="fade-up rounded-[32px] px-6 py-6 sm:px-8 sm:py-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-black/42">
              Theme signals
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
              Repeated topics with real traction
            </h3>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
              Only themes that repeat across at least two visible uploads appear
              here, so the chart reflects a real pattern instead of one-off title language.
            </p>
          </div>
          {topicRows.length ? (
            <span className="rounded-full border border-black/8 bg-white/74 px-3 py-1 text-xs font-medium text-black/60">
              Click to focus
            </span>
          ) : null}
        </div>

        <div className="mt-6 space-y-3">
          {topicRows.length ? (
            topicRows.map((row) => (
              <button
                key={row.topic}
                type="button"
                onClick={() => onTopicSelect(row.topic)}
                className="grid w-full gap-3 rounded-[24px] border border-black/8 bg-white/58 px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-black/16 hover:bg-white/82 md:grid-cols-[minmax(0,1fr)_140px]"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--ink)]">{row.topic}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {row.count} {row.count === 1 ? "video" : "videos"} · avg{" "}
                    {formatCompactNumber(row.averageViewsPerDay)}/day
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-black/6">
                    <div
                      className="bar-grow h-full rounded-full bg-[linear-gradient(90deg,var(--accent),rgba(217,119,6,0.8))]"
                      style={{
                        width: `${Math.max(18, (row.averageMomentum / maxTopicMomentum) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="mono-data w-12 text-right text-sm font-medium text-[var(--ink)]">
                    {row.averageMomentum}
                  </span>
                </div>
              </button>
            ))
          ) : (
            <div className="rounded-[24px] border border-black/8 bg-white/58 px-4 py-4 text-sm text-[var(--muted)]">
              This view does not yet contain a repeated theme with enough signal.
              Broaden the date range or clear filters to surface stronger clusters.
            </div>
          )}
        </div>
      </Panel>

      <Panel className="fade-up rounded-[32px] px-6 py-6 sm:px-8 sm:py-7">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-black/42">
          Momentum mix
        </p>
        <h3 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
          How momentum is distributed
        </h3>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          A quick read on how much of the current shortlist is breaking out, holding
          steady, or cooling off.
        </p>

        {videos.length ? (
          <>
            <div className="mt-6 flex h-4 overflow-hidden rounded-full bg-black/6">
              {lifecycleRows.map((row) => (
                <div
                  key={row.label}
                  className={row.color}
                  style={{ width: `${row.share * 100}%` }}
                />
              ))}
            </div>

            <div className="mt-6 space-y-3">
              {lifecycleRows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-4 rounded-[22px] border border-black/8 bg-white/58 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className={`h-2.5 w-2.5 rounded-full ${row.color}`} />
                    <span className="text-sm font-medium text-[var(--ink)]">{row.label}</span>
                  </div>
                  <div className="text-right">
                    <p className="mono-data text-sm font-medium text-[var(--ink)]">
                      {row.count}
                    </p>
                    <p className="text-xs text-[var(--muted)]">{formatPercent(row.share)}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="mt-6 rounded-[24px] border border-black/8 bg-white/58 px-4 py-4 text-sm text-[var(--muted)]">
            No videos match the current filters, so this momentum mix is unavailable.
          </div>
        )}
      </Panel>

      <Panel className="fade-up rounded-[32px] px-6 py-6 sm:px-8 sm:py-7">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-black/42">
          Runtime signals
        </p>
        <h3 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
          Which runtimes are earning attention
        </h3>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Compare runtime bands by daily velocity to see whether shorter, mid-length,
          or longer formats are carrying the strongest pull.
        </p>

        <div className="mt-6 space-y-4">
          {runtimeRows.length ? (
            runtimeRows.map((row) => (
              <div key={row.label} className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-[var(--ink)]">{row.label}</p>
                    <p className="text-xs text-[var(--muted)]">{row.count} uploads</p>
                  </div>
                  <div className="text-right">
                    <p className="mono-data text-sm font-medium text-[var(--ink)]">
                      {formatCompactNumber(row.averageViewsPerDay)}/day
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      Momentum {row.averageMomentum}
                    </p>
                  </div>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-black/6">
                  <div
                    className="bar-grow h-full rounded-full bg-[linear-gradient(90deg,rgba(217,119,6,0.82),var(--accent))]"
                    style={{
                      width: `${Math.max(16, (row.averageViewsPerDay / maxRuntimeViews) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[24px] border border-black/8 bg-white/58 px-4 py-4 text-sm text-[var(--muted)]">
              No videos match the current filters, so runtime patterns cannot be compared yet.
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
