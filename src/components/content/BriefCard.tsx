import { ContentBrief } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Target,
  CheckCircle2,
  Circle,
  Brain,
  TrendingUp,
  BarChart,
  Users,
  Search,
  Lightbulb,
} from 'lucide-react';

// Helper component to render markdown-like text with proper formatting
const JourneyDisplay = ({ text }: { text: string }) => {
  if (!text) return null;

  // 텍스트 정리 - 프롬프트 관련 텍스트 제거
  let cleanedText = text
    .replace(/Provide a structured user journey analysis[^:]*:/i, '')
    .replace(/Write a comprehensive analysis[^:]*:/i, '')
    .replace(/^[•\-\*]\s*/, '') // 시작 bullet point 제거
    .trim();

  // 스마트 텍스트 정규화 - 패턴에 관계없이 구조 감지
  cleanedText = normalizeText(cleanedText);

  const lines = cleanedText.split('\n');
  const processedLines: JSX.Element[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // 빈 줄 처리
    if (!trimmedLine) {
      processedLines.push(<div key={i} className="h-2"></div>);
      continue;
    }

    const processedElement = processLine(trimmedLine, i);
    if (processedElement) {
      processedLines.push(processedElement);
    }
  }

  return (
    <div className="space-y-1 font-sans text-sm leading-relaxed">
      {processedLines}
    </div>
  );
};

// 텍스트 정규화 함수 - 패턴에 관계없이 구조 감지
function normalizeText(text: string): string {
  // 1. 긴 한 줄 텍스트를 감지하고 구조적으로 분리
  let normalized = text;

  // 2. 다양한 헤더 패턴 감지 및 줄바꿈 추가
  // 이모지 + 텍스트 + 콜론 패턴
  normalized = normalized.replace(
    /([^\w\s][^:•\-\*]{3,}?):\s*([•\-\*])/g,
    '$1:\n$2'
  );

  // 볼드 텍스트 + 콜론 패턴
  normalized = normalized.replace(
    /(\*\*[^*]{3,}\*\*:?)\s*([•\-\*])/g,
    '$1\n$2'
  );

  // 대문자로 시작하는 헤더 패턴
  normalized = normalized.replace(
    /([A-Z][^:•\-\*]{10,}?):\s*([•\-\*])/g,
    '$1:\n$2'
  );

  // 3. Bullet point 사이 줄바꿈 추가
  normalized = normalized.replace(
    /([•\-\*]\s+[^•\-\*]{10,}?)\s*([•\-\*])/g,
    '$1\n$2'
  );

  // 4. 연속된 패턴 분리
  // 헤더 사이 분리
  normalized = normalized.replace(
    /([^.!?:])\s*([^\w\s][^:•\-\*]{3,}?):/g,
    '$1\n\n$2:'
  );
  normalized = normalized.replace(
    /([^.!?:])\s*(\*\*[^*]{3,}\*\*:)/g,
    '$1\n\n$2'
  );

  return normalized.trim();
}

// 라인별 처리 함수 - 유연한 패턴 매칭
function processLine(line: string, index: number): JSX.Element | null {
  // 1. 헤더 감지 (다양한 패턴 지원)
  const headerPattern = detectHeader(line);
  if (headerPattern) {
    return (
      <div key={index} className="mt-4 mb-2">
        <strong className="block mb-1 text-base text-blue-900">
          {headerPattern.title}
        </strong>
        {headerPattern.content && (
          <div className="text-sm text-gray-700">{headerPattern.content}</div>
        )}
      </div>
    );
  }

  // 2. 리스트 아이템 감지 (bullet point, numbered list 등)
  const listItem = detectListItem(line);
  if (listItem) {
    return (
      <div key={index} className="flex gap-2 items-start my-1 ml-4">
        <span className="text-blue-600 text-sm mt-0.5 shrink-0">•</span>
        <div className="flex-1 text-sm text-gray-700">
          {renderInlineFormatting(listItem.content)}
        </div>
      </div>
    );
  }

  // 3. 인라인 포맷팅이 있는 일반 텍스트
  if (hasInlineFormatting(line)) {
    return (
      <div key={index} className="my-1 text-sm leading-normal text-gray-700">
        {renderInlineFormatting(line)}
      </div>
    );
  }

  // 4. 일반 텍스트
  return (
    <div key={index} className="my-1 text-sm leading-normal text-gray-700">
      {line}
    </div>
  );
}

