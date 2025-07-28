import { Card, CardContent } from '@/components/ui/card';

interface ErrorDisplayProps {
  error: string | null;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error }) => {
  if (!error) return null;

  return (
    <Card className="bg-red-50 border-red-200 dark:border-red-800 dark:bg-red-950/30">
      <CardContent className="pt-6">
        <div className="flex gap-2 items-center text-red-800 dark:text-red-200">
          <span>⚠️</span>
          <span className="font-medium">An error occurred:</span>
        </div>
        <p className="mt-2 text-red-700 dark:text-red-300">{error}</p>
      </CardContent>
    </Card>
  );
};
