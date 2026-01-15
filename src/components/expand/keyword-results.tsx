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
import { TrendChart } from './trend-chart';
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
  const maxVal = Math.max(...data.map((r) => r.value?.[0] ?? 0));

  return (
    <div>
      <h4 className="mb-2 font-semibold">Interest by Region</h4>
      <div className="text-sm">
        {data.slice(0, 5).map((region, index) => {
          if (!region.value || region.value.length === 0) return null;
          const widthPercent =
            maxVal > 0 ? (region.value[0] / maxVal) * 100 : 0;
          return (
            <div
              key={`${region.geoName}-${index}`}
              className="flex justify-between items-center mb-1"
            >
              <span className="w-1/3 truncate">{region.geoName}</span>
              <div className="flex gap-2 items-center w-2/3">
                <div className="overflow-hidden flex-grow h-4 rounded-full bg-muted">
                  <div
                    className="h-4 rounded-full bg-primary"
                    style={{ width: `${widthPercent}%` }}
                  ></div>
                </div>
                <span className="w-8 text-sm tabular-nums text-right">
                  {region.value[0]}
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
  const { isFetching, error, interestOverTime, keyword } = keywordData;

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
}: {
  row: any;
  onFetchTrends: (keyword: string, forceRefetch?: boolean) => void;
}) => {
  const keywordData = row.original as ExpandedKeyword;
  const { interestByRegion, relatedQueries, relatedTopics } = keywordData;

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
      <TrendChartSection
        keywordData={keywordData}
        onFetchTrends={onFetchTrends}
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2">
        {interestByRegion && interestByRegion.length > 0 && (
          <InterestByRegion data={interestByRegion} />
        )}
        {relatedQueries && (
          <RelatedDataSection
            title="Related Queries"
            topData={relatedQueries.top}
            risingData={relatedQueries.rising}
            dataType="queries"
          />
        )}
        {relatedTopics && (
          <RelatedDataSection
            title="Related Topics"
            topData={relatedTopics.top}
            risingData={relatedTopics.rising}
            dataType="topics"
          />
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
  timeRange: TimeRange;
}

export function KeywordResults({
  processedKeywords,
  viewMode,
  isExpanding,
  rowSelection,
  setRowSelection,
  onFetchTrends,
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

        // Only log for seed keywords to reduce noise
        if (row.original.source === 'seed') {
          console.log(`🖥️ UI Debug - Geo for "${row.original.keyword}":`, {
            geo: geo,
            source: row.original.source,
            hasInterestByRegion: !!row.original.interestByRegion,
            interestByRegionLength: row.original.interestByRegion?.length || 0,
          });
        }

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
