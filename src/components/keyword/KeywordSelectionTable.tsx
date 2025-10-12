import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  MinusCircle,
  Loader2,
} from 'lucide-react';
import type {
  CollectedKeyword,
  SortConfig,
  SortableKey,
  TrendType,
  GscPeriodUnit,
} from '@/types/keywords';
import { MAX_KEYWORDS, TREND_CONFIGS } from '../../app/keywords/constants';

interface KeywordSelectionTableProps {
  isLoading: boolean;
  selectedCount: number;
  collectedKeywords: CollectedKeyword[];
  isTrendSelected: (trend: TrendType) => boolean;
  handleSelectByTrend: (
    trend: TrendType,
    setCollectedKeywords: React.Dispatch<
      React.SetStateAction<CollectedKeyword[]>
    >
  ) => void;
  hasTrend: (trend: TrendType) => boolean;
  setCollectedKeywords: React.Dispatch<
    React.SetStateAction<CollectedKeyword[]>
  >;
  handleSelectAll: (
    checked: boolean,
    setCollectedKeywords: React.Dispatch<
      React.SetStateAction<CollectedKeyword[]>
    >
  ) => void;
  allSelected: boolean;
  sortConfig: SortConfig | null;
  handleSort: (key: SortableKey) => void;
  sortedKeywords: CollectedKeyword[];
  handleSelectRow: (
    keyword: string,
    checked: boolean,
    setCollectedKeywords: React.Dispatch<
      React.SetStateAction<CollectedKeyword[]>
    >
  ) => void;
  getKeywordTrend: (k: CollectedKeyword) => string;
  // Summary inputs
  websiteUrl?: string;
  gscPeriodUnit?: GscPeriodUnit;
  gscPeriodValue?: number;
  gscCountry?: string;
  manualKeywordsCount?: number;
  excludeKeywordsCount?: number;
  useContainsExclusion?: boolean;
}

const SortIndicator = ({
  columnKey,
  sortConfig,
}: {
  columnKey: SortableKey;
  sortConfig: SortConfig | null;
}) => {
  if (!sortConfig || sortConfig.key !== columnKey) {
    return <ArrowUpDown className="inline-block ml-1 w-4 h-4 opacity-20" />;
  }
  if (sortConfig.direction === 'asc') {
    return <ArrowUp className="inline-block ml-1 w-4 h-4" />;
  }
  return <ArrowDown className="inline-block ml-1 w-4 h-4" />;
};

const TrendIndicator = ({ trend }: { trend: CollectedKeyword['trend'] }) => {
  switch (trend) {
    case 'rising':
      return (
        <div className="flex gap-1 items-center text-green-600">
          <TrendingUp /> <span>Rising</span>
        </div>
      );
    case 'falling':
      return (
        <div className="flex gap-1 items-center text-red-600">
          <TrendingDown /> <span>Falling</span>
        </div>
      );
    case 'new':
      return (
        <div className="flex gap-1 items-center text-blue-600">
          <Sparkles /> <span>New</span>
        </div>
      );
    default:
      return (
        <div className="flex gap-1 items-center text-muted-foreground">
          <Minus /> <span>Stable</span>
        </div>
      );
  }
};

