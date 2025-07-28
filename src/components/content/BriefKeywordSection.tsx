import { ContentBrief } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

import { Search } from 'lucide-react';
import { BriefCard } from './BriefCard';

interface BriefKeywordSectionProps {
  keyword: string;
  briefList: ContentBrief[];
  getSelectedCountForKeyword: (keyword: string) => number;
  isBriefSelected: (briefId: string) => boolean;
  handleSelectBrief: (brief: ContentBrief) => void;
  getDifficultyColor: (difficulty: string) => string;
}

export function BriefKeywordSection({
  keyword,
  briefList,
  getSelectedCountForKeyword,
  isBriefSelected,
  handleSelectBrief,
  getDifficultyColor,
}: BriefKeywordSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="flex gap-2 items-center">
            <Search className="w-5 h-5" />
            Keyword: <span className="text-primary">{keyword}</span>
          </CardTitle>
          <CardDescription>
            {briefList.length} content briefs generated
            {getSelectedCountForKeyword(keyword) > 0 &&
              ` (${getSelectedCountForKeyword(keyword)} selected)`}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {briefList.map((brief) => (
            <BriefCard
              key={brief.id}
              brief={brief}
              isSelected={isBriefSelected(brief.id)}
              onSelect={handleSelectBrief}
              getDifficultyColor={getDifficultyColor}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
