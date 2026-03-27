import { readFile } from "node:fs/promises";
import { join } from "node:path";

import {
  normalizeYouTubeChannelInput,
  type NormalizedInput,
} from "@/lib/channel-url";
import type { RawVideo } from "@/types/youtube";

type ErrorField = "channelUrl" | "general";

type YouTubeApiError = {
  code?: number;
  message?: string;
  errors?: Array<{
    message?: string;
    reason?: string;
  }>;
};

type YouTubeApiResponse = {
  error?: YouTubeApiError;
};

type YouTubeThumbnailMap = Partial<
  Record<
    "default" | "medium" | "high" | "standard" | "maxres",
    {
      url: string;
    }
  >
>;

type YouTubeChannelItem = {
  id: string;
  snippet?: {
    title?: string;
    description?: string;
    customUrl?: string;
    thumbnails?: YouTubeThumbnailMap;
  };
  statistics?: {
    subscriberCount?: string;
    hiddenSubscriberCount?: boolean;
  };
  topicDetails?: {
    topicCategories?: string[];
  };
  contentDetails?: {
    relatedPlaylists?: {
      uploads?: string;
    };
  };
};

type YouTubeChannelListResponse = YouTubeApiResponse & {
  items?: YouTubeChannelItem[];
};

type YouTubePlaylistItem = {
  contentDetails?: {
    videoId?: string;
  };
};

type YouTubePlaylistItemsResponse = YouTubeApiResponse & {
  nextPageToken?: string;
  items?: YouTubePlaylistItem[];
};

type YouTubeVideoItem = {
  id: string;
  snippet?: {
    title?: string;
    description?: string;
    publishedAt?: string;
    thumbnails?: YouTubeThumbnailMap;
    tags?: string[];
  };
  statistics?: {
    viewCount?: string;
    likeCount?: string;
    commentCount?: string;
  };
  contentDetails?: {
    duration?: string;
  };
};

type YouTubeVideosListResponse = YouTubeApiResponse & {
  items?: YouTubeVideoItem[];
};

export class ChannelAnalysisError extends Error {
  readonly field: ErrorField;
  readonly status: number;

  constructor(
    message: string,
    options?: {
      field?: ErrorField;
      status?: number;
    },
  ) {
    super(message);
    this.name = "ChannelAnalysisError";
    this.field = options?.field ?? "general";
    this.status = options?.status ?? 500;
  }
}

type ResolvedChannelReference = {
  channelId: string;
  canonicalUrl: string;
};

export type YouTubeChannelSnapshot = {
  channel: {
    id: string;
    name: string;
    handle: string;
    url: string;
    description: string;
    subscriberCount: number | null;
    avatarUrl?: string;
    topicCategories: string[];
    uploadsPlaylistId: string;
  };
  videos: RawVideo[];
};

const YOUTUBE_API_ROOT = "https://www.googleapis.com/youtube/v3/";
const HTML_CHANNEL_ID_PATTERN =
  /https:\/\/www\.youtube\.com\/channel\/(UC[\w-]{20,})/;
const YOUTUBE_FETCH_TIMEOUT_MS = 10_000;

let cachedEnvLocalApiKey: string | null | undefined;

