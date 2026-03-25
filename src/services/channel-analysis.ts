import {
  formatCompactNumber,
  formatDuration,
  formatSignedPercent,
} from "@/lib/formatters";
import { average, buildVideoAnalysis, median, sum } from "@/lib/scoring";
import {
  fetchYouTubeChannelSnapshot,
  type ChannelAnalysisError,
} from "@/services/youtube-api";
import type {
  ChannelAnalysis,
  ChannelInsight,
  ChannelMetrics,
  ChannelProfile,
  RawVideo,
  VideoAnalysis,
} from "@/types/youtube";

const STOP_WORDS = new Set([
  "that",
  "this",
  "with",
  "from",
  "your",
  "into",
  "what",
  "they",
  "still",
  "have",
  "behind",
  "about",
  "where",
  "after",
  "before",
  "more",
  "make",
  "like",
  "kept",
  "over",
  "them",
  "than",
  "week",
  "channel",
  "video",
  "videos",
  "shorts",
  "short",
  "how",
  "why",
  "best",
  "guide",
]);

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function cleanDescription(description: string) {
  const trimmed = description.replace(/\s+/g, " ").trim();

  if (!trimmed) {
    return "Live public-channel snapshot pulled from YouTube Data API v3.";
  }

  if (trimmed.length <= 220) {
    return trimmed;
  }

  return `${trimmed.slice(0, 217).trimEnd()}...`;
}

function averageGapInDays(videos: RawVideo[]) {
  if (videos.length < 2) {
    return 7;
  }

  const publishedTimes = videos
    .map((video) => new Date(video.publishedAt).getTime())
    .sort((left, right) => right - left);
  const gaps: number[] = [];

  for (let index = 0; index < publishedTimes.length - 1; index += 1) {
    gaps.push(
      Math.max(
        1,
        Math.round(
          (publishedTimes[index] - publishedTimes[index + 1]) /
            (1000 * 60 * 60 * 24),
        ),
      ),
    );
  }

  return Math.max(1, Math.round(average(gaps)));
}

function buildUploadCadence(videos: RawVideo[]) {
  const averageGap = averageGapInDays(videos);
  const uploadsPerWeek = Math.max(1, Math.round(7 / averageGap));

  return `${uploadsPerWeek} ${uploadsPerWeek === 1 ? "upload" : "uploads"} / week`;
}

