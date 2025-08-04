import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { XCircle } from 'lucide-react';

interface KeywordInputSectionProps {
  manualKeywords: string[];
  currentManualKeyword: string;
  setCurrentManualKeyword: (keyword: string) => void;
  handleManualKeywordKeyDown: (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => void;
  handleRemoveManualKeyword: (keyword: string) => void;
  excludeKeywords: string[];
  currentExcludeKeyword: string;
  setCurrentExcludeKeyword: (keyword: string) => void;
  handleExcludeKeywordKeyDown: (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => void;
  handleRemoveExcludeKeyword: (keyword: string) => void;
  useContainsExclusion: boolean;
  setUseContainsExclusion: (use: boolean) => void;
}

export const KeywordInputSection = ({
  manualKeywords,
  currentManualKeyword,
  setCurrentManualKeyword,
  handleManualKeywordKeyDown,
  handleRemoveManualKeyword,
  excludeKeywords,
  currentExcludeKeyword,
  setCurrentExcludeKeyword,
  handleExcludeKeywordKeyDown,
  handleRemoveExcludeKeyword,
  useContainsExclusion,
  setUseContainsExclusion,
}: KeywordInputSectionProps) => (
  <div className="space-y-2">
    <div className="space-y-2">
      <label className="block text-sm font-medium">Manual Seed Keywords</label>
      <div className="flex flex-wrap content-start items-center gap-2 p-2 border rounded-md min-h-[8rem] bg-background">
        {manualKeywords.map((keyword) => (
          <Badge key={keyword} variant="secondary" className="gap-1">
            {keyword}
            <XCircle
              className="w-3 h-3 cursor-pointer hover:text-destructive"
              onClick={() => handleRemoveManualKeyword(keyword)}
            />
          </Badge>
        ))}
        <Input
          className="flex-grow h-auto p-0 bg-transparent border-0 shadow-none focus-visible:ring-0 min-w-[120px]"
          placeholder="Type and press Enter"
          value={currentManualKeyword}
          onChange={(e) => setCurrentManualKeyword(e.target.value)}
          onKeyDown={handleManualKeywordKeyDown}
        />
      </div>
    </div>
    <div className="space-y-2">
      <label className="block text-sm font-medium">Exclude Keywords</label>
      <div className="flex flex-wrap content-start items-center gap-2 p-2 border rounded-md min-h-[6rem] bg-background">
        {excludeKeywords.map((keyword) => (
          <Badge key={keyword} variant="secondary" className="gap-1">
            {keyword}
            <XCircle
              className="w-3 h-3 cursor-pointer hover:text-destructive"
              onClick={() => handleRemoveExcludeKeyword(keyword)}
            />
          </Badge>
        ))}
        <Input
          className="flex-grow h-auto p-0 bg-transparent border-0 shadow-none focus-visible:ring-0 min-w-[120px]"
          placeholder="Type and press Enter"
          value={currentExcludeKeyword}
          onChange={(e) => setCurrentExcludeKeyword(e.target.value)}
          onKeyDown={handleExcludeKeywordKeyDown}
        />
      </div>
      <div className="flex items-center mt-2 space-x-2">
        <Checkbox
          id="contains-exclusion"
          checked={useContainsExclusion}
          onCheckedChange={(checked) => setUseContainsExclusion(!!checked)}
        />
        <label
          htmlFor="contains-exclusion"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Use 'contains' matching for exclusions
        </label>
      </div>
    </div>
  </div>
);
