import { useState } from 'react';
import { OptimizationResult } from '@/types/content';

export function useOptimization() {
  const [optimizationResult, setOptimizationResult] =
    useState<OptimizationResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeContent = async (
    content: string,
    keyword: string,
    briefId?: string
  ) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      console.log(
        briefId
          ? '🔍 Starting context-aware content analysis...'
          : '🔍 Starting content analysis with web search...'
      );

      const response = await fetch('/api/content/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          keyword,
          briefId,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to analyze content';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // If we can't parse the error response, use the status
          errorMessage = `API Error: ${response.status} ${response.statusText}`;
        }
        console.error('🚨 Optimization API Error:', {
          status: response.status,
          statusText: response.statusText,
          message: errorMessage,
        });
        throw new Error(errorMessage);
      }

      const result: OptimizationResult = await response.json();
      setOptimizationResult(result);
      console.log(
        briefId
          ? '✅ Context-aware analysis complete:'
          : '✅ Web search-based analysis complete:',
        result
      );
    } catch (err) {
      console.error('❌ Error analyzing content:', err);
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    optimizationResult,
    isAnalyzing,
    error,
    analyzeContent,
  };
}
