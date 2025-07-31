import { useState, useCallback, useRef, useEffect } from 'react';
import { ExpandedKeyword } from '@/lib/keyword-expansion/types';

export const useKeywordExpansion = () => {
  const [expandedKeywords, setExpandedKeywords] = useState<{
    [lang: string]: ExpandedKeyword[];
  }>({});
  const [isExpanding, setIsExpanding] = useState(false);
  const [progress, setProgress] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const isExpandingRef = useRef(false);
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    isExpandingRef.current = isExpanding;
  }, [isExpanding]);

  const resetProgress = useCallback(() => {
    setProgress(null);
    setError(null);
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  }, []);

  const pollProgress = useCallback(async () => {
    const currentSessionId = sessionId;
    if (!currentSessionId || !isExpandingRef.current) {
      console.log('Polling stopped: No session ID or not expanding.');
      return;
    }

    try {
      const url = `/api/keywords/expand?sessionId=${currentSessionId}&t=${new Date().getTime()}`;
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          console.log('Session not found - expansion may have completed');
          setIsExpanding(false);
          return;
        }
        throw new Error(`HTTP ${response.status}: Failed to fetch progress`);
      }

      const data = await response.json();
      setProgress(data);

      // 🔥 FIXED: Merge new results with existing ones for real-time updates
      if (data.results) {
        console.log('🔄 Processing data.results:', Object.keys(data.results));
        setExpandedKeywords((prevKeywords) => {
          const newKeywords = { ...prevKeywords };
          for (const lang in data.results) {
            const langResults = data.results[lang] || [];
            console.log(
              `📋 Processing ${langResults.length} results for language: ${lang}`
            );

            const existingKeywordMap = new Map(
              (newKeywords[lang] || []).map((k) => [k.keyword, k])
            );

            // Process all results from expansion (including seed keywords with trends data)
            langResults.forEach((newKeyword: ExpandedKeyword) => {
              const isSeeedKeyword = newKeyword.source === 'seed';
              const existingKeyword = existingKeywordMap.get(
                newKeyword.keyword
              );

              // Debug metadata
              // Infer metadata if missing
              if (
                !newKeyword.timeRange &&
                newKeyword.interestOverTime &&
                newKeyword.interestOverTime.length > 0
              ) {
                const dates = newKeyword.interestOverTime
                  .map((item) => new Date(item.date))
                  .sort((a, b) => a.getTime() - b.getTime());
                const startDate = dates[0];
                const endDate = dates[dates.length - 1];

                if (startDate && endDate) {
                  const diffInDays = Math.floor(
                    (endDate.getTime() - startDate.getTime()) /
                      (1000 * 60 * 60 * 24)
                  );
                  const diffInMonths = Math.floor(diffInDays / 30);

                  if (diffInDays <= 1) {
                    newKeyword.timeRange = 'Past day';
                  } else if (diffInDays <= 7) {
                    newKeyword.timeRange = 'Past 7 days';
                  } else if (diffInDays <= 30) {
                    newKeyword.timeRange = 'Past 30 days';
                  } else if (diffInMonths <= 3) {
                    newKeyword.timeRange = 'Past 3 months';
                  } else if (diffInMonths <= 12) {
                    newKeyword.timeRange = 'Past 12 months';
                  } else {
                    newKeyword.timeRange = 'Past 5 years';
                  }
                  console.log(
                    `🔮 Inferred time range for "${newKeyword.keyword}": ${newKeyword.timeRange} (${diffInDays} days)`
                  );
                }
              }

              if (!newKeyword.geo) {
                newKeyword.geo = 'Worldwide';
                console.log(
                  `🌍 Defaulting geo for "${newKeyword.keyword}" to: Worldwide`
                );
              }

              console.log(`🔍 Processing keyword "${newKeyword.keyword}":`, {
                timeRange: newKeyword.timeRange,
                geo: newKeyword.geo,
                source: newKeyword.source,
                hasInterestOverTime: !!newKeyword.interestOverTime,
                hasInterestByRegion: !!newKeyword.interestByRegion,
              });

              if (existingKeyword) {
                console.log(
                  `🔄 Updating ${
                    isSeeedKeyword ? 'SEED' : 'related'
                  } keyword: "${newKeyword.keyword}"`
                );
                // Update existing keyword with trends data and clear fetching state
                const updatedKeyword = {
                  ...existingKeyword,
                  ...newKeyword,
                  isFetching: false, // Clear fetching state
                  error: undefined,
                };
                existingKeywordMap.set(newKeyword.keyword, updatedKeyword);

                console.log(`📊 Updated keyword metadata:`, {
                  timeRange: updatedKeyword.timeRange,
                  geo: updatedKeyword.geo,
                });

                if (isSeeedKeyword) {
                  console.log(
                    `✅ Seed keyword "${newKeyword.keyword}" updated with trends:`,
                    {
                      hasInterestOverTime: !!newKeyword.interestOverTime,
                      hasRelatedQueries: !!newKeyword.relatedQueries,
                      hasRelatedTopics: !!newKeyword.relatedTopics,
                      timeRange: updatedKeyword.timeRange,
                      geo: updatedKeyword.geo,
                    }
                  );
                }
              } else {
                console.log(
                  `➕ Adding new ${
                    isSeeedKeyword ? 'SEED' : 'related'
                  } keyword: "${newKeyword.keyword}"`
                );
                // Add new keyword
                const newKeywordData = {
                  ...newKeyword,
                  isFetching: false,
                };
                existingKeywordMap.set(newKeyword.keyword, newKeywordData);

                console.log(`📊 New keyword metadata:`, {
                  timeRange: newKeywordData.timeRange,
                  geo: newKeywordData.geo,
                });
              }
            });

            newKeywords[lang] = Array.from(existingKeywordMap.values());
          }
          return newKeywords;
        });
      }

      // 🔥 NEW: Also check for intermediate results that might contain seed keywords with trends data
      console.log('🔍 Checking intermediateResults:', {
        exists: !!data.intermediateResults,
        type: typeof data.intermediateResults,
        keys: data.intermediateResults
          ? Object.keys(data.intermediateResults)
          : [],
        data: data.intermediateResults,
      });

      if (
        data.intermediateResults &&
        Object.keys(data.intermediateResults).length > 0
      ) {
        console.log('✅ Processing intermediateResults for UI update');
        setExpandedKeywords((prevKeywords) => {
          const newKeywords = { ...prevKeywords };
          for (const lang in data.intermediateResults) {
            const langResults = data.intermediateResults[lang] || [];
            console.log(
              `Updating ${langResults.length} seed keywords for language: ${lang}`
            );

            langResults.forEach((resultKeyword: any) => {
              const hasAnyTrendData =
                resultKeyword.interestOverTime ||
                resultKeyword.relatedQueries ||
                resultKeyword.relatedTopics ||
                resultKeyword.interestByRegion;

              const existingKeywords = newKeywords[lang] || [];
              const existingIndex = existingKeywords.findIndex(
                (k) => k.keyword === resultKeyword.keyword
              );

              if (existingIndex >= 0) {
                console.log(
                  `✅ Updating "${resultKeyword.keyword}" - trends: ${
                    hasAnyTrendData ? 'YES' : 'NO'
                  }`
                );
                // 🔥 FIXED: Always update seed keyword, regardless of trend data availability
                existingKeywords[existingIndex] = {
                  ...existingKeywords[existingIndex],
                  interestOverTime:
                    resultKeyword.interestOverTime ||
                    existingKeywords[existingIndex].interestOverTime,
                  interestByRegion:
                    resultKeyword.interestByRegion ||
                    existingKeywords[existingIndex].interestByRegion,
                  relatedQueries:
                    resultKeyword.relatedQueries ||
                    existingKeywords[existingIndex].relatedQueries,
                  relatedTopics:
                    resultKeyword.relatedTopics ||
                    existingKeywords[existingIndex].relatedTopics,
                  isFetching: false, // Always set to false so UI stops showing "fetching"
                  error: undefined,
                };
                newKeywords[lang] = [...existingKeywords];
              } else {
                console.log(
                  `Keyword "${resultKeyword.keyword}" not found in existing keywords`
                );
              }
            });
          }
          return newKeywords;
        });
      }

      if (data.isCompleted) {
        setIsExpanding(false);

        // 🔥 FIXED: Clean up duplicates and keywords without trends data when expansion completes
        setExpandedKeywords((prevKeywords) => {
          const cleanedKeywords = { ...prevKeywords };
          Object.keys(cleanedKeywords).forEach((lang) => {
            const keywords = cleanedKeywords[lang];
            const seenKeywords = new Map<string, ExpandedKeyword>();

            keywords.forEach((keyword) => {
              const existing = seenKeywords.get(keyword.keyword);
              const hasTrendsData = !!(
                (keyword.interestOverTime &&
                  keyword.interestOverTime.length > 0) ||
                (keyword.relatedQueries &&
                  (keyword.relatedQueries.top?.length ||
                    keyword.relatedQueries.rising?.length)) ||
                (keyword.relatedTopics &&
                  (keyword.relatedTopics.top?.length ||
                    keyword.relatedTopics.rising?.length)) ||
                (keyword.interestByRegion &&
                  keyword.interestByRegion.length > 0)
              );

              if (!existing) {
                // Only add seed keywords that have trends data, or all related keywords
                if (keyword.source !== 'seed' || hasTrendsData) {
                  seenKeywords.set(keyword.keyword, {
                    ...keyword,
                    isFetching: false,
                    error: undefined,
                  });
                }
              } else {
                // Handle duplicates: prefer the one with trends data
                const existingHasTrends = !!(
                  (existing.interestOverTime &&
                    existing.interestOverTime.length > 0) ||
                  (existing.relatedQueries &&
                    (existing.relatedQueries.top?.length ||
                      existing.relatedQueries.rising?.length)) ||
                  (existing.relatedTopics &&
                    (existing.relatedTopics.top?.length ||
                      existing.relatedTopics.rising?.length)) ||
                  (existing.interestByRegion &&
                    existing.interestByRegion.length > 0)
                );

                if (hasTrendsData && !existingHasTrends) {
                  console.log(
                    `🔄 Final cleanup: Replacing "${keyword.keyword}" - new has trends, existing doesn't`
                  );
                  seenKeywords.set(keyword.keyword, {
                    ...keyword,
                    isFetching: false,
                    error: undefined,
                  });
                } else if (hasTrendsData && existingHasTrends) {
                  // Both have trends, merge them
                  seenKeywords.set(keyword.keyword, {
                    ...existing,
                    ...keyword,
                    isFetching: false,
                    error: undefined,
                  });
                }
                // If new doesn't have trends but existing does, keep existing
              }
            });

            cleanedKeywords[lang] = Array.from(seenKeywords.values());
            console.log(
              `🧹 Final cleanup for ${lang}: ${cleanedKeywords[lang].length} keywords (removed duplicates and trends-less seeds)`
            );
          });

          return cleanedKeywords;
        });

        if (data.error) {
          setError(data.error);
        } else {
          console.log(
            '✅ Keyword expansion completed successfully with cleanup'
          );
        }
        return;
      }

      if (isExpandingRef.current) {
        pollTimeoutRef.current = setTimeout(pollProgress, 2000);
      }
    } catch (e) {
      console.error('Progress polling error:', e);
      setError(e instanceof Error ? e.message : 'Failed to fetch progress');
      setIsExpanding(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || !isExpanding) {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
      return;
    }
    pollProgress();

    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
    };
  }, [sessionId, isExpanding, pollProgress]);

  const stopExpansion = useCallback(async () => {
    if (!sessionId) return;
    setIsExpanding(false);

    try {
      const response = await fetch('/api/keywords/expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'stop',
          sessionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to stop expansion');
      }

      console.log('Expansion stopped successfully');
    } catch (err) {
      console.error('Stop expansion error:', err);
      setError(err instanceof Error ? err.message : 'Failed to stop expansion');
    } finally {
      // Clean up frontend state
      setSessionId(null);
      resetProgress();
      setProgress((prev: any) =>
        prev
          ? {
              ...prev,
              logs: [...(prev.logs || []), '⚠️ Stopped by user.'],
              isCompleted: true,
            }
          : null
      );
    }
  }, [sessionId, resetProgress]);

  const startExpansion = useCallback(
    async (
      seedKeywords: string[],
      selectedCountries: string[],
      selectedApis: string[],
      useSerpApi: boolean = false,
      timeRange: string = 'today 3-m',
      browserInfo: { debugPort?: number }
    ) => {
      console.log('✨ Starting Keyword Expansion');
      resetProgress();
      setIsExpanding(true);
      setError(null);

      // 🔥 FIXED: Don't populate seed keywords initially to avoid duplicates
      // They will be added when actual trends data is available
      setExpandedKeywords({});

      if (seedKeywords.length === 0 || selectedCountries.length === 0) {
        setError('Seed keywords and at least one country must be selected.');
        setIsExpanding(false);
        return;
      }

      try {
        const response = await fetch('/api/keywords/expand', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            seedKeywords,
            countries: selectedCountries,
            selectedApis,
            useSerpApi,
            timeRange,
            browserInfo, // Send browser info on start
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || `HTTP ${response.status}: Failed to start expansion`
          );
        }

        setSessionId(data.sessionId);
        pollTimeoutRef.current = setTimeout(pollProgress, 1000);
      } catch (e: any) {
        console.error('💥 Expansion error:', e);
        setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        setIsExpanding(false);
        setSessionId(null);
      }
    },
    [resetProgress]
  );

  useEffect(() => {
    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, []);

  const onFetchTrends = useCallback(
    async (keyword: string, forceRefetch: boolean = false) => {
      if (!sessionId) {
        console.warn('No session ID available for fetching trends');
        return;
      }

      console.log(`Fetching trends for keyword: "${keyword}"`);

      setExpandedKeywords((prev) =>
        Object.keys(prev).reduce((acc, lang) => {
          acc[lang] = prev[lang].map((k) =>
            k.keyword === keyword
              ? { ...k, isFetching: true, error: undefined }
              : k
          );
          return acc;
        }, {} as { [lang: string]: ExpandedKeyword[] })
      );

      try {
        const response = await fetch(`/api/trends/fetch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            keywords: [keyword],
            forceRefetch,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Trends fetch failed:`, response.status, errorText);
          throw new Error(
            `Failed to fetch trends: ${response.status} ${errorText}`
          );
        }

        const data = await response.json();
        console.log(`Received trends data for "${keyword}":`, data);

        setExpandedKeywords((prev) =>
          Object.keys(prev).reduce((acc, lang) => {
            acc[lang] = prev[lang].map((k) =>
              k.keyword === keyword
                ? {
                    ...k,
                    interestOverTime:
                      data.interestOverTime || k.interestOverTime,
                    interestByRegion:
                      data.interestByRegion || k.interestByRegion,
                    relatedQueries: data.relatedQueries || k.relatedQueries,
                    relatedTopics: data.relatedTopics || k.relatedTopics,
                    isFetching: false,
                    error: undefined,
                  }
                : k
            );
            return acc;
          }, {} as { [lang: string]: ExpandedKeyword[] })
        );

        console.log(`Successfully updated trends data for "${keyword}"`);
      } catch (error) {
        console.error(`Error fetching trends for "${keyword}":`, error);
        setExpandedKeywords((prev) =>
          Object.keys(prev).reduce((acc, lang) => {
            acc[lang] = prev[lang].map((k) =>
              k.keyword === keyword
                ? { ...k, isFetching: false, error: (error as Error).message }
                : k
            );
            return acc;
          }, {} as { [lang: string]: ExpandedKeyword[] })
        );
      }
    },
    [sessionId]
  );

  return {
    expandedKeywords,
    isExpanding,
    progress,
    error,
    startExpansion,
    stopExpansion,
    resetProgress,
    sessionId,
    onFetchTrends,
  };
};
