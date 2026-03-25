import { identifierToDisplayName, normalizeYouTubeChannelInput } from "@/lib/channel-url";
import {
  formatCompactNumber,
  formatDuration,
  formatSignedPercent,
} from "@/lib/formatters";
import { average, buildVideoAnalysis, clamp, median, sum } from "@/lib/scoring";
import type {
  ChannelAnalysis,
  ChannelInsight,
  ChannelMetrics,
  ChannelProfile,
  RawVideo,
  VideoAnalysis,
} from "@/types/youtube";

type Theme = {
  matches: string[];
  category: string;
  description: string;
  focusTags: string[];
  colors: [string, string];
  titles: string[];
};

type ReleaseTrajectory = "surging" | "steady" | "cooling";

const THEME_LIBRARY: Theme[] = [
  {
    matches: ["ai", "gpt", "agent", "automation", "prompt"],
    category: "AI product marketing",
    description:
      "Covers shipping, positioning, and operating AI-heavy products for modern teams.",
    focusTags: ["AI workflows", "Product demos", "Operational playbooks"],
    colors: ["#0f766e", "#164e63"],
    titles: [
      "7 AI automations we use to run onboarding every week",
      "The agent workflow that doubled our weekly output",
      "Why our AI demo video started compounding after day three",
      "Building an internal research copilot for a lean team",
      "What broke after we shipped autonomous outreach",
      "From prompt stack to product: our migration path",
      "The AI dashboard we wanted six months earlier",
      "How we review automation before customers ever see it",
      "Three AI product bets we would still make today",
      "Turning support tickets into an AI roadmap signal",
      "Where generic AI content is already losing",
      "The fastest way to make AI outputs feel more human",
    ],
  },
  {
    matches: ["design", "ux", "ui", "brand", "studio"],
    category: "Product design systems",
    description:
      "Breaks down interface systems, visual strategy, and how product storytelling converts.",
    focusTags: ["UI audits", "Design systems", "Homepage strategy"],
    colors: ["#d97706", "#7c2d12"],
    titles: [
      "The landing page system behind our best signup week",
      "Why this homepage redesign outperformed the old one",
      "A Swiss layout framework for faster product pages",
      "How we make dense dashboards feel calm",
      "The hero section pattern we stopped using",
      "Designing pricing pages that read like a narrative",
      "The visual hierarchy audit we run before every launch",
      "Where most SaaS dashboards lose clarity",
      "The product screen formula that makes demos land harder",
      "How motion changes perceived product confidence",
      "What high-converting competitors do above the fold",
      "A minimalist UI teardown with real conversion lessons",
    ],
  },
  {
    matches: ["dev", "code", "build", "stack", "engineer", "frontend"],
    category: "Developer tooling",
    description:
      "Focuses on technical product marketing, docs funnels, and feature storytelling for builders.",
    focusTags: ["Docs-led growth", "Launch strategy", "Developer trust"],
    colors: ["#2563eb", "#1d4ed8"],
    titles: [
      "What developers actually click on a docs homepage",
      "The launch video structure that engineers keep watching",
      "Why our changelog post outranked the product trailer",
      "Building a docs funnel that turns curiosity into installs",
      "The feature announcement format that drives qualified demos",
      "A teardown of developer landing pages that convert",
      "What technical founders miss in product walkthroughs",
      "The onboarding sequence that reduced first-run dropoff",
      "Shipping a benchmark story developers trust",
      "How we position complexity without scaring prospects",
      "Why this technical teaser kept compounding for weeks",
      "A homepage rewrite for builders, not buyers",
    ],
  },
  {
    matches: ["growth", "saas", "startup", "founder", "revenue"],
    category: "SaaS growth strategy",
    description:
      "Analyzes positioning, growth loops, and revenue experiments for subscription products.",
    focusTags: ["Growth loops", "Pricing tests", "Demand capture"],
    colors: ["#0f766e", "#0f172a"],
    titles: [
      "The pricing experiment that changed our pipeline quality",
      "Why this founder-led demo kept climbing all month",
      "A teardown of SaaS videos that actually earn demand",
      "What we learned from a zero-budget launch week",
      "The content wedge that brought us better-fit leads",
      "How we turned one webinar into three pipeline assets",
      "The retention story prospects actually cared about",
      "Where high-growth SaaS channels find momentum",
      "The monthly reporting format our audience shares internally",
      "What a breakout explainer video looks like in B2B",
      "Why comparison content is still underrated",
      "The growth loop hidden inside strong educational content",
    ],
  },
];

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
]);

