import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface SeedKeywordsListProps {
  seedKeywords: string[];
  selectedKeywords: string[];
  setSelectedKeywords: (keywords: string[]) => void;
}

export const SeedKeywordsList: React.FC<SeedKeywordsListProps> = ({
  seedKeywords,
  selectedKeywords,
  setSelectedKeywords,
}) => {
  const handleSelectAll = () => {
    setSelectedKeywords([...seedKeywords]);
  };

  const handleSelectNone = () => {
    setSelectedKeywords([]);
  };

  const handleKeywordToggle = (keyword: string, checked: boolean) => {
    if (checked) {
      setSelectedKeywords([...selectedKeywords, keyword]);
    } else {
      setSelectedKeywords(selectedKeywords.filter((k) => k !== keyword));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seed Keywords</CardTitle>
        <CardDescription>
          Select the keywords you want to process.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {seedKeywords.length > 0 ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  All
                </Button>
                <Button variant="outline" size="sm" onClick={handleSelectNone}>
                  None
                </Button>
              </div>
              <span className="text-sm text-muted-foreground">
                {selectedKeywords.length} / {seedKeywords.length} selected
              </span>
            </div>

            <div className="overflow-y-auto mt-2 space-y-2 max-h-60">
              {seedKeywords.map((keyword) => (
                <div
                  key={keyword}
                  className="flex items-center p-2 space-x-2 rounded hover:bg-muted/30"
                >
                  <Checkbox
                    id={`keyword-${keyword}`}
                    checked={selectedKeywords.includes(keyword)}
                    onCheckedChange={(checked) =>
                      handleKeywordToggle(keyword, !!checked)
                    }
                  />
                  <Label
                    htmlFor={`keyword-${keyword}`}
                    className="flex-1 text-sm cursor-pointer"
                  >
                    {keyword}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-10 text-center">
            <p className="text-muted-foreground">No seed keywords found.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
