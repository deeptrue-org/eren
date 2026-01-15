'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

import { ContentBrief } from '@/lib/types';
import { ContentOutline, OptimizationResult } from '@/types/content';
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  FileText,
  Target,
  Edit,
  Copy,
} from 'lucide-react';

// Import separated components and hooks
import {
  OutlineStats,
  OptimizationPanel,
  ReviewSection,
  RealTimeLogs,
  AISuggestions,
} from '@/components/content';
import { useOutlineGeneration, useOptimization } from '@/hooks';

// Main Component
function OutlinesPageContent() {
  const router = useRouter();
  const [selectedBrief, setSelectedBrief] = useState<ContentBrief | null>(null);
  const [activeOutlineId, setActiveOutlineId] = useState<string>('');
  const [editingDraft, setEditingDraft] = useState<string>('');
  const [suggestedContent, setSuggestedContent] = useState<string | null>(null);
  const [localOutlines, setLocalOutlines] = useState<ContentOutline[]>([]);

  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [autoImprovementRequest, setAutoImprovementRequest] = useState<{
    type: string;
    details: string;
  } | null>(null);

  // Custom hooks
  const {
    outlines: hookOutlines,
    isLoading,
    error,
    logs,
    generateOutlines,
  } = useOutlineGeneration();
  const { optimizationResult, isAnalyzing, analyzeContent } = useOptimization();

  // Load selected briefs from sessionStorage
  useEffect(() => {
    const loadSelectedBrief = () => {
      try {
        const stored = sessionStorage.getItem('selectedBrief');
        const expandedKeywordsStored =
          sessionStorage.getItem('expandedKeywords');

        if (stored) {
          let brief = JSON.parse(stored) as ContentBrief;

          // Enhanced brief with related keywords
          if (expandedKeywordsStored && brief) {
            try {
              const expandedKeywords = JSON.parse(expandedKeywordsStored);
              console.log('🔍 Found expanded keywords data:', expandedKeywords);

              const allExpandedKeywords: string[] = [];
              if (typeof expandedKeywords === 'object') {
                Object.values(expandedKeywords).forEach((keywords: any) => {
                  if (Array.isArray(keywords)) {
                    keywords.forEach((kw: any) => {
                      if (
                        kw.keyword &&
                        !allExpandedKeywords.includes(kw.keyword)
                      ) {
                        allExpandedKeywords.push(kw.keyword);
                      }
                    });
                  }
                });
              }

              brief = {
                ...brief,
                relatedKeywords: allExpandedKeywords
                  .filter(
                    (kw) =>
                      kw !== brief.keyword &&
                      kw
                        .toLowerCase()
                        .includes(brief.keyword.toLowerCase().split(' ')[0])
                  )
                  .slice(0, 10),
              };

              console.log('📋 Enhanced brief with related keywords:', brief);
            } catch (e) {
              console.warn(
                'Failed to parse expanded keywords, continuing without them:',
                e
              );
            }
          }

          if (brief) {
            setSelectedBrief(brief);
            return brief;
          }
        }
        return null;
      } catch (e) {
        console.error('Failed to load selected briefs:', e);
        return null;
      }
    };

    // Check for existing outlines in sessionStorage (independent of brief)
    const checkExistingOutlines = () => {
      try {
        const savedOutlines = sessionStorage.getItem('generatedOutlines');
        const savedDraft = sessionStorage.getItem('finalizedContent');
        const savedActiveOutline = sessionStorage.getItem('activeOutline');

        if (savedOutlines) {
          const outlines = JSON.parse(savedOutlines);
          console.log('🔄 Restoring existing outlines from sessionStorage');

          // If we have a saved draft, use it
          if (savedDraft) {
            const updatedOutlines = outlines.map((outline: any) => ({
              ...outline,
              draft: savedDraft,
            }));
            console.log('📄 Found saved draft, will restore content');

            // Restore active outline and editing draft
            if (savedActiveOutline) {
              const activeOutlineData = JSON.parse(savedActiveOutline);
              setActiveOutlineId(activeOutlineData.id);
              setEditingDraft(savedDraft);
            }

            return updatedOutlines;
          }

          // Check if any outline has a saved draft in localStorage
          const outlinesWithDrafts = outlines.map((outline: any) => {
            const savedDraftForOutline = localStorage.getItem(
              `draft-${outline.id}`
            );
            if (savedDraftForOutline) {
              return {
                ...outline,
                draft: savedDraftForOutline,
              };
            }
            return outline;
          });

          // Restore active outline if saved
          if (savedActiveOutline) {
            const activeOutlineData = JSON.parse(savedActiveOutline);
            setActiveOutlineId(activeOutlineData.id);
            const activeOutlineFromSaved = outlinesWithDrafts.find(
              (o: any) => o.id === activeOutlineData.id
            );
            if (activeOutlineFromSaved) {
              setEditingDraft(activeOutlineFromSaved.draft || '');
            }
          }

          return outlinesWithDrafts;
        }
      } catch (e) {
        console.warn('Failed to restore outlines:', e);
      }
      return null;
    };

    // Load brief first
    const brief = loadSelectedBrief();

    // Then restore outlines (independent of brief to handle refresh)
    const existingOutlines = checkExistingOutlines();
    if (existingOutlines && existingOutlines.length > 0) {
      // Check if the outlines match the current brief
      if (brief && existingOutlines[0]?.keyword !== brief.keyword) {
        // Different brief selected, clear previous outlines
        console.log('🧹 Different brief detected, clearing previous outlines');
        sessionStorage.removeItem('generatedOutlines');
        sessionStorage.removeItem('finalizedContent');
        sessionStorage.removeItem('activeOutline');
        sessionStorage.removeItem('optimizationResult');
        // Clear any saved drafts for previous outlines
        existingOutlines.forEach((outline: any) => {
          localStorage.removeItem(`draft-${outline.id}`);
        });
        setLocalOutlines([]);
        setActiveOutlineId('');
        setEditingDraft('');
      } else {
        console.log('✅ Restoring outlines from sessionStorage');
        setLocalOutlines(existingOutlines);
      }
    }

    // Don't auto-generate - let user choose when to start
  }, []); // Empty dependency array to run only once on mount

  // Sync hook outlines with local outlines
  useEffect(() => {
    if (hookOutlines.length > 0) {
      setLocalOutlines(hookOutlines);
    }
  }, [hookOutlines]);

  // Set active outline when outlines are loaded
  useEffect(() => {
    if (localOutlines.length > 0 && !activeOutlineId) {
      setActiveOutlineId(localOutlines[0].id);
      setEditingDraft(localOutlines[0].draft);
    }
  }, [localOutlines, activeOutlineId]);

  const handleOutlineChange = (outlineId: string) => {
    const outline = localOutlines.find((o) => o.id === outlineId);
    if (outline) {
      setActiveOutlineId(outlineId);
      setEditingDraft(outline.draft);
      setHasChanges(false);
    }
  };

  const handleDraftUpdate = (value: string) => {
    setEditingDraft(value);
    setHasChanges(true);
    localStorage.setItem(`draft-${activeOutlineId}`, value);
  };

  const handleContentChange = (content: string) => {
    setEditingDraft(content);
    setHasChanges(true);
    localStorage.setItem(`draft-${activeOutlineId}`, content);
  };

  const handleStartOptimization = () => {
    const activeOutline = localOutlines.find((o) => o.id === activeOutlineId);
    if (activeOutline && editingDraft) {
      analyzeContent(editingDraft, activeOutline.keyword);
    }
  };

  const handleRequestImprovement = (
    improvementType: string,
    details: string
  ) => {
    setAutoImprovementRequest({ type: improvementType, details });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(editingDraft);
  };

  const activeOutline = localOutlines.find((o) => o.id === activeOutlineId);

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
                Generating Content Outlines...
              </h3>
              <p className="text-muted-foreground">
                Creating detailed outlines and drafts for your selected briefs
              </p>
            </div>
          </div>

          {/* Real-time logs */}
          <div className="mx-auto max-w-2xl">
            <RealTimeLogs
              logs={logs}
              isActive={isLoading}
              title="Outline Generation Progress"
            />
          </div>
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

  if (localOutlines.length === 0 && !isLoading) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  Ready to Generate Outline
                </h3>
                <div className="text-muted-foreground">
                  {selectedBrief
                    ? `Create a detailed outline and draft for: "${selectedBrief.topic}"`
                    : 'No brief selected. Please go back and select a brief first.'}
                </div>
              </div>

              {selectedBrief ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <Button
                      size="lg"
                      onClick={() => {
                        // Clear existing data when generating new outlines
                        sessionStorage.removeItem('finalizedContent');
                        sessionStorage.removeItem('activeOutline');
                        sessionStorage.removeItem('optimizationResult');
                        // Clear any existing drafts
                        localOutlines.forEach((outline) => {
                          localStorage.removeItem(`draft-${outline.id}`);
                        });
                        generateOutlines([selectedBrief]);
                      }}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FileText className="mr-2 w-4 h-4" />
                          Generate Outline & Draft
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    This will research the topic and create a comprehensive
                    outline with a full draft
                  </div>
                </div>
              ) : (
                <Button onClick={() => router.back()}>
                  <ArrowLeft className="mr-2 w-4 h-4" />
                  Back to Briefs
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 pb-40 mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Content Creation Studio
        </h1>
        <p className="mt-2 text-muted-foreground">
          Create, optimize, and finalize your content with AI assistance.
        </p>
      </div>

      {localOutlines.map((outline) => (
        <div key={outline.id} className="mt-6">
          {/* Active Content Info */}
          {activeOutline && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex gap-2 items-center">
                  <Target className="w-5 h-5" />
                  {activeOutline.title}
                </CardTitle>
                <CardDescription className="">
                  <div className="flex gap-2 justify-between">
                    <div>
                      Keyword: {activeOutline.keyword} •{' '}
                      {activeOutline.totalWordCount} words
                      {optimizationResult && (
                        <>
                          {' • Overall Score: '}
                          <Badge variant="secondary">
                            {optimizationResult.overallScore}/100
                          </Badge>
                        </>
                      )}
                      {hasChanges && (
                        <>
                          {' • '}
                          <Badge variant="outline" className="animate-pulse">
                            Modified
                          </Badge>
                        </>
                      )}{' '}
                    </div>
                    <Button
                      onClick={() => {
                        if (selectedBrief) {
                          // Clear existing data when regenerating outlines
                          sessionStorage.removeItem('finalizedContent');
                          sessionStorage.removeItem('activeOutline');
                          sessionStorage.removeItem('optimizationResult');
                          // Clear any existing drafts
                          localOutlines.forEach((outline) => {
                            localStorage.removeItem(`draft-${outline.id}`);
                          });
                          generateOutlines([selectedBrief]);
                        }
                      }}
                      disabled={isLoading || !selectedBrief}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                          Regenerating...
                        </>
                      ) : (
                        '✨ Regenerate Outlines'
                      )}
                    </Button>
                  </div>
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {/* Content Creation Interface */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Main Content Editor */}
            <div className="space-y-4 lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex gap-2 items-center">
                        <Edit className="w-5 h-5" />
                        Content Editor
                      </CardTitle>
                      <CardDescription>
                        Edit your content, optimize it, and finalize for
                        publishing.
                        {hasChanges && (
                          <Badge
                            variant="outline"
                            className="ml-2 animate-pulse"
                          >
                            Modified
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Button
                        onClick={copyToClipboard}
                        variant="outline"
                        size="sm"
                      >
                        <Copy className="mr-1 w-4 h-4" />
                        Copy
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    className="w-full min-h-[500px] resize-y font-mono text-sm"
                    value={editingDraft}
                    onChange={(e) => handleDraftUpdate(e.target.value)}
                    placeholder="Generated draft content will appear here..."
                  />
                </CardContent>
              </Card>

              {/* AI Suggestions */}
              <AISuggestions
                originalContent={editingDraft}
                suggestedContent={suggestedContent}
                onApply={(content) => {
                  handleContentChange(content);
                  setSuggestedContent(null);
                }}
                onReject={() => setSuggestedContent(null)}
              />
            </div>

            {/* Sidebar - Optimization & AI Assistant */}
            <div className="space-y-6 lg:col-span-1">
              {/* Optimization Panel */}
              <OptimizationPanel
                optimizationResult={optimizationResult}
                isAnalyzing={isAnalyzing}
                onAnalyze={handleStartOptimization}
                onRequestImprovement={handleRequestImprovement}
              />

              {/* AI Assistant & Review */}
              {activeOutline && (
                <ReviewSection
                  content={editingDraft}
                  keyword={activeOutline.keyword}
                  optimizationResult={optimizationResult || undefined}
                  onContentChange={handleContentChange}
                  onHasChanges={setHasChanges}
                  onSuggestedContent={setSuggestedContent}
                  autoImprovementRequest={autoImprovementRequest}
                  onAutoImprovementHandled={() =>
                    setAutoImprovementRequest(null)
                  }
                />
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Fixed Footer Navigation */}
      <div className="fixed right-0 bottom-0 left-0 z-20 p-4 border-t backdrop-blur-sm bg-background/80">
        <div className="container flex gap-4 justify-between items-center mx-auto">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to Briefs
          </Button>
          <Button
            size="lg"
            onClick={() => {
              sessionStorage.setItem('finalizedContent', editingDraft);
              sessionStorage.setItem('reviewComplete', 'true');

              // Save outlines for restoration
              if (localOutlines.length > 0) {
                sessionStorage.setItem(
                  'generatedOutlines',
                  JSON.stringify(localOutlines)
                );
              }

              if (activeOutline) {
                sessionStorage.setItem(
                  'activeOutline',
                  JSON.stringify(activeOutline)
                );
              }
              if (optimizationResult) {
                sessionStorage.setItem(
                  'optimizationResult',
                  JSON.stringify(optimizationResult)
                );
              }
              router.push('/publishing');
            }}
            disabled={localOutlines.length === 0}
          >
            Complete & Publish →
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function OutlinesPage() {
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
      <OutlinesPageContent />
    </Suspense>
  );
}
