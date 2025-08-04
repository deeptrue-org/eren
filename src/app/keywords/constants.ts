import { TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';
import type { Country, TrendType } from '@/types/keywords';

export const MAX_KEYWORDS = 100;
export const RECENT_URLS_LIMIT = 5;

export const TREND_ORDER = {
  rising: 4,
  new: 3,
  stable: 2,
  falling: 1,
} as const;

export const STORAGE_KEYS = {
  RECENT_WEB_URLS: 'recentWebUrls',
  RECENT_NOTION_URLS: 'recentNotionUrls',
  SELECTED_KEYWORDS: 'selectedKeywords',
} as const;

export const TREND_CONFIGS = [
  { type: 'rising' as TrendType, icon: TrendingUp, label: 'Rising' },
  { type: 'new' as TrendType, icon: Sparkles, label: 'New' },
  { type: 'stable' as TrendType, icon: Minus, label: 'Stable' },
  { type: 'falling' as TrendType, icon: TrendingDown, label: 'Falling' },
] as const;

export const countryList: Country[] = [
  { code: 'all', name: 'All Countries' },
  { code: 'usa', name: 'United States' },
  { code: 'kor', name: 'South Korea' },
  { code: 'jpn', name: 'Japan' },
  { code: 'chn', name: 'China' },
  { code: 'deu', name: 'Germany' },
  { code: 'fra', name: 'France' },
  { code: 'gbr', name: 'United Kingdom' },
  { code: 'ind', name: 'India' },
  { code: 'bra', name: 'Brazil' },
  { code: 'can', name: 'Canada' },
  { code: 'rus', name: 'Russia' },
];
