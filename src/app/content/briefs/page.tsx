'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ContentBrief } from '@/lib/types';
import { ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import {
  BriefsStartScreen,
  BriefsLoadingState,
  BriefsErrorState,
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
  const [processingKeyword, setProcessingKeyword] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [logs, setLogs] = useState<{ message: string; timestamp: string }[]>(
    []
  );
  const [canForceRestart, setCanForceRestart] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const keywords = useMemo(() => {
    const keywordsParam = searchParams.get('keywords');
    console.log('🔍 Keywords param from URL:', keywordsParam);

    if (keywordsParam) {
      try {
        const parsed = JSON.parse(keywordsParam);
        console.log('✅ Parsed keywords:', parsed);
        return parsed;
      } catch (e) {
        console.error('❌ Failed to parse keywords:', e);
        setError('Invalid keywords format in URL.');
        return [];
      }
    }
    console.log('⚠️ No keywords param found');
    return [];
  }, [searchParams]);

  const generateBriefs = async (forceRestart = false) => {
    // Prevent multiple simultaneous requests
    if (isLoading && !forceRestart) {
      console.log('🛑 Generation already in progress, ignoring request');
      return;
    }

    // Check if we already have complete results
    if (!forceRestart && Object.keys(briefs).length > 0) {
      console.log('🎉 Briefs already generated, no need to regenerate');
      return;
    }

    setIsLoading(true);
    setError(null);
    setLogs([]);
    setHasStarted(true);
    console.log('🚀 Starting brief generation...');

    try {
      const response = await fetch('/api/content/briefs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keywords, stream: true }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate content briefs');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

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
    }
  };

  // Check for existing results when page loads (but don't auto-start)
  useEffect(() => {
    if (keywords.length > 0 && Object.keys(briefs).length === 0) {
      console.log('🔍 Page loaded, checking for existing completed briefs...');

      // First try to restore session from sessionStorage
      const savedSessionId = sessionStorage.getItem('currentBriefSession');
      if (savedSessionId) {
        console.log(`🔄 Restoring session from storage: ${savedSessionId}`);
        setSessionId(savedSessionId);
        return; // pollProgress will start automatically via useEffect
      }

      // If no saved session, check for completed briefs
      fetch('/api/content/briefs')
        .then((res) => res.json())
        .then((data) => {
          if (data.results && Object.keys(data.results).length > 0) {
            console.log('🎉 Found existing briefs on page load:', data.results);
            setBriefs(data.results);
            setProgress(100);
            setIsLoading(false);
            setHasStarted(true);
          } else {
            console.log(
              'No existing briefs found, user can start generation manually'
            );
          }
        })
        .catch((err) => {
          console.log('No existing briefs found:', err);
        });
    }
  }, [keywords]);

  const handleSelectBrief = (brief: ContentBrief) => {
    const newSelection = selectedBrief?.id === brief.id ? null : brief;
    setSelectedBrief(newSelection);

    // Save to sessionStorage for cross-component communication
    sessionStorage.setItem('selectedBrief', JSON.stringify(newSelection));
  };

  // Single selection - no need for select all functionality
  const handleSelectAllForKeyword = (keyword: string, checked: boolean) => {
    // This function is not used in single selection mode
  };

  const isBriefSelected = (briefId: string) => {
    return selectedBrief?.id === briefId;
  };

  const isKeywordAllSelected = (keyword: string) => {
    // Not used in single selection mode
    return false;
  };

  const getSelectedCountForKeyword = (keyword: string) => {
    const keywordBriefs = briefs[keyword] || [];
    return keywordBriefs.some((brief) => brief.id === selectedBrief?.id)
      ? 1
      : 0;
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

  // Debug info
  console.log('🔧 Briefs page state:', {
    keywordsLength: keywords.length,
    keywords,
    isLoading,
    error,
    briefsCount: Object.keys(briefs).length,
  });

  // Show start screen when no briefs are generated yet and not loading
  if (!isLoading && Object.keys(briefs).length === 0 && keywords.length > 0) {
    return (
      <BriefsStartScreen
        keywords={keywords}
        isLoading={isLoading}
        onStartGeneration={() => generateBriefs()}
        hasExistingBriefs={Object.keys(briefs).length > 0}
      />
    );
  }

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
          <div className="max-w-2xl mx-auto">
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
                generateBriefs();
              }}
            >
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setError(null);
                setBriefs({});
              }}
            >
              Back to Start
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (keywords.length === 0) {
    return (
      <Card className="text-center">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="text-lg font-semibold text-muted-foreground">
              No Keywords Selected
            </div>
            <div className="text-sm text-muted-foreground">
              Please go back to the keyword expansion page and select keywords
              to generate content briefs.
            </div>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="mr-2 w-4 h-4" />
              Back to Keywords
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // This case should rarely happen now since we show the start screen instead
  if (
    Object.keys(briefs).length === 0 &&
    hasStarted &&
    !isLoading &&
    !error &&
    keywords.length > 0
  ) {
    return (
      <Card className="text-center">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="text-muted-foreground">
              No content briefs generated. Please try again.
            </div>
            <Button
              onClick={() => {
                setHasStarted(false);
                setError(null);
                setSessionId(null);
                setProgress(0);
                setLogs([]);
              }}
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalBriefs = Object.values(briefs).reduce(
    (sum, briefList) => sum + briefList.length,
    0
  );

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
              Back
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
    <Button size="lg" disabled={!selectedBrief} onClick={handleCreateOutlines}>
      Next: Generate Outlines {selectedBrief ? '(1 selected)' : ''} →
      <ArrowRight className="ml-2 w-4 h-4" />
    </Button>
  );
}
