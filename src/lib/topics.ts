import type { RawVideo, VideoAnalysis } from "@/types/youtube";

type TopicSource = Pick<RawVideo, "title" | "tags">;
type TopicRow = {
  topic: string;
  count: number;
  averageMomentum: number;
  averageViewsPerDay: number;
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "atau",
  "apa",
  "about",
  "after",
  "analysis",
  "anime",
  "avant",
  "banget",
  "baru",
  "before",
  "belum",
  "best",
  "bikin",
  "bisa",
  "buat",
  "but",
  "campaign",
  "channel",
  "content",
  "ct",
  "dan",
  "dari",
  "dengan",
  "developers",
  "different",
  "ending",
  "episode",
  "for",
  "from",
  "gak",
  "gds",
  "google",
  "guide",
  "have",
  "how",
  "idk",
  "indo",
  "indonesia",
  "influence",
  "into",
  "just",
  "karena",
  "learn",
  "lebih",
  "live",
  "livestream",
  "more",
  "nggak",
  "nih",
  "official",
  "part",
  "pattern",
  "pr",
  "pr_pr",
  "project",
  "purpose",
  "reaction",
  "review",
  "same",
  "series",
  "short",
  "shorts",
  "siapa",
  "story",
  "sudah",
  "tag",
  "tags",
  "tactical",
  "tech",
  "technology",
  "that",
  "the",
  "their",
  "them",
  "this",
  "today",
  "tone",
  "trailer",
  "type",
  "untuk",
  "upload",
  "video",
  "videos",
  "video type",
  "vs",
  "was",
  "watch",
  "week",
  "were",
  "what",
  "when",
  "where",
  "which",
  "why",
  "will",
  "with",
  "yang",
  "your",
]);

const SHORT_TOPIC_WHITELIST = new Set(["ai", "ux", "ui", "vr", "ar", "ml", "qa", "3d"]);
const METADATA_TAG_MARKERS = [
  "pr_pr",
  "purpose",
  "campaign",
  "video type",
  "type:",
  "series",
  "gds",
  "ct:",
];
const GENERIC_CATEGORY_LABELS = new Set([
  "home",
  "knowledge",
  "lifestyle",
  "media",
  "society",
]);
const DISPLAY_TOKEN_OVERRIDES: Record<string, string> = {
  ai: "AI",
  api: "API",
  apis: "APIs",
  ar: "AR",
  js: "JS",
  ml: "ML",
  qa: "QA",
  ts: "TS",
  ui: "UI",
  ux: "UX",
  vr: "VR",
  "3d": "3D",
  firebase: "Firebase",
  javascript: "JavaScript",
  typescript: "TypeScript",
};

function isGenericLabel(value: string) {
  return GENERIC_CATEGORY_LABELS.has(value.toLowerCase());
}

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => {
      const normalizedPart = part.toLowerCase();

      return (
        DISPLAY_TOKEN_OVERRIDES[normalizedPart] ??
        (part[0]?.toUpperCase() + part.slice(1).toLowerCase())
      );
    })
    .join(" ");
}