function cleanEnvValue(value: string) {
  return value.trim().replace(/^['"]|['"]$/g, "");
}

async function getYouTubeApiKey() {
  if (process.env.YOUTUBE_API_KEY) {
    return process.env.YOUTUBE_API_KEY;
  }

  if (cachedEnvLocalApiKey !== undefined) {
    if (cachedEnvLocalApiKey) {
      return cachedEnvLocalApiKey;
    }

    throw new ChannelAnalysisError(
      "Missing YOUTUBE_API_KEY. Add it to .env.local and restart the dev server.",
    );
  }

  try {
    const content = await readFile(join(process.cwd(), "env.local"), "utf8");
    const match = content.match(/^YOUTUBE_API_KEY=(.+)$/m);

    cachedEnvLocalApiKey = match ? cleanEnvValue(match[1]) : null;
  } catch {
    cachedEnvLocalApiKey = null;
  }

  if (!cachedEnvLocalApiKey) {
    throw new ChannelAnalysisError(
      "Missing YOUTUBE_API_KEY. Add it to .env.local and restart the dev server.",
    );
  }

  return cachedEnvLocalApiKey;
}

function mapYouTubeApiError(error: YouTubeApiError | undefined, status = 500) {
  const reason = error?.errors?.[0]?.reason ?? "";

  if (
    [
      "keyInvalid",
      "accessNotConfigured",
      "ipRefererBlocked",
      "forbidden",
      "forbiddenEmbeddedPlayer",
    ].includes(reason)
  ) {
    return new ChannelAnalysisError(
      "The YouTube API key is invalid or YouTube Data API v3 is not enabled for it.",
      { status: 500 },
    );
  }

  if (["quotaExceeded", "dailyLimitExceeded"].includes(reason)) {
    return new ChannelAnalysisError(
      "The YouTube API quota has been exceeded. Try again later or use a different API key.",
      { status: 503 },
    );
  }

  if (["channelNotFound", "playlistNotFound", "videoNotFound"].includes(reason)) {
    return new ChannelAnalysisError(
      "We could not find that YouTube channel or its recent uploads.",
      { field: "channelUrl", status: 404 },
    );
  }

  return new ChannelAnalysisError(
    error?.message ?? "YouTube returned an unexpected error.",
    { status },
  );
}

function mapYouTubeFetchFailure(error: unknown) {
  if (error instanceof ChannelAnalysisError) {
    return error;
  }

  if (
    error instanceof Error &&
    (error.name === "AbortError" || error.name === "TimeoutError")
  ) {
    return new ChannelAnalysisError(
      "YouTube took too long to respond. Please try again in a moment.",
      { status: 504 },
    );
  }

  return new ChannelAnalysisError(
    "We could not reach YouTube right now. Please try again in a moment.",
    { status: 502 },
  );
}

async function youtubeFetch<T extends YouTubeApiResponse>(
  path: string,
  searchParams: Record<string, string | undefined>,
) {
  const apiKey = await getYouTubeApiKey();
  const url = new URL(path, YOUTUBE_API_ROOT);

  url.searchParams.set("key", apiKey);

  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string" && value) {
      url.searchParams.set(key, value);
    }
  }

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(YOUTUBE_FETCH_TIMEOUT_MS),
    });
    const payload = (await response.json()) as T;

    if (!response.ok || payload.error) {
      throw mapYouTubeApiError(payload.error, response.status);
    }

    return payload;
  } catch (error) {
    throw mapYouTubeFetchFailure(error);
  }
}

function pickThumbnailUrl(thumbnails?: YouTubeThumbnailMap) {
  return (
    thumbnails?.maxres?.url ??
    thumbnails?.standard?.url ??
    thumbnails?.high?.url ??
    thumbnails?.medium?.url ??
    thumbnails?.default?.url ??
    ""
  );
}

function parseDurationToMinutes(isoDuration = "") {
  const hours = Number(isoDuration.match(/(\d+)H/)?.[1] ?? 0);
  const minutes = Number(isoDuration.match(/(\d+)M/)?.[1] ?? 0);
  const seconds = Number(isoDuration.match(/(\d+)S/)?.[1] ?? 0);

  return Math.max(1, Math.round(hours * 60 + minutes + seconds / 60));
}

function toNumber(value?: string) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toHandle(customUrl: string | undefined, fallback: string) {
  if (!customUrl) {
    return fallback;
  }

  return customUrl.startsWith("@") ? customUrl : `@${customUrl}`;
}

async function resolveChannelIdFromHtml(url: string): Promise<ResolvedChannelReference> {
  let response: Response;

  try {
    response = await fetch(url, {
      cache: "no-store",
      headers: {
        "accept-language": "en-US,en;q=0.9",
        "user-agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(YOUTUBE_FETCH_TIMEOUT_MS),
    });
  } catch (error) {
    throw mapYouTubeFetchFailure(error);
  }

  if (!response.ok) {
    throw new ChannelAnalysisError(
      "We could not resolve that YouTube channel URL.",
      { field: "channelUrl", status: 404 },
    );
  }

  const html = await response.text();
  const channelId =
    html.match(HTML_CHANNEL_ID_PATTERN)?.[1] ??
    html.match(/"externalId":"(UC[\w-]{20,})"/)?.[1] ??
    html.match(/"channelId":"(UC[\w-]{20,})"/)?.[1];

  if (!channelId) {
    throw new ChannelAnalysisError(
      "We could not resolve that YouTube channel URL.",
      { field: "channelUrl", status: 404 },
    );
  }

  const canonicalUrl =
    html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] ??
    `https://www.youtube.com/channel/${channelId}`;

  return {
    channelId,
    canonicalUrl,
  };
}

async function resolveChannelReference(
  normalized: NormalizedInput & { ok: true },
): Promise<ResolvedChannelReference> {
  if (normalized.kind === "channelId") {
    return {
      channelId: normalized.identifier,
      canonicalUrl: normalized.normalizedUrl,
    };
  }

  if (normalized.kind === "handle") {
    const response = await youtubeFetch<YouTubeChannelListResponse>("channels", {
      part: "id",
      forHandle: normalized.identifier,
    });
    const channelId = response.items?.[0]?.id;

    if (channelId) {
      return {
        channelId,
        canonicalUrl: normalized.normalizedUrl,
      };
    }
  }

  if (normalized.kind === "username") {
    const response = await youtubeFetch<YouTubeChannelListResponse>("channels", {
      part: "id",
      forUsername: normalized.identifier,
    });
    const channelId = response.items?.[0]?.id;

    if (channelId) {
      return {
        channelId,
        canonicalUrl: normalized.normalizedUrl,
      };
    }
  }

  return resolveChannelIdFromHtml(normalized.normalizedUrl);
}

