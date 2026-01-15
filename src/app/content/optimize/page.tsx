'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BookOpen,
  Target,
} from 'lucide-react';

interface ContentOutline {
  id: string;
  briefId: string;
  keyword: string;
  title: string;
  totalWordCount: number;
  sections: any[];
  draft: string;
  internalNotes: string[];
}

interface OptimizationResult {
  seo: {
    overallScore: number;
    keywordDensity: {
      keyword: string;
      count: number;
      density: number;
      recommendation: string;
    };
    metaDescription: {
      length: number;
      isOptimal: boolean;
      recommendation: string;
    };
    titleTags: {
      h1Count: number;
      h2Count: number;
      h3Count: number;
      recommendation: string;
    };
    imageAltTags: {
      missingCount: number;
      suggestions: string[];
    };
    keywordPlacement: {
      inTitle: boolean;
      inFirstParagraph: boolean;
      inSubheadings: number;
      recommendation: string;
    };
  };
  factCheck: {
    verifiedCount: number;
    totalClaims: number;
    facts: {
      claim: string;
      isVerified: boolean;
      source?: string;
      confidence: number;
    }[];
    suggestions: {
      claim: string;
      suggestedSource: string;
      reason: string;
    }[];
  };
  readability: {
    clarityScore: number;
    sentenceLength: {
      average: number;
      isOptimal: boolean;
      recommendation: string;
    };
    passiveVoice: {
      count: number;
      percentage: number;
      suggestions: string[];
    };
    grammar: {
      errorCount: number;
      errors: {
        text: string;
        suggestion: string;
        position: number;
      }[];
    };
    tone: {
      detected: string;
      consistency: number;
      recommendation: string;
    };
    complexity: {
      score: number;
      recommendation: string;
    };
  };
  overallScore: number;
  suggestions: string[];
}

