import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

export const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

export const getScoreBadgeVariant = (score: number) => {
  if (score >= 80) return 'default' as const;
  if (score >= 60) return 'secondary' as const;
  return 'destructive' as const;
};

export const getStatusIcon = (isGood: boolean, hasWarning = false) => {
  if (isGood) return <CheckCircle className="w-4 h-4 text-green-500" />;
  if (hasWarning) return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
  return <XCircle className="w-4 h-4 text-red-500" />;
};

export const formatScoreDisplay = (score: number, total = 100) => ({
  score,
  total,
  color: getScoreColor(score),
  badgeVariant: getScoreBadgeVariant(score),
});
