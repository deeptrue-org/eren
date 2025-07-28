import { useState, useCallback } from 'react';
import { ContentBrief } from '@/lib/types';
import { ContentOutline } from '@/types/content';

export function useOutlineGeneration() {
  const [outlines, setOutlines] = useState<ContentOutline[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<{ message: string; timestamp: string }[]>(
    []
  );

  const generateOutlines = async (briefsToProcess: ContentBrief[]) => {
    if (briefsToProcess.length === 0) return;

    setIsLoading(true);
    setError(null);
    setProgress(0);
    setLogs([]);

    try {
      console.log(
        '🚀 Starting outline generation for briefs:',
        briefsToProcess
      );

      const response = await fetch('/api/content/outlines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selectedBriefs: briefsToProcess, stream: true }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate outlines');
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
                setOutlines(data.results);
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

      console.log('✅ Outlines generated successfully');
    } catch (err) {
      console.error('❌ Error generating outlines:', err);
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const restoreOutlines = useCallback((savedOutlines: ContentOutline[]) => {
    setOutlines(savedOutlines);
    setProgress(100);
    console.log('✅ Outlines restored successfully');
  }, []);

  return {
    outlines,
    setOutlines,
    isLoading,
    error,
    progress,
    logs,
    generateOutlines,
    restoreOutlines,
  };
}
