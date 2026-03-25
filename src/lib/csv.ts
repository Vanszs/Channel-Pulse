import type { VideoAnalysis } from "@/types/youtube";

function escapeCsvCell(value: string | number | undefined) {
  const text = `${value ?? ""}`;

  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export function buildVideosCsv(videos: VideoAnalysis[]) {
  const headers = [
    "Rank",
    "Title",
    "Published",
    "Views",
    "Likes",
    "Comments",
    "Views per day",
    "Performance score",
    "Momentum score",
    "Trend",
    "Lifecycle",
  ];

  const rows = videos.map((video) => [
    video.rank,
    video.title,
    video.publishedAt,
    video.views,
    video.likes ?? "",
    video.comments ?? "",
    video.viewsPerDay,
    video.performanceScore,
    video.momentumScore,
    video.trend,
    video.lifecycle,
  ]);

  return [headers, ...rows]
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(","))
    .join("\n");
}
