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
import { Textarea } from '@/components/ui/textarea';
import { Search, Lightbulb, Loader2, Bot, Pencil } from 'lucide-react';

interface BriefsStartScreenProps {
  keywords: string[];
  isLoading: boolean;
  onStartGeneration: (generationMode: 'ai' | 'fixed') => void;
  hasExistingBriefs?: boolean;
  generationMode: 'ai' | 'fixed';
  setGenerationMode: (mode: 'ai' | 'fixed') => void;
  userContext: string;
  setUserContext: (value: string) => void;
}

export function BriefsStartScreen({
  keywords,
  isLoading,
  onStartGeneration,
  hasExistingBriefs = false,
  generationMode,
  setGenerationMode,
  userContext,
  setUserContext,
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

          {/* User Guidance / Context */}
          <div className="p-4 rounded-lg border bg-background">
            <h4 className="mb-2 text-sm font-medium">
              Guidance / Context (optional)
            </h4>
            <p className="mb-3 text-sm text-muted-foreground">
              Tell the writer how you want the briefs shaped (target audience,
              tone, constraints, preferred angle, examples, etc.).
            </p>
            <Textarea
              placeholder="e.g., Focus on B2B buyers at evaluation stage, pragmatic tone, include real integration examples and ROI framing. Avoid generic marketing fluff."
              value={userContext}
              onChange={(e) => setUserContext(e.target.value)}
              className="min-h-[120px]"
            />
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
                  <div className="flex gap-2 items-center font-semibold">
                    <Bot className="w-4 h-4" />
                    AI-Powered Autonomous Mode
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Let the AI analyze the data and autonomously decide 5 strong
                    angles aligned with current SERP evidence. More creative and
                    diverse results.
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
                  <div className="flex gap-2 items-center font-semibold">
                    <Pencil className="w-4 h-4" />
                    Structured Mode
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Generate 5 well-organized briefs with consistent structure
                    and clear differentiation. No forced categories; SERP
                    evidence should drive angle.
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