function hashIdentifier(identifier: string) {
  let hash = 0;

  for (let index = 0; index < identifier.length; index += 1) {
    hash = (hash * 31 + identifier.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function createSeededRandom(seed: number) {
  let state = seed || 1;

  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function pickTheme(identifier: string) {
  return (
    THEME_LIBRARY.find((theme) =>
      theme.matches.some((keyword) => identifier.includes(keyword)),
    ) ?? THEME_LIBRARY[3]
  );
}

function escapeSvgText(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function splitTitle(title: string) {
  const words = title.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length > 20 && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = nextLine;
    }

    if (lines.length === 2) {
      break;
    }
  }

  if (currentLine && lines.length < 3) {
    lines.push(currentLine);
  }

  return lines.slice(0, 3);
}

function createThumbnailDataUrl(
  title: string,
  category: string,
  rank: number,
  colors: [string, string],
) {
  const lines = splitTitle(title);
  const text = lines
    .map(
      (line, index) =>
        `<tspan x="48" dy="${index === 0 ? 0 : 44}">${escapeSvgText(line)}</tspan>`,
    )
    .join("");

  const svg = `
    <svg width="1280" height="720" viewBox="0 0 1280 720" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="1280" height="720" rx="40" fill="${colors[1]}" />
      <rect x="24" y="24" width="1232" height="672" rx="32" fill="url(#bg)" />
      <path d="M0 548C219 498 362 430 530 278C668 154 900 110 1280 156V720H0V548Z" fill="rgba(255,255,255,0.08)" />
      <path d="M108 128H458V156H108V128ZM108 190H356V214H108V190Z" fill="rgba(255,255,255,0.35)" />
      <text x="48" y="470" fill="white" font-family="IBM Plex Sans, Arial, sans-serif" font-size="64" font-weight="600">${text}</text>
      <text x="48" y="620" fill="rgba(255,255,255,0.74)" font-family="IBM Plex Sans, Arial, sans-serif" font-size="28" letter-spacing="2">${escapeSvgText(category.toUpperCase())}</text>
      <text x="1110" y="112" fill="rgba(255,255,255,0.8)" font-family="IBM Plex Mono, monospace" font-size="28">R${rank
        .toString()
        .padStart(2, "0")}</text>
      <defs>
        <linearGradient id="bg" x1="36" y1="64" x2="1240" y2="664" gradientUnits="userSpaceOnUse">
          <stop stop-color="${colors[0]}" />
          <stop offset="1" stop-color="${colors[1]}" />
        </linearGradient>
      </defs>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function generateDailyViews(
  totalViews: number,
  trajectory: ReleaseTrajectory,
  random: () => number,
) {
  const patternMap: Record<ReleaseTrajectory, number[]> = {
    surging: [0.58, 0.69, 0.81, 0.94, 1.11, 1.28, 1.45],
    steady: [0.96, 1.02, 1.0, 1.04, 1.01, 1.06, 1.03],
    cooling: [1.44, 1.26, 1.12, 1.0, 0.94, 0.88, 0.82],
  };

  const recentShare =
    trajectory === "surging"
      ? 0.18 + random() * 0.06
      : trajectory === "steady"
        ? 0.12 + random() * 0.04
        : 0.09 + random() * 0.04;

  const recentViews = Math.max(totalViews * recentShare, 3000);
  const weightedPattern = patternMap[trajectory].map(
    (factor) => factor * (0.94 + random() * 0.14),
  );
  const totalWeight = sum(weightedPattern);

  return weightedPattern.map((factor) =>
    Math.max(260, Math.round((recentViews * factor) / totalWeight)),
  );
}

function buildChannelProfile(
  identifier: string,
  normalizedUrl: string,
  theme: Theme,
  random: () => number,
): ChannelProfile {
  const baseName = identifierToDisplayName(identifier);
  const suffixOptions = ["Lab", "Studio", "Signals", "Collective", "Works"];
  const suffix = suffixOptions[Math.floor(random() * suffixOptions.length)];
  const name = baseName.includes(" ") ? baseName : `${baseName} ${suffix}`;
  const subscriberCount = Math.round(68000 + random() * 420000);
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

  return {
    id: identifier,
    name,
    handle: `@${identifier}`,
    url: normalizedUrl,
    category: theme.category,
    description: theme.description,
    subscriberCount,
    avatarText: initials || "CV",
    uploadCadence: `${Math.max(2, Math.round(2 + random() * 2))} uploads / week`,
    focusTags: theme.focusTags,
  };
}

function generateRawVideos(
  profile: ChannelProfile,
  theme: Theme,
  random: () => number,
) {
  const trajectories: ReleaseTrajectory[] = [
    "surging",
    "steady",
    "surging",
    "cooling",
    "steady",
    "surging",
    "steady",
    "cooling",
    "steady",
    "surging",
    "steady",
    "cooling",
  ];
  const now = new Date();
  let offsetDays = 2 + Math.floor(random() * 2);

  return theme.titles.map((title, index) => {
    if (index > 0) {
      offsetDays += 2 + Math.floor(random() * 4);
    }

    const trajectory = trajectories[index];
    const publishedAt = new Date(now);
    publishedAt.setDate(now.getDate() - offsetDays);

    const freshnessBoost = clamp(1.28 - offsetDays / 100, 0.7, 1.18);
    const trajectoryBoost =
      trajectory === "surging"
        ? 1.42 + random() * 0.34
        : trajectory === "steady"
          ? 0.96 + random() * 0.2
          : 0.68 + random() * 0.12;
    const titleBoost = /how|why|7|three|breakout|system|pricing/i.test(title)
      ? 1.1
      : 1;
    const views = Math.round(
      profile.subscriberCount *
        (0.16 + random() * 0.44) *
        freshnessBoost *
        trajectoryBoost *
        titleBoost,
    );
    const likes = Math.round(views * (0.032 + random() * 0.024));
    const comments = Math.round(likes * (0.07 + random() * 0.11));
    const durationMinutes = 6 + Math.floor(random() * 15);

    return {
      id: `${profile.id}-${index + 1}`,
      title,
      publishedAt: publishedAt.toISOString(),
      views,
      likes,
      comments,
      durationMinutes,
      thumbnailUrl: createThumbnailDataUrl(
        title,
        profile.category,
        index + 1,
        theme.colors,
      ),
      dailyViews: generateDailyViews(views, trajectory, random),
    } satisfies RawVideo;
  });
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

function extractCommonKeyword(videos: VideoAnalysis[]) {
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

  return keyword ?? "story";
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
  const publishGaps = videos.slice(0, 5).flatMap((video, index) => {
    const nextVideo = videos[index + 1];

    if (!nextVideo) {
      return [];
    }

    const gapInDays = Math.round(
      (new Date(video.publishedAt).getTime() -
        new Date(nextVideo.publishedAt).getTime()) /
        (1000 * 60 * 60 * 24),
    );

    return [gapInDays];
  });
  const averageGap = Math.max(2, Math.round(average(publishGaps)));

  return [
    {
      title: "Current winner",
      detail: `${leader.title} is leading at ${formatCompactNumber(
        leader.viewsPerDay,
      )} views/day with ${formatSignedPercent(
        leader.acceleration,
      )} week-over-week acceleration.`,
      tone: "signal",
    },
    {
      title: "Pattern to copy",
      detail: `The strongest uploads lean ${
        topAverageDuration <= channelAverageDuration ? "shorter and more tactical" : "slightly deeper"
      } than the channel average, and "${keyword}" keeps repeating in top titles.`,
      tone: "neutral",
    },
    {
      title: "Momentum read",
      detail: `${profile.name} is publishing roughly every ${averageGap} days, and ${
        metrics.breakoutCount
      } recent uploads are in breakout territory. ${
        metrics.breakoutCount >= 3
          ? "Momentum is broad, not concentrated in a single spike."
          : "Performance is concentrated, so format replication matters more than volume."
      }`,
      tone: metrics.breakoutCount >= 3 ? "signal" : "watch",
    },
  ] satisfies ChannelInsight[];
}

export async function analyzeChannel(channelUrl: string): Promise<ChannelAnalysis> {
  const normalized = normalizeYouTubeChannelInput(channelUrl);

  if (!normalized.ok) {
    throw new Error(normalized.error);
  }

  const theme = pickTheme(normalized.identifier);
  const random = createSeededRandom(hashIdentifier(normalized.identifier));
  const channel = buildChannelProfile(
    normalized.identifier,
    normalized.normalizedUrl,
    theme,
    random,
  );
  const rawVideos = generateRawVideos(channel, theme, random);
  const videos = buildVideoAnalysis(rawVideos);
  const metrics = buildMetrics(videos);

  return {
    channel,
    generatedAt: new Date().toISOString(),
    defaultDateRange: "30d",
    metrics,
    insights: buildInsights(channel, videos, metrics),
    scoreExplanation: {
      formula:
        "30% views reach + 25% views/day + 18% engagement proxy + 17% acceleration + 10% recency",
      weights: {
        viewReach: 30,
        velocity: 25,
        engagement: 18,
        acceleration: 17,
        recency: 10,
      },
      note: `Designed to highlight fast-rising videos, not just the biggest back-catalog hits. Typical winning runtimes for this channel sit around ${formatDuration(
        Math.round(average(videos.slice(0, 5).map((video) => video.durationMinutes))),
      )}.`,
    },
    videos,
  };
}
