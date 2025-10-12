import { useState, useCallback } from 'react';
import { ContentBrief } from '@/lib/types';

export interface ArticleResult {
  id: string;
  briefId: string;
  keyword: string;
  title: string;
  content: string;
  wordCount: number;
}

export function useArticleGeneration() {
  const [articles, setArticles] = useState<ArticleResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<{ message: string; timestamp: string }[]>(
    []
  );

  const generateArticles = async (briefsToProcess: ContentBrief[]) => {
    if (briefsToProcess.length === 0) return;

    setIsLoading(true);
    setError(null);
    setProgress(0);
    setLogs([]);

    try {
      console.log(
        '🚀 Starting article generation for briefs:',
        briefsToProcess
      );

      const response = await fetch('/api/content/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selectedBriefs: briefsToProcess, stream: true }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate articles');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((line) => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'log') {
                setLogs((prev) => [
                  ...prev,
                  { message: data.message, timestamp: data.timestamp },
                ]);
              } else if (data.type === 'complete') {
                setArticles(data.results);
                setProgress(100);
                break;
              } else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch (parseError) {
              console.error('Failed to parse SSE data:', parseError);
            }
          }
        }
      }

      console.log('✅ Articles generated successfully');
    } catch (err) {
      console.error('❌ Error generating articles:', err);
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const restoreArticles = useCallback((savedArticles: ArticleResult[]) => {
    setArticles(savedArticles);
    setProgress(100);
    console.log('✅ Articles restored successfully');
  }, []);

  return {
    articles,
    setArticles,
    isLoading,
    error,
    progress,
    logs,
    generateArticles,
    restoreArticles,
  };
}
