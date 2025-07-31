import { OptimizationResult } from '@/types/content';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { CheckCircle, XCircle, Image } from 'lucide-react';
import { getScoreColor, getStatusIcon } from './optimization-utils';

interface SeoAnalysisTabProps {
  seoData: OptimizationResult['seo'];
}

export function SeoAnalysisTab({ seoData }: SeoAnalysisTabProps) {
  return (
    <div className="space-y-4">
      {/* Overall Score */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">SEO Overall Score</span>
          <span
            className={`text-sm font-bold ${getScoreColor(
              seoData.overallScore
            )}`}
          >
            {seoData.overallScore}/100
          </span>
        </div>
        <Progress value={seoData.overallScore} />
      </div>

      <Accordion type="single" collapsible>
        {/* 키워드 밀도 */}
        <AccordionItem value="keyword-density">
          <AccordionTrigger className="text-sm">
            <div className="flex gap-2 items-center">
              Keyword Density
              {getStatusIcon(
                seoData.keywordDensity.density >= 1 &&
                  seoData.keywordDensity.density <= 3
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-2 text-sm">
            <p>
              <strong>"{seoData.keywordDensity.keyword}"</strong> appears{' '}
              {seoData.keywordDensity.count} times (
              {seoData.keywordDensity.density.toFixed(1)}%)
            </p>
            <p className="text-muted-foreground">
              💡 {seoData.keywordDensity.recommendation}
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* 메타 디스크립션 */}
        <AccordionItem value="meta-description">
          <AccordionTrigger className="text-sm">
            <div className="flex gap-2 items-center">
              Meta Description Length
              {getStatusIcon(seoData.metaDescription.isOptimal)}
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-2 text-sm">
            <p>
              Current length:{' '}
              <strong>{seoData.metaDescription.length} characters</strong>
              {seoData.metaDescription.isOptimal
                ? ' (optimal range)'
                : ' (recommended: 120-160 characters)'}
            </p>
            <p className="text-muted-foreground">
              💡 {seoData.metaDescription.recommendation}
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* 제목 태그 구조 */}
        <AccordionItem value="title-tags">
          <AccordionTrigger className="text-sm">
            <div className="flex gap-2 items-center">
              Heading Tag Structure
              {getStatusIcon(
                seoData.titleTags.h1Count === 1 && seoData.titleTags.h2Count > 0
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-2 text-sm">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded bg-muted">
                <div className="font-bold">H1</div>
                <div>{seoData.titleTags.h1Count}</div>
              </div>
              <div className="p-2 rounded bg-muted">
                <div className="font-bold">H2</div>
                <div>{seoData.titleTags.h2Count}</div>
              </div>
              <div className="p-2 rounded bg-muted">
                <div className="font-bold">H3</div>
                <div>{seoData.titleTags.h3Count}</div>
              </div>
            </div>
            <p className="text-muted-foreground">
              💡 {seoData.titleTags.recommendation}
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* 이미지 Alt 태그 */}
        <AccordionItem value="image-alt">
          <AccordionTrigger className="text-sm">
            <div className="flex gap-2 items-center">
              <Image className="w-4 h-4" />
              Image Alt Tags
              {getStatusIcon(seoData.imageAltTags.missingCount === 0)}
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-2 text-sm">
            {seoData.imageAltTags.missingCount > 0 ? (
              <>
                <p className="text-red-600">
                  ⚠️ Images missing Alt tags:{' '}
                  {seoData.imageAltTags.missingCount}
                </p>
                <div className="space-y-1">
                  <p className="font-medium">Suggested Alt Tags:</p>
                  {seoData.imageAltTags.suggestions.map((suggestion, index) => (
                    <div key={index} className="p-2 text-xs rounded bg-muted">
                      "{suggestion}"
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-green-600">✅ All images have Alt tags set</p>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* 키워드 배치 */}
        <AccordionItem value="keyword-placement">
          <AccordionTrigger className="text-sm">
            <div className="flex gap-2 items-center">
              Keyword Placement
              {getStatusIcon(
                seoData.keywordPlacement.inTitle &&
                  seoData.keywordPlacement.inFirstParagraph
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-2 text-sm">
            <div className="space-y-1">
              <div className="flex gap-2 items-center">
                {seoData.keywordPlacement.inTitle ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span>Keyword in title</span>
              </div>
              <div className="flex gap-2 items-center">
                {seoData.keywordPlacement.inFirstParagraph ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span>Keyword in first paragraph</span>
              </div>
              <div className="flex gap-2 items-center">
                {seoData.keywordPlacement.inSubheadings > 0 ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span>
                  Keyword in {seoData.keywordPlacement.inSubheadings}{' '}
                  subheadings
                </span>
              </div>
            </div>
            <p className="text-muted-foreground">
              💡 {seoData.keywordPlacement.recommendation}
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
