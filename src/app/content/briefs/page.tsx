'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ContentBrief } from '@/lib/types';
import { ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import {
  BriefsStartScreen,
  BriefsStats,
  BriefKeywordSection,
  RealTimeLogs,
} from '@/components/content';

type BriefsData = Record<string, ContentBrief[]>;

function BriefsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [briefs, setBriefs] = useState<BriefsData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBrief, setSelectedBrief] = useState<ContentBrief | null>(null);
  const [logs, setLogs] = useState<{ message: string; timestamp: string }[]>(
    []
  );
  const [hasStarted, setHasStarted] = useState(false);
  const [generationMode, setGenerationMode] = useState<'ai' | 'fixed'>('ai');

  const keywords = useMemo(() => {
    const keywordsParam = searchParams.get('keywords');
    if (keywordsParam) {
      try {
        return JSON.parse(keywordsParam);
      } catch (e) {
        console.error('❌ Failed to parse keywords:', e);
        setError('Invalid keywords format in URL.');
        return [];
      }
    }
    return [];
  }, [searchParams]);

  const generateBriefs = async (mode: 'ai' | 'fixed', forceRestart = false) => {
    if (isLoading && !forceRestart) return;
    // Do not return if briefs already exist when forceRestart is true
    if (!forceRestart && Object.keys(briefs).length > 0) return;

    setIsLoading(true);
    setError(null);
    setLogs([]);
    setHasStarted(true);
    // Store loading state in sessionStorage for navigation button
    sessionStorage.setItem('isBriefsLoading', 'true');
    console.log(`🚀 Starting brief generation in ${mode} mode...`);

    try {
      let keywordExpansionData = null;
      try {
        const expansionDataStr = sessionStorage.getItem(
          'keywordExpansionResults'
        );
        if (expansionDataStr)
          keywordExpansionData = JSON.parse(expansionDataStr);
      } catch (e) {
        console.warn('Failed to load keyword expansion data:', e);
      }

      let gscData = null;
      try {
        const gscDataStr =
          sessionStorage.getItem('gscData') ||
          sessionStorage.getItem('deeptrueData');
        if (gscDataStr) gscData = JSON.parse(gscDataStr);
      } catch (e) {
        console.warn('Failed to load GSC data:', e);
      }

      // Get notion URL from sessionStorage
      let notionUrl = null;
      try {
        notionUrl = sessionStorage.getItem('notionUrl');
      } catch (e) {
        console.warn('Failed to load notion URL:', e);
      }

      const requestBody = {
        keywords,
        stream: true,
        keywordExpansionData,
        gscData,
        generationMode: mode, // Pass the mode from argument
        notionUrl,
      };

      console.log('📤 Sending request with mode:', mode);

      const response = await fetch('/api/content/briefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate content briefs');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No response body');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((line) => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'log') {
                setLogs((prev) => [
                  ...prev,
                  { message: data.message, timestamp: data.timestamp },
                ]);
              } else if (data.type === 'complete') {
                setBriefs(data.results);
                break;
              } else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch (parseError) {
              console.error('Failed to parse SSE data:', parseError);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error generating briefs:', err);
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred'
      );
    } finally {
      setIsLoading(false);
      // Clear loading state from sessionStorage
      sessionStorage.removeItem('isBriefsLoading');
    }
  };

  const totalBriefs = Object.values(briefs).reduce(
    (sum, briefList) => sum + briefList.length,
    0
  );

  const getSelectedCountForKeyword = (keyword: string) => {
    const keywordBriefs = briefs[keyword] || [];
    return keywordBriefs.some((brief) => brief.id === selectedBrief?.id)
      ? 1
      : 0;
  };

  const isBriefSelected = (briefId: string) => {
    return selectedBrief?.id === briefId;
  };

  const handleSelectBrief = (brief: ContentBrief) => {
    const newSelection = selectedBrief?.id === brief.id ? null : brief;
    setSelectedBrief(newSelection);
    sessionStorage.setItem('selectedBrief', JSON.stringify(newSelection));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Low':
        return 'bg-green-100 text-green-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'High':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <div className="space-y-8">
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                Generating Content Briefs...
              </h3>
              <p className="text-muted-foreground">
                Creating detailed briefs for your keywords
              </p>
            </div>
          </div>

          {/* Real-time logs */}
          <div className="mx-auto max-w-2xl">
            <RealTimeLogs
              logs={logs}
              isActive={isLoading}
              title="Brief Generation Progress"
            />
          </div>
        </div>
      </div>
    );
  }

  if (!isLoading && Object.keys(briefs).length === 0 && keywords.length > 0) {
    return (
      <BriefsStartScreen
        keywords={keywords}
        isLoading={isLoading}
        onStartGeneration={generateBriefs}
        hasExistingBriefs={Object.keys(briefs).length > 0}
        generationMode={generationMode}
        setGenerationMode={setGenerationMode}
      />
    );
  }

  if (error) {
    return (
      <Card className="text-center">
        <CardContent className="pt-6">
          <div className="mb-4 text-lg font-semibold text-destructive">
            Error: {error}
          </div>
          <div className="space-x-2">
            <Button
              onClick={() => {
                setError(null);
                generateBriefs(generationMode, true); // Use true for forceRestart
              }}
            >
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setError(null);
                setBriefs({});
                setHasStarted(false);
              }}
            >
              Back to Start
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Summary */}
      <BriefsStats
        keywordsCount={keywords.length}
        totalBriefs={totalBriefs}
        selectedBriefs={selectedBrief ? 1 : 0}
      />

      {/* Content Briefs by Keyword */}
      {Object.entries(briefs).map(([keyword, briefList]) => (
        <BriefKeywordSection
          key={keyword}
          keyword={keyword}
          briefList={briefList}
          getSelectedCountForKeyword={getSelectedCountForKeyword}
          isBriefSelected={isBriefSelected}
          handleSelectBrief={handleSelectBrief}
          getDifficultyColor={getDifficultyColor}
        />
      ))}
    </div>
  );
}

