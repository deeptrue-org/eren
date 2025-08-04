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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { countries } from './types';
import { TimeRange } from '@/lib/keyword-expansion/serpapi-service';

interface SeedKeywordsListProps {
  seedKeywords: string[];
  selectedKeywords: string[];
  setSelectedKeywords: (keywords: string[]) => void;
  selectedCountry: string;
  onCountryChange: (country: string) => void;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  apiSource?: string; // Add apiSource to show appropriate settings
}

export const SeedKeywordsList: React.FC<SeedKeywordsListProps> = ({
  seedKeywords,
  selectedKeywords,
  setSelectedKeywords,
  selectedCountry,
  onCountryChange,
  timeRange,
  onTimeRangeChange,
  apiSource = 'trends',
}) => {
  console.log('🎯 SeedKeywordsList render:', {
    seedKeywords,
    selectedKeywords,
    selectedKeywordsLength: selectedKeywords.length,
    seedKeywordsLength: seedKeywords.length,
  });
  const handleSelectAll = () => {
    setSelectedKeywords([...seedKeywords]);
  };

  const handleSelectNone = () => {
    setSelectedKeywords([]);
  };

  const handleKeywordToggle = (keyword: string, checked: boolean) => {
    console.log(`🔄 Toggling keyword "${keyword}": ${checked}`);
    if (checked) {
      const newSelected = [...selectedKeywords, keyword];
      console.log('✅ Adding keyword, new selection:', newSelected);
      setSelectedKeywords(newSelected);
    } else {
      const newSelected = selectedKeywords.filter((k) => k !== keyword);
      console.log('❌ Removing keyword, new selection:', newSelected);
      setSelectedKeywords(newSelected);
    }
  };

  const timeRangeOptions = [
    { value: 'now 1-H' as TimeRange, label: 'Past hour' },
    { value: 'now 4-H' as TimeRange, label: 'Past 4 hours' },
    { value: 'now 1-d' as TimeRange, label: 'Past day' },
    { value: 'now 7-d' as TimeRange, label: 'Past 7 days' },
    { value: 'today 1-m' as TimeRange, label: 'Past 30 days' },
    { value: 'today 3-m' as TimeRange, label: 'Past 3 months' },
    { value: 'today 12-m' as TimeRange, label: 'Past 12 months' },
    { value: 'today 5-y' as TimeRange, label: 'Past 5 years' },
    { value: 'all' as TimeRange, label: 'All time' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seed Keywords</CardTitle>
        <CardDescription>
          Select the keywords you want to process.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Keywords Selection */}
          {seedKeywords.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Select Keywords</h3>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectNone}
                  >
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
          {/* Data Collection Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">
              {apiSource === 'trends'
                ? 'Google Trends Settings'
                : 'Data Collection Settings'}
            </h3>

            {/* Countries */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Country</Label>
              <Select value={selectedCountry} onValueChange={onCountryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {countries.map((country) => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Time Range */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Time Range
              </Label>
              <Select
                value={timeRange}
                onValueChange={(value) => onTimeRangeChange(value as TimeRange)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {timeRangeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
