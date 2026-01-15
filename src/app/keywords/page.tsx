'use client';

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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  MinusCircle,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

const countryList = [
  { code: 'all', name: 'All Countries' },
  { code: 'usa', name: 'United States' },
  { code: 'kor', name: 'South Korea' },
  { code: 'jpn', name: 'Japan' },
  { code: 'chn', name: 'China' },
  { code: 'deu', name: 'Germany' },
  { code: 'fra', name: 'France' },
  { code: 'gbr', name: 'United Kingdom' },
  { code: 'ind', name: 'India' },
  { code: 'bra', name: 'Brazil' },
  { code: 'can', name: 'Canada' },
  { code: 'rus', name: 'Russia' },
];

type SortableKey = 'keyword' | 'source' | 'clicks' | 'impressions' | 'trend';
interface SortConfig {
  key: SortableKey;
  direction: 'asc' | 'desc';
}

type KeywordSource = 'GSC' | 'Manual' | 'URL';

interface CollectedKeyword {
  keyword: string;
  source: KeywordSource;
  selected: boolean;
  clicks?: number;
  impressions?: number;
  trend?: 'rising' | 'falling' | 'stable' | 'new';
}

type GscPeriodUnit = 'day' | 'month' | 'year';

const getUrlLabel = (url: string): string => {
  if (!url || typeof url !== 'string') return '';
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `http://${url}`);

    if (urlObj.hostname.endsWith('notion.so')) {
      const pathParts = urlObj.pathname.split('/').filter((p) => p);
      const lastPart = pathParts[pathParts.length - 1];

      if (lastPart) {
        const lastHyphenIndex = lastPart.lastIndexOf('-');
        if (lastHyphenIndex > 0) {
          const potentialId = lastPart.substring(lastHyphenIndex + 1);
          if (
            potentialId &&
            potentialId.length === 32 &&
            /^[0-9a-f]{32}$/i.test(potentialId)
          ) {
            return lastPart.substring(0, lastHyphenIndex);
          }
        }
      }
      return lastPart || urlObj.hostname;
    }

    return urlObj.hostname;
  } catch (e) {
    const cleanedUrl = url.replace(/^https?:\/\//, '');
    const firstPart = cleanedUrl.split('/')[0];
    return firstPart;
  }
};

