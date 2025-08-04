import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { GscPeriodUnit } from '@/types/keywords';
import { countryList } from '@/app/keywords/constants';
import { KeywordInputSection } from './KeywordInputSection';
import { UrlBadge } from './UrlBadge';

interface DataSourcesSectionProps {
  gscPeriodValue: number;
  setGscPeriodValue: (value: number) => void;
  gscPeriodUnit: GscPeriodUnit;
  setGscPeriodUnit: (unit: GscPeriodUnit) => void;
  gscCountry: string;
  setGscCountry: (country: string) => void;
  handleImportFromGsc: () => void;
  isGscLoading: boolean;
  websiteUrl: string;
  setWebsiteUrl: (url: string) => void;
  recentWebUrls: string[];
  removeWebUrl: (url: string) => void;
  keywordInputProps: {
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
  };
}

export const DataSourcesSection = ({
  gscPeriodValue,
  setGscPeriodValue,
  gscPeriodUnit,
  setGscPeriodUnit,
  gscCountry,
  setGscCountry,
  handleImportFromGsc,
  isGscLoading,
  websiteUrl,
  setWebsiteUrl,
  recentWebUrls,
  removeWebUrl,
  keywordInputProps,
}: DataSourcesSectionProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Data Sources</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-3">
        <p className="font-medium">Google Search Console</p>
        <div>
          <label className="block mb-2 text-sm font-medium">Website URL</label>
          <Input
            placeholder="https://your-website.com"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
          />
          <div className="flex flex-wrap gap-1 mt-2">
            {recentWebUrls.map((url) => (
              <UrlBadge
                key={url}
                url={url}
                onClick={() => setWebsiteUrl(url)}
                onRemove={() => removeWebUrl(url)}
              />
            ))}
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <Input
            type="number"
            value={gscPeriodValue}
            onChange={(e) =>
              setGscPeriodValue(parseInt(e.target.value, 10) || 1)
            }
            className="w-24"
            min="1"
          />
          <Select
            value={gscPeriodUnit}
            onValueChange={(value: GscPeriodUnit) => setGscPeriodUnit(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Days</SelectItem>
              <SelectItem value="month">Months</SelectItem>
              <SelectItem value="year">Years</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select
            value={gscCountry}
            onValueChange={(value) => setGscCountry(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {countryList.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          className="w-full"
          onClick={handleImportFromGsc}
          disabled={isGscLoading || !websiteUrl}
        >
          {isGscLoading ? 'Importing...' : 'Import from Google Search Console'}
        </Button>
      </div>
      <KeywordInputSection {...keywordInputProps} />
    </CardContent>
  </Card>
);
