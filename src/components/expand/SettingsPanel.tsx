import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface SerpApiAccount {
  total_searches_left: number;
  plan_searches_left: number;
  api_key: string;
}

interface SettingsPanelProps {
  apiSource: string;
  serpApiAccount: SerpApiAccount | null;
  onApiSourceChange: (source: string) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  apiSource,
  serpApiAccount,
  onApiSourceChange,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Sources</CardTitle>
        <CardDescription>
          Select the data source for keyword expansion.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium">APIs</h3>
          <RadioGroup
            value={apiSource}
            onValueChange={onApiSourceChange}
            className="space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="trends" id="api-trends" />
                <Label htmlFor="api-trends" className="font-medium">
                  Google Trends
                </Label>
              </div>
              <p className="ml-6 text-xs text-muted-foreground">
                Browser-based data extraction. Requires manual trend data
                fetching for detailed insights.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="serpapi" id="api-serp" />
                <Label htmlFor="api-serp" className="font-medium">
                  SERP API
                  {serpApiAccount && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (remaining {serpApiAccount.plan_searches_left} / 250
                      calls)
                    </span>
                  )}
                </Label>
              </div>
              <p className="ml-6 text-xs text-muted-foreground">
                API-based service. Includes complete trend data automatically
                (charts, related queries, regional data).
              </p>
            </div>
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
};
