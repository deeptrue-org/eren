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
        let errorDetails = null;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          errorDetails = errorData.details || null;
        } catch (parseError) {
          // If we can't parse the error response, get the text
          try {
            const errorText = await response.text();
            errorMessage = `API Error: ${response.status} ${response.statusText}`;
            console.error('🚨 Raw Error Response:', errorText);
          } catch (textError) {
            errorMessage = `API Error: ${response.status} ${response.statusText}`;
          }
        }
        console.error('🚨 Optimization API Error:', {
          status: response.status,
          statusText: response.statusText,
          message: errorMessage,
          details: errorDetails,
          url: response.url,
        });
        throw new Error(errorMessage);
      }

      let result: OptimizationResult;
      try {
        const responseText = await response.text();
        console.log(
          '📥 Raw API Response:',
          responseText.substring(0, 500) + '...'
        );

        result = JSON.parse(responseText);
        setOptimizationResult(result);
        console.log(
          briefId
            ? '✅ Context-aware analysis complete:'
            : '✅ Web search-based analysis complete:',
          result
        );
      } catch (parseError) {
        console.error('❌ Failed to parse API response:', parseError);
        throw new Error('Invalid JSON response from API');
      }
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
