import { OptimizationResult } from '@/types/content';
import { Progress } from '@/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ExternalLink } from 'lucide-react';
import { getStatusIcon } from './OptimizationUtils';

interface FactCheckTabProps {
  factCheckData: OptimizationResult['factCheck'];
}

export function FactCheckTab({ factCheckData }: FactCheckTabProps) {
  const verificationPercentage =
    factCheckData.totalClaims > 0
      ? (factCheckData.verifiedCount / factCheckData.totalClaims) * 100
      : 100;

  return (
    <div className="space-y-4">
      {/* Verified Facts Progress */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Verified Facts</span>
          <span className="text-sm font-bold">
            {factCheckData.verifiedCount}/{factCheckData.totalClaims}
          </span>
        </div>
        <Progress value={verificationPercentage} />
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
            {factCheckData.facts.map((fact, index) => (
              <div key={index} className="p-3 space-y-2 rounded border">
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
        {factCheckData.suggestions.length > 0 && (
          <AccordionItem value="source-suggestions">
            <AccordionTrigger className="text-sm">
              <div className="flex gap-2 items-center">
                Recommended Sources & Citations
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm">
              {factCheckData.suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-2 space-y-1 text-black bg-blue-50 rounded border border-blue-200"
                >
                  <p className="font-medium">"{suggestion.claim}"</p>
                  <p className="text-muted-foreground">{suggestion.reason}</p>
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
              ))}
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}
