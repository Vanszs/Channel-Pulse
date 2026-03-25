import { Panel } from "@/components/ui/panel";
import { formatCompactNumber, formatPercent } from "@/lib/formatters";
import type { VideoAnalysis } from "@/types/youtube";

type SignalChartsProps = {
  videos: VideoAnalysis[];
  onTopicSelect: (topic: string) => void;
};

const STOP_WORDS = new Set([
  "this",
  "that",
  "with",
  "from",
  "what",
  "your",
  "have",
  "about",
  "video",
  "videos",
  "shorts",
  "short",
  "yang",
  "buat",
  "banget",
  "untuk",
  "anime",
]);

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function normalizeTopic(value: string) {
  return titleCase(
    value
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function extractFallbackKeywords(title: string) {
  return title
    .split(/[^a-zA-Z0-9]+/)
    .map((word) => word.trim())
    .filter(
      (word) =>
        word.length >= 4 && !STOP_WORDS.has(word.toLowerCase()),
    )
    .slice(0, 3)
    .map((word) => titleCase(word));
}

function buildTopicRows(videos: VideoAnalysis[]) {
  const topics = new Map<
    string,
    {
      count: number;
      totalMomentum: number;
      totalViewsPerDay: number;
    }
  >();

  for (const video of videos) {
    const sourceTopics = (video.tags?.length
      ? video.tags.map(normalizeTopic)
      : extractFallbackKeywords(video.title)
    ).slice(0, 3);

    for (const topic of sourceTopics) {
      if (!topic) {
        continue;
      }

      const current = topics.get(topic) ?? {
        count: 0,
        totalMomentum: 0,
        totalViewsPerDay: 0,
      };

      topics.set(topic, {
        count: current.count + 1,
        totalMomentum: current.totalMomentum + video.momentumScore,
        totalViewsPerDay: current.totalViewsPerDay + video.viewsPerDay,
      });
    }
  }

  return [...topics.entries()]
    .map(([topic, stats]) => ({
      topic,
      count: stats.count,
      averageMomentum: Math.round(stats.totalMomentum / stats.count),
      averageViewsPerDay: Math.round(stats.totalViewsPerDay / stats.count),
    }))
    .sort((left, right) => {
      return (
        right.averageMomentum - left.averageMomentum ||
        right.count - left.count ||
        right.averageViewsPerDay - left.averageViewsPerDay
      );
    })
    .slice(0, 5);
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

  return rows.sort((left, right) => right.averageMomentum - left.averageMomentum);
}

export function SignalCharts({ videos, onTopicSelect }: SignalChartsProps) {
  const topicRows = buildTopicRows(videos);
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
              Topic chart
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
              Which themes are carrying momentum
            </h3>
          </div>
          <span className="rounded-full border border-black/8 bg-white/74 px-3 py-1 text-xs font-medium text-black/60">
            Click to filter
          </span>
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
                    {row.count} videos · avg {formatCompactNumber(row.averageViewsPerDay)}/day
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
              Topic tags are not available for this visible set yet, so no topic chart can
              be drawn.
            </div>
          )}
        </div>
      </Panel>

      <Panel className="fade-up rounded-[32px] px-6 py-6 sm:px-8 sm:py-7">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-black/42">
          Lifecycle chart
        </p>
        <h3 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
          How the visible set is distributed
        </h3>

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
      </Panel>

      <Panel className="fade-up rounded-[32px] px-6 py-6 sm:px-8 sm:py-7">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-black/42">
          Runtime chart
        </p>
        <h3 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
          Which runtime bands are working
        </h3>

        <div className="mt-6 space-y-4">
          {runtimeRows.map((row) => (
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
          ))}
        </div>
      </Panel>
    </div>
  );
}
