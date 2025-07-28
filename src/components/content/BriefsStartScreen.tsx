import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Lightbulb, Loader2 } from 'lucide-react';

interface BriefsStartScreenProps {
  keywords: string[];
  isLoading: boolean;
  onStartGeneration: () => void;
  hasExistingBriefs?: boolean;
}

export function BriefsStartScreen({
  keywords,
  isLoading,
  onStartGeneration,
  hasExistingBriefs = false,
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
            {keywords.length} keywords
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

          <div className="p-4 rounded-lg border bg-muted/50">
            <h4 className="mb-2 text-sm font-medium">What we'll generate:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Target audience analysis</li>
              <li>• Search intent identification</li>
              <li>• Content angle suggestions</li>
              <li>• SEO difficulty assessment</li>
              <li>• Topic recommendations</li>
            </ul>
          </div>

          <div className="flex justify-center pt-4">
            <Button
              size="lg"
              onClick={onStartGeneration}
              className="px-8"
              disabled={isLoading || keywords.length === 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : hasExistingBriefs ? (
                <>
                  <Lightbulb className="mr-2 w-5 h-5" />
                  Regenerate Content Briefs
                </>
              ) : (
                <>
                  <Lightbulb className="mr-2 w-5 h-5" />
                  Generate Content Briefs
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
