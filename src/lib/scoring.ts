import type {
  LifecycleLabel,
  RawVideo,
  TrendDirection,
  VideoAnalysis,
} from "@/types/youtube";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

type DerivedVideoMetrics = {
  raw: RawVideo;
  ageDays: number;
  viewsPerDay: number;
  engagementRate: number;
  acceleration: number;
  recencyScore: number;
};

export function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

export function average(values: number[]) {
  if (!values.length) {
    return 0;
  }

  return sum(values) / values.length;
}

export function median(values: number[]) {
  if (!values.length) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

export function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function deriveMetrics(video: RawVideo, referenceDate: Date): DerivedVideoMetrics {
  const publishedAt = new Date(video.publishedAt);
  const ageDays = Math.max(
    1,
    Math.ceil((referenceDate.getTime() - publishedAt.getTime()) / MS_PER_DAY),
  );
  const viewsPerDay = video.views / ageDays;
  const likes = video.likes ?? 0;
  const comments = video.comments ?? 0;
  const engagementRate = (likes + comments * 4) / Math.max(video.views, 1);
  const headAverage = average(video.dailyViews.slice(0, 4));
  const tailAverage = average(video.dailyViews.slice(-3));
  const acceleration = (tailAverage - headAverage) / Math.max(headAverage, 1);
  const recencyScore = clamp(1 - (ageDays - 1) / 90, 0.22, 1);

  return {
    raw: video,
    ageDays,
    viewsPerDay,
    engagementRate,
    acceleration,
    recencyScore,
  };
}

function toTrendDirection(acceleration: number): TrendDirection {
  if (acceleration > 0.12) {
    return "up";
  }

  if (acceleration < -0.08) {
    return "down";
  }

  return "steady";
}

function toLifecycleLabel(
  performanceScore: number,
  momentumScore: number,
  acceleration: number,
  ageDays: number,
  viewsPerDay: number,
  maxViewsPerDay: number,
): LifecycleLabel {
  if (
    performanceScore >= 80 ||
    momentumScore >= 78 ||
    (acceleration > 0.18 && ageDays <= 30)
  ) {
    return "Breakout";
  }

  if (
    momentumScore < 48 ||
    acceleration < -0.1 ||
    (ageDays > 45 && viewsPerDay < maxViewsPerDay * 0.38)
  ) {
    return "Cooling";
  }

  return "Steady";
}

export function buildVideoAnalysis(rawVideos: RawVideo[]) {
  const referenceDate = new Date();
  const derivedVideos = rawVideos.map((video) => deriveMetrics(video, referenceDate));
  const maxViews = Math.max(...derivedVideos.map((video) => video.raw.views), 1);
  const maxViewsPerDay = Math.max(
    ...derivedVideos.map((video) => video.viewsPerDay),
    1,
  );
  const maxEngagement = Math.max(
    ...derivedVideos.map((video) => video.engagementRate),
    0.01,
  );
  const accelerationSpan = Math.max(
    ...derivedVideos.map((video) => Math.abs(video.acceleration)),
    0.15,
  );

  const scoredVideos: Omit<VideoAnalysis, "rank">[] = derivedVideos.map((video) => {
    const viewReach = video.raw.views / maxViews;
    const velocity = video.viewsPerDay / maxViewsPerDay;
    const engagement = video.engagementRate / maxEngagement;
    const normalizedAcceleration =
      (video.acceleration + accelerationSpan) / (accelerationSpan * 2);

    const performanceScore = Math.round(
      (viewReach * 0.3 +
        velocity * 0.25 +
        engagement * 0.18 +
        clamp(normalizedAcceleration, 0, 1) * 0.17 +
        video.recencyScore * 0.1) *
        100,
    );
    const momentumScore = Math.round(
      (velocity * 0.32 +
        clamp(normalizedAcceleration, 0, 1) * 0.38 +
        video.recencyScore * 0.2 +
        engagement * 0.1) *
        100,
    );

    return {
      ...video.raw,
      ageDays: video.ageDays,
      viewsPerDay: Math.round(video.viewsPerDay),
      engagementRate: video.engagementRate,
      acceleration: video.acceleration,
      performanceScore,
      momentumScore,
      trend: toTrendDirection(video.acceleration),
      lifecycle: toLifecycleLabel(
        performanceScore,
        momentumScore,
        video.acceleration,
        video.ageDays,
        video.viewsPerDay,
        maxViewsPerDay,
      ),
      scoreBreakdown: {
        viewReach: Math.round(viewReach * 100),
        velocity: Math.round(velocity * 100),
        engagement: Math.round(engagement * 100),
        acceleration: Math.round(clamp(normalizedAcceleration, 0, 1) * 100),
        recency: Math.round(video.recencyScore * 100),
      },
    };
  });

  return scoredVideos
    .sort((left, right) => right.performanceScore - left.performanceScore)
    .map((video, index) => ({
      ...video,
      rank: index + 1,
    }));
}