export default function SeedKeywordsPage() {
  const router = useRouter();
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [notionUrl, setNotionUrl] = useState('');
  const [manualKeywords, setManualKeywords] = useState<string[]>([]);
  const [currentManualKeyword, setCurrentManualKeyword] = useState('');
  const [excludeKeywords, setExcludeKeywords] = useState<string[]>([]);
  const [currentExcludeKeyword, setCurrentExcludeKeyword] = useState('');
  const [useContainsExclusion, setUseContainsExclusion] = useState(false);
  const [collectedKeywords, setCollectedKeywords] = useState<
    CollectedKeyword[]
  >([]);
  const [gscPeriodUnit, setGscPeriodUnit] = useState<GscPeriodUnit>('month');
  const [gscPeriodValue, setGscPeriodValue] = useState(1);
  const [gscCountry, setGscCountry] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isGscLoading, setIsGscLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({
    key: 'trend',
    direction: 'desc',
  });
  const [recentWebUrls, setRecentWebUrls] = useState<string[]>([]);
  const [recentNotionUrls, setRecentNotionUrls] = useState<string[]>([]);

  // Load URLs from localStorage on initial render
  useEffect(() => {
    try {
      const storedWebUrls = localStorage.getItem('recentWebUrls');
      if (storedWebUrls) setRecentWebUrls(JSON.parse(storedWebUrls));
      const storedNotionUrls = localStorage.getItem('recentNotionUrls');
      if (storedNotionUrls) setRecentNotionUrls(JSON.parse(storedNotionUrls));
    } catch (error) {
      console.error('Failed to parse URLs from localStorage', error);
    }
  }, []);

  // Centralized function to update state and localStorage
  const updateRecentUrls = (
    updater: (prev: string[]) => string[],
    type: 'web' | 'notion'
  ) => {
    const key = type === 'web' ? 'recentWebUrls' : 'recentNotionUrls';
    const setter = type === 'web' ? setRecentWebUrls : setRecentNotionUrls;
    setter((prevUrls) => {
      const newUrls = updater(prevUrls);
      try {
        localStorage.setItem(key, JSON.stringify(newUrls));
      } catch (error) {
        console.error(
          `Failed to save URLs to localStorage for key: ${key}`,
          error
        );
      }
      return newUrls;
    });
  };

  const addUrlToRecent = (url: string, type: 'web' | 'notion') => {
    if (!url || !url.trim()) return;
    updateRecentUrls((prevUrls) => {
      if (prevUrls.includes(url)) return prevUrls;
      return [url, ...prevUrls].slice(0, 5);
    }, type);
  };

  const removeUrl = (urlToRemove: string, type: 'web' | 'notion') => {
    updateRecentUrls(
      (prevUrls) => prevUrls.filter((url) => url !== urlToRemove),
      type
    );
  };

  const handleCollectKeywords = async () => {
    addUrlToRecent(websiteUrl, 'web');
    addUrlToRecent(notionUrl, 'notion');
    setIsLoading(true);
    try {
      const response = await fetch('/api/keywords/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteUrl,
          notionUrl,
          manualKeywords: manualKeywords.join('\n'),
          excludeKeywords: excludeKeywords.join('\n'),
          useContainsExclusion,
          gscPeriodUnit,
          gscPeriodValue,
          gscCountry,
        }),
      });
      const data = await response.json();
      console.log(
        'API Response Data:',
        data.map((k: any) => ({ keyword: k.keyword, trend: k.trend }))
      );
      setCollectedKeywords(data.map((k: any) => ({ ...k, selected: true })));
    } catch (error) {
      console.error('Error collecting keywords:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportFromGsc = async () => {
    if (!websiteUrl) {
      alert('Please enter a website URL first.');
      return;
    }
    addUrlToRecent(websiteUrl, 'web');
    setIsGscLoading(true);
    try {
      const countryParam = gscCountry === 'all' ? '' : `&country=${gscCountry}`;
      const response = await fetch(
        `/api/keywords/gsc?url=${websiteUrl}&periodUnit=${gscPeriodUnit}&periodValue=${gscPeriodValue}${countryParam}`
      );
      const data = await response.json();
      setCollectedKeywords(data.map((k: any) => ({ ...k, selected: true })));
    } catch (error) {
      console.error('Error importing from GSC:', error);
    } finally {
      setIsGscLoading(false);
    }
  };

  const handleManualKeywordKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Enter' && currentManualKeyword.trim()) {
      e.preventDefault();
      const newKeyword = currentManualKeyword.trim();
      if (!manualKeywords.includes(newKeyword)) {
        setManualKeywords([...manualKeywords, newKeyword]);
      }
      setCurrentManualKeyword('');
    } else if (
      e.key === 'Backspace' &&
      !currentManualKeyword &&
      manualKeywords.length > 0
    ) {
      e.preventDefault();
      handleRemoveManualKeyword(manualKeywords[manualKeywords.length - 1]);
    }
  };

  const handleRemoveManualKeyword = (keywordToRemove: string) => {
    setManualKeywords(manualKeywords.filter((k) => k !== keywordToRemove));
  };

  const handleExcludeKeywordKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Enter' && currentExcludeKeyword.trim()) {
      e.preventDefault();
      const newKeyword = currentExcludeKeyword.trim();
      if (!excludeKeywords.includes(newKeyword)) {
        setExcludeKeywords([...excludeKeywords, newKeyword]);
      }
      setCurrentExcludeKeyword('');
    } else if (
      e.key === 'Backspace' &&
      !currentExcludeKeyword &&
      excludeKeywords.length > 0
    ) {
      e.preventDefault();
      handleRemoveExcludeKeyword(excludeKeywords[excludeKeywords.length - 1]);
    }
  };

  const handleRemoveExcludeKeyword = (keywordToRemove: string) => {
    setExcludeKeywords(excludeKeywords.filter((k) => k !== keywordToRemove));
  };

  const handleSort = (key: SortableKey) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === 'desc'
    ) {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const getKeywordTrend = (k: CollectedKeyword) =>
    k.trend?.trim().toLowerCase() || 'stable';

  const sortedKeywords = useMemo(() => {
    if (!sortConfig) return collectedKeywords;

    const trendOrder = {
      rising: 4,
      new: 3,
      stable: 2,
      falling: 1,
    };

    return [...collectedKeywords].sort((a, b) => {
      const { key, direction } = sortConfig;

      if (key === 'trend') {
        const aTrend = getKeywordTrend(a);
        const bTrend = getKeywordTrend(b);
        const aValue = trendOrder[aTrend as keyof typeof trendOrder];
        const bValue = trendOrder[bTrend as keyof typeof trendOrder];

        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
      }

      const aValue =
        a[key as keyof typeof a] ??
        (typeof a[key as keyof typeof a] === 'number' ? -1 : '');
      const bValue =
        b[key as keyof typeof b] ??
        (typeof b[key as keyof typeof b] === 'number' ? -1 : '');

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;

      return 0;
    });
  }, [collectedKeywords, sortConfig]);

  const handleSelectAll = (checked: boolean) => {
    setCollectedKeywords((prev) =>
      prev.map((k) => ({ ...k, selected: checked }))
    );
  };

  const handleSelectRow = (keyword: string, checked: boolean) => {
    setCollectedKeywords((prev) =>
      prev.map((k) => (k.keyword === keyword ? { ...k, selected: checked } : k))
    );
  };

  const handleSelectByTrend = (
    trendToSelect: 'rising' | 'new' | 'stable' | 'falling'
  ) => {
    const keywordsInTrend = collectedKeywords.filter(
      (k) => getKeywordTrend(k) === trendToSelect
    );
    if (keywordsInTrend.length === 0) return;

    const areAllInTrendSelected = keywordsInTrend.every((k) => k.selected);
    const newSelectedValue = !areAllInTrendSelected;

    setCollectedKeywords((prevKeywords) =>
      prevKeywords.map((k) =>
        getKeywordTrend(k) === trendToSelect
          ? { ...k, selected: newSelectedValue }
          : k
      )
    );
  };

  const isTrendSelected = (
    trend: 'rising' | 'new' | 'stable' | 'falling'
  ): boolean => {
    const keywordsInTrend = collectedKeywords.filter(
      (k) => getKeywordTrend(k) === trend
    );
    if (keywordsInTrend.length === 0) return false;
    return keywordsInTrend.every((k) => k.selected);
  };

  const hasTrend = (
    trend: 'rising' | 'new' | 'stable' | 'falling'
  ): boolean => {
    return collectedKeywords.some((k) => getKeywordTrend(k) === trend);
  };

  const selectedCount = collectedKeywords.filter((k) => k.selected).length;
  const allSelected =
    collectedKeywords.length > 0 && selectedCount === collectedKeywords.length;

  const MAX_KEYWORDS = 100;

  const SortIndicator = ({ columnKey }: { columnKey: SortableKey }) => {
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

  return (
    <div className="container py-8 pb-40 mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Keyword Strategy</h1>
        <p className="mt-2 text-muted-foreground">
          Step 1: Collect seed keywords to start your content strategy.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Inputs */}
        <div className="space-y-8 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Context Data</CardTitle>
              <CardDescription>
                Provide URLs for context extraction.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium">
                  Website URL
                </label>
                <Input
                  placeholder="https://your-website.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                />
                <div className="flex flex-wrap gap-1 mt-2">
                  {recentWebUrls.map((url) => (
                    <Badge
                      key={url}
                      variant="outline"
                      className="cursor-pointer group"
                      onClick={() => setWebsiteUrl(url)}
                    >
                      {getUrlLabel(url)}
                      <XCircle
                        className="ml-1 w-3 h-3 text-muted-foreground group-hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeUrl(url, 'web');
                        }}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium">
                  Notion URL (optional)
                </label>
                <Input
                  placeholder="https://notion.so/your-page"
                  value={notionUrl}
                  onChange={(e) => setNotionUrl(e.target.value)}
                />
                <div className="flex flex-wrap gap-1 mt-2">
                  {recentNotionUrls.map((url) => (
                    <Badge
                      key={url}
                      variant="outline"
                      className="cursor-pointer group"
                      onClick={() => setNotionUrl(url)}
                    >
                      {getUrlLabel(url)}
                      <XCircle
                        className="ml-1 w-3 h-3 text-muted-foreground group-hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeUrl(url, 'notion');
                        }}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Sources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <p className="font-medium">Google Search Console</p>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    value={gscPeriodValue}
                    onChange={(e) =>
                      setGscPeriodValue(parseInt(e.target.value, 10) || 1)
                    }
                    className="w-24"
                    min="1"
                  />
                  <Select
                    value={gscPeriodUnit}
                    onValueChange={(value: GscPeriodUnit) =>
                      setGscPeriodUnit(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Days</SelectItem>
                      <SelectItem value="month">Months</SelectItem>
                      <SelectItem value="year">Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select
                    value={gscCountry}
                    onValueChange={(value) => setGscCountry(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countryList.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  onClick={handleImportFromGsc}
                  disabled={isGscLoading || !websiteUrl}
                >
                  {isGscLoading
                    ? 'Importing...'
                    : 'Import from Google Search Console'}
                </Button>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Manual Seed Keywords
                </label>
                <div className="flex flex-wrap content-start items-center gap-2 p-2 border rounded-md min-h-[8rem] bg-background">
                  {manualKeywords.map((keyword) => (
                    <Badge key={keyword} variant="secondary" className="gap-1">
                      {keyword}
                      <XCircle
                        className="w-3 h-3 cursor-pointer hover:text-destructive"
                        onClick={() => handleRemoveManualKeyword(keyword)}
                      />
                    </Badge>
                  ))}
                  <Input
                    className="flex-grow h-auto p-0 bg-transparent border-0 shadow-none focus-visible:ring-0 min-w-[120px]"
                    placeholder="Type and press Enter"
                    value={currentManualKeyword}
                    onChange={(e) => setCurrentManualKeyword(e.target.value)}
                    onKeyDown={handleManualKeywordKeyDown}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Exclude Keywords
                </label>
                <div className="flex flex-wrap content-start items-center gap-2 p-2 border rounded-md min-h-[6rem] bg-background">
                  {excludeKeywords.map((keyword) => (
                    <Badge key={keyword} variant="secondary" className="gap-1">
                      {keyword}
                      <XCircle
                        className="w-3 h-3 cursor-pointer hover:text-destructive"
                        onClick={() => handleRemoveExcludeKeyword(keyword)}
                      />
                    </Badge>
                  ))}
                  <Input
                    className="flex-grow h-auto p-0 bg-transparent border-0 shadow-none focus-visible:ring-0 min-w-[120px]"
                    placeholder="Type and press Enter"
                    value={currentExcludeKeyword}
                    onChange={(e) => setCurrentExcludeKeyword(e.target.value)}
                    onKeyDown={handleExcludeKeywordKeyDown}
                  />
                </div>
                <div className="flex items-center mt-2 space-x-2">
                  <Checkbox
                    id="contains-exclusion"
                    checked={useContainsExclusion}
                    onCheckedChange={(checked) =>
                      setUseContainsExclusion(!!checked)
                    }
                  />
                  <label
                    htmlFor="contains-exclusion"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Use 'contains' matching for exclusions
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            size="lg"
            variant="default"
            className="w-full"
            onClick={handleCollectKeywords}
            disabled={isLoading}
          >
            {isLoading ? 'Collecting...' : 'Collect & Combine All Keywords'}
          </Button>
        </div>

        {/* Right Column: Keyword Selection */}
        <div className="lg:col-span-2">
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
                    <span className="mr-2 text-sm font-medium">
                      Quick Select:
                    </span>
                    <Button
                      variant={
                        isTrendSelected('rising') ? 'default' : 'outline'
                      }
                      size="sm"
                      onClick={() => handleSelectByTrend('rising')}
                      disabled={!hasTrend('rising')}
                    >
                      <TrendingUp className="mr-2 w-4 h-4" />
                      Rising
                    </Button>
                    <Button
                      variant={isTrendSelected('new') ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleSelectByTrend('new')}
                      disabled={!hasTrend('new')}
                    >
                      <Sparkles className="mr-2 w-4 h-4" />
                      New
                    </Button>
                    <Button
                      variant={
                        isTrendSelected('stable') ? 'default' : 'outline'
                      }
                      size="sm"
                      onClick={() => handleSelectByTrend('stable')}
                      disabled={!hasTrend('stable')}
                    >
                      <Minus className="mr-2 w-4 h-4" />
                      Stable
                    </Button>
                    <Button
                      variant={
                        isTrendSelected('falling') ? 'default' : 'outline'
                      }
                      size="sm"
                      onClick={() => handleSelectByTrend('falling')}
                      disabled={!hasTrend('falling')}
                    >
                      <TrendingDown className="mr-2 w-4 h-4" />
                      Falling
                    </Button>
                    {selectedCount > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectAll(false)}
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
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead
                          className="cursor-pointer"
                          onClick={() => handleSort('keyword')}
                        >
                          Keyword <SortIndicator columnKey="keyword" />
                        </TableHead>
                        <TableHead
                          className="cursor-pointer"
                          onClick={() => handleSort('source')}
                        >
                          Source <SortIndicator columnKey="source" />
                        </TableHead>
                        <TableHead
                          className="cursor-pointer"
                          onClick={() => handleSort('clicks')}
                        >
                          Clicks <SortIndicator columnKey="clicks" />
                        </TableHead>
                        <TableHead
                          className="cursor-pointer"
                          onClick={() => handleSort('impressions')}
                        >
                          Impressions <SortIndicator columnKey="impressions" />
                        </TableHead>
                        <TableHead
                          className="cursor-pointer"
                          onClick={() => handleSort('trend')}
                        >
                          Trend <SortIndicator columnKey="trend" />
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
                                handleSelectRow(item.keyword, !!checked)
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
                          <TableCell>
                            {item.impressions?.toLocaleString()}
                          </TableCell>
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
        </div>
      </div>

      {/* Navigation */}
      <div className="fixed right-0 bottom-0 left-0 z-20 p-4 border-t backdrop-blur-sm bg-background/80">
        <div className="flex gap-4 justify-end items-center">
          {selectedCount > MAX_KEYWORDS && (
            <p className="text-sm text-destructive">
              Please select {MAX_KEYWORDS} or fewer keywords to continue.
            </p>
          )}
          <Button
            size="lg"
            disabled={selectedCount === 0 || selectedCount > MAX_KEYWORDS}
            onClick={() => {
              const keywordsToExpand = collectedKeywords
                .filter((k) => k.selected)
                .map((k) => k.keyword);
              sessionStorage.setItem(
                'selectedKeywords',
                JSON.stringify(keywordsToExpand)
              );
              router.push('/keywords/expand');
            }}
          >
            Next: Expand Keywords →
          </Button>
        </div>
      </div>
    </div>
  );
}
