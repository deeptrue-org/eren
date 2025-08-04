import type { CollectedKeyword, TrendType } from '@/types/keywords';

export const useKeywordManagement = (collectedKeywords: CollectedKeyword[]) => {
  const getKeywordTrend = (k: CollectedKeyword) =>
    k.trend?.trim().toLowerCase() || 'stable';

  const handleSelectAll = (
    checked: boolean,
    setCollectedKeywords: React.Dispatch<
      React.SetStateAction<CollectedKeyword[]>
    >
  ) => {
    setCollectedKeywords((prev) =>
      prev.map((k) => ({ ...k, selected: checked }))
    );
  };

  const handleSelectRow = (
    keyword: string,
    checked: boolean,
    setCollectedKeywords: React.Dispatch<
      React.SetStateAction<CollectedKeyword[]>
    >
  ) => {
    setCollectedKeywords((prev) =>
      prev.map((k) => (k.keyword === keyword ? { ...k, selected: checked } : k))
    );
  };

  const handleSelectByTrend = (
    trendToSelect: TrendType,
    setCollectedKeywords: React.Dispatch<
      React.SetStateAction<CollectedKeyword[]>
    >
  ) => {
    const keywordsInTrend = collectedKeywords.filter(
      (k) => getKeywordTrend(k) === trendToSelect
    );
    if (keywordsInTrend.length === 0) return;

    const areAllInTrendSelected = keywordsInTrend.every((k) => k.selected);
    const newSelectedValue = !areAllInTrendSelected;

    setCollectedKeywords((prevKeywords) =>
      prevKeywords.map((k) =>
        getKeywordTrend(k) === trendToSelect
          ? { ...k, selected: newSelectedValue }
          : k
      )
    );
  };

  const isTrendSelected = (trend: TrendType): boolean => {
    const keywordsInTrend = collectedKeywords.filter(
      (k) => getKeywordTrend(k) === trend
    );
    if (keywordsInTrend.length === 0) return false;
    return keywordsInTrend.every((k) => k.selected);
  };

  const hasTrend = (trend: TrendType): boolean => {
    return collectedKeywords.some((k) => getKeywordTrend(k) === trend);
  };

  const selectedCount = collectedKeywords.filter((k) => k.selected).length;
  const allSelected =
    collectedKeywords.length > 0 && selectedCount === collectedKeywords.length;

  return {
    getKeywordTrend,
    handleSelectAll,
    handleSelectRow,
    handleSelectByTrend,
    isTrendSelected,
    hasTrend,
    selectedCount,
    allSelected,
  };
};
