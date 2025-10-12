'use client';

import { Button } from '@/components/ui/button';
import { ExpandedKeyword } from '@/lib/keyword-expansion/types';
import { TrendChart } from '../TrendChart';

export function TrendChartSection({
  keywordData,
  onFetchTrends,
}: {
  keywordData: ExpandedKeyword;
  onFetchTrends: (keyword: string, forceRefetch?: boolean) => void;
}) {
  const { isFetching, error, interestOverTime, keyword, source } = keywordData;

  const isSerpApiData =
    source?.includes('SerpApi') ||
    source?.includes('Rising') ||
    source?.includes('Top');

  if (isFetching) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 rounded-full border-2 border-dashed animate-spin border-primary"></div>
        <span>Fetching trend data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center">
        <p className="mb-2 text-sm text-destructive">Error: {error}</p>
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onFetchTrends(keyword, true);
          }}
          disabled={isFetching}
        >
          Retry Fetch
        </Button>
      </div>
    );
  }

  if (interestOverTime && interestOverTime.length > 0) {
    return (
      <div>
        <h4 className="mb-2 font-semibold">Interest Over Time</h4>
        <div className="w-full h-[150px]">
          <TrendChart
            data={interestOverTime as { date: string; value: number }[]}
          />
        </div>
      </div>
    );
  }

  if (isSerpApiData) {
    return (
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          No trend data available for this keyword from SERP API.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="mb-2 text-sm text-muted-foreground">
        Click to fetch trend data.
      </p>
      <Button
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onFetchTrends(keyword, true);
        }}
        disabled={isFetching}
      >
        Fetch Trend Data
      </Button>
    </div>
  );
}