function extractCommonKeyword(videos: Array<Pick<VideoAnalysis, "title">>) {
  const counts = new Map<string, number>();

  for (const video of videos) {
    for (const word of video.title.toLowerCase().split(/[^a-z0-9]+/)) {
      if (word.length < 4 || STOP_WORDS.has(word)) {
        continue;
      }

      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }

  const [keyword] =
    [...counts.entries()].sort((left, right) => right[1] - left[1])[0] ?? [];

  return keyword ? titleCase(keyword) : "Comparison";
}

function extractFocusTags(
  topicCategories: string[],
  videos: RawVideo[],
  limit = 3,
) {
  const tags: string[] = [];

  for (const topicCategory of topicCategories) {
    try {
      const url = new URL(topicCategory);
      tags.push(titleCase(decodeURIComponent(url.pathname.split("/").pop() ?? "")));
    } catch {
      continue;
    }
  }

  const keywordCounts = new Map<string, number>();

  for (const video of videos) {
    for (const tag of video.tags ?? []) {
      const normalizedTag = tag
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      if (normalizedTag.length >= 4) {
        keywordCounts.set(
          normalizedTag,
          (keywordCounts.get(normalizedTag) ?? 0) + 2,
        );
      }
    }

    for (const word of video.title.split(/[^A-Za-z0-9]+/)) {
      const normalizedWord = word.trim();

      if (
        normalizedWord.length >= 4 &&
        !STOP_WORDS.has(normalizedWord.toLowerCase())
      ) {
        keywordCounts.set(
          normalizedWord,
          (keywordCounts.get(normalizedWord) ?? 0) + 1,
        );
      }
    }
  }

  const keywordTags = [...keywordCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([keyword]) => titleCase(keyword))
    .filter((keyword) => !tags.includes(keyword));

  return [...tags, ...keywordTags].filter(Boolean).slice(0, limit);
}

function buildCategory(topicCategories: string[], videos: RawVideo[]) {
  const [firstTopic] = extractFocusTags(topicCategories, videos, 1);
  return firstTopic ?? "YouTube channel";
}

function buildChannelProfile(
  channelSnapshot: Awaited<ReturnType<typeof fetchYouTubeChannelSnapshot>>["channel"],
  videos: RawVideo[],
): ChannelProfile {
  const focusTags = extractFocusTags(channelSnapshot.topicCategories, videos);

  return {
    id: channelSnapshot.id,
    name: channelSnapshot.name,
    handle: channelSnapshot.handle,
    url: channelSnapshot.url,
    category: buildCategory(channelSnapshot.topicCategories, videos),
    description: cleanDescription(channelSnapshot.description),
    subscriberCount: channelSnapshot.subscriberCount,
    avatarText: getInitials(channelSnapshot.name) || "YT",
    avatarUrl: channelSnapshot.avatarUrl,
    uploadCadence: buildUploadCadence(videos),
    focusTags,
  };
}

function buildMetrics(videos: VideoAnalysis[]) {
  const thisMonthVideos = videos.filter((video) => video.ageDays <= 30);

  return {
    totalRecentViews: Math.round(sum(thisMonthVideos.map((video) => video.views))),
    videosThisMonth: thisMonthVideos.length,
    monthlyWinners: thisMonthVideos.filter(
      (video) => video.momentumScore >= 72 || video.lifecycle === "Breakout",
    ).length,
    averageViewsPerDay: Math.round(average(videos.map((video) => video.viewsPerDay))),
    breakoutCount: thisMonthVideos.filter((video) => video.lifecycle === "Breakout")
      .length,
    medianPerformance: Math.round(
      median(thisMonthVideos.map((video) => video.performanceScore)),
    ),
  } satisfies ChannelMetrics;
}

function buildInsights(
  profile: ChannelProfile,
  videos: VideoAnalysis[],
  metrics: ChannelMetrics,
) {
  const topVideos = videos.slice(0, 5);
  const leader = topVideos[0];
  const keyword = extractCommonKeyword(topVideos);
  const topAverageDuration = average(topVideos.map((video) => video.durationMinutes));
  const channelAverageDuration = average(videos.map((video) => video.durationMinutes));
  const averageGap = averageGapInDays(videos);

  return [
    {
      title: "Current winner",
      detail: `${leader.title} is leading at ${formatCompactNumber(
        leader.viewsPerDay,
      )} views/day, ${formatSignedPercent(
        leader.acceleration,
      )} above the channel's recent median velocity.`,
      tone: "signal",
    },
    {
      title: "Pattern to copy",
      detail: `The strongest uploads skew ${
        topAverageDuration <= channelAverageDuration
          ? "shorter and more tactical"
          : "a little deeper than the channel average"
      }, and "${keyword}" keeps repeating across the top titles.`,
      tone: "neutral",
    },
    {
      title: "Momentum read",
      detail: `${profile.name} is publishing roughly every ${averageGap} days, and ${
        metrics.monthlyWinners
      } recent uploads from the last 30 days are beating the baseline. ${
        metrics.breakoutCount >= 3
          ? "The momentum is spread across multiple formats."
          : "Performance is concentrated, so format replication matters more than volume."
      }`,
      tone: metrics.breakoutCount >= 3 ? "signal" : "watch",
    },
  ] satisfies ChannelInsight[];
}

export async function analyzeChannel(channelUrl: string): Promise<ChannelAnalysis> {
  const snapshot = await fetchYouTubeChannelSnapshot(channelUrl);
  const channel = buildChannelProfile(snapshot.channel, snapshot.videos);
  const videos = buildVideoAnalysis(snapshot.videos);

  if (!videos.length) {
    throw new Error("This channel does not have enough public videos to analyze.");
  }

  const metrics = buildMetrics(videos);

  return {
    channel,
    generatedAt: new Date().toISOString(),
    defaultDateRange: "30d",
    metrics,
    insights: buildInsights(channel, videos, metrics),
    scoreExplanation: {
      formula:
        "30% views reach + 25% views/day + 18% engagement proxy + 17% velocity proxy + 10% recency",
      weights: {
        viewReach: 30,
        velocity: 25,
        engagement: 18,
        acceleration: 17,
        recency: 10,
      },
      note: `Uses live public YouTube stats. The velocity proxy compares each video's views/day against the channel's recent median, so rising uploads surface before raw lifetime views dominate. Typical winning runtimes for this channel sit around ${formatDuration(
        Math.round(average(videos.slice(0, 5).map((video) => video.durationMinutes))),
      )}.`,
    },
    videos,
  };
}

export type { ChannelAnalysisError };