export const KeywordSelectionTable = ({
  isLoading,
  selectedCount,
  collectedKeywords,
  isTrendSelected,
  handleSelectByTrend,
  hasTrend,
  setCollectedKeywords,
  handleSelectAll,
  allSelected,
  sortConfig,
  handleSort,
  sortedKeywords,
  handleSelectRow,
  getKeywordTrend,
  websiteUrl,
  gscPeriodUnit = 'month',
  gscPeriodValue = 1,
  gscCountry = 'all',
  manualKeywordsCount = 0,
  excludeKeywordsCount = 0,
  useContainsExclusion = false,
}: KeywordSelectionTableProps) => {
  const hasGscData = collectedKeywords.some((k) => k.source === 'GSC');

  const formatPeriod = () => {
    const now = new Date();
    const end = now;
    const start = new Date(now);
    if (gscPeriodUnit === 'day') {
      start.setDate(now.getDate() - (gscPeriodValue || 1) + 1);
      return `${start.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })} – ${end.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}`;
    }
    if (gscPeriodUnit === 'year') {
      start.setFullYear(now.getFullYear() - (gscPeriodValue || 1));
      return `${start.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })} – ${end.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })}`;
    }
    // month (default)
    start.setMonth(now.getMonth() - (gscPeriodValue || 1));
    start.setDate(1);
    return `${start.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    })} – ${end.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    })}`;
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Seed Keyword Selection</CardTitle>
          <CardDescription>
            Select up to {MAX_KEYWORDS} seed keywords to proceed. (
            {selectedCount}/{collectedKeywords.length} selected)
            {selectedCount > MAX_KEYWORDS && (
              <span className="ml-2 text-destructive">
                (Limit: {MAX_KEYWORDS} keywords)
              </span>
            )}
          </CardDescription>
          {hasGscData && (
            <div className="mt-3">
              <div className="mb-1 text-sm font-medium text-foreground">
                Data Summary
              </div>
              <ul className="grid grid-cols-1 gap-y-1 gap-x-6 p-0 text-sm list-none sm:grid-cols-2 text-muted-foreground">
                <li>
                  <span className="font-medium text-foreground">Source:</span>{' '}
                  Google Search Console
                </li>
                {websiteUrl && (
                  <li>
                    <span className="font-medium text-foreground">
                      Property:
                    </span>{' '}
                    {websiteUrl}
                  </li>
                )}
                <li>
                  <span className="font-medium text-foreground">Period:</span>{' '}
                  {formatPeriod()}
                </li>
                <li>
                  <span className="font-medium text-foreground">Country:</span>{' '}
                  {gscCountry === 'all' ? 'All' : gscCountry.toUpperCase()}
                </li>
                <li>
                  <span className="font-medium text-foreground">
                    Manual Seeds:
                  </span>{' '}
                  {manualKeywordsCount > 0
                    ? `Included (${manualKeywordsCount})`
                    : 'Not included'}
                </li>
                <li>
                  <span className="font-medium text-foreground">
                    Exclude Keywords:
                  </span>{' '}
                  {excludeKeywordsCount > 0
                    ? `Applied (${excludeKeywordsCount})${
                        useContainsExclusion
                          ? ' · Contains match'
                          : ' · Exact match'
                      }`
                    : 'Not applied'}
                </li>
              </ul>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-4 justify-center items-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-lg font-semibold text-muted-foreground">
              Collecting Keywords...
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 items-center mb-4">
              <span className="mr-2 text-sm font-medium">Quick Select:</span>
              {TREND_CONFIGS.map(({ type, icon: Icon, label }) => (
                <Button
                  key={type}
                  variant={isTrendSelected(type) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    handleSelectByTrend(type, setCollectedKeywords)
                  }
                  disabled={!hasTrend(type)}
                >
                  <Icon className="mr-2 w-4 h-4" />
                  {label}
                </Button>
              ))}
              {selectedCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectAll(false, setCollectedKeywords)}
                  className="text-destructive hover:text-destructive"
                >
                  <MinusCircle className="mr-2 w-4 h-4" />
                  Deselect All
                </Button>
              )}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(checked) =>
                        handleSelectAll(!!checked, setCollectedKeywords)
                      }
                    />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort('keyword')}
                  >
                    Keyword{' '}
                    <SortIndicator
                      columnKey="keyword"
                      sortConfig={sortConfig}
                    />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort('source')}
                  >
                    Source{' '}
                    <SortIndicator columnKey="source" sortConfig={sortConfig} />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort('clicks')}
                  >
                    Clicks{' '}
                    <SortIndicator columnKey="clicks" sortConfig={sortConfig} />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort('impressions')}
                  >
                    Impressions{' '}
                    <SortIndicator
                      columnKey="impressions"
                      sortConfig={sortConfig}
                    />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort('trend')}
                  >
                    Trend{' '}
                    <SortIndicator columnKey="trend" sortConfig={sortConfig} />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedKeywords.map((item) => (
                  <TableRow key={item.keyword}>
                    <TableCell>
                      <Checkbox
                        checked={item.selected}
                        onCheckedChange={(checked) =>
                          handleSelectRow(
                            item.keyword,
                            !!checked,
                            setCollectedKeywords
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.keyword}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.source === 'GSC' ? 'default' : 'secondary'
                        }
                      >
                        {item.source}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.clicks?.toLocaleString()}</TableCell>
                    <TableCell>{item.impressions?.toLocaleString()}</TableCell>
                    <TableCell>
                      <TrendIndicator trend={item.trend} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
};
