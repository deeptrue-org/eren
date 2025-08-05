import { OptimizationResult } from '@/types/content';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Loader2,
  Sparkles,
  Hash,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { getScoreBadgeVariant } from './OptimizationUtils';
import { SeoAnalysisTab } from './SeoAnalysisTab';
import { FactCheckTab } from './FactCheckTab';
import { ReadabilityTab } from './ReadabilityTab';

interface OptimizationPanelProps {
  optimizationResult: OptimizationResult | null;
  isAnalyzing: boolean;
  onAnalyze: (briefId?: string) => void;
  onRequestImprovement?: (improvementType: string, details: string) => void;
  onComprehensiveImprovement?: (optimizationResult: OptimizationResult) => void;
  briefId?: string; // Optional briefId for context-aware optimization
}

export function OptimizationPanel({
  optimizationResult,
  isAnalyzing,
  onAnalyze,
  onRequestImprovement,
  onComprehensiveImprovement,
  briefId,
}: OptimizationPanelProps) {
  // 개선이 필요한지 판단하는 함수
  const hasImprovementNeeded = (): boolean => {
    if (!optimizationResult) return false;

    // SEO 점수가 80 미만이거나
    if (optimizationResult.seo.overallScore < 80) return true;

    // 전체 점수가 85 미만이거나
    if (optimizationResult.overallScore < 85) return true;

    // 가독성 점수가 75 미만이거나
    if (optimizationResult.readability.clarityScore < 75) return true;

    // 팩트체크에서 검증되지 않은 클레임이 있거나
    if (
      optimizationResult.factCheck.verifiedCount <
      optimizationResult.factCheck.totalClaims
    )
      return true;

    // 문법 오류가 있거나
    if (optimizationResult.readability.grammar.errorCount > 0) return true;

    // 수동태 사용이 20% 이상이면
    if (optimizationResult.readability.passiveVoice.percentage > 20)
      return true;

    return false;
  };

  // 포괄적 개선 요청 처리 함수
  const handleComprehensiveImprovement = () => {
    if (optimizationResult && onComprehensiveImprovement) {
      onComprehensiveImprovement(optimizationResult);
    }
  };
  const renderLoadingState = () => (
    <div className="flex flex-col items-center py-8">
      <Loader2 className="mb-4 w-8 h-8 animate-spin text-primary" />
      <p className="text-sm text-center text-muted-foreground">
        Analyzing SEO optimization, fact-checking, and readability...
        <br />
        Please wait a moment
      </p>
    </div>
  );

  const renderEmptyState = () => (
    <div className="py-8 text-center">
      <p className="text-sm text-muted-foreground">
        Click "Start Analysis" to comprehensively analyze your content for SEO,
        fact-checking, and readability.
      </p>
    </div>
  );

  const renderTabs = () => {
    if (!optimizationResult) return null;

    return (
      <Tabs defaultValue="seo" className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="seo">
            <Hash className="mr-1 w-4 h-4" />
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
            <ExternalLink className="mr-1 w-4 h-4" />
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
            <BookOpen className="mr-1 w-4 h-4" />
            Readability
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
          <SeoAnalysisTab seoData={optimizationResult.seo} />
        </TabsContent>

        <TabsContent value="facts" className="mt-4">
          <FactCheckTab factCheckData={optimizationResult.factCheck} />
        </TabsContent>

        <TabsContent value="readability" className="mt-4">
          <ReadabilityTab readabilityData={optimizationResult.readability} />
        </TabsContent>
      </Tabs>
    );
  };

  const renderAnalysisButton = () => (
    <div className="flex flex-col gap-3 m-6">
      <Button
        className="w-full"
        onClick={() => onAnalyze(briefId)}
        disabled={isAnalyzing}
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="mr-2 w-4 h-4 animate-spin" />
            Analyzing...
          </>
        ) : optimizationResult ? (
          <>
            <Sparkles className="mr-2 w-4 h-4" />
            Re-analyze
          </>
        ) : (
          <>
            <Sparkles className="mr-2 w-4 h-4" />
            Start Analysis
          </>
        )}
      </Button>

      {optimizationResult && hasImprovementNeeded() && onRequestImprovement && (
        <Button
          variant="default"
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          onClick={handleComprehensiveImprovement}
        >
          <Sparkles className="mr-2 w-4 h-4" />
          Improve Content
        </Button>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex gap-2 items-center">
              <Search className="w-5 h-5" />
              Content Optimization & Validation
            </CardTitle>
            <CardDescription>
              {isAnalyzing
                ? 'AI is analyzing your content...'
                : briefId
                ? 'Context-aware analysis for SEO, fact-checking, and readability'
                : 'Comprehensive analysis for SEO, fact-checking, and readability'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isAnalyzing && renderLoadingState()}
        {!isAnalyzing && !optimizationResult && renderEmptyState()}
        {!isAnalyzing && optimizationResult && renderTabs()}
      </CardContent>

      {renderAnalysisButton()}
    </Card>
  );
}
