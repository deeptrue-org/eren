import { OptimizationResult } from '@/types/content';
import { Progress } from '@/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Eye, MessageSquare } from 'lucide-react';
import { getScoreColor, getStatusIcon } from './optimization-utils';

interface ReadabilityTabProps {
  readabilityData: OptimizationResult['readability'];
}

export function ReadabilityTab({ readabilityData }: ReadabilityTabProps) {
  return (
    <div className="space-y-4">
      {/* Readability Score */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Readability Score</span>
          <span
            className={`text-sm font-bold ${getScoreColor(
              readabilityData.clarityScore
            )}`}
          >
            {readabilityData.clarityScore}/100
          </span>
        </div>
        <Progress value={readabilityData.clarityScore} />
      </div>

      <Accordion type="single" collapsible>
        {/* 문장 길이 */}
        <AccordionItem value="sentence-length">
          <AccordionTrigger className="text-sm">
            <div className="flex gap-2 items-center">
              <Eye className="w-4 h-4" />
              Sentence Length Analysis
              {getStatusIcon(readabilityData.sentenceLength.isOptimal)}
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-2 text-sm">
            <p>
              Average sentence length:{' '}
              <strong>{readabilityData.sentenceLength.average} words</strong>
              {readabilityData.sentenceLength.isOptimal
                ? ' (optimal)'
                : ' (needs improvement)'}
            </p>
            <p className="text-muted-foreground">
              💡 {readabilityData.sentenceLength.recommendation}
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* 수동태 사용 */}
        <AccordionItem value="passive-voice">
          <AccordionTrigger className="text-sm">
            <div className="flex gap-2 items-center">
              Passive Voice & Style
              {getStatusIcon(readabilityData.passiveVoice.percentage < 10)}
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-2 text-sm">
            <p>
              Passive voice usage:{' '}
              <strong>{readabilityData.passiveVoice.count} times</strong> (
              {readabilityData.passiveVoice.percentage.toFixed(1)}%)
            </p>
            {readabilityData.passiveVoice.suggestions.length > 0 && (
              <div className="space-y-1">
                <p className="font-medium">Suggestions:</p>
                {readabilityData.passiveVoice.suggestions.map(
                  (suggestion, index) => (
                    <div key={index} className="p-2 text-xs rounded bg-muted">
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
              {getStatusIcon(readabilityData.grammar.errorCount === 0)}
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-2 text-sm">
            {readabilityData.grammar.errorCount > 0 ? (
              <>
                <p className="text-red-600">
                  Errors found: {readabilityData.grammar.errorCount}
                </p>
                <div className="space-y-1">
                  {readabilityData.grammar.errors.map((error, index) => (
                    <div
                      key={index}
                      className="p-2 space-y-1 bg-red-50 rounded border border-red-200"
                    >
                      <p className="font-medium text-red-800">"{error.text}"</p>
                      <p className="text-xs text-red-600">
                        → {error.suggestion}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-green-600">✅ No grammar errors found</p>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* 톤 & 스타일 */}
        <AccordionItem value="tone">
          <AccordionTrigger className="text-sm">
            <div className="flex gap-2 items-center">
              <MessageSquare className="w-4 h-4" />
              Tone & Consistency
              {getStatusIcon(readabilityData.tone.consistency >= 80)}
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-2 text-sm">
            <p>
              Detected tone: <strong>{readabilityData.tone.detected}</strong>
            </p>
            <p>
              Consistency: <strong>{readabilityData.tone.consistency}%</strong>
            </p>
            <p className="text-muted-foreground">
              💡 {readabilityData.tone.recommendation}
            </p>
          </AccordionContent>
        </AccordionItem>

        {/* 복잡도 */}
        <AccordionItem value="complexity">
          <AccordionTrigger className="text-sm">
            <div className="flex gap-2 items-center">
              Complexity Analysis
              {getStatusIcon(readabilityData.complexity.score >= 70)}
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-2 text-sm">
            <p>
              Complexity score:{' '}
              <strong>{readabilityData.complexity.score}/100</strong>
            </p>
            <p className="text-muted-foreground">
              💡 {readabilityData.complexity.recommendation}
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
