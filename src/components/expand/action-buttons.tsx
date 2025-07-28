import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface ActionButtonsProps {
  isExpanding: boolean;
  selectedKeywords: string[];
  selectedApis: string[];
  onExpand: () => void;
  onStop: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  isExpanding,
  selectedKeywords,
  selectedApis,
  onExpand,
  onStop,
}) => {
  const handleExpandClick = () => {
    onExpand();
  };

  const isExpandDisabled =
    isExpanding ||
    !selectedKeywords ||
    selectedKeywords.length === 0 ||
    selectedApis.length === 0;

  return (
    <div className="flex flex-col gap-3">
      <Button onClick={handleExpandClick} disabled={isExpandDisabled} size="lg">
        {isExpanding ? (
          <>
            <Loader2 className="mr-2 w-4 h-4 animate-spin" />
            Expanding...
          </>
        ) : (
          `Expand ${selectedKeywords?.length || 0} Keyword${
            (selectedKeywords?.length || 0) !== 1 ? 's' : ''
          }`
        )}
      </Button>
      {isExpanding && (
        <Button onClick={onStop} variant="outline">
          Stop
        </Button>
      )}
    </div>
  );
};
