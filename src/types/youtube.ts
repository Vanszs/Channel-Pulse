export type TrendDirection = "up" | "steady" | "down";
export type LifecycleLabel = "Breakout" | "Steady" | "Cooling";
export type SortOption =
  | "performance"
  | "views"
  | "viewsPerDay"
  | "recency"
  | "momentum";
export type DateRangeOption = "7d" | "30d" | "90d" | "all";

export type RawVideo = {
  id: string;
  title: string;
  publishedAt: string;
  views: number;
  likes?: number;
  comments?: number;
  durationMinutes: number;
  thumbnailUrl: string;
  dailyViews: number[];
};

export type ChannelProfile = {
  id: string;
  name: string;
  handle: string;
  url: string;
  category: string;
  description: string;
  subscriberCount: number;
  avatarText: string;
  uploadCadence: string;
  focusTags: string[];
};

export type ScoreVector = {
  viewReach: number;
  velocity: number;
  engagement: number;
  acceleration: number;
  recency: number;
};

export type VideoAnalysis = RawVideo & {
  rank: number;
  ageDays: number;
  viewsPerDay: number;
  engagementRate: number;
  acceleration: number;
  performanceScore: number;
  momentumScore: number;
  trend: TrendDirection;
  lifecycle: LifecycleLabel;
  scoreBreakdown: ScoreVector;
};

export type ChannelMetrics = {
  totalRecentViews: number;
  videosThisMonth: number;
  monthlyWinners: number;
  averageViewsPerDay: number;
  breakoutCount: number;
  medianPerformance: number;
};

export type InsightTone = "signal" | "neutral" | "watch";

export type ChannelInsight = {
  title: string;
  detail: string;
  tone: InsightTone;
};

export type ScoreExplanation = {
  formula: string;
  weights: ScoreVector;
  note: string;
};

export type ChannelAnalysis = {
  channel: ChannelProfile;
  generatedAt: string;
  defaultDateRange: DateRangeOption;
  metrics: ChannelMetrics;
  insights: ChannelInsight[];
  scoreExplanation: ScoreExplanation;
  videos: VideoAnalysis[];
};

export type AnalyzeChannelRequest = {
  channelUrl: string;
};

export type AnalyzeChannelSuccessResponse = {
  ok: true;
  data: ChannelAnalysis;
};

export type AnalyzeChannelErrorResponse = {
  ok: false;
  error: string;
  field?: "channelUrl" | "general";
};

export type AnalyzeChannelResponse =
  | AnalyzeChannelSuccessResponse
  | AnalyzeChannelErrorResponse;