function OptimizePageContent() {
  const router = useRouter();
  const [outlines, setOutlines] = useState<ContentOutline[]>([]);
  const [currentDraft, setCurrentDraft] = useState<string>('');
  const [activeOutlineId, setActiveOutlineId] = useState<string>('');
  const [activeOutline, setActiveOutline] = useState<ContentOutline | null>(
    null
  );
  const [optimizationResult, setOptimizationResult] =
    useState<OptimizationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<{
    hasOpenAI: boolean;
    hasBingSearch: boolean;
    analysisMethod: string;
    factCheckMethod: string;
  } | null>(null);

  // Load data from outline page
  useEffect(() => {
    const loadOutlineData = () => {
      try {
        const outlinesData = sessionStorage.getItem('contentOutlines');
        const draftData = sessionStorage.getItem('currentDraft');
        const activeId = sessionStorage.getItem('activeOutlineId');

        if (outlinesData && draftData && activeId) {
          const parsedOutlines = JSON.parse(outlinesData) as ContentOutline[];
          setOutlines(parsedOutlines);
          setCurrentDraft(draftData);
          setActiveOutlineId(activeId);

          const active = parsedOutlines.find((o) => o.id === activeId);
          if (active) {
            setActiveOutline(active);
            // Automatically start analysis
            analyzeContent(draftData, active.keyword);
          }
          return true;
        }

        setError(
          'No content data found. Please go back to outlines and try again.'
        );
        return false;
      } catch (e) {
        console.error('Failed to load outline data:', e);
        setError('Failed to load content data. Please try again.');
        return false;
      }
    };

    if (loadOutlineData()) {
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, []);

  // Check API status on component mount
  useEffect(() => {
    const checkAPIStatus = async () => {
      try {
        const response = await fetch('/api/content/optimize', {
          method: 'GET',
        });

        if (response.ok) {
          const status = await response.json();
          setApiStatus({
            hasOpenAI: status.services.seo === 'GPT-enhanced',
            hasBingSearch: status.services.factCheck === 'search-verified',
            analysisMethod: status.services.seo,
            factCheckMethod: status.services.factCheck,
          });
        }
      } catch (error) {
        console.error('Failed to check API status:', error);
      }
    };

    checkAPIStatus();
  }, []);

  const analyzeContent = async (content: string, targetKeyword: string) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      console.log('🔍 Starting content analysis...');

      const response = await fetch('/api/content/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          targetKeyword,
          tone: 'professional',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze content');
      }

      const result: OptimizationResult = await response.json();
      setOptimizationResult(result);

      // Update API status from response headers
      const analysisMethod =
        response.headers.get('X-Analysis-Method') || 'Unknown';
      const factCheckMethod =
        response.headers.get('X-Fact-Check-Method') || 'Unknown';

      setApiStatus((prev) =>
        prev
          ? {
              ...prev,
              analysisMethod,
              factCheckMethod,
              hasOpenAI: analysisMethod === 'GPT-Enhanced',
              hasBingSearch: factCheckMethod === 'Search-Verified',
            }
          : null
      );

      console.log('✅ Analysis complete:', result);
    } catch (err) {
      console.error('❌ Error analyzing content:', err);
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDraftUpdate = (value: string) => {
    setCurrentDraft(value);
    // Auto-save
    sessionStorage.setItem('currentDraft', value);
  };

  const handleReanalyze = () => {
    if (activeOutline) {
      analyzeContent(currentDraft, activeOutline.keyword);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  if (isLoading) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="mb-4 text-lg font-semibold text-destructive">
              Error: {error}
            </div>
            <div className="space-x-2">
              <Button onClick={() => router.back()} variant="outline">
                Go Back
              </Button>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!activeOutline) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="mb-4 text-muted-foreground">
              No active content found. Please go back to outlines and select
              content to optimize.
            </div>
            <Button onClick={() => router.back()}>Back to Outlines</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 pb-32 mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Content Optimization & Validation
        </h1>
        <p className="mt-2 text-muted-foreground">
          Step 4: Analyze and optimize your content for SEO, accuracy, and
          readability.
        </p>

        {/* API Status Info */}
        {apiStatus && !apiStatus.hasOpenAI && (
          <Card className="mt-4 bg-yellow-50 border-yellow-200 dark:border-yellow-800 dark:bg-yellow-950">
            <CardContent className="pt-6">
              <div className="flex gap-3 items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div className="space-y-2">
                  <div className="font-medium text-yellow-800 dark:text-yellow-200">
                    Basic Analysis Mode
                  </div>
                  <div className="text-sm text-yellow-700 dark:text-yellow-300">
                    Using pattern-based analysis. For enhanced GPT-4 powered
                    insights, configure OpenAI API key.
                  </div>
                  <div className="text-xs text-yellow-600 dark:text-yellow-400">
                    Current: SEO ({apiStatus.analysisMethod}) • Fact Check (
                    {apiStatus.factCheckMethod})
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* GPT Active but Bing Missing Info */}
        {apiStatus && apiStatus.hasOpenAI && !apiStatus.hasBingSearch && (
          <Card className="mt-4 bg-blue-50 border-blue-200 dark:border-blue-800 dark:bg-blue-950">
            <CardContent className="pt-6">
              <div className="flex gap-3 items-start">
                <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="space-y-2">
                  <div className="font-medium text-blue-800 dark:text-blue-200">
                    GPT-4 Enhanced Analysis
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    Using GPT-4 for advanced SEO analysis. Fact-checking uses AI
                    estimation. For real web search verification, configure Bing
                    Search API key.
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">
                    Current: SEO ({apiStatus.analysisMethod}) • Fact Check (
                    {apiStatus.factCheckMethod})
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* API Status Success */}
        {apiStatus && apiStatus.hasOpenAI && apiStatus.hasBingSearch && (
          <Card className="mt-4 bg-green-50 border-green-200 dark:border-green-800 dark:bg-green-950">
            <CardContent className="pt-6">
              <div className="flex gap-3 items-start">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div className="space-y-2">
                  <div className="font-medium text-green-800 dark:text-green-200">
                    Enhanced Analysis Mode
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">
                    Using GPT-4 powered analysis and real web search
                    fact-checking for accurate results.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Active Content Info */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex gap-2 items-center">
            <Target className="w-5 h-5" />
            Optimizing: {activeOutline.keyword}
          </CardTitle>
          <CardDescription>
            {activeOutline.title} ({activeOutline.totalWordCount} words)
          </CardDescription>
        </CardHeader>
        {optimizationResult && (
          <CardContent>
            <div className="flex gap-4 items-center">
              <div className="text-center">
                <div
                  className={`text-3xl font-bold ${getScoreColor(
                    optimizationResult.overallScore
                  )}`}
                >
                  {optimizationResult.overallScore}
                </div>
                <div className="text-sm text-muted-foreground">
                  Overall Score
                </div>
              </div>
              <div className="flex-1">
                <Progress
                  value={optimizationResult.overallScore}
                  className="h-3"
                />
              </div>
              <Button onClick={handleReanalyze} disabled={isAnalyzing}>
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Re-analyze'
                )}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Draft Editor Section */}
        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex gap-2 items-center">
                <BookOpen className="w-5 h-5" />
                Draft Editor
              </CardTitle>
              <CardDescription>
                Edit your content and re-analyze for updated optimization
                scores.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                className="w-full min-h-[600px] resize-none font-mono text-sm"
                value={currentDraft}
                onChange={(e) => handleDraftUpdate(e.target.value)}
                placeholder="Your content draft will appear here..."
              />
            </CardContent>
          </Card>
        </div>

        {/* Analysis Results Section */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex gap-2 items-center">
                Optimization & Validation
                {apiStatus && (
                  <Badge
                    variant={
                      apiStatus.hasOpenAI && apiStatus.hasBingSearch
                        ? 'default'
                        : 'secondary'
                    }
                    className="ml-2"
                  >
                    {apiStatus.hasOpenAI && apiStatus.hasBingSearch
                      ? 'Enhanced'
                      : 'Basic'}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {isAnalyzing
                  ? 'Analyzing content...'
                  : apiStatus && apiStatus.hasOpenAI && apiStatus.hasBingSearch
                  ? 'GPT-4 powered analysis with real fact-checking'
                  : 'Pattern-based analysis with simulated verification'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isAnalyzing ? (
                <div className="flex flex-col items-center py-8">
                  <Loader2 className="mb-4 w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Analyzing SEO, facts, and readability...
                  </p>
                </div>
              ) : optimizationResult ? (
                <Tabs defaultValue="seo" className="w-full">
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="seo">
                      SEO
                      <Badge
                        variant={getScoreBadgeVariant(
                          optimizationResult.seo.overallScore
                        )}
                        className="ml-1 text-xs"
                      >
                        {optimizationResult.seo.overallScore}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="facts">
                      Facts
                      <Badge
                        variant={
                          optimizationResult.factCheck.verifiedCount ===
                          optimizationResult.factCheck.totalClaims
                            ? 'default'
                            : 'secondary'
                        }
                        className="ml-1 text-xs"
                      >
                        {optimizationResult.factCheck.verifiedCount}/
                        {optimizationResult.factCheck.totalClaims}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="readability">
                      Read
                      <Badge
                        variant={getScoreBadgeVariant(
                          optimizationResult.readability.clarityScore
                        )}
                        className="ml-1 text-xs"
                      >
                        {optimizationResult.readability.clarityScore}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="seo" className="mt-4">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">SEO Score</span>
                          <span
                            className={`text-sm font-bold ${getScoreColor(
                              optimizationResult.seo.overallScore
                            )}`}
                          >
                            {optimizationResult.seo.overallScore}/100
                          </span>
                        </div>
                        <Progress value={optimizationResult.seo.overallScore} />
                      </div>

                      <Accordion type="single" collapsible>
                        <AccordionItem value="keyword-density">
                          <AccordionTrigger className="text-sm">
                            <div className="flex gap-2 items-center">
                              Keyword Density
                              {optimizationResult.seo.keywordDensity.density >=
                                1 &&
                              optimizationResult.seo.keywordDensity.density <=
                                3 ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                              )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="text-sm">
                            <p>
                              "{optimizationResult.seo.keywordDensity.keyword}"
                              appears{' '}
                              {optimizationResult.seo.keywordDensity.count}{' '}
                              times (
                              {optimizationResult.seo.keywordDensity.density.toFixed(
                                1
                              )}
                              %)
                            </p>
                            <p className="mt-1 text-muted-foreground">
                              {
                                optimizationResult.seo.keywordDensity
                                  .recommendation
                              }
                            </p>
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="meta-description">
                          <AccordionTrigger className="text-sm">
                            <div className="flex gap-2 items-center">
                              Meta Description
                              {optimizationResult.seo.metaDescription
                                .isOptimal ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                              )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="text-sm">
                            <p>
                              Length:{' '}
                              {optimizationResult.seo.metaDescription.length}{' '}
                              characters
                            </p>
                            <p className="mt-1 text-muted-foreground">
                              {
                                optimizationResult.seo.metaDescription
                                  .recommendation
                              }
                            </p>
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="title-tags">
                          <AccordionTrigger className="text-sm">
                            <div className="flex gap-2 items-center">
                              Title Structure
                              {optimizationResult.seo.titleTags.h1Count ===
                              1 ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                              )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="text-sm">
                            <p>
                              H1: {optimizationResult.seo.titleTags.h1Count},
                              H2: {optimizationResult.seo.titleTags.h2Count},
                              H3: {optimizationResult.seo.titleTags.h3Count}
                            </p>
                            <p className="mt-1 text-muted-foreground">
                              {optimizationResult.seo.titleTags.recommendation}
                            </p>
                          </AccordionContent>
                        </AccordionItem>

                        {optimizationResult.seo.imageAltTags.missingCount >
                          0 && (
                          <AccordionItem value="alt-tags">
                            <AccordionTrigger className="text-sm">
                              <div className="flex gap-2 items-center">
                                Image Alt Tags
                                <XCircle className="w-4 h-4 text-red-500" />
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="text-sm">
                              <p>
                                {
                                  optimizationResult.seo.imageAltTags
                                    .missingCount
                                }{' '}
                                images need alt tags
                              </p>
                              <div className="mt-2 space-y-1">
                                {optimizationResult.seo.imageAltTags.suggestions.map(
                                  (suggestion, idx) => (
                                    <p
                                      key={idx}
                                      className="text-xs text-muted-foreground"
                                    >
                                      {suggestion}
                                    </p>
                                  )
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        )}
                      </Accordion>
                    </div>
                  </TabsContent>

                  <TabsContent value="facts" className="mt-4">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">
                            Verified Claims
                          </span>
                          <span className="text-sm font-bold">
                            {optimizationResult.factCheck.verifiedCount}/
                            {optimizationResult.factCheck.totalClaims}
                          </span>
                        </div>
                        <Progress
                          value={
                            optimizationResult.factCheck.totalClaims > 0
                              ? (optimizationResult.factCheck.verifiedCount /
                                  optimizationResult.factCheck.totalClaims) *
                                100
                              : 100
                          }
                        />
                      </div>

                      {optimizationResult.factCheck.facts.length > 0 ? (
                        <div className="space-y-2">
                          {optimizationResult.factCheck.facts.map(
                            (fact, idx) => (
                              <div
                                key={idx}
                                className="p-2 text-xs rounded border"
                              >
                                <div className="flex gap-2 items-start">
                                  {fact.isVerified ? (
                                    <CheckCircle className="h-3 w-3 text-green-500 mt-0.5" />
                                  ) : (
                                    <XCircle className="h-3 w-3 text-red-500 mt-0.5" />
                                  )}
                                  <div className="flex-1">
                                    <p className="font-medium">{fact.claim}</p>
                                    {fact.source && (
                                      <p className="mt-1 text-muted-foreground">
                                        Source: {fact.source} ({fact.confidence}
                                        % confidence)
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No specific claims detected in the content.
                        </p>
                      )}

                      {optimizationResult.factCheck.suggestions.length > 0 && (
                        <div className="mt-4">
                          <h4 className="mb-2 text-sm font-medium">
                            Suggested Sources:
                          </h4>
                          <div className="space-y-1">
                            {optimizationResult.factCheck.suggestions.map(
                              (suggestion, idx) => (
                                <div
                                  key={idx}
                                  className="p-2 text-xs bg-blue-50 rounded dark:bg-blue-950/30"
                                >
                                  <p className="font-medium">
                                    {suggestion.claim}
                                  </p>
                                  <p className="text-muted-foreground">
                                    {suggestion.suggestedSource}
                                  </p>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="readability" className="mt-4">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">
                            Clarity Score
                          </span>
                          <span
                            className={`text-sm font-bold ${getScoreColor(
                              optimizationResult.readability.clarityScore
                            )}`}
                          >
                            {optimizationResult.readability.clarityScore}/100
                          </span>
                        </div>
                        <Progress
                          value={optimizationResult.readability.clarityScore}
                        />
                      </div>

                      <Accordion type="single" collapsible>
                        <AccordionItem value="sentence-length">
                          <AccordionTrigger className="text-sm">
                            <div className="flex gap-2 items-center">
                              Sentence Length
                              {optimizationResult.readability.sentenceLength
                                .isOptimal ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                              )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="text-sm">
                            <p>
                              Average:{' '}
                              {
                                optimizationResult.readability.sentenceLength
                                  .average
                              }{' '}
                              words per sentence
                            </p>
                            <p className="mt-1 text-muted-foreground">
                              {
                                optimizationResult.readability.sentenceLength
                                  .recommendation
                              }
                            </p>
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="passive-voice">
                          <AccordionTrigger className="text-sm">
                            <div className="flex gap-2 items-center">
                              Passive Voice
                              {optimizationResult.readability.passiveVoice
                                .percentage < 10 ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                              )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="text-sm">
                            <p>
                              {
                                optimizationResult.readability.passiveVoice
                                  .count
                              }{' '}
                              instances (
                              {
                                optimizationResult.readability.passiveVoice
                                  .percentage
                              }
                              %)
                            </p>
                            {optimizationResult.readability.passiveVoice
                              .suggestions.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {optimizationResult.readability.passiveVoice.suggestions.map(
                                  (suggestion, idx) => (
                                    <p
                                      key={idx}
                                      className="text-xs text-muted-foreground"
                                    >
                                      {suggestion}
                                    </p>
                                  )
                                )}
                              </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="tone">
                          <AccordionTrigger className="text-sm">
                            <div className="flex gap-2 items-center">
                              Tone & Style
                              {optimizationResult.readability.tone.consistency >
                              50 ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                              )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="text-sm">
                            <p>
                              Detected tone:{' '}
                              {optimizationResult.readability.tone.detected}
                            </p>
                            <p className="mt-1 text-muted-foreground">
                              {
                                optimizationResult.readability.tone
                                  .recommendation
                              }
                            </p>
                          </AccordionContent>
                        </AccordionItem>

                        {optimizationResult.readability.grammar.errorCount >
                          0 && (
                          <AccordionItem value="grammar">
                            <AccordionTrigger className="text-sm">
                              <div className="flex gap-2 items-center">
                                Grammar
                                <XCircle className="w-4 h-4 text-red-500" />
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="text-sm">
                              <p>
                                {
                                  optimizationResult.readability.grammar
                                    .errorCount
                                }{' '}
                                potential issues found
                              </p>
                              <div className="mt-2 space-y-1">
                                {optimizationResult.readability.grammar.errors.map(
                                  (error, idx) => (
                                    <div
                                      key={idx}
                                      className="p-2 text-xs bg-red-50 rounded dark:bg-red-950/30"
                                    >
                                      <p className="font-medium">
                                        "{error.text}"
                                      </p>
                                      <p className="text-muted-foreground">
                                        {error.suggestion}
                                      </p>
                                    </div>
                                  )
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        )}
                      </Accordion>
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    Click "Re-analyze" to start content optimization analysis.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fixed Footer Navigation */}
      <div className="fixed right-0 bottom-0 left-0 z-20 p-4 border-t backdrop-blur-sm bg-background/80">
        <div className="container flex gap-4 justify-between items-center mx-auto">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to Outlines
          </Button>
          <Button
            size="lg"
            onClick={() => {
              if (optimizationResult && activeOutline) {
                // Save optimization data for review page
                sessionStorage.setItem(
                  'optimizationResult',
                  JSON.stringify(optimizationResult)
                );
                sessionStorage.setItem('finalDraft', currentDraft);
                sessionStorage.setItem(
                  'activeOutline',
                  JSON.stringify(activeOutline)
                );
                router.push('/content/review');
              }
            }}
            disabled={!optimizationResult}
          >
            Next: Review & Finalize →
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function OptimizePage() {
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
      <OptimizePageContent />
    </Suspense>
  );
}
