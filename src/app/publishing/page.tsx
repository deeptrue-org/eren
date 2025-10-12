'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Loader2, Check, AlertCircle } from 'lucide-react';

export default function PublishingPage() {
  const [finalContent, setFinalContent] = useState<string>('');
  const [selectedBrief, setSelectedBrief] = useState<any>(null);
  const [activeArticle, setActiveArticle] = useState<any>(null);
  const [publishingOption, setPublishingOption] = useState<string>('notion');
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [publishResult, setPublishResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Load content from sessionStorage
  useEffect(() => {
    try {
      const storedContent = sessionStorage.getItem('finalizedContent');
      const storedBrief = sessionStorage.getItem('selectedBrief');
      const storedArticle = sessionStorage.getItem('activeArticle');

      if (storedContent) {
        setFinalContent(storedContent);
      }
      if (storedBrief) {
        setSelectedBrief(JSON.parse(storedBrief));
      }
      if (storedArticle) {
        setActiveArticle(JSON.parse(storedArticle));
      }
    } catch (error) {
      console.error('Failed to load content from sessionStorage:', error);
      setFinalContent('Error loading content. Please go back and try again.');
    }
  }, []);

  const handlePublish = async () => {
    if (!finalContent.trim()) {
      setPublishResult({ success: false, message: 'No content to publish' });
      return;
    }

    setIsPublishing(true);
    setPublishResult(null);

    try {
      if (publishingOption === 'notion') {
        const response = await fetch('/api/publishing/notion', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: finalContent,
            title: activeArticle?.title || selectedBrief?.topic || 'Blog Post',
            keyword: activeArticle?.keyword || selectedBrief?.keyword,
          }),
        });

        const result = await response.json();

        if (response.ok) {
          setPublishResult({
            success: true,
            message: `Successfully published to Notion! Page URL: ${result.url}`,
          });
        } else {
          setPublishResult({
            success: false,
            message: result.error || 'Failed to publish to Notion',
          });
        }
      } else if (publishingOption === 'markdown') {
        // Download as Markdown
        const blob = new Blob([finalContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeArticle?.title || 'blog-post'}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setPublishResult({
          success: true,
          message: 'Markdown file downloaded successfully!',
        });
      } else if (publishingOption === 'html') {
        // Download as HTML
        const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>${activeArticle?.title || 'Blog Post'}</title>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1, h2, h3 { color: #333; }
        p { line-height: 1.6; }
    </style>
</head>
<body>
    <div>${finalContent.replace(/\n/g, '<br>')}</div>
</body>
</html>`;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeArticle?.title || 'blog-post'}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setPublishResult({
          success: true,
          message: 'HTML file downloaded successfully!',
        });
      }
    } catch (error) {
      console.error('Publishing error:', error);
      setPublishResult({
        success: false,
        message: 'An error occurred during publishing. Please try again.',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <>
      <div className="container py-8 mx-auto">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Publish Your Content</CardTitle>
              <CardDescription>
                Your content is ready. Choose a publishing option below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Content Preview */}
              <div className="p-4 rounded-md border bg-muted">
                <h3 className="mb-2 text-lg font-semibold">Content Preview</h3>
                <pre className="p-4 font-sans text-sm whitespace-pre-wrap bg-white rounded-md dark:bg-gray-900">
                  {finalContent.trim()}
                </pre>
              </div>

              {/* Publishing Options */}
              <div>
                <h3 className="mb-4 text-lg font-semibold">
                  Publishing Options
                </h3>
                <RadioGroup
                  value={publishingOption}
                  onValueChange={setPublishingOption}
                  className="space-y-4"
                >
                  <div className="flex items-center p-4 rounded-md border">
                    <RadioGroupItem value="notion" id="notion" />
                    <Label htmlFor="notion" className="ml-3">
                      <span className="block font-semibold">
                        Publish to Notion
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Automatically send the content to your Notion workspace.
                      </span>
                    </Label>
                  </div>
                  <div className="flex items-center p-4 rounded-md border">
                    <RadioGroupItem value="markdown" id="markdown" />
                    <Label htmlFor="markdown" className="ml-3">
                      <span className="block font-semibold">
                        Download as Markdown
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Save the content as a .md file.
                      </span>
                    </Label>
                  </div>
                  <div className="flex items-center p-4 rounded-md border">
                    <RadioGroupItem value="html" id="html" />
                    <Label htmlFor="html" className="ml-3">
                      <span className="block font-semibold">
                        Download as HTML
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Save the content as a .html file.
                      </span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Publishing Result */}
              {publishResult && (
                <div
                  className={`p-4 rounded-md border ${
                    publishResult.success
                      ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                      : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                  }`}
                >
                  <div className="flex gap-2 items-center">
                    {publishResult.success ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span
                      className={`font-medium ${
                        publishResult.success
                          ? 'text-green-800'
                          : 'text-red-800'
                      }`}
                    >
                      {publishResult.message}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  size="lg"
                  onClick={handlePublish}
                  disabled={isPublishing || !finalContent.trim()}
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    'Publish Now'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="container py-8 mx-auto">
        <div className="flex justify-between">
          <Link href="/content/review">
            <Button variant="outline">← Back to Review</Button>
          </Link>
          <Link href="/dashboard">
            <Button>Finish & Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    </>
  );
}
