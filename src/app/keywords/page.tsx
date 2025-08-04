'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { CollectedKeyword, GscPeriodUnit } from '@/types/keywords';
import { STORAGE_KEYS, MAX_KEYWORDS } from './constants';
import { createKeywordHandler } from '@/lib/utils';
import { useUrlManagement, useKeywordManagement, useSorting } from '@/hooks';
import {
  UrlInputSection,
  DataSourcesSection,
  KeywordSelectionTable,
} from '../../components/keyword';

export default function SeedKeywordsPage() {
  const router = useRouter();
  const [websiteUrl, setWebsiteUrl] = useState(''); // For GSC only
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

  // Use custom hooks
  const { recentWebUrls, recentNotionUrls, addUrlToRecent, removeUrl } =
    useUrlManagement();

  // Wrapper for URL removal
  const removeNotionUrl = (url: string) => removeUrl(url, 'notion');
  const removeWebUrl = (url: string) => removeUrl(url, 'web');
  const keywordManagement = useKeywordManagement(collectedKeywords);
  const {
    getKeywordTrend,
    handleSelectAll,
    handleSelectRow,
    handleSelectByTrend,
    isTrendSelected,
    hasTrend,
    selectedCount,
    allSelected,
  } = keywordManagement;
  const { sortConfig, handleSort, sortedKeywords } = useSorting(
    collectedKeywords,
    getKeywordTrend
  );

  const handleCollectKeywords = async () => {
    addUrlToRecent(notionUrl, 'notion');

    // Store URLs for later use in brief generation
    if (notionUrl) sessionStorage.setItem('notionUrl', notionUrl);

    setIsLoading(true);
    try {
      const response = await fetch('/api/keywords/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notionUrl,
          manualKeywords: manualKeywords.join('\n'),
          excludeKeywords: excludeKeywords.join('\n'),
          useContainsExclusion,
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
    addUrlToRecent(notionUrl, 'notion');

    // Store URLs for later use in brief generation
    if (notionUrl) sessionStorage.setItem('notionUrl', notionUrl);

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

  const handleRemoveManualKeyword = (keywordToRemove: string) => {
    setManualKeywords(manualKeywords.filter((k) => k !== keywordToRemove));
  };

  const handleRemoveExcludeKeyword = (keywordToRemove: string) => {
    setExcludeKeywords(excludeKeywords.filter((k) => k !== keywordToRemove));
  };

  // Use the generic keyword handler
  const handleManualKeywordKeyDown = createKeywordHandler(
    currentManualKeyword,
    manualKeywords,
    setManualKeywords,
    setCurrentManualKeyword,
    handleRemoveManualKeyword
  );

  const handleExcludeKeywordKeyDown = createKeywordHandler(
    currentExcludeKeyword,
    excludeKeywords,
    setExcludeKeywords,
    setCurrentExcludeKeyword,
    handleRemoveExcludeKeyword
  );

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
          <UrlInputSection
            notionUrl={notionUrl}
            setNotionUrl={setNotionUrl}
            recentNotionUrls={recentNotionUrls}
            removeUrl={removeNotionUrl}
          />

          <DataSourcesSection
            gscPeriodValue={gscPeriodValue}
            setGscPeriodValue={setGscPeriodValue}
            gscPeriodUnit={gscPeriodUnit}
            setGscPeriodUnit={setGscPeriodUnit}
            gscCountry={gscCountry}
            setGscCountry={setGscCountry}
            handleImportFromGsc={handleImportFromGsc}
            isGscLoading={isGscLoading}
            websiteUrl={websiteUrl}
            setWebsiteUrl={setWebsiteUrl}
            recentWebUrls={recentWebUrls}
            removeWebUrl={removeWebUrl}
            keywordInputProps={{
              manualKeywords,
              currentManualKeyword,
              setCurrentManualKeyword,
              handleManualKeywordKeyDown,
              handleRemoveManualKeyword,
              excludeKeywords,
              currentExcludeKeyword,
              setCurrentExcludeKeyword,
              handleExcludeKeywordKeyDown,
              handleRemoveExcludeKeyword,
              useContainsExclusion,
              setUseContainsExclusion,
            }}
          />

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
          <KeywordSelectionTable
            isLoading={isLoading}
            selectedCount={selectedCount}
            collectedKeywords={collectedKeywords}
            isTrendSelected={isTrendSelected}
            handleSelectByTrend={handleSelectByTrend}
            hasTrend={hasTrend}
            setCollectedKeywords={setCollectedKeywords}
            handleSelectAll={handleSelectAll}
            allSelected={allSelected}
            sortConfig={sortConfig}
            handleSort={handleSort}
            sortedKeywords={sortedKeywords}
            handleSelectRow={handleSelectRow}
            getKeywordTrend={getKeywordTrend}
          />
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
                STORAGE_KEYS.SELECTED_KEYWORDS,
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
