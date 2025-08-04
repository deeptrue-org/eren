import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface ImprovementPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  originalContent: string;
  improvedContent: string;
  improvementSummary: string[];
  onApply: (content: string) => void;
  onReject: () => void;
  isApplying?: boolean;
}

export function ImprovementPreviewDialog({
  isOpen,
  onClose,
  originalContent,
  improvedContent,
  improvementSummary,
  onApply,
  onReject,
  isApplying = false,
}: ImprovementPreviewDialogProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'comparison'>(
    'preview'
  );

  const handleApply = () => {
    onApply(improvedContent);
  };

  const handleReject = () => {
    onReject();
    onClose();
  };

  // 간단한 diff 표시를 위한 유틸리티 함수
  const renderContentWithHighlights = (
    content: string,
    isOriginal: boolean
  ) => {
    const lines = content.split('\n');
    return lines.map((line, index) => (
      <div
        key={index}
        className={`mb-2 p-2 rounded-md ${
          isOriginal
            ? 'bg-red-50 border-l-4 border-red-200'
            : 'bg-green-50 border-l-4 border-green-200'
        }`}
      >
        <span className={isOriginal ? 'text-red-800' : 'text-green-800'}>
          {line || '\u00A0'}
        </span>
      </div>
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Content Improvement Preview
          </DialogTitle>
          <DialogDescription>
            Review the comprehensive improvements made to your content. You can
            compare the changes or preview the final result.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as 'preview' | 'comparison')
            }
            className="flex-1 flex flex-col"
          >
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Improved Content
              </TabsTrigger>
              <TabsTrigger
                value="comparison"
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Side-by-Side Comparison
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="flex-1 flex flex-col">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">
                {/* Improved Content */}
                <div className="lg:col-span-2 flex flex-col">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-green-600" />
                    Improved Content
                  </h3>
                  <div className="flex-1 h-96 border rounded-lg p-4 bg-green-50 overflow-y-auto">
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                        {improvedContent}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Improvement Summary */}
                <div className="flex flex-col">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    Improvements Made
                  </h3>
                  <div className="flex-1 h-96 overflow-y-auto">
                    <div className="space-y-2">
                      {improvementSummary.map((improvement, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200"
                        >
                          <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-blue-800">
                            {improvement}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="comparison" className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                {/* Original Content */}
                <div className="flex flex-col">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-red-600" />
                    Original Content
                    <Badge variant="secondary">Before</Badge>
                  </h3>
                  <div className="flex-1 h-96 border rounded-lg p-4 overflow-y-auto">
                    <div className="space-y-1">
                      {renderContentWithHighlights(originalContent, true)}
                    </div>
                  </div>
                </div>

                {/* Improved Content */}
                <div className="flex flex-col">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-green-600" />
                    Improved Content
                    <Badge variant="default">After</Badge>
                  </h3>
                  <div className="flex-1 h-96 border rounded-lg p-4 overflow-y-auto">
                    <div className="space-y-1">
                      {renderContentWithHighlights(improvedContent, false)}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t flex-shrink-0">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowRight className="w-4 h-4" />
              <span>This will replace your current content</span>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleReject}
                disabled={isApplying}
              >
                <XCircle className="mr-2 w-4 h-4" />
                Keep Original
              </Button>
              <Button
                onClick={handleApply}
                disabled={isApplying}
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
              >
                {isApplying ? (
                  <>
                    <Sparkles className="mr-2 w-4 h-4 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 w-4 h-4" />
                    Apply Improvements
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
