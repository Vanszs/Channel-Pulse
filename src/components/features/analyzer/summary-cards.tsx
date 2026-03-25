import { MetricCard } from "@/components/ui/metric-card";
import { formatCompactNumber } from "@/lib/formatters";
import type { ChannelAnalysis } from "@/types/youtube";

type SummaryCardsProps = {
  analysis: ChannelAnalysis;
};

export function SummaryCards({ analysis }: SummaryCardsProps) {
  const { metrics } = analysis;

  return (
    <div className="fade-up grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <MetricCard
        label="Winners this month"
        value={`${metrics.monthlyWinners}`}
        detail={`${metrics.monthlyWinners} videos are beating the current channel baseline.`}
        emphasis
      />
      <MetricCard
        label="Monthly views"
        value={formatCompactNumber(metrics.totalRecentViews)}
        detail="Total views from videos published in the last 30 days."
      />
      <MetricCard
        label="Uploads this month"
        value={`${metrics.videosThisMonth}`}
        detail="Recent uploads included in the month window."
      />
      <MetricCard
        label="Avg views / day"
        value={formatCompactNumber(metrics.averageViewsPerDay)}
        detail="Average daily velocity across the analyzed set."
      />
      <MetricCard
        label="Breakout count"
        value={`${metrics.breakoutCount}`}
        detail={`Median performance score is ${metrics.medianPerformance}/100.`}
      />
    </div>
  );
}