export default function BriefsPage() {
  const router = useRouter();
  const [selectedBriefs, setSelectedBriefs] = useState<ContentBrief[]>([]);

  // Load selected briefs from state
  useEffect(() => {
    const handleBriefsUpdate = () => {
      // This will be managed by the child component
    };
    handleBriefsUpdate();
  }, []);

  return (
    <Suspense
      fallback={
        <div className="container px-4 py-8 mx-auto">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </div>
      }
    >
      <div className="container px-4 py-8 pb-32 mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Content Briefs</h1>
          <p className="mt-2 text-muted-foreground">
            Step 2: Select target audiences, search intents, and topics to
            generate content outlines.
          </p>
        </div>

        <BriefsPageContent />

        {/* Fixed Footer Navigation */}
        <div className="fixed right-0 bottom-0 left-0 z-20 p-4 border-t backdrop-blur-sm bg-background/80">
          <div className="container flex gap-4 justify-between items-center mx-auto">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 w-4 h-4" />
              Back to Keywords
            </Button>
            <BriefsNavigationButton />
          </div>
        </div>
      </div>
    </Suspense>
  );
}

// Separate component to handle navigation with selected brief
function BriefsNavigationButton() {
  const router = useRouter();
  const [selectedBrief, setSelectedBrief] = useState<ContentBrief | null>(null);
  const [isBriefsLoading, setIsBriefsLoading] = useState(false);

  useEffect(() => {
    // This is a simple approach - in a real app you'd use context or state management
    const interval = setInterval(() => {
      const stored = sessionStorage.getItem('selectedBrief');
      if (stored) {
        try {
          const brief = JSON.parse(stored);
          setSelectedBrief(brief);
        } catch (e) {
          console.error('Failed to parse selected brief');
        }
      } else {
        setSelectedBrief(null);
      }

      // Check loading state
      const loadingState = sessionStorage.getItem('isBriefsLoading');
      setIsBriefsLoading(loadingState === 'true');
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handleCreateOutlines = () => {
    if (!selectedBrief) {
      alert('Please select a content brief.');
      return;
    }

    router.push('/content/outlines');
  };

  return (
    <Button
      size="lg"
      disabled={!selectedBrief || isBriefsLoading}
      onClick={handleCreateOutlines}
    >
      {isBriefsLoading ? (
        <>
          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
          Generating Briefs...
        </>
      ) : (
        <>
          Next: Create Outlines {selectedBrief ? '(1 selected)' : ''}
          <ArrowRight className="ml-2 w-4 h-4" />
        </>
      )}
    </Button>
  );
}
