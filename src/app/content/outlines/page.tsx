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
// ContentOutline type no longer needed - using ArticleResult
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  FileText,
  Target,
  Edit,
  Copy,
  Eye,
} from 'lucide-react';

// Import separated components and hooks
import {
  OptimizationPanel,
  ReviewSection,
  RealTimeLogs,
  AISuggestions,
  ImprovementPreviewDialog,
} from '@/components/content';
import { useArticleGeneration, useOptimization } from '@/hooks';

// Define ArticleResult locally for now
interface ArticleResult {
  id: string;
  briefId: string;
  keyword: string;
  title: string;
  content: string;
  wordCount: number;
}

// Markdown Preview Component
const MarkdownPreview = ({ content }: { content: string }) => {
  if (!content) {
    return (
      <div className="flex justify-center items-center h-64 text-muted-foreground">
        <div className="text-center">
          <FileText className="mx-auto mb-4 w-12 h-12 opacity-50" />
          <p>No content to preview</p>
        </div>
      </div>
    );
  }

  // Simple markdown parsing for common elements
  const parseMarkdown = (text: string) => {
    const lines = text.split('\n');
    const result: JSX.Element[] = [];
    let inTable = false;
    let tableHeaders: string[] = [];
    let tableRows: string[][] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Handle images
      if (trimmedLine.match(/^!\[.*?\]\(.*?\)/)) {
        const imageMatch = trimmedLine.match(
          /^!\[(.*?)\]\((.*?)\s*(?:"(.*?)")?\)/
        );
        if (imageMatch) {
          const [, alt, src, title] = imageMatch;
          result.push(
            <div
              key={i}
              className="p-4 my-6 text-center bg-gray-50 rounded-lg border-2 border-gray-300 border-dashed"
            >
              <div className="flex flex-col gap-2 items-center text-gray-600">
                <div className="flex justify-center items-center w-16 h-16 bg-gray-200 rounded-lg">
                  <FileText className="w-8 h-8" />
                </div>
                <div className="text-sm">
                  <div className="font-medium">{alt || 'Image'}</div>
                  <div className="text-xs text-gray-500">{src}</div>
                  {title && <div className="text-xs italic">{title}</div>}
                </div>
              </div>
            </div>
          );
          continue;
        }
      }

      // Handle tables
      if (trimmedLine.includes('|') && !trimmedLine.startsWith('#')) {
        if (!inTable) {
          inTable = true;
          tableHeaders = trimmedLine
            .split('|')
            .map((h) => h.trim())
            .filter((h) => h !== '');
        } else if (trimmedLine.match(/^[\|\s\-]+$/)) {
          // Table separator line - skip
          continue;
        } else {
          const row = trimmedLine
            .split('|')
            .map((c) => c.trim())
            .filter((c) => c !== '');
          if (row.length > 0) {
            tableRows.push(row);
          }
        }

        // Check if next line is still part of table
        const nextLine = lines[i + 1];
        if (!nextLine || !nextLine.trim().includes('|')) {
          // End of table
          if (tableHeaders.length > 0 && tableRows.length > 0) {
            result.push(
              <div key={i} className="overflow-x-auto my-6">
                <table className="w-full bg-white rounded-lg border border-gray-300 border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      {tableHeaders.map((header, idx) => (
                        <th
                          key={idx}
                          className="px-4 py-2 font-semibold text-left text-gray-900 border border-gray-300"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((row, rowIdx) => (
                      <tr
                        key={rowIdx}
                        className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                      >
                        {row.map((cell, cellIdx) => (
                          <td
                            key={cellIdx}
                            className="px-4 py-2 text-gray-700 border border-gray-300"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
          inTable = false;
          tableHeaders = [];
          tableRows = [];
        }
        continue;
      }

      // Reset table state if we encounter non-table content
      if (inTable && !trimmedLine.includes('|')) {
        inTable = false;
        tableHeaders = [];
        tableRows = [];
      }

      // Handle headings
      if (trimmedLine.startsWith('#')) {
        const level = trimmedLine.match(/^#+/)?.[0].length || 1;
        const text = trimmedLine.replace(/^#+\s*/, '');
        const headingClasses = {
          1: 'text-3xl font-bold mt-8 mb-4 text-gray-900',
          2: 'text-2xl font-bold mt-6 mb-3 text-gray-800',
          3: 'text-xl font-semibold mt-4 mb-2 text-gray-700',
          4: 'text-lg font-semibold mt-3 mb-2 text-gray-700',
          5: 'text-base font-semibold mt-2 mb-1 text-gray-700',
          6: 'text-sm font-semibold mt-2 mb-1 text-gray-700',
        };
        const className =
          headingClasses[level as keyof typeof headingClasses] ||
          headingClasses[6];
        result.push(
          <div key={i} className={className}>
            {text}
          </div>
        );
        continue;
      }

      // Handle blockquotes
      if (trimmedLine.startsWith('>')) {
        const text = trimmedLine.replace(/^>\s*/, '');
        result.push(
          <blockquote
            key={i}
            className="py-2 pl-4 my-4 italic text-gray-700 bg-blue-50 border-l-4 border-blue-500"
          >
            {text}
          </blockquote>
        );
        continue;
      }

      // Handle bullet points
      if (trimmedLine.match(/^[\*\-\+]\s+/)) {
        const text = trimmedLine.replace(/^[\*\-\+]\s+/, '');
        result.push(
          <div key={i} className="flex gap-2 items-start my-1 ml-4">
            <span className="text-blue-600 mt-1.5 text-xs">•</span>
            <span className="text-gray-700">{text}</span>
          </div>
        );
        continue;
      }

      // Handle numbered lists
      if (trimmedLine.match(/^\d+\.\s+/)) {
        const text = trimmedLine.replace(/^\d+\.\s+/, '');
        const number = trimmedLine.match(/^(\d+)\./)?.[1] || '1';
        result.push(
          <div key={i} className="flex gap-2 items-start my-1 ml-4">
            <span className="text-blue-600 mt-0.5 text-sm font-medium">
              {number}.
            </span>
            <span className="text-gray-700">{text}</span>
          </div>
        );
        continue;
      }

      // Handle code blocks
      if (trimmedLine.startsWith('```')) {
        const nextCodeEnd = lines.findIndex(
          (l, idx) => idx > i && l.trim() === '```'
        );
        if (nextCodeEnd > i) {
          const codeContent = lines.slice(i + 1, nextCodeEnd).join('\n');
          result.push(
            <pre
              key={i}
              className="overflow-x-auto p-4 my-4 text-gray-100 bg-gray-900 rounded-lg"
            >
              <code>{codeContent}</code>
            </pre>
          );
          i = nextCodeEnd; // Skip to end of code block
          continue;
        }
      }

      // Handle empty lines
      if (!trimmedLine) {
        result.push(<div key={i} className="h-4"></div>);
        continue;
      }

      // Handle regular paragraphs with inline formatting
      let formattedText = trimmedLine;

      // Handle bold text
      formattedText = formattedText.replace(
        /\*\*(.*?)\*\*/g,
        '<strong class="font-semibold text-gray-900">$1</strong>'
      );

      // Handle italic text
      formattedText = formattedText.replace(
        /\*(.*?)\*/g,
        '<em class="italic">$1</em>'
      );

      // Handle inline code
      formattedText = formattedText.replace(
        /`(.*?)`/g,
        '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>'
      );

      result.push(
        <div
          key={i}
          className="my-2 leading-relaxed text-gray-700"
          dangerouslySetInnerHTML={{ __html: formattedText }}
        />
      );
    }

    return result;
  };

  return (
    <div className="max-w-none prose prose-sm">
      <div className="space-y-2">{parseMarkdown(content)}</div>
    </div>
  );
};

// Main Component
function OutlinesPageContent() {
  const router = useRouter();
  const [selectedBrief, setSelectedBrief] = useState<ContentBrief | null>(null);
  const [activeOutlineId, setActiveOutlineId] = useState<string>('');
  const [editingDraft, setEditingDraft] = useState<string>('');
  const [suggestedContent, setSuggestedContent] = useState<string | null>(null);
  const [localArticles, setLocalArticles] = useState<ArticleResult[]>([]);

  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [autoImprovementRequest, setAutoImprovementRequest] = useState<{
    type: string;
    details: string;
  } | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);

  // Comprehensive improvement states
  const [showImprovementDialog, setShowImprovementDialog] =
    useState<boolean>(false);
  const [improvedContent, setImprovedContent] = useState<string>('');
  const [improvementSummary, setImprovementSummary] = useState<string[]>([]);
  const [isProcessingImprovement, setIsProcessingImprovement] =
    useState<boolean>(false);

  // Custom hooks
  const {
    articles: hookArticles,
    isLoading,
    error,
    logs,
    generateArticles,
  } = useArticleGeneration();
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
        setLocalArticles([]);
        setActiveOutlineId('');
        setEditingDraft('');
      } else {
        console.log('✅ Restoring articles from sessionStorage');
        setLocalArticles(existingOutlines);
      }
    }

    // Don't auto-generate - let user choose when to start
  }, []); // Empty dependency array to run only once on mount

  // Sync hook articles with local articles
  useEffect(() => {
    if (hookArticles.length > 0) {
      setLocalArticles(hookArticles);
    }
  }, [hookArticles]);

  // Set active article when articles are loaded
  useEffect(() => {
    if (localArticles.length > 0 && !activeOutlineId) {
      setActiveOutlineId(localArticles[0].id);
      setEditingDraft(localArticles[0].content);
    }
  }, [localArticles, activeOutlineId]);

  const handleOutlineChange = (outlineId: string) => {
    const article = localArticles.find((a) => a.id === outlineId);
    if (article) {
      setActiveOutlineId(outlineId);
      setEditingDraft(article.content);
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
    const activeArticle = localArticles.find((a) => a.id === activeOutlineId);
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
    const activeArticle = localArticles.find((a) => a.id === activeOutlineId);
    if (!activeArticle || !editingDraft) return;

    setIsProcessingImprovement(true);

    try {
      const response = await fetch('/api/content/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editingDraft,
          userFeedback: '', // Will be auto-generated
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
      // TODO: Show error toast
    } finally {
      setIsProcessingImprovement(false);
    }
  };

  // Apply improvement handler
  const handleApplyImprovement = (content: string) => {
    handleContentChange(content);
    setShowImprovementDialog(false);
    setImprovedContent('');
    setImprovementSummary([]);
  };

  // Reject improvement handler
  const handleRejectImprovement = () => {
    setShowImprovementDialog(false);
    setImprovedContent('');
    setImprovementSummary([]);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(editingDraft);
  };

  const activeArticle = localArticles.find((a) => a.id === activeOutlineId);

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

  if (localArticles.length === 0 && !isLoading) {
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
                <CardDescription className="">
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
                      placeholder="Generated draft content will appear here..."
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

// Separate component to handle navigation with outlines
function OutlinesNavigationButton() {
  const router = useRouter();
  const [hasOutlines, setHasOutlines] = useState(false);
  const [editingDraft, setEditingDraft] = useState('');
  const [localArticles, setLocalArticles] = useState<ArticleResult[]>([]);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      // Check for outlines
      const storedOutlines = sessionStorage.getItem('generatedOutlines');
      const storedDraft = sessionStorage.getItem('finalizedContent');
      const storedOptimization = sessionStorage.getItem('optimizationResult');

      if (storedOutlines) {
        try {
          const articles = JSON.parse(storedOutlines);
          setLocalArticles(articles);
          setHasOutlines(articles.length > 0);
        } catch (e) {
          console.error('Failed to parse outlines');
          setHasOutlines(false);
        }
      } else {
        setHasOutlines(false);
      }

      if (storedDraft) {
        setEditingDraft(storedDraft);
      }

      if (storedOptimization) {
        try {
          setOptimizationResult(JSON.parse(storedOptimization));
        } catch (e) {
          console.error('Failed to parse optimization result');
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handlePublish = () => {
    if (!hasOutlines) {
      alert('Please generate an outline first.');
      return;
    }

    // Save current state
    sessionStorage.setItem('finalizedContent', editingDraft);
    sessionStorage.setItem('reviewComplete', 'true');

    // Save articles for restoration
    if (localArticles.length > 0) {
      sessionStorage.setItem(
        'generatedOutlines',
        JSON.stringify(localArticles)
      );
    }

    if (optimizationResult) {
      sessionStorage.setItem(
        'optimizationResult',
        JSON.stringify(optimizationResult)
      );
    }

    router.push('/publishing');
  };

  return (
    <Button size="lg" disabled={!hasOutlines} onClick={handlePublish}>
      Complete & Publish
      <ArrowRight className="ml-2 w-4 h-4" />
    </Button>
  );
}

export default function OutlinesPage() {
  const router = useRouter();

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
          <h1 className="text-3xl font-bold tracking-tight">
            Content Creation Studio
          </h1>
          <p className="mt-2 text-muted-foreground">
            Create, optimize, and finalize your content with AI assistance.
          </p>
        </div>

        <OutlinesPageContent />

        {/* Fixed Footer Navigation */}
        <div className="fixed right-0 bottom-0 left-0 z-20 p-4 border-t backdrop-blur-sm bg-background/80">
          <div className="container flex gap-4 justify-between items-center mx-auto">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 w-4 h-4" />
              Back to Briefs
            </Button>
            <OutlinesNavigationButton />
          </div>
        </div>
      </div>
    </Suspense>
  );
}
