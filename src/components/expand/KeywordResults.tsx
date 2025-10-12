'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getExpandedRowModel,
  ExpandedState,
  SortingState,
  getSortedRowModel,
} from '@tanstack/react-table';
// Subcomponents split for separation of concerns
import { TrendChart } from './TrendChart';
import { TrendChartSection as ImportedTrendChartSection } from './keyword-results/TrendChartSection';
import { InterestByRegion as ImportedInterestByRegion } from './keyword-results/InterestByRegion';
import { RelatedDataSection as ImportedRelatedDataSection } from './keyword-results/RelatedData';
import { Checkbox } from '@/components/ui/checkbox';
import { ExpandedKeyword } from '@/lib/keyword-expansion/types';
import { RowSelectionState } from '@tanstack/react-table';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TimeRange } from '@/lib/keyword-expansion/serpapi-service';

// Helper function for parsing rising values
const parseRisingValue = (
  formattedValue: string,
  allRisingItems: { formattedValue: string }[]
): number => {
  if (formattedValue === 'Breakout') {
    const otherValues = allRisingItems
      .map((r) => r.formattedValue)
      .filter((v) => v !== 'Breakout')
      .map((v) => parseFloat(v.replace(/[^0-9,.]/g, '')))
      .filter((v) => !isNaN(v));
    const maxOther = otherValues.length > 0 ? Math.max(...otherValues) : 5000;
    return maxOther * 1.2;
  }
  const numericValue = parseFloat(formattedValue.replace(/[^0-9,.]/g, ''));
  return isNaN(numericValue) ? 0 : numericValue;
};