// 헤더 감지 함수 - 패턴 독립적
function detectHeader(
  line: string
): { title: string; content?: string } | null {
  // 1. 이모지 + 텍스트 + 콜론 패턴
  const emojiMatch = line.match(/^([^\w\s][^:]{2,}):\s*(.*)$/);
  if (emojiMatch) {
    return {
      title: emojiMatch[1].trim(),
      content: emojiMatch[2].trim() || undefined,
    };
  }

  // 2. 볼드 텍스트 + 콜론 패턴
  const boldMatch = line.match(/^\*\*([^*]+)\*\*:?\s*(.*)$/);
  if (boldMatch) {
    return {
      title: boldMatch[1].trim(),
      content: boldMatch[2].trim() || undefined,
    };
  }

  // 3. 대문자로 시작하는 헤더 (최소 길이 체크)
  const titleMatch = line.match(/^([A-Z][^:]{8,}):\s*(.*)$/);
  if (titleMatch) {
    return {
      title: titleMatch[1].trim(),
      content: titleMatch[2].trim() || undefined,
    };
  }

  // 4. 숫자와 점으로 시작하는 헤더
  const numberedMatch = line.match(/^(\d+\.\s*[^:]+):\s*(.*)$/);
  if (numberedMatch) {
    return {
      title: numberedMatch[1].trim(),
      content: numberedMatch[2].trim() || undefined,
    };
  }

  return null;
}

// 리스트 아이템 감지 함수 - 다양한 형태 지원
function detectListItem(line: string): { content: string } | null {
  // 1. 기본 bullet point (•, -, *, +)
  const bulletMatch = line.match(/^[•\-\*\+]\s*(.+)$/);
  if (bulletMatch) {
    return { content: bulletMatch[1].trim() };
  }

  // 2. 숫자 리스트 (1., 2., 등)
  const numberMatch = line.match(/^\d+\.\s*(.+)$/);
  if (numberMatch) {
    return { content: numberMatch[1].trim() };
  }

  // 3. 들여쓰기된 텍스트 (리스트로 간주)
  if (line.match(/^\s{2,}[^\s]/)) {
    return { content: line.trim() };
  }

  return null;
}

// 인라인 포맷팅 감지
function hasInlineFormatting(text: string): boolean {
  return text.includes('**') || text.includes('*') || text.includes('`');
}

// 인라인 포맷팅 렌더링
function renderInlineFormatting(text: string): JSX.Element[] {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g).filter(Boolean);

  return parts.map((part, index) => {
    // Bold text
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="text-blue-900">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // Italic text (single *)
    if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
      return (
        <em key={index} className="text-blue-800">
          {part.slice(1, -1)}
        </em>
      );
    }

    // Code text
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="px-1 py-0.5 text-xs bg-gray-100 rounded">
          {part.slice(1, -1)}
        </code>
      );
    }

    return <span key={index}>{part}</span>;
  });
}

interface BriefCardProps {
  brief: ContentBrief;
  isSelected: boolean;
  onSelect: (brief: ContentBrief) => void;
  getDifficultyColor: (difficulty: string) => string;
}

function getIntentDisplay(type?: string) {
  switch (type) {
    case 'data-driven':
      return {
        icon: BarChart,
        color: 'bg-blue-100 text-blue-800',
        label: 'Data-Driven',
      };
    case 'trend-based':
      return {
        icon: TrendingUp,
        color: 'bg-green-100 text-green-800',
        label: 'Trend-Based',
      };
    case 'competitor-analysis':
      return {
        icon: Users,
        color: 'bg-orange-100 text-orange-800',
        label: 'Competitor Analysis',
      };
    case 'content-gap':
      return {
        icon: Search,
        color: 'bg-purple-100 text-purple-800',
        label: 'Content Gap',
      };
    case 'user-intent':
      return {
        icon: Brain,
        color: 'bg-indigo-100 text-indigo-800',
        label: 'User Intent',
      };
    default:
      return {
        icon: Lightbulb,
        color: 'bg-gray-100 text-gray-800',
        label: 'Standard',
      };
  }
}

