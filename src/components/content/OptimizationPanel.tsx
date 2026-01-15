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
import { getScoreBadgeVariant } from './optimization-utils';
import { SeoAnalysisTab } from './SeoAnalysisTab';
import { FactCheckTab } from './FactCheckTab';
import { ReadabilityTab } from './ReadabilityTab';
import { ImprovementActions } from './ImprovementActions';

interface OptimizationPanelProps {
  optimizationResult: OptimizationResult | null;
  isAnalyzing: boolean;
  onAnalyze: () => void;
  onRequestImprovement?: (improvementType: string, details: string) => void;
}

export function OptimizationPanel({
  optimizationResult,
  isAnalyzing,
  onAnalyze,
  onRequestImprovement,
}: OptimizationPanelProps) {
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
    <div className="flex justify-center m-6">
      <Button className="w-full" onClick={onAnalyze} disabled={isAnalyzing}>
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
                : 'Comprehensive analysis for SEO, fact-checking, and readability'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isAnalyzing && renderLoadingState()}
        {!isAnalyzing && !optimizationResult && renderEmptyState()}
        {!isAnalyzing && optimizationResult && renderTabs()}

        {/* Improvement Actions */}
        {optimizationResult && onRequestImprovement && (
          <ImprovementActions
            optimizationResult={optimizationResult}
            onRequestImprovement={onRequestImprovement}
          />
        )}
      </CardContent>

      {renderAnalysisButton()}
    </Card>
  );
}