// Component for Top Data (Queries/Topics)
const TopDataList = ({
  title,
  data,
}: {
  title: string;
  data: { topic: string; value: number; type?: string }[];
}) => {
  return (
    <div key={`top-${title}`}>
      <h5 className="mb-1 text-sm font-medium">{title}</h5>
      <div className="space-y-1">
        {data.slice(0, 5).map((item, index) => (
          <div
            key={`${item.topic}-${index}`}
            className="flex justify-between items-center"
          >
            <span className="w-1/2 text-sm truncate">
              {item.topic}{' '}
              {item.type && (
                <span className="text-muted-foreground">({item.type})</span>
              )}
            </span>
            <div className="flex gap-2 items-center w-1/2">
              <div className="overflow-hidden flex-grow h-4 rounded-full bg-muted">
                <div
                  className="h-4 rounded-full bg-primary"
                  style={{ width: `${item.value}%` }}
                ></div>
              </div>
              <span className="w-8 text-sm tabular-nums text-right">
                {item.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Component for Rising Data (Queries/Topics)
const RisingDataList = ({
  title,
  data,
}: {
  title: string;
  data: { topic: string; formattedValue: string; type?: string }[];
}) => {
  const risingData = data.slice(0, 5).map((q) => ({
    ...q,
    numericValue: parseRisingValue(q.formattedValue, data),
  }));

  const maxVal = Math.max(...risingData.map((d) => d.numericValue));

  return (
    <div key={`rising-${title}`}>
      <h5 className="mb-1 text-sm font-medium">{title}</h5>
      <div className="space-y-1">
        {risingData.map((q, index) => {
          const widthPercent = maxVal > 0 ? (q.numericValue / maxVal) * 100 : 0;
          const isBreakout = q.formattedValue === 'Breakout';
          return (
            <div
              key={`${q.topic}-${index}`}
              className="flex justify-between items-center"
            >
              <span className="w-1/2 text-sm truncate">
                {q.topic}{' '}
                {q.type && (
                  <span className="text-muted-foreground">({q.type})</span>
                )}
              </span>
              <div className="flex gap-2 items-center w-1/2">
                <div className="overflow-hidden flex-grow h-4 rounded-full bg-muted">
                  <div
                    className={`h-4 rounded-full ${
                      isBreakout ? 'bg-destructive' : 'bg-primary'
                    }`}
                    style={{ width: `${widthPercent}%` }}
                  ></div>
                </div>
                <span
                  className={`w-24 text-right text-sm tabular-nums ${
                    isBreakout ? 'font-semibold text-destructive' : ''
                  }`}
                >
                  {q.formattedValue}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Component for a section (e.g., Related Queries, Related Topics)
const RelatedDataSection = ({
  title,
  topData,
  risingData,
  dataType,
}: {
  title: string;
  topData?: any[];
  risingData?: any[];
  dataType: 'queries' | 'topics';
}) => {
  const hasTopData = topData && topData.length > 0;
  const hasRisingData = risingData && risingData.length > 0;

  const mapToTop = (d: any) => ({
    topic: d.query || d.topic,
    value: d.value,
    type: d.type,
  });
  const mapToRising = (d: any) => ({
    topic: d.query || d.topic,
    formattedValue: d.formattedValue,
    type: d.type,
  });

  return (
    <div>
      <h4 className="mb-2 font-semibold">{title}</h4>
      {!hasTopData && !hasRisingData ? (
        <p className="text-sm text-muted-foreground">
          No related {dataType} data.
        </p>
      ) : (
        <div className="space-y-4">
          {hasTopData && (
            <TopDataList title="Top" data={topData.map(mapToTop)} />
          )}
          {hasRisingData && (
            <RisingDataList title="Rising" data={risingData.map(mapToRising)} />
          )}
        </div>
      )}
    </div>
  );
};

const InterestByRegion = ({
  data,
}: {
  data: { geoName: string; value: number[] }[];
}) => {
  // 데이터가 있는 국가들만 필터링하고 값이 높은 순으로 정렬
  const filteredAndSortedData = data
    .filter((region) => {
      // 값이 존재하고, 유효한 국가명이 있는 경우 포함 (0 값도 포함)
      return (
        region.value &&
        region.value.length > 0 &&
        region.value[0] >= 0 &&
        region.geoName &&
        region.geoName.trim() !== ''
      );
    })
    .sort((a, b) => {
      // 값이 높은 순으로 정렬 (내림차순)
      const valueA = a.value?.[0] ?? 0;
      const valueB = b.value?.[0] ?? 0;
      return valueB - valueA;
    })
    .slice(0, 10); // 상위 10개 국가 표시 (미미한 값 포함)

  const maxVal =
    filteredAndSortedData.length > 0
      ? Math.max(...filteredAndSortedData.map((r) => r.value?.[0] ?? 0))
      : 0;

  if (filteredAndSortedData.length === 0) {
    return (
      <div>
        <h4 className="mb-2 font-semibold">Interest by Region</h4>
        <div className="text-sm text-muted-foreground">
          No regional data available
        </div>
      </div>
    );
  }

  return (
    <div>
      <h4 className="mb-2 font-semibold">Interest by Region</h4>
      <div className="text-sm">
        {filteredAndSortedData.map((region, index) => {
          const rawPercent = maxVal > 0 ? (region.value[0] / maxVal) * 100 : 0;
          // 미미한 값도 보이도록 최소 너비 설정 (값이 0보다 크면 최소 2%는 보이게)
          const widthPercent =
            region.value[0] > 0 ? Math.max(rawPercent, 2) : rawPercent;

          return (
            <div
              key={`${region.geoName}-${index}`}
              className="flex justify-between items-center mb-1"
            >
              <span className="w-1/3 truncate">{region.geoName}</span>
              <div className="flex gap-2 items-center w-2/3">
                <div className="overflow-hidden flex-grow h-4 rounded-full bg-muted">
                  <div
                    className={`h-4 rounded-full ${
                      region.value[0] === 0
                        ? 'bg-gray-300' // 값이 0인 경우 회색
                        : region.value[0] < 5
                        ? 'bg-blue-400' // 미미한 값은 연한 파란색
                        : 'bg-primary' // 일반 값은 기본 색상
                    }`}
                    style={{ width: `${widthPercent}%` }}
                  ></div>
                </div>
                <span className="w-8 text-sm tabular-nums text-right">
                  {region.value[0] === 0 ? '<1' : region.value[0]}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TrendChartSection = ({
  keywordData,
  onFetchTrends,
}: {
  keywordData: ExpandedKeyword;
  onFetchTrends: (keyword: string, forceRefetch?: boolean) => void;
}) => {
  const { isFetching, error, interestOverTime, keyword, source } = keywordData;

  // Check if this is SERP API data that already includes trend information
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
};

const ExpandedRowContent = ({
  row,
  onFetchTrends,
  onFetchSerpApiFullData,
}: {
  row: any;
  onFetchTrends: (keyword: string, forceRefetch?: boolean) => void;
  onFetchSerpApiFullData?: (keyword: string) => void;
}) => {
  const keywordData = row.original as ExpandedKeyword;
  const {
    interestByRegion,
    relatedQueries,
    relatedTopics,
    keyword,
    source,
    isFetching,
  } = keywordData;

  // Check if this is SERP API data and whether it's a seed keyword (which has full data)
  const isSerpApiData =
    source?.includes('SerpApi') ||
    source?.includes('Rising') ||
    source?.includes('Top');
  const isSeedKeyword = source === 'seed';
  const isRelatedKeyword = isSerpApiData && !isSeedKeyword;

  // Debug: Log all available data for this keyword
  console.log(
    `🔍 Debug - Expanded data for "${keyword}" (source: ${source}):`,
    {
      isSeedKeyword,
      isRelatedKeyword,
      interestByRegion: interestByRegion,
      interestByRegionLength: interestByRegion?.length || 0,
      relatedQueries: relatedQueries,
      relatedQueriesTopLength: relatedQueries?.top?.length || 0,
      relatedQueriesRisingLength: relatedQueries?.rising?.length || 0,
      relatedTopics: relatedTopics,
      relatedTopicsTopLength: relatedTopics?.top?.length || 0,
      relatedTopicsRisingLength: relatedTopics?.rising?.length || 0,
    }
  );

  const hasRelatedQueries =
    relatedQueries &&
    ((relatedQueries.top?.length ?? 0) > 0 ||
      (relatedQueries.rising?.length ?? 0) > 0);
  const hasRelatedTopics =
    relatedTopics &&
    ((relatedTopics.top?.length ?? 0) > 0 ||
      (relatedTopics.rising?.length ?? 0) > 0);

  return (
    <div className="p-4 space-y-4 bg-muted/50">
      <ImportedTrendChartSection
        keywordData={keywordData}
        onFetchTrends={onFetchTrends}
      />

      {/* Show fetch buttons for non-seed keywords that don't have complete data */}
      {!isSeedKeyword &&
        (!hasRelatedQueries ||
          !hasRelatedTopics ||
          !interestByRegion?.length) && (
          <div className="p-4 space-y-3 text-center rounded-lg border border-dashed border-muted-foreground/20">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Complete data not available.</span>
              <br />
              Click below to fetch all sections (regions, queries, topics) for
              this keyword.
            </p>
            <div className="flex flex-col gap-2 justify-center sm:flex-row">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log(
                    `🔄 Google Trends: Fetching ALL data for "${keyword}"`
                  );
                  onFetchTrends(keyword, true);
                }}
                disabled={isFetching}
                className="flex gap-2 items-center"
              >
                {isFetching ? (
                  <div className="w-3 h-3 rounded-full border-2 border-current border-dashed animate-spin"></div>
                ) : null}
                Fetch All with Google Trends
              </Button>
              <Button
                size="sm"
                variant="default"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log(
                    `🔄 SERP API: Fetching ALL data for "${keyword}"`
                  );
                  if (onFetchSerpApiFullData) {
                    onFetchSerpApiFullData(keyword);
                  }
                }}
                disabled={isFetching || !onFetchSerpApiFullData}
                className="flex gap-2 items-center"
              >
                {isFetching ? (
                  <div className="w-3 h-3 rounded-full border-2 border-current border-dashed animate-spin"></div>
                ) : null}
                Fetch All with SERP API
              </Button>
            </div>
          </div>
        )}

      {/* Always show data sections - both Google Trends and SERP API can fetch full data */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2">
        {/* Interest by Region Section */}
        {interestByRegion && interestByRegion.length > 0 ? (
          <ImportedInterestByRegion data={interestByRegion} />
        ) : (
          <div>
            <h4 className="mb-2 font-semibold">Interest by Region</h4>
            <p className="text-sm text-muted-foreground">
              No regional data available for this keyword.
            </p>
          </div>
        )}

        {/* Related Queries Section */}
        {hasRelatedQueries ? (
          <ImportedRelatedDataSection
            title="Related Queries"
            topData={relatedQueries.top}
            risingData={relatedQueries.rising}
            dataType="queries"
          />
        ) : (
          <div>
            <h4 className="mb-2 font-semibold">Related Queries</h4>
            <p className="text-sm text-muted-foreground">
              No related queries available for this keyword.
            </p>
          </div>
        )}

        {/* Related Topics Section */}
        {hasRelatedTopics ? (
          <ImportedRelatedDataSection
            title="Related Topics"
            topData={relatedTopics.top}
            risingData={relatedTopics.rising}
            dataType="topics"
          />
        ) : (
          <div>
            <h4 className="mb-2 font-semibold">Related Topics</h4>
            <p className="text-sm text-muted-foreground">
              No related topics available for this keyword.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
interface KeywordResultsProps {
  processedKeywords: ExpandedKeyword[];
  viewMode: 'list' | 'grid';
  isExpanding: boolean;
  rowSelection: RowSelectionState;
  setRowSelection: React.Dispatch<React.SetStateAction<RowSelectionState>>;
  onFetchTrends: (keyword: string, forceRefetch?: boolean) => void;
  onFetchSerpApiFullData?: (keyword: string) => void;
  timeRange: TimeRange;
}

export function KeywordResults({
  processedKeywords,
  viewMode,
  isExpanding,
  rowSelection,
  setRowSelection,
  onFetchTrends,
  onFetchSerpApiFullData,
  timeRange,
}: KeywordResultsProps) {
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<ExpandedKeyword>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: 'expander',
      header: () => null,
      cell: ({ row }) => {
        // Always allow expanding to see details or fetch data.
        // The expander was previously conditional on hasTrendData, which prevented
        // rows without data from being expanded to fetch it.
        if (!row.getCanExpand()) return null;

        return (
          <div
            onClick={(e) => {
              e.stopPropagation();
              row.toggleExpanded();
            }}
            className="cursor-pointer"
          >
            <ChevronRight
              className={`h-4 w-4 transition-transform ${
                row.getIsExpanded() ? 'rotate-90' : ''
              }`}
            />
          </div>
        );
      },
    },
    {
      accessorKey: 'keyword',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Keyword
            <ArrowUpDown className="ml-2 w-4 h-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('keyword')}</div>
      ),
    },
    {
      accessorKey: 'source',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Source
            <ArrowUpDown className="ml-2 w-4 h-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const source = row.getValue('source') as string;
        const isSeedKeyword = source === 'seed';

        if (isSeedKeyword) {
          return (
            <div className="flex gap-2 items-center">
              <Badge
                variant="default"
                className="text-green-800 bg-green-100 hover:bg-green-100"
              >
                Seed
              </Badge>
              <span className="text-xs text-muted-foreground">Full data</span>
            </div>
          );
        }

        return (
          <div className="flex gap-2 items-center">
            <Badge variant="outline" className="text-xs">
              {source}
            </Badge>
            {(source?.includes('SerpApi') ||
              source?.includes('Rising') ||
              source?.includes('Top')) && (
              <span className="text-xs text-muted-foreground">Trends only</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'volume',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Volume
            <ArrowUpDown className="ml-2 w-4 h-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: 'timeRange',
      header: 'Time Range',
      cell: ({ row }) => {
        const keywordTimeRange = row.original.timeRange;
        const source = row.original.source;

        // Only log for seed keywords to reduce noise
        if (source === 'seed') {
          console.log(
            `🖥️ UI Debug - Time Range for "${row.original.keyword}":`,
            {
              timeRange: keywordTimeRange,
              source: source,
              fallbackTimeRange: timeRange,
              hasInterestOverTime: !!row.original.interestOverTime,
              interestOverTimeLength:
                row.original.interestOverTime?.length || 0,
            }
          );
        }

        if (keywordTimeRange) {
          return (
            <Badge variant="outline" className="text-xs">
              {keywordTimeRange}
            </Badge>
          );
        }
        // Fallback to props timeRange for non-trends data
        if (
          source === 'trends' ||
          source.includes('Trends') ||
          source.includes('SerpApi')
        ) {
          return (
            <Badge variant="outline" className="text-xs">
              {timeRange}
            </Badge>
          );
        }
        return <span className="text-xs text-muted-foreground">-</span>;
      },
    },
    {
      accessorKey: 'geo',
      header: 'Region',
      cell: ({ row }) => {
        const geo = row.original.geo;

        if (geo) {
          return (
            <Badge variant="outline" className="text-xs">
              {geo}
            </Badge>
          );
        }
        return <span className="text-xs text-muted-foreground">-</span>;
      },
    },
  ];

  const table = useReactTable({
    data: processedKeywords,
    columns,
    state: {
      rowSelection,
      expanded,
      sorting,
    },
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onExpandedChange: setExpanded,
    getRowCanExpand: () => true,
  });

  // If no data available, show empty state
  if (processedKeywords.length === 0 && !isExpanding) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-muted-foreground">
            No keywords expanded yet. Click "Expand Keywords" to start.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expanded Keywords</CardTitle>
        <CardDescription>
          Review and select from the expanded keyword list.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <React.Fragment key={row.id}>
                    <TableRow
                      data-state={row.getIsSelected() && 'selected'}
                      className={row.getCanExpand() ? 'cursor-pointer' : ''}
                      onClick={() => row.toggleExpanded()}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    {row.getIsExpanded() && (
                      <TableRow>
                        <TableCell colSpan={columns.length}>
                          <ExpandedRowContent
                            row={row}
                            onFetchTrends={onFetchTrends}
                            onFetchSerpApiFullData={onFetchSerpApiFullData}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    Expanding keywords...
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
