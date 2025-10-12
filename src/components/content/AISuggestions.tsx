'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, X, Sparkles, Eye, GitCompare } from 'lucide-react';
import { diffLines, Change } from 'diff';

interface AISuggestionsProps {
  originalContent: string;
  suggestedContent: string | null;
  onApply: (content: string) => void;
  onReject: () => void;
}

export function AISuggestions({
  originalContent,
  suggestedContent,
  onApply,
  onReject,
}: AISuggestionsProps) {
  if (!suggestedContent) return null;

  const diffs = diffLines(originalContent, suggestedContent);
  const changeCount = diffs.filter(
    (change) => change.added || change.removed
  ).length;

  return (
    <Card className="mt-4 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex gap-2 justify-between items-center text-sm">
          <div className="flex gap-2 items-center">
            <Sparkles className="w-4 h-4 text-blue-600" />
            AI Suggestions
          </div>
          <div className="text-xs text-muted-foreground">
            {changeCount} changes detected
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Tabs defaultValue="diff" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="diff" className="flex gap-2 items-center">
              <GitCompare className="w-3 h-3" />
              Changes
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex gap-2 items-center">
              <Eye className="w-3 h-3" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="diff" className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Comparing changes:
            </div>
            <div className="overflow-y-auto p-4 max-h-96 font-mono text-xs bg-gray-50 rounded border">
              {diffs.map((change, index) => {
                let bgColor = '';
                let textColor = '';
                let prefix = '';

                if (change.added) {
                  bgColor = 'bg-green-100';
                  textColor = 'text-green-800';
                  prefix = '+ ';
                } else if (change.removed) {
                  bgColor = 'bg-red-100';
                  textColor = 'text-red-800';
                  prefix = '- ';
                } else {
                  bgColor = 'bg-white';
                  textColor = 'text-gray-600';
                  prefix = '  ';
                }

                return (
                  <div
                    key={index}
                    className={`whitespace-pre-wrap ${bgColor} ${textColor}`}
                  >
                    <span className="opacity-50 select-none">{prefix}</span>
                    {change.value}
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Full updated content ({suggestedContent.length} characters):
            </div>
            <div className="overflow-y-auto p-4 max-h-96 font-mono text-xs text-black bg-blue-50 rounded border">
              <div className="whitespace-pre-wrap">{suggestedContent}</div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2">
          <Button size="sm" onClick={() => onApply(suggestedContent)}>
            <Check className="mr-1 w-3 h-3" />
            Apply Changes
          </Button>
          <Button variant="outline" size="sm" onClick={onReject}>
            <X className="mr-1 w-3 h-3" />
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
