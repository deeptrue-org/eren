import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { countries } from './types';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TimeRange } from '@/lib/keyword-expansion/serpapi-service';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface SerpApiAccount {
  total_searches_left: number;
  plan_searches_left: number;
  api_key: string;
}

interface SettingsPanelProps {
  apiSource: string;
  selectedCountries: string[];
  timeRange: TimeRange;
  serpApiAccount: SerpApiAccount | null;
  onApiSourceChange: (source: string) => void;
  onCountriesChange: (countries: string[]) => void;
  onTimeRangeChange: (range: TimeRange) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  apiSource,
  selectedCountries,
  timeRange,
  serpApiAccount,
  onApiSourceChange,
  onCountriesChange,
  onTimeRangeChange,
}) => {
  const handleCountryToggle = (countryValue: string) => {
    const newSelection = selectedCountries.includes(countryValue)
      ? selectedCountries.filter((c) => c !== countryValue)
      : [...selectedCountries, countryValue];
    onCountriesChange(newSelection);
  };

  const isSerpApiSelected = apiSource === 'serpapi';

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
        <CardTitle>Data Sources</CardTitle>
        <CardDescription>
          Select the data sources and countries for expansion.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">APIs</h3>
          <RadioGroup
            value={apiSource}
            onValueChange={onApiSourceChange}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="trends" id="api-trends" />
              <Label htmlFor="api-trends">Google Trends</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="serpapi" id="api-serp" />
              <Label htmlFor="api-serp">
                SERP API
                {serpApiAccount && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (remaining {serpApiAccount.plan_searches_left} / 100 calls)
                  </span>
                )}
              </Label>
            </div>
          </RadioGroup>
        </div>
        {isSerpApiSelected && (
          <>
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Countries</h3>
              <Select onValueChange={(value) => handleCountryToggle(value)}>
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
              <div className="flex flex-wrap gap-2 pt-2">
                {selectedCountries.map((countryCode) => {
                  const country = countries.find(
                    (c) => c.value === countryCode
                  );
                  return (
                    <Badge key={countryCode} variant="secondary">
                      <span>{country?.label || countryCode}</span>
                      <button
                        onClick={() => handleCountryToggle(countryCode)}
                        className="ml-2 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      >
                        <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Time Range</h3>
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
          </>
        )}
      </CardContent>
    </Card>
  );
};
