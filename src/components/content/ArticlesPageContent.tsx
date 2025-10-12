'use client';

import { useState, useEffect } from 'react';
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
import { Loader2, FileText, Target, Edit, Copy, Eye } from 'lucide-react';

import { useArticleGeneration, useOptimization } from '@/hooks';
import { useSessionStorage } from '@/hooks/use-session-storage';
import {
  OptimizationPanel,
  ReviewSection,
  RealTimeLogs,
  AISuggestions,
  ImprovementPreviewDialog,
  MarkdownPreview,
} from '@/components/content';

export function ArticlesPageContent() {
  const router = useRouter();
  const [activeArticleId, setActiveArticleId] = useState<string>('');
  const [editingDraft, setEditingDraft] = useState<string>('');
  const [suggestedContent, setSuggestedContent] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);

  // Improvement states
  const [autoImprovementRequest, setAutoImprovementRequest] = useState<{
    type: string;
    details: string;
  } | null>(null);
  const [showImprovementDialog, setShowImprovementDialog] =
    useState<boolean>(false);
  const [improvedContent, setImprovedContent] = useState<string>('');
  const [improvementSummary, setImprovementSummary] = useState<string[]>([]);
  const [isProcessingImprovement, setIsProcessingImprovement] =
    useState<boolean>(false);

  // Custom hooks
  const { selectedBrief, localArticles, setLocalArticles } =
    useSessionStorage();
  const {
    articles: hookArticles,
    isLoading,
    error,
    logs,
    generateArticles,
  } = useArticleGeneration();
  const { optimizationResult, isAnalyzing, analyzeContent } = useOptimization();

  // Sync hook articles with local articles
  useEffect(() => {
    if (hookArticles.length > 0) {
      setLocalArticles(hookArticles);
    }
  }, [hookArticles, setLocalArticles]);

  // Set active article when articles are loaded
  useEffect(() => {
    if (localArticles.length > 0 && !activeArticleId) {
      setActiveArticleId(localArticles[0].id);
      setEditingDraft(localArticles[0].content);
    }
  }, [localArticles, activeArticleId]);

  const handleDraftUpdate = (value: string) => {
    setEditingDraft(value);
    setHasChanges(true);
    localStorage.setItem(`draft-${activeArticleId}`, value);
  };

  const handleContentChange = (content: string) => {
    setEditingDraft(content);
    setHasChanges(true);
    localStorage.setItem(`draft-${activeArticleId}`, content);
  };

  const handleStartOptimization = () => {
    const activeArticle = localArticles.find((a) => a.id === activeArticleId);
    if (activeArticle && editingDraft) {
      analyzeContent(editingDraft, activeArticle.keyword);
    }
  };

  const handleRequestImprovement = (
    improvementType: string,
    details: string
  ) => {
    setAutoImprovementRequest({ type: improvementType, details });
  };

  // Comprehensive improvement handler
  const handleComprehensiveImprovement = async (optimizationResult: any) => {
    const activeArticle = localArticles.find((a) => a.id === activeArticleId);
    if (!activeArticle || !editingDraft) return;

    setIsProcessingImprovement(true);

    try {
      const response = await fetch('/api/content/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: editingDraft,
          userFeedback: '',
          chatHistory: [],
          targetKeyword: activeArticle.keyword,
          optimizationContext: optimizationResult,
          isComprehensiveImprovement: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process comprehensive improvement');
      }

      const data = await response.json();

      if (data.updatedContent) {
        setImprovedContent(data.updatedContent);
        setImprovementSummary(data.suggestions || []);
        setShowImprovementDialog(true);
      }
    } catch (error) {
      console.error('Error processing comprehensive improvement:', error);
    } finally {
      setIsProcessingImprovement(false);
    }
  };

  const handleApplyImprovement = (content: string) => {
    handleContentChange(content);
    setShowImprovementDialog(false);
    setImprovedContent('');
    setImprovementSummary([]);
  };

  const handleRejectImprovement = () => {
    setShowImprovementDialog(false);
    setImprovedContent('');
    setImprovementSummary([]);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(editingDraft);
  };

  const activeArticle = localArticles.find((a) => a.id === activeArticleId);

  if (isLoading) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <div className="space-y-8">
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Generating Articles...</h3>
              <p className="text-muted-foreground">
                Creating complete articles for your selected briefs
              </p>
            </div>
          </div>
          <div className="mx-auto max-w-2xl">
            <RealTimeLogs
              logs={logs}
              isActive={isLoading}
              title="Article Generation Progress"
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

  if (localArticles.length === 0 && !isLoading) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  Ready to Generate Article
                </h3>
                <div className="text-muted-foreground">
                  {selectedBrief
                    ? `Create a complete article for: "${selectedBrief.topic}"`
                    : 'No brief selected. Please go back and select a brief first.'}
                </div>
              </div>

              {selectedBrief ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <Button
                      size="lg"
                      onClick={() => {
                        sessionStorage.removeItem('finalizedContent');
                        sessionStorage.removeItem('activeArticle');
                        sessionStorage.removeItem('optimizationResult');
                        localArticles.forEach((article) => {
                          localStorage.removeItem(`draft-${article.id}`);
                        });
                        generateArticles([selectedBrief]);
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
                          Generate Complete Article
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    This will research the topic and create a comprehensive
                    4000+ word article
                  </div>
                </div>
              ) : (
                <Button onClick={() => router.back()}>Back to Briefs</Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {localArticles.map((article) => (
        <div key={article.id} className="mt-6">
          {/* Active Content Info */}
          {activeArticle && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex gap-2 items-center">
                  <Target className="w-5 h-5" />
                  {activeArticle.title}
                </CardTitle>
                <CardDescription>
                  <div className="flex gap-2 justify-between">
                    <div>
                      Keyword: {activeArticle.keyword} •{' '}
                      {activeArticle.wordCount} words
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
                      )}
                    </div>
                    <Button
                      onClick={() => {
                        if (selectedBrief) {
                          sessionStorage.removeItem('finalizedContent');
                          sessionStorage.removeItem('activeArticle');
                          sessionStorage.removeItem('optimizationResult');
                          localArticles.forEach((article) => {
                            localStorage.removeItem(`draft-${article.id}`);
                          });
                          generateArticles([selectedBrief]);
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
                        '✨ Regenerate Article'
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
                        {isPreviewMode ? (
                          <Eye className="w-5 h-5" />
                        ) : (
                          <Edit className="w-5 h-5" />
                        )}
                        {isPreviewMode ? 'Content Preview' : 'Content Editor'}
                      </CardTitle>
                      <CardDescription>
                        {isPreviewMode
                          ? 'Preview your content with formatted tables, images, and styling.'
                          : 'Edit your content, optimize it, and finalize for publishing.'}
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
                        onClick={() => setIsPreviewMode(!isPreviewMode)}
                        variant="outline"
                        size="sm"
                      >
                        {isPreviewMode ? (
                          <>
                            <Edit className="mr-1 w-4 h-4" />
                            Edit
                          </>
                        ) : (
                          <>
                            <Eye className="mr-1 w-4 h-4" />
                            Preview
                          </>
                        )}
                      </Button>
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
                  {isPreviewMode ? (
                    <div className="w-full min-h-[500px] max-h-[700px] overflow-y-auto border rounded-md p-4 bg-white">
                      <MarkdownPreview content={editingDraft} />
                    </div>
                  ) : (
                    <Textarea
                      className="w-full min-h-[500px] resize-y font-mono text-sm"
                      value={editingDraft}
                      onChange={(e) => handleDraftUpdate(e.target.value)}
                      placeholder="Generated article content will appear here..."
                    />
                  )}
                </CardContent>
              </Card>

              {/* AI Suggestions - Only show in Edit mode */}
              {!isPreviewMode && (
                <AISuggestions
                  originalContent={editingDraft}
                  suggestedContent={suggestedContent}
                  onApply={(content) => {
                    handleContentChange(content);
                    setSuggestedContent(null);
                  }}
                  onReject={() => setSuggestedContent(null)}
                />
              )}
            </div>

            {/* Sidebar - Optimization & AI Assistant */}
            <div className="space-y-6 lg:col-span-1">
              {/* Optimization Panel */}
              <OptimizationPanel
                optimizationResult={optimizationResult}
                isAnalyzing={isAnalyzing || isProcessingImprovement}
                onAnalyze={handleStartOptimization}
                onRequestImprovement={handleRequestImprovement}
                onComprehensiveImprovement={handleComprehensiveImprovement}
                briefId={activeArticle?.briefId}
              />

              {/* AI Assistant & Review */}
              {activeArticle && (
                <ReviewSection
                  content={editingDraft}
                  keyword={activeArticle.keyword}
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

      {/* Improvement Preview Dialog */}
      <ImprovementPreviewDialog
        isOpen={showImprovementDialog}
        onClose={() => setShowImprovementDialog(false)}
        originalContent={editingDraft}
        improvedContent={improvedContent}
        improvementSummary={improvementSummary}
        onApply={handleApplyImprovement}
        onReject={handleRejectImprovement}
        isApplying={false}
      />
    </div>
  );
}
