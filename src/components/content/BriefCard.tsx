import { ContentBrief } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, CheckCircle2, Circle } from 'lucide-react';

interface BriefCardProps {
  brief: ContentBrief;
  isSelected: boolean;
  onSelect: (brief: ContentBrief) => void;
  getDifficultyColor: (difficulty: string) => string;
}

export function BriefCard({
  brief,
  isSelected,
  onSelect,
  getDifficultyColor,
}: BriefCardProps) {
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
              {brief.target}
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
        <Badge variant="outline" className="w-fit">
          {brief.intent}
        </Badge>

        <div className="flex justify-between items-center text-sm">
          <div className="flex gap-4 items-center">
            <div>
              <span className="text-muted-foreground">Volume: </span>
              <span className="font-medium">
                {brief.searchVolume?.toLocaleString()}
              </span>
            </div>
            <Badge
              variant="secondary"
              className={getDifficultyColor(brief.difficulty || 'Medium')}
            >
              {brief.difficulty}
            </Badge>
          </div>
        </div>

        {brief.description && (
          <p className="text-sm text-muted-foreground">{brief.description}</p>
        )}
      </CardContent>
    </Card>
  );
}