function normalizePhrase(value: string) {
  return value
    .replace(/\([^)]*\)/g, " ")
    .replace(/[_-]+/g, " ")
    .replace(/[“”"'"`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string) {
  return normalizePhrase(value)
    .split(/[^a-zA-Z0-9]+/)
    .map((word) => word.trim())
    .filter(Boolean);
}

function buildIgnoredTerms(channelName: string, channelHandle: string) {
  const normalizedHandle = channelHandle.replace(/^@/, "");
  const ignoredTerms = new Set<string>();

  for (const source of [channelName, normalizedHandle]) {
    const normalizedSource = normalizePhrase(source).toLowerCase();

    if (normalizedSource.length >= 3) {
      ignoredTerms.add(normalizedSource);
    }

    for (const token of tokenize(source)) {
      const normalizedToken = token.toLowerCase();

      if (normalizedToken.length >= 3) {
        ignoredTerms.add(normalizedToken);
      }
    }
  }

  return ignoredTerms;
}

function isMeaningfulWord(word: string, ignoredTerms: Set<string>) {
  return (
    (word.length >= 3 || SHORT_TOPIC_WHITELIST.has(word)) &&
    !STOP_WORDS.has(word) &&
    !ignoredTerms.has(word)
  );
}

function isMetadataTag(tag: string) {
  const normalizedTag = tag.toLowerCase();

  return (
    normalizedTag.includes(";") ||
    normalizedTag.includes(":") ||
    METADATA_TAG_MARKERS.some((marker) => normalizedTag.includes(marker))
  );
}

function buildPhrase(words: string[]) {
  return titleCase(words.join(" "));
}

function extractPhrasesFromTag(tag: string, ignoredTerms: Set<string>) {
  if (isMetadataTag(tag)) {
    return [];
  }

  const normalizedTag = normalizePhrase(tag);
  const lowerNormalizedTag = normalizedTag.toLowerCase();

  if (ignoredTerms.has(lowerNormalizedTag)) {
    return [];
  }

  const words = tokenize(normalizedTag).map((word) => word.toLowerCase());
  const meaningfulWords = words.filter((word) => isMeaningfulWord(word, ignoredTerms));

  if (!meaningfulWords.length || meaningfulWords.length > 4) {
    return [];
  }

  return [buildPhrase(meaningfulWords)];
}

function extractPhrasesFromTitle(title: string, ignoredTerms: Set<string>) {
  const words = tokenize(title).map((word) => word.toLowerCase());
  const phrases = new Set<string>();

  for (let index = 0; index < words.length; index += 1) {
    const word = words[index];

    if (
      isMeaningfulWord(word, ignoredTerms) &&
      (word.length >= 4 || SHORT_TOPIC_WHITELIST.has(word))
    ) {
      phrases.add(buildPhrase([word]));
    }

    const pair = words.slice(index, index + 2);
    const triple = words.slice(index, index + 3);

    if (pair.length === 2 && pair.every((part) => isMeaningfulWord(part, ignoredTerms))) {
      phrases.add(buildPhrase(pair));
    }

    if (triple.length === 3 && triple.every((part) => isMeaningfulWord(part, ignoredTerms))) {
      phrases.add(buildPhrase(triple));
    }
  }

  return [...phrases];
}

function extractTopicsFromSource(
  source: TopicSource,
  ignoredTerms: Set<string>,
) {
  const tagPhrases = (source.tags ?? [])
    .flatMap((tag) => extractPhrasesFromTag(tag, ignoredTerms))
    .slice(0, 4);

  if (tagPhrases.length) {
    return [...new Set(tagPhrases)];
  }

  return extractPhrasesFromTitle(source.title, ignoredTerms).slice(0, 4);
}

function normalizeCategoryLabel(value: string) {
  return titleCase(normalizePhrase(value).replace(/\s+/g, " "));
}

function extractCategoryTopics(
  topicCategories: string[],
  channelName: string,
  channelHandle: string,
) {
  const ignoredTerms = buildIgnoredTerms(channelName, channelHandle);

  return topicCategories
    .map((topicCategory) => {
      try {
        const url = new URL(topicCategory);
        return normalizeCategoryLabel(
          decodeURIComponent(url.pathname.split("/").pop() ?? ""),
        );
      } catch {
        return normalizeCategoryLabel(topicCategory);
      }
    })
    .filter((label) => {
      const normalizedLabel = label.toLowerCase();

      return (
        normalizedLabel &&
        !ignoredTerms.has(normalizedLabel) &&
        !STOP_WORDS.has(normalizedLabel)
      );
    });
}

function buildTopicCandidates(
  videos: VideoAnalysis[],
  channelName: string,
  channelHandle: string,
) {
  const ignoredTerms = buildIgnoredTerms(channelName, channelHandle);
  const topics = new Map<
    string,
    {
      count: number;
      totalMomentum: number;
      totalViewsPerDay: number;
    }
  >();

  for (const video of videos) {
    const topicsForVideo = [...new Set(extractTopicsFromSource(video, ignoredTerms))];

    for (const topic of topicsForVideo) {
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
    .filter((row) => !isGenericLabel(row.topic))
    .sort((left, right) => {
      return (
        right.count - left.count ||
        right.averageMomentum - left.averageMomentum ||
        right.averageViewsPerDay - left.averageViewsPerDay ||
        left.topic.localeCompare(right.topic)
      );
    });
}

export function buildTopicRows(
  videos: VideoAnalysis[],
  channelName: string,
  channelHandle: string,
) {
  return buildTopicCandidates(videos, channelName, channelHandle)
    .filter((row) => row.count >= 2)
    .sort((left, right) => {
      return (
        right.averageMomentum - left.averageMomentum ||
        right.averageViewsPerDay - left.averageViewsPerDay ||
        right.count - left.count ||
        left.topic.localeCompare(right.topic)
      );
    });
}

export function extractFocusTags(
  videos: VideoAnalysis[],
  channelName: string,
  channelHandle: string,
  limit = 3,
) {
  return buildTopicCandidates(videos, channelName, channelHandle)
    .filter((row) => row.count >= 2)
    .map((row) => row.topic)
    .slice(0, limit);
}

export function buildVideoTopicChips(
  source: TopicSource,
  channelName: string,
  channelHandle: string,
  limit = 2,
) {
  const ignoredTerms = buildIgnoredTerms(channelName, channelHandle);

  return extractTopicsFromSource(source, ignoredTerms).slice(0, limit);
}

export function pickPrimaryCategory(
  topicCategories: string[],
  channelName: string,
  channelHandle: string,
) {
  const categoryTopics = extractCategoryTopics(
    topicCategories,
    channelName,
    channelHandle,
  );
  const specificCategory = categoryTopics.find(
    (topic) => !isGenericLabel(topic),
  );

  if (specificCategory) {
    return specificCategory;
  }

  const identity = `${channelName} ${channelHandle}`.toLowerCase();

  if (
    /(developer|developers|dev|code|cloud|firebase|android|javascript|react|next|programming|software|engineer|engineering|ai)\b/.test(
      identity,
    )
  ) {
    return "Developer media";
  }

  if (/(music|band|song|album|artist)\b/.test(identity)) {
    return "Music";
  }

  if (/(game|gaming|gamer|esports)\b/.test(identity)) {
    return "Gaming";
  }

  if (/(comedy|entertainment|funny)\b/.test(identity)) {
    return "Entertainment";
  }

  return categoryTopics[0] ?? null;
}

export function pickFastestMover(videos: VideoAnalysis[]) {
  const recentVideos = videos.filter((video) => video.ageDays <= 30);
  const candidateVideos = recentVideos.length ? recentVideos : videos;

  return [...candidateVideos].sort((left, right) => {
    return (
      right.viewsPerDay - left.viewsPerDay ||
      right.momentumScore - left.momentumScore ||
      right.performanceScore - left.performanceScore
    );
  })[0];
}