export function BriefCard({
  brief,
  isSelected,
  onSelect,
  getDifficultyColor,
}: BriefCardProps) {
  const intentDisplay = getIntentDisplay(brief.generationIntent?.type);
  const IntentIcon = intentDisplay.icon;

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
        isSelected ? 'ring-2 shadow-lg ring-primary' : ''}`}
      onClick={() => onSelect(brief)}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="mb-2 text-lg leading-tight">
              {brief.topic}
            </CardTitle>
            <CardDescription className="flex gap-1 items-center">
              <Target className="w-3 h-3 shrink-0" />
              {brief.targetAudience}
            </CardDescription>
          </div>
          <div className="ml-2">
            {isSelected ? (
              <CheckCircle2 className="w-5 h-5 text-primary" />
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="flex flex-wrap gap-2">
          <div className="text-sm text-gray-700">{brief.intent}</div>

          {/* 생성 의도 타입 표시 */}
          {brief.generationIntent && (
            <Badge
              variant="secondary"
              className={`flex items-center gap-1 ${intentDisplay.color}`}
            >
              <IntentIcon className="w-3 h-3" />
              {intentDisplay.label}
              {brief.generationIntent.confidence && (
                <span className="text-xs">
                  ({brief.generationIntent.confidence}%)
                </span>
              )}
            </Badge>
          )}
        </div>

        {/* 사용자 여정 분석 (토글) */}
        {brief.userJourney && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="user-journey" className="border-b-0">
              <AccordionTrigger className="p-3 text-sm font-medium text-blue-900 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md border border-blue-100 [&[data-state=open]]:rounded-b-none">
                <div className="flex gap-2 items-center">
                  <IntentIcon className="w-4 h-4 text-blue-600" />
                  <span>User Journey Analysis</span>
                  <span className="text-xs text-blue-600">
                    ({brief.generationIntent?.confidence}% confidence)
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-4 bg-white rounded-b-md border border-t-0 border-blue-100">
                <JourneyDisplay text={brief.userJourney} />
                {brief.generationIntent?.dataSources &&
                  brief.generationIntent.dataSources.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-3 mt-3 border-t">
                      {brief.generationIntent.dataSources.map(
                        (source: string, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs text-blue-700 bg-blue-100 rounded-full"
                          >
                            {source}
                          </span>
                        )
                      )}
                    </div>
                  )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {/* AI 키워드 인사이트 (토글) */}
        {brief.keywordInsights?.aiInsights && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="ai-insights" className="border-b-0">
              <AccordionTrigger className="p-3 text-sm font-medium text-green-900 bg-gradient-to-r from-green-50 to-emerald-50 rounded-md border border-green-100 [&[data-state=open]]:rounded-b-none">
                <div className="flex gap-2 items-center">
                  <Brain className="w-4 h-4 text-green-600" />
                  <span>AI Keyword Insights</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-4 bg-white rounded-b-md border border-t-0 border-green-100">
                {/* 트렌드 분석 */}
                {brief.keywordInsights.aiInsights.trendAnalysis && (
                  <div className="mb-3">
                    <h5 className="mb-1 text-xs font-medium text-green-800">
                      Trend Analysis
                    </h5>
                    <p className="text-xs text-gray-700">
                      {
                        brief.keywordInsights.aiInsights.trendAnalysis
                          .trendDescription
                      }
                    </p>
                    <div className="flex gap-2 mt-1">
                      <span className="px-2 py-1 text-xs text-green-700 bg-green-100 rounded-full">
                        {
                          brief.keywordInsights.aiInsights.trendAnalysis
                            .trendDirection
                        }
                      </span>
                      <span className="px-2 py-1 text-xs text-green-700 bg-green-100 rounded-full">
                        {
                          brief.keywordInsights.aiInsights.trendAnalysis
                            .trendStrength
                        }
                      </span>
                    </div>
                  </div>
                )}

                {/* 사용자 의도 분석 */}
                {brief.keywordInsights.aiInsights.userIntentAnalysis && (
                  <div className="mb-3">
                    <h5 className="mb-1 text-xs font-medium text-green-800">
                      User Intent
                    </h5>
                    <p className="text-xs text-gray-700">
                      {
                        brief.keywordInsights.aiInsights.userIntentAnalysis
                          .searchBehavior
                      }
                    </p>
                    <div className="flex gap-2 mt-1">
                      <span className="px-2 py-1 text-xs text-green-700 bg-green-100 rounded-full">
                        {
                          brief.keywordInsights.aiInsights.userIntentAnalysis
                            .primaryIntent
                        }
                      </span>
                      <span className="px-2 py-1 text-xs text-green-700 bg-green-100 rounded-full">
                        {
                          brief.keywordInsights.aiInsights.userIntentAnalysis
                            .userJourneyStage
                        }
                      </span>
                    </div>
                  </div>
                )}

                {/* 콘텐츠 기회 */}
                {brief.keywordInsights.aiInsights.contentOpportunities && (
                  <div className="mb-3">
                    <h5 className="mb-1 text-xs font-medium text-green-800">
                      Content Opportunities
                    </h5>
                    <p className="text-xs text-gray-700">
                      {
                        brief.keywordInsights.aiInsights.contentOpportunities
                          .strategicRecommendations
                      }
                    </p>
                    {brief.keywordInsights.aiInsights.contentOpportunities
                      .contentGaps && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {brief.keywordInsights.aiInsights.contentOpportunities.contentGaps
                          .slice(0, 3)
                          .map((gap: string, index: number) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs text-green-700 bg-green-100 rounded-full"
                            >
                              {gap}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {brief.description && (
          <p className="text-sm text-muted-foreground">{brief.description}</p>
        )}
      </CardContent>
    </Card>
  );
}
