import {
  defaultPaginationState,
  sanitizePage,
  sanitizePageSize,
  type PaginationState,
} from "@/lib/pagination";
import type { VideoFilters } from "@/lib/video-filters";
import type { DateRangeOption, SortOption } from "@/types/youtube";

const validSorts = new Set<SortOption>([
  "momentum",
  "performance",
  "views",
  "viewsPerDay",
  "recency",
]);

const validDateRanges = new Set<DateRangeOption>(["7d", "30d", "90d", "all"]);
const validSegments = new Set<VideoFilters["segment"]>([
  "all",
  "winners",
  "breakout",
]);

export function parseVideoFiltersFromSearchParams(searchParams: URLSearchParams) {
  const filters: Partial<VideoFilters> = {};
  const search = searchParams.get("q")?.trim();
  const sort = searchParams.get("sort");
  const dateRange = searchParams.get("range");
  const minViews = searchParams.get("minViews");
  const segment = searchParams.get("segment");

  if (search) {
    filters.search = search.slice(0, 120);
  }

  if (sort && validSorts.has(sort as SortOption)) {
    filters.sort = sort as SortOption;
  }

  if (dateRange && validDateRanges.has(dateRange as DateRangeOption)) {
    filters.dateRange = dateRange as DateRangeOption;
  }

  if (minViews) {
    const parsedMinViews = Number.parseInt(minViews, 10);

    if (Number.isFinite(parsedMinViews) && parsedMinViews > 0) {
      filters.minViews = parsedMinViews;
    }
  }

  if (segment && validSegments.has(segment as VideoFilters["segment"])) {
    filters.segment = segment as VideoFilters["segment"];
  }

  return filters;
}

export function parsePaginationFromSearchParams(searchParams: URLSearchParams) {
  const page = searchParams.get("page");
  const pageSize = searchParams.get("pageSize");
  const pagination: Partial<PaginationState> = {};

  if (page) {
    pagination.page = sanitizePage(Number.parseInt(page, 10));
  }

  if (pageSize) {
    pagination.pageSize = sanitizePageSize(Number.parseInt(pageSize, 10));
  }

  return pagination;
}

export function buildAnalysisSearchParams(
  channelUrl: string,
  filters: VideoFilters,
  defaultDateRange: DateRangeOption,
  pagination?: PaginationState,
) {
  const searchParams = new URLSearchParams();

  searchParams.set("channel", channelUrl);

  if (filters.search.trim()) {
    searchParams.set("q", filters.search.trim());
  }

  if (filters.sort !== "momentum") {
    searchParams.set("sort", filters.sort);
  }

  if (filters.dateRange !== defaultDateRange) {
    searchParams.set("range", filters.dateRange);
  }

  if (filters.minViews > 0) {
    searchParams.set("minViews", `${Math.round(filters.minViews)}`);
  }

  if (filters.segment !== "all") {
    searchParams.set("segment", filters.segment);
  }

  if (pagination) {
    if (pagination.page > 1) {
      searchParams.set("page", `${pagination.page}`);
    }

    if (pagination.pageSize !== defaultPaginationState.pageSize) {
      searchParams.set("pageSize", `${pagination.pageSize}`);
    }
  }

  return searchParams;
}
