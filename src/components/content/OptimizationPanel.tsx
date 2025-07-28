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
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Search,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  Sparkles,
  ExternalLink,
  Image,
  Hash,
  Eye,
  BookOpen,
  MessageSquare,
} from 'lucide-react';

interface OptimizationPanelProps {
  optimizationResult: OptimizationResult | null;
  isAnalyzing: boolean;
  onAnalyze: () => void;
}

export function OptimizationPanel({
  optimizationResult,
  isAnalyzing,
  onAnalyze,
}: OptimizationPanelProps) {
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

  const getStatusIcon = (isGood: boolean, hasWarning = false) => {
    if (isGood) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (hasWarning)
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

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
        {isAnalyzing ? (
          <div className="flex flex-col items-center py-8">
            <Loader2 className="mb-4 w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-center text-muted-foreground">
              Analyzing SEO optimization, fact-checking, and readability...
              <br />
              Please wait a moment
            </p>
          </div>
        ) : optimizationResult ? (
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

            {/* SEO 탭 */}
            <TabsContent value="seo" className="mt-4">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">
                      SEO Overall Score
                    </span>
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
                  {/* 키워드 밀도 */}
                  <AccordionItem value="keyword-density">
                    <AccordionTrigger className="text-sm">
                      <div className="flex gap-2 items-center">
                        Keyword Density
                        {getStatusIcon(
                          optimizationResult.seo.keywordDensity.density >= 1 &&
                            optimizationResult.seo.keywordDensity.density <= 3
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 text-sm">
                      <p>
                        <strong>
                          "{optimizationResult.seo.keywordDensity.keyword}"
                        </strong>{' '}
                        appears {optimizationResult.seo.keywordDensity.count}{' '}
                        times (
                        {optimizationResult.seo.keywordDensity.density.toFixed(
                          1
                        )}
                        %)
                      </p>
                      <p className="text-muted-foreground">
                        💡{' '}
                        {optimizationResult.seo.keywordDensity.recommendation}
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  {/* 메타 디스크립션 */}
                  <AccordionItem value="meta-description">
                    <AccordionTrigger className="text-sm">
                      <div className="flex gap-2 items-center">
                        Meta Description Length
                        {getStatusIcon(
                          optimizationResult.seo.metaDescription.isOptimal
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 text-sm">
                      <p>
                        Current length:{' '}
                        <strong>
                          {optimizationResult.seo.metaDescription.length}{' '}
                          characters
                        </strong>
                        {optimizationResult.seo.metaDescription.isOptimal
                          ? ' (optimal range)'
                          : ' (recommended: 120-160 characters)'}
                      </p>
                      <p className="text-muted-foreground">
                        💡{' '}
                        {optimizationResult.seo.metaDescription.recommendation}
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  {/* 제목 태그 구조 */}
                  <AccordionItem value="title-tags">
                    <AccordionTrigger className="text-sm">
                      <div className="flex gap-2 items-center">
                        Heading Tag Structure
                        {getStatusIcon(
                          optimizationResult.seo.titleTags.h1Count === 1 &&
                            optimizationResult.seo.titleTags.h2Count > 0
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 text-sm">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded bg-muted">
                          <div className="font-bold">H1</div>
                          <div>{optimizationResult.seo.titleTags.h1Count}</div>
                        </div>
                        <div className="p-2 rounded bg-muted">
                          <div className="font-bold">H2</div>
                          <div>{optimizationResult.seo.titleTags.h2Count}</div>
                        </div>
                        <div className="p-2 rounded bg-muted">
                          <div className="font-bold">H3</div>
                          <div>{optimizationResult.seo.titleTags.h3Count}</div>
                        </div>
                      </div>
                      <p className="text-muted-foreground">
                        💡 {optimizationResult.seo.titleTags.recommendation}
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  {/* 이미지 Alt 태그 */}
                  <AccordionItem value="image-alt">
                    <AccordionTrigger className="text-sm">
                      <div className="flex gap-2 items-center">
                        <Image className="w-4 h-4" />
                        Image Alt Tags
                        {getStatusIcon(
                          optimizationResult.seo.imageAltTags.missingCount === 0
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 text-sm">
                      {optimizationResult.seo.imageAltTags.missingCount > 0 ? (
                        <>
                          <p className="text-red-600">
                            ⚠️ Images missing Alt tags:{' '}
                            {optimizationResult.seo.imageAltTags.missingCount}
                          </p>
                          <div className="space-y-1">
                            <p className="font-medium">Suggested Alt Tags:</p>
                            {optimizationResult.seo.imageAltTags.suggestions.map(
                              (suggestion, index) => (
                                <div
                                  key={index}
                                  className="p-2 text-xs rounded bg-muted"
                                >
                                  "{suggestion}"
                                </div>
                              )
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="text-green-600">
                          ✅ All images have Alt tags set
                        </p>
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  {/* 키워드 배치 */}
                  <AccordionItem value="keyword-placement">
                    <AccordionTrigger className="text-sm">
                      <div className="flex gap-2 items-center">
                        Keyword Placement
                        {getStatusIcon(
                          optimizationResult.seo.keywordPlacement.inTitle &&
                            optimizationResult.seo.keywordPlacement
                              .inFirstParagraph
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 text-sm">
                      <div className="space-y-1">
                        <div className="flex gap-2 items-center">
                          {optimizationResult.seo.keywordPlacement.inTitle ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span>Keyword in title</span>
                        </div>
                        <div className="flex gap-2 items-center">
                          {optimizationResult.seo.keywordPlacement
                            .inFirstParagraph ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span>Keyword in first paragraph</span>
                        </div>
                        <div className="flex gap-2 items-center">
                          {optimizationResult.seo.keywordPlacement
                            .inSubheadings > 0 ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          )}
                          <span>
                            Keyword in{' '}
                            {
                              optimizationResult.seo.keywordPlacement
                                .inSubheadings
                            }{' '}
                            subheadings
                          </span>
                        </div>
                      </div>
                      <p className="text-muted-foreground">
                        💡{' '}
                        {optimizationResult.seo.keywordPlacement.recommendation}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </TabsContent>

            {/* 사실 확인 탭 */}
            <TabsContent value="facts" className="mt-4">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Verified Facts</span>
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

                <Accordion type="single" collapsible>
                  {/* 사실 확인 결과 */}
                  <AccordionItem value="fact-results">
                    <AccordionTrigger className="text-sm">
                      <div className="flex gap-2 items-center">
                        <ExternalLink className="w-4 h-4" />
                        Fact Check Results
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 text-sm">
                      {optimizationResult.factCheck.facts.map((fact, index) => (
                        <div
                          key={index}
                          className="p-3 space-y-2 rounded border"
                        >
                          <div className="flex gap-2 items-start">
                            {getStatusIcon(fact.isVerified)}
                            <div className="flex-1">
                              <p className="font-medium">"{fact.claim}"</p>
                              <div className="mt-1 text-xs text-muted-foreground">
                                Confidence: {fact.confidence}%
                              </div>
                              {fact.source && (
                                <div className="mt-1">
                                  <a
                                    href={fact.source}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex gap-1 items-center text-xs text-blue-600 hover:underline"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    Check Source
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>

                  {/* 추천 출처 */}
                  {optimizationResult.factCheck.suggestions.length > 0 && (
                    <AccordionItem value="source-suggestions">
                      <AccordionTrigger className="text-sm">
                        <div className="flex gap-2 items-center">
                          Recommended Sources & Citations
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-2 text-sm">
                        {optimizationResult.factCheck.suggestions.map(
                          (suggestion, index) => (
                            <div
                              key={index}
                              className="p-2 space-y-1 bg-blue-50 rounded border border-blue-200"
                            >
                              <p className="font-medium">
                                "{suggestion.claim}"
                              </p>
                              <p className="text-muted-foreground">
                                {suggestion.reason}
                              </p>
                              <a
                                href={suggestion.suggestedSource}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex gap-1 items-center text-xs text-blue-600 hover:underline"
                              >
                                <ExternalLink className="w-3 h-3" />
                                {suggestion.suggestedSource}
                              </a>
                            </div>
                          )
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>
              </div>
            </TabsContent>

            {/* 가독성 탭 */}
            <TabsContent value="readability" className="mt-4">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">
                      Readability Score
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
                  {/* 문장 길이 */}
                  <AccordionItem value="sentence-length">
                    <AccordionTrigger className="text-sm">
                      <div className="flex gap-2 items-center">
                        <Eye className="w-4 h-4" />
                        Sentence Length Analysis
                        {getStatusIcon(
                          optimizationResult.readability.sentenceLength
                            .isOptimal
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 text-sm">
                      <p>
                        Average sentence length:{' '}
                        <strong>
                          {
                            optimizationResult.readability.sentenceLength
                              .average
                          }
                          단어
                        </strong>
                        {optimizationResult.readability.sentenceLength.isOptimal
                          ? ' (optimal)'
                          : ' (needs improvement)'}
                      </p>
                      <p className="text-muted-foreground">
                        💡{' '}
                        {
                          optimizationResult.readability.sentenceLength
                            .recommendation
                        }
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  {/* 수동태 사용 */}
                  <AccordionItem value="passive-voice">
                    <AccordionTrigger className="text-sm">
                      <div className="flex gap-2 items-center">
                        Passive Voice & Style
                        {getStatusIcon(
                          optimizationResult.readability.passiveVoice
                            .percentage < 10
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 text-sm">
                      <p>
                        Passive voice usage:{' '}
                        <strong>
                          {optimizationResult.readability.passiveVoice.count}{' '}
                          times
                        </strong>
                        (
                        {optimizationResult.readability.passiveVoice.percentage.toFixed(
                          1
                        )}
                        %)
                      </p>
                      {optimizationResult.readability.passiveVoice.suggestions
                        .length > 0 && (
                        <div className="space-y-1">
                          <p className="font-medium">Suggestions:</p>
                          {optimizationResult.readability.passiveVoice.suggestions.map(
                            (suggestion, index) => (
                              <div
                                key={index}
                                className="p-2 text-xs rounded bg-muted"
                              >
                                {suggestion}
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  {/* 문법 검사 */}
                  <AccordionItem value="grammar">
                    <AccordionTrigger className="text-sm">
                      <div className="flex gap-2 items-center">
                        Grammar & Spelling Check
                        {getStatusIcon(
                          optimizationResult.readability.grammar.errorCount ===
                            0
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 text-sm">
                      {optimizationResult.readability.grammar.errorCount > 0 ? (
                        <>
                          <p className="text-red-600">
                            Errors found:{' '}
                            {optimizationResult.readability.grammar.errorCount}
                          </p>
                          <div className="space-y-1">
                            {optimizationResult.readability.grammar.errors.map(
                              (error, index) => (
                                <div
                                  key={index}
                                  className="p-2 space-y-1 bg-red-50 rounded border border-red-200"
                                >
                                  <p className="font-medium text-red-800">
                                    "{error.text}"
                                  </p>
                                  <p className="text-xs text-red-600">
                                    → {error.suggestion}
                                  </p>
                                </div>
                              )
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="text-green-600">
                          ✅ No grammar errors found
                        </p>
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  {/* 톤 & 스타일 */}
                  <AccordionItem value="tone">
                    <AccordionTrigger className="text-sm">
                      <div className="flex gap-2 items-center">
                        <MessageSquare className="w-4 h-4" />
                        Tone & Consistency
                        {getStatusIcon(
                          optimizationResult.readability.tone.consistency >= 80
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 text-sm">
                      <p>
                        Detected tone:{' '}
                        <strong>
                          {optimizationResult.readability.tone.detected}
                        </strong>
                      </p>
                      <p>
                        Consistency:{' '}
                        <strong>
                          {optimizationResult.readability.tone.consistency}%
                        </strong>
                      </p>
                      <p className="text-muted-foreground">
                        💡 {optimizationResult.readability.tone.recommendation}
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  {/* 복잡도 */}
                  <AccordionItem value="complexity">
                    <AccordionTrigger className="text-sm">
                      <div className="flex gap-2 items-center">
                        Complexity Analysis
                        {getStatusIcon(
                          optimizationResult.readability.complexity.score >= 70
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 text-sm">
                      <p>
                        Complexity score:{' '}
                        <strong>
                          {optimizationResult.readability.complexity.score}/100
                        </strong>
                      </p>
                      <p className="text-muted-foreground">
                        💡{' '}
                        {
                          optimizationResult.readability.complexity
                            .recommendation
                        }
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Click "Start Analysis" to comprehensively analyze your content for
              SEO, fact-checking, and readability.
            </p>
          </div>
        )}
      </CardContent>
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
    </Card>
  );
}
