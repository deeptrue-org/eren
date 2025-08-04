'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import {
  SettingsPanel,
  ActionButtons,
  KeywordResults,
  ErrorDisplay,
  BrowserConnectionDialog,
  SeedKeywordsList,
} from '@/components/expand';
import { useKeywordExpansion } from '@/hooks/use-keyword-expansion';
import { ExpandedKeyword } from '@/lib/keyword-expansion/types';
import { RowSelectionState } from '@tanstack/react-table';
import { ViewMode } from '@/components/expand/types';
import { TimeRange } from '@/lib/keyword-expansion/serpapi-service';
import { ArrowLeft } from 'lucide-react';

interface SerpApiAccount {
  total_searches_left: number;
  plan_searches_left: number;
  api_key: string;
}

function ExpandKeywordsPageComponent() {
  const {
    isExpanding,
    error,
    expandedKeywords,
    startExpansion,
    stopExpansion,
    onFetchTrends,
    onFetchSerpApiFullData,
  } = useKeywordExpansion();

  const [seedKeywords, setSeedKeywords] = useState<string[]>(['netflix']);
  const [selectedSeedKeywords, setSelectedSeedKeywords] = useState<string[]>(
    []
  );
  const [selectedCountry, setSelectedCountry] = useState<string>('WW');
  const [apiSource, setApiSource] = useState('trends'); // 'trends' or 'serpapi'
  const [timeRange, setTimeRange] = useState<TimeRange>('today 3-m');
  const [showBrowserDialog, setShowBrowserDialog] = useState(false);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [serpApiAccount, setSerpApiAccount] = useState<SerpApiAccount | null>(
    null
  );

  const router = useRouter();

  useEffect(() => {
    const savedKeywords = sessionStorage.getItem('selectedKeywords');
    console.log('🔍 Saved keywords from sessionStorage:', savedKeywords);

    if (savedKeywords) {
      const parsed = JSON.parse(savedKeywords);
      console.log('📝 Parsed keywords:', parsed);
      setSeedKeywords(parsed);
      setSelectedSeedKeywords(parsed); // Set selected keywords as well
    } else {
      // No saved keywords, use default and select them
      console.log('🎯 No saved keywords, using default: netflix');
      setSelectedSeedKeywords(['netflix']); // Auto-select the default keyword
    }

    const fetchSerpApiAccount = async () => {
      try {
        const response = await fetch('/api/serp/account');
        if (response.ok) {
          const data = await response.json();
          setSerpApiAccount(data);
        }
      } catch (error) {
        console.error('Failed to fetch SERP API account:', error);
      }
    };
    fetchSerpApiAccount();
  }, []);

  const handleStartAndConnect = async (browserInfo?: {
    debugPort?: number;
  }) => {
    setShowBrowserDialog(false);
    const apisToUse = apiSource === 'serpapi' ? ['serpapi'] : ['trends'];

    console.log('🚀 Starting expansion with params:', {
      selectedSeedKeywords,
      selectedCountry: [selectedCountry],
      apisToUse,
      useSerpApi: apiSource === 'serpapi',
      timeRange,
      browserInfo,
    });

    await startExpansion(
      selectedSeedKeywords,
      [selectedCountry],
      apisToUse,
      apiSource === 'serpapi',
      timeRange,
      browserInfo || {}
    );
  };

  const handleExpand = () => {
    console.log(
      '🚀 handleExpand called with selectedSeedKeywords:',
      JSON.stringify(selectedSeedKeywords)
    );
    console.log('🚀 selectedSeedKeywords length:', selectedSeedKeywords.length);
    console.log('🚀 selectedSeedKeywords content:', selectedSeedKeywords);

    if (selectedSeedKeywords.length === 0) {
      alert('Please select at least one keyword to expand.');
      return;
    }

    if (apiSource === 'serpapi') {
      // SERP API인 경우 브라우저 연결 없이 바로 실행
      console.log('🔌 Starting SERP API expansion...');
      handleStartAndConnect({});
    } else {
      // Google Trends인 경우 브라우저 연결 다이얼로그 표시
      console.log('📈 Opening browser connection dialog for Google Trends...');
      setShowBrowserDialog(true);
    }
  };

  const processedKeywords = useMemo((): ExpandedKeyword[] => {
    if (!expandedKeywords || typeof expandedKeywords !== 'object') {
      return [];
    }

    console.log('🔄 Processing expandedKeywords:', expandedKeywords);

    const processed = Object.entries(expandedKeywords)
      .flatMap(([language, keywords]) =>
        Array.isArray(keywords)
          ? keywords.map((keyword) => {
              const processedKeyword = {
                ...keyword,
                lang: language,
              };

              console.log(`📋 Processed keyword "${keyword.keyword}":`, {
                timeRange: processedKeyword.timeRange,
                geo: processedKeyword.geo,
                source: processedKeyword.source,
                hasInterestByRegion: !!processedKeyword.interestByRegion,
              });

              return processedKeyword;
            })
          : []
      )
      .sort((a, b) => (b.volume || 0) - (a.volume || 0));

    console.log(`📊 Final processed keywords count: ${processed.length}`);
    return processed;
  }, [expandedKeywords]);

  const selectedKeywordsForBriefs = useMemo(() => {
    return processedKeywords
      .filter((_, index) => rowSelection[index])
      .map((k) => k.keyword);
  }, [rowSelection, processedKeywords]);

  const handleCreateContentBriefs = () => {
    if (selectedKeywordsForBriefs.length === 0) {
      alert('Please select at least one keyword.');
      return;
    }
    const query = new URLSearchParams({
      keywords: JSON.stringify(selectedKeywordsForBriefs),
    }).toString();
    router.push(`/content/briefs?${query}`);
  };

  const handleApiSourceChange = (source: string) => {
    // When switching away from SERP API, reset country and time range
    if (apiSource === 'serpapi' && source !== 'serpapi') {
      setSelectedCountry('WW');
      setTimeRange('today 3-m');
    }
    setApiSource(source);
  };

  return (
    <div className="container px-4 py-8 pb-32 mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Keyword Expansion
          </h1>
          <p className="text-muted-foreground">
            Discover new opportunities from your seed keywords.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-8 items-start lg:grid-cols-3">
        <div className="sticky top-8 space-y-6 lg:col-span-1">
          <SeedKeywordsList
            seedKeywords={seedKeywords}
            selectedKeywords={selectedSeedKeywords}
            setSelectedKeywords={setSelectedSeedKeywords}
            selectedCountry={selectedCountry}
            onCountryChange={setSelectedCountry}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            apiSource={apiSource}
          />
          <SettingsPanel
            apiSource={apiSource}
            onApiSourceChange={handleApiSourceChange}
            serpApiAccount={serpApiAccount}
          />
          <ActionButtons
            isExpanding={isExpanding}
            selectedKeywords={selectedSeedKeywords}
            selectedApis={[apiSource]}
            onExpand={handleExpand}
            onStop={stopExpansion}
          />
        </div>
        <div className="space-y-6 lg:col-span-2">
          <ErrorDisplay error={error} />
          <KeywordResults
            processedKeywords={processedKeywords}
            viewMode={viewMode}
            isExpanding={isExpanding}
            rowSelection={rowSelection}
            setRowSelection={setRowSelection}
            onFetchTrends={onFetchTrends}
            onFetchSerpApiFullData={onFetchSerpApiFullData}
            timeRange={timeRange}
          />
        </div>
      </div>
      <div className="fixed right-0 bottom-0 left-0 z-20 p-4 border-t backdrop-blur-sm bg-background/80">
        <div className="container flex gap-4 justify-between items-center mx-auto">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back
          </Button>
          <Button
            size="lg"
            disabled={isExpanding || selectedKeywordsForBriefs.length === 0}
            onClick={handleCreateContentBriefs}
          >
            Next: Create Briefs ({selectedKeywordsForBriefs.length} selected) →
          </Button>
        </div>
      </div>
      <BrowserConnectionDialog
        open={showBrowserDialog}
        onOpenChange={setShowBrowserDialog}
        onConnect={handleStartAndConnect}
        isConnecting={isExpanding}
      />
    </div>
  );
}
export default ExpandKeywordsPageComponent;
