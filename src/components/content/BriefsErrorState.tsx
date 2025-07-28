import { ContentBrief } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { BriefKeywordSection } from './BriefKeywordSection';

interface BriefsErrorStateProps {
  error: string;
  canForceRestart: boolean;
  keywords: string[];
  briefs: Record<string, ContentBrief[]>;
  onTryAgain: () => void;
  onBackToStart: () => void;
  onForceRestart?: () => void;
  // Props for existing briefs display
  getSelectedCountForKeyword: (keyword: string) => number;
  isBriefSelected: (briefId: string) => boolean;
  handleSelectBrief: (brief: ContentBrief) => void;
  getDifficultyColor: (difficulty: string) => string;
}

export function BriefsErrorState({
  error,
  canForceRestart,
  keywords,
  briefs,
  onTryAgain,
  onBackToStart,
  onForceRestart,
  getSelectedCountForKeyword,
  isBriefSelected,
  handleSelectBrief,
  getDifficultyColor,
}: BriefsErrorStateProps) {
  return (
    <div className="space-y-6">
      <Card className="text-center bg-red-50 border-red-200">
        <CardContent className="pt-6">
          <div className="mb-4">
            <AlertCircle className="mx-auto mb-3 w-12 h-12 text-red-500" />
            <h3 className="mb-2 text-lg font-semibold text-red-800">
              Generation Failed
            </h3>
            <p className="text-red-600">{error}</p>
          </div>
          <div className="flex gap-2 justify-center">
            <Button onClick={onTryAgain} disabled={keywords.length === 0}>
              <RotateCcw className="mr-2 w-4 h-4" />
              Try Again
            </Button>
            <Button variant="outline" onClick={onBackToStart}>
              Back to Start
            </Button>
            {canForceRestart && onForceRestart && (
              <Button
                variant="outline"
                onClick={onForceRestart}
                className="text-orange-700 bg-orange-50 border-orange-200 hover:bg-orange-100"
                disabled={keywords.length === 0}
              >
                Force Restart
              </Button>
            )}
          </div>
          {canForceRestart && (
            <p className="mt-3 text-sm text-muted-foreground">
              If you're sure the previous generation is stuck, click "Force
              Restart" to override it.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Show existing briefs if any */}
      {Object.keys(briefs).length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Previously Generated Briefs</h3>
          <div className="space-y-4">
            {Object.entries(briefs).map(([keyword, briefList]) => (
              <BriefKeywordSection
                key={keyword}
                keyword={keyword}
                briefList={briefList}
                getSelectedCountForKeyword={getSelectedCountForKeyword}
                isBriefSelected={isBriefSelected}
                handleSelectBrief={handleSelectBrief}
                getDifficultyColor={getDifficultyColor}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
