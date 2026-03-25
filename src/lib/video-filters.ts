import type { DateRangeOption, SortOption, VideoAnalysis } from "@/types/youtube";

export type VideoFilters = {
  search: string;
  sort: SortOption;
  dateRange: DateRangeOption;
  minViews: number;
  segment: "all" | "winners" | "breakout";
};

export const defaultVideoFilters: VideoFilters = {
  search: "",
  sort: "momentum",
  dateRange: "30d",
  minViews: 0,
  segment: "all",
};

function matchesDateRange(video: VideoAnalysis, dateRange: DateRangeOption) {
  if (dateRange === "all") {
    return true;
  }

  if (dateRange === "7d") {
    return video.ageDays <= 7;
  }

  if (dateRange === "30d") {
    return video.ageDays <= 30;
  }

  return video.ageDays <= 90;
}

export function applyVideoFilters(
  videos: VideoAnalysis[],
  filters: VideoFilters,
) {
  const searchQuery = filters.search.trim().toLowerCase();

  const filteredVideos = videos.filter((video) => {
    const matchesSearch =
      !searchQuery ||
      video.title.toLowerCase().includes(searchQuery) ||
      (video.tags ?? []).some((tag) => tag.toLowerCase().includes(searchQuery));
    const matchesViews = video.views >= filters.minViews;
    const matchesSegment =
      filters.segment === "all" ||
      (filters.segment === "breakout" && video.lifecycle === "Breakout") ||
      (filters.segment === "winners" &&
        (video.momentumScore >= 72 || video.lifecycle === "Breakout"));

    return (
      matchesSearch &&
      matchesViews &&
      matchesSegment &&
      matchesDateRange(video, filters.dateRange)
    );
  });

  const sortedVideos = [...filteredVideos].sort((left, right) => {
    if (filters.sort === "views") {
      return right.views - left.views;
    }

    if (filters.sort === "viewsPerDay") {
      return right.viewsPerDay - left.viewsPerDay;
    }

    if (filters.sort === "recency") {
      return (
        new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime()
      );
    }

    if (filters.sort === "momentum") {
      return (
        right.momentumScore - left.momentumScore ||
        right.performanceScore - left.performanceScore
      );
    }

    return right.performanceScore - left.performanceScore;
  });

  return sortedVideos.map((video, index) => ({
    ...video,
    rank: index + 1,
  }));
}
