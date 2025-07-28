import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';

interface BriefsStatsProps {
  keywordsCount: number;
  totalBriefs: number;
  selectedBriefs: number;
}

export function BriefsStats({
  keywordsCount,
  totalBriefs,
  selectedBriefs,
}: BriefsStatsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex gap-2 items-center">
          <Lightbulb className="w-5 h-5" />
          Brief Generation Results
        </CardTitle>
        <CardDescription>
          {totalBriefs} content briefs generated for {keywordsCount} keywords
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">
              {keywordsCount}
            </div>
            <div className="text-sm text-muted-foreground">Keywords</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{totalBriefs}</div>
            <div className="text-sm text-muted-foreground">Briefs</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">
              {selectedBriefs}
            </div>
            <div className="text-sm text-muted-foreground">Selected</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
