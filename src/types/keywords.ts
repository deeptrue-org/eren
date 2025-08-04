export type SortableKey =
  | 'keyword'
  | 'source'
  | 'clicks'
  | 'impressions'
  | 'trend';

export interface SortConfig {
  key: SortableKey;
  direction: 'asc' | 'desc';
}

export type KeywordSource = 'GSC' | 'Manual' | 'URL';

export interface CollectedKeyword {
  keyword: string;
  source: KeywordSource;
  selected: boolean;
  clicks?: number;
  impressions?: number;
  trend?: 'rising' | 'falling' | 'stable' | 'new';
}

export type GscPeriodUnit = 'day' | 'month' | 'year';
export type TrendType = 'rising' | 'falling' | 'stable' | 'new';

export interface Country {
  code: string;
  name: string;
}
