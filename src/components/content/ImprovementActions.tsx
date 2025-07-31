import { OptimizationResult } from '@/types/content';
import { Button } from '@/components/ui/button';
import { Hash, BookOpen, SquarePen, MessageSquare } from 'lucide-react';

interface ImprovementActionsProps {
  optimizationResult: OptimizationResult;
  onRequestImprovement: (improvementType: string, details: string) => void;
}

export function ImprovementActions({
  optimizationResult,
  onRequestImprovement,
}: ImprovementActionsProps) {
  const shouldShowSeoImprovement = optimizationResult.seo.overallScore < 80;
  const shouldShowReadabilityImprovement =
    optimizationResult.readability.clarityScore < 80;
  const shouldShowCredibilityImprovement =
    optimizationResult.factCheck.verifiedCount <
    optimizationResult.factCheck.totalClaims;

  return (
    <div className="pb-4 space-y-2">
      <div className="flex flex-wrap gap-2 mt-4">
        {shouldShowSeoImprovement && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() =>
              onRequestImprovement(
                'seo-overall',
                `SEO score is ${
                  optimizationResult.seo.overallScore
                }/100. Please optimize the content for SEO including: keyword density (currently ${optimizationResult.seo.keywordDensity.density.toFixed(
                  1
                )}%), meta description length (${
                  optimizationResult.seo.metaDescription.length
                } chars), heading structure (H1:${
                  optimizationResult.seo.titleTags.h1Count
                }, H2:${
                  optimizationResult.seo.titleTags.h2Count
                }), and keyword placement. Fix all SEO issues comprehensively.`
              )
            }
          >
            <Hash className="mr-1 w-3 h-3" />
            Improve SEO
          </Button>
        )}

        {shouldShowReadabilityImprovement && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() =>
              onRequestImprovement(
                'readability-overall',
                `Readability score is ${
                  optimizationResult.readability.clarityScore
                }/100. Please improve readability by fixing: sentence length (avg: ${
                  optimizationResult.readability.sentenceLength.average
                } words), passive voice usage (${optimizationResult.readability.passiveVoice.percentage.toFixed(
                  1
                )}%), grammar errors (${
                  optimizationResult.readability.grammar.errorCount
                } found), tone consistency (${
                  optimizationResult.readability.tone.consistency
                }%), and overall complexity. Make the content clear and engaging.`
              )
            }
          >
            <BookOpen className="mr-1 w-3 h-3" />
            Improve Readability
          </Button>
        )}

        {shouldShowCredibilityImprovement && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() =>
              onRequestImprovement(
                'factcheck-improve',
                `Fact-check results: ${optimizationResult.factCheck.verifiedCount}/${optimizationResult.factCheck.totalClaims} claims verified. Please improve content credibility by adding reliable sources, fact-checking unverified claims, and ensuring all statements are accurate and well-supported with evidence.`
              )
            }
          >
            <SquarePen className="mr-1 w-3 h-3" />
            Improve Credibility
          </Button>
        )}

        {/* Blog Tone Check Button - always show when optimization result exists */}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() =>
            onRequestImprovement(
              'blog-tone-check',
              `Please analyze this content and check if it reads like a natural, engaging blog post. Evaluate: 1) Writing flow and readability, 2) Conversational tone vs overly formal language, 3) Sentence variety and rhythm, 4) Use of personal pronouns and direct address, 5) Engaging opening and conclusion, 6) Overall naturalness and authenticity. Provide specific feedback on how to make it sound more like a smooth, natural blog article that readers would enjoy.`
            )
          }
        >
          <MessageSquare className="mr-1 w-3 h-3" />
          Check Blog Tone
        </Button>
      </div>
    </div>
  );
}
