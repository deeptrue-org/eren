import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Search, Lightbulb, Loader2, Bot, Pencil } from 'lucide-react';

interface BriefsStartScreenProps {
  keywords: string[];
  isLoading: boolean;
  onStartGeneration: (generationMode: 'ai' | 'fixed') => void;
  hasExistingBriefs?: boolean;
  generationMode: 'ai' | 'fixed';
  setGenerationMode: (mode: 'ai' | 'fixed') => void;
}

export function BriefsStartScreen({
  keywords,
  isLoading,
  onStartGeneration,
  hasExistingBriefs = false,
  generationMode,
  setGenerationMode,
}: BriefsStartScreenProps) {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex gap-2 items-center">
            <Search className="w-5 h-5" />
            Ready to Generate Content Briefs
          </CardTitle>
          <CardDescription>
            We'll create detailed content briefs for the following{' '}
            {keywords.length} keywords. Choose your generation method below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Selected Keywords:
            </h4>
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword: string, index: number) => (
                <Badge key={index} variant="outline" className="text-sm">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>

          {/* Generation Mode Selection */}
          <div className="p-4 rounded-lg border bg-background">
            <h4 className="mb-4 text-sm font-medium">Generation Method:</h4>
            <RadioGroup
              value={generationMode}
              onValueChange={(value) =>
                setGenerationMode(value as 'ai' | 'fixed')
              }
              className="space-y-4"
            >
              <Label
                htmlFor="ai-mode"
                className="flex items-start p-4 rounded-md border cursor-pointer transition-all hover:border-primary data-[state=checked]:border-primary"
              >
                <RadioGroupItem value="ai" id="ai-mode" className="mt-1" />
                <div className="ml-4">
                  <div className="font-semibold flex items-center gap-2">
                    <Bot className="w-4 h-4" />
                    AI-Powered Autonomous Mode
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Let the AI analyze the data and autonomously decide the best
                    5 content angles (e.g., comparison, tutorial, trend
                    analysis). This provides more creative and diverse results.
                  </p>
                </div>
              </Label>
              <Label
                htmlFor="fixed-mode"
                className="flex items-start p-4 rounded-md border cursor-pointer transition-all hover:border-primary data-[state=checked]:border-primary"
              >
                <RadioGroupItem
                  value="fixed"
                  id="fixed-mode"
                  className="mt-1"
                />
                <div className="ml-4">
                  <div className="font-semibold flex items-center gap-2">
                    <Pencil className="w-4 h-4" />
                    Fixed Category Mode
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Generate briefs based on the 5 predefined categories:
                    Comparison, Tutorial, Trend, Guide, and Analysis. This
                    provides predictable and structured results.
                  </p>
                </div>
              </Label>
            </RadioGroup>
          </div>

          <div className="flex justify-center pt-4">
            <Button
              size="lg"
              onClick={() => onStartGeneration(generationMode)}
              className="px-8"
              disabled={isLoading || keywords.length === 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Lightbulb className="mr-2 w-5 h-5" />
                  {hasExistingBriefs
                    ? 'Regenerate Briefs'
                    : 'Generate Content Briefs'}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