async function fetchChannelById(channelId: string) {
  const response = await youtubeFetch<YouTubeChannelListResponse>("channels", {
    part: "snippet,statistics,contentDetails,topicDetails",
    id: channelId,
  });
  const channel = response.items?.[0];

  if (!channel?.contentDetails?.relatedPlaylists?.uploads) {
    throw new ChannelAnalysisError(
      "We could not load recent uploads for that channel.",
      { field: "channelUrl", status: 404 },
    );
  }

  return channel;
}

async function fetchUploadsPlaylistVideoIds(playlistId: string, limit = 50) {
  const ids: string[] = [];
  let nextPageToken: string | undefined;

  while (ids.length < limit) {
    const response = await youtubeFetch<YouTubePlaylistItemsResponse>(
      "playlistItems",
      {
        part: "contentDetails",
        playlistId,
        maxResults: String(Math.min(50, limit - ids.length)),
        pageToken: nextPageToken,
      },
    );

    for (const item of response.items ?? []) {
      if (item.contentDetails?.videoId) {
        ids.push(item.contentDetails.videoId);
      }
    }

    if (!response.nextPageToken) {
      break;
    }

    nextPageToken = response.nextPageToken;
  }

  return ids;
}

async function fetchVideosByIds(videoIds: string[]) {
  const chunks: string[][] = [];

  for (let index = 0; index < videoIds.length; index += 50) {
    chunks.push(videoIds.slice(index, index + 50));
  }

  const videos: YouTubeVideoItem[] = [];

  for (const chunk of chunks) {
    const response = await youtubeFetch<YouTubeVideosListResponse>("videos", {
      part: "snippet,statistics,contentDetails",
      id: chunk.join(","),
      maxResults: String(chunk.length),
    });

    videos.push(...(response.items ?? []));
  }

  return videos;
}

export async function fetchYouTubeChannelSnapshot(
  channelUrl: string,
): Promise<YouTubeChannelSnapshot> {
  const normalized = normalizeYouTubeChannelInput(channelUrl);

  if (!normalized.ok) {
    throw new ChannelAnalysisError(normalized.error, {
      field: "channelUrl",
      status: 400,
    });
  }

  const resolved = await resolveChannelReference(normalized);
  const channelItem = await fetchChannelById(resolved.channelId);
  const uploadsPlaylistId = channelItem.contentDetails?.relatedPlaylists?.uploads;

  if (!uploadsPlaylistId) {
    throw new ChannelAnalysisError(
      "We could not load recent uploads for that channel.",
      { field: "channelUrl", status: 404 },
    );
  }

  const recentVideoIds = await fetchUploadsPlaylistVideoIds(uploadsPlaylistId, 50);
  const recentVideos = await fetchVideosByIds(recentVideoIds);

  const rawVideos = recentVideos
    .filter(
      (video) =>
        Boolean(video.id) &&
        Boolean(video.snippet?.publishedAt) &&
        Boolean(video.snippet?.title) &&
        Boolean(video.statistics?.viewCount),
    )
    .map((video) => ({
      id: video.id,
      title: video.snippet?.title ?? "Untitled video",
      publishedAt: video.snippet?.publishedAt ?? new Date().toISOString(),
      views: toNumber(video.statistics?.viewCount),
      likes: video.statistics?.likeCount
        ? toNumber(video.statistics.likeCount)
        : undefined,
      comments: video.statistics?.commentCount
        ? toNumber(video.statistics.commentCount)
        : undefined,
      durationMinutes: parseDurationToMinutes(video.contentDetails?.duration),
      thumbnailUrl: pickThumbnailUrl(video.snippet?.thumbnails),
      tags: video.snippet?.tags ?? [],
    }))
    .sort(
      (left, right) =>
        new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime(),
    );

  if (!rawVideos.length) {
    throw new ChannelAnalysisError(
      "This channel does not have enough public recent videos to analyze.",
      { field: "channelUrl", status: 404 },
    );
  }

  return {
    channel: {
      id: channelItem.id,
      name: channelItem.snippet?.title ?? "YouTube Channel",
      handle: toHandle(
        channelItem.snippet?.customUrl,
        normalized.kind === "handle" ? `@${normalized.identifier}` : `@${normalized.identifier}`,
      ),
      url: resolved.canonicalUrl,
      description: channelItem.snippet?.description ?? "",
      subscriberCount: channelItem.statistics?.hiddenSubscriberCount
        ? null
        : toNumber(channelItem.statistics?.subscriberCount),
      avatarUrl: pickThumbnailUrl(channelItem.snippet?.thumbnails) || undefined,
      topicCategories: channelItem.topicDetails?.topicCategories ?? [],
      uploadsPlaylistId,
    },
    videos: rawVideos,
  };
}
