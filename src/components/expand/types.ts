import { Progress } from '@/lib/progress-store';

export type ViewMode = 'list' | 'grid';

export interface KeywordResultsProps {
  processedKeywords: { [key: string]: ExpandedKeyword[] };
  activeTab: string;
  setActiveTab: (lang: string) => void;
  openTrend: string | null;
  setOpenTrend: (id: string | null) => void;
  handleSelectAll: (lang: string, checked: boolean) => void;
  handleSelectRow: (lang: string, keyword: string, checked: boolean) => void;
  areAllTrendsOpen: boolean;
  viewMode: ViewMode;
  isExpanding: boolean;
}

export interface ProgressDisplayProps {
  progress: Progress | null;
}

export interface Language {
  value: string;
  label: string;
}

export const languages: Language[] = [
  { value: 'en', label: 'English' },
  { value: 'ko', label: 'Korean (한국어)' },
  { value: 'ja', label: 'Japanese (日本語)' },
  { value: 'cn', label: 'Chinese (简体中文)' },
  { value: 'es', label: 'Spanish (Español)' },
  { value: 'fr', label: 'French (Français)' },
  { value: 'de', label: 'German (Deutsch)' },
  { value: 'pt', label: 'Portuguese (Português)' },
  { value: 'ar', label: 'Arabic (العربية)' },
  { value: 'hi', label: 'Hindi (हिन्दी)' },
];

export const countries = [
  { value: 'WW', label: 'Worldwide' },
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'JP', label: 'Japan' },
  { value: 'KR', label: 'South Korea' },
  { value: 'IN', label: 'India' },
  { value: 'BR', label: 'Brazil' },
  { value: 'ES', label: 'Spain' },
  { value: 'IT', label: 'Italy' },
  { value: 'CN', label: 'China' },
  { value: 'RU', label: 'Russia' },
];

export const langCodeMap: { [key: string]: string } = {
  'windows-1252': 'en',
  'EUC-KR': 'ko',
  'UTF-8': 'ko',
  SHIFT_JIS: 'ja',
  Big5: 'cn',
  GB2312: 'cn',
  'ISO-8859-1': 'es',
};

export const detectionSupportedEncodings = [
  'windows-1252',
  'EUC-KR',
  'UTF-8',
  'SHIFT_JIS',
  'Big5',
  'GB2312',
];

export interface KeywordSource {
  name: string;
  enabled: boolean;
}

export interface KeywordIdea {
  keyword: string;
  source: string;
  volume: number | string;
  lang: string;
  selected?: boolean;
  interestOverTime?: { date: string; value: number }[];
  timeRange?: string;
  geo?: string;
  rank?: number;
}

export type ExpandedKeyword = KeywordIdea & {
  volume: number | string;
  cpc?: number;
  competition?: number;
  isFetching?: boolean;
  trendData?: { date: string; value: number }[];
  timeRange?: string;
  geo?: string;
};

export type ProgressState = {
  // ... existing code ...
};
