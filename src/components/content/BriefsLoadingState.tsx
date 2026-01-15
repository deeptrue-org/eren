import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

interface BriefsLoadingStateProps {
  processingKeyword: string;
  progress: number;
  logs: string[];
}

export function BriefsLoadingState({
  processingKeyword,
  progress,
  logs,
}: BriefsLoadingStateProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">
            Generating Content Briefs...
          </h3>

          {processingKeyword && (
            <p className="text-sm text-primary">
              Currently processing: "{processingKeyword}"
            </p>
          )}
          <Progress value={progress} className="mx-auto w-full max-w-md" />

          {logs.length > 0 && (
            <Card className="mt-4 text-left">
              <CardContent className="overflow-y-auto p-4 h-48 text-sm text-muted-foreground">
                {logs.map((log, index) => (
                  <p key={index} className="mb-1">
                    {log}
                  </p>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
