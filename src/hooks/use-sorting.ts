import { useState, useMemo } from 'react';
import type {
  CollectedKeyword,
  SortConfig,
  SortableKey,
} from '../app/keywords/types';
import { TREND_ORDER } from '../app/keywords/constants';

export const useSorting = (
  collectedKeywords: CollectedKeyword[],
  getKeywordTrend: (k: CollectedKeyword) => string
) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({
    key: 'trend',
    direction: 'desc',
  });

  const handleSort = (key: SortableKey) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === 'desc'
    ) {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const sortedKeywords = useMemo(() => {
    if (!sortConfig) return collectedKeywords;

    return [...collectedKeywords].sort((a, b) => {
      const { key, direction } = sortConfig;

      if (key === 'trend') {
        const aTrend = getKeywordTrend(a);
        const bTrend = getKeywordTrend(b);
        const aValue = TREND_ORDER[aTrend as keyof typeof TREND_ORDER];
        const bValue = TREND_ORDER[bTrend as keyof typeof TREND_ORDER];

        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
      }

      const aValue =
        a[key as keyof typeof a] ??
        (typeof a[key as keyof typeof a] === 'number' ? -1 : '');
      const bValue =
        b[key as keyof typeof b] ??
        (typeof b[key as keyof typeof b] === 'number' ? -1 : '');

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;

      return 0;
    });
  }, [collectedKeywords, sortConfig, getKeywordTrend]);

  return {
    sortConfig,
    handleSort,
    sortedKeywords,
  };
};
