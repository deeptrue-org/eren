import { Badge } from '@/components/ui/badge';
import { XCircle } from 'lucide-react';
import { getUrlLabel } from '@/lib/utils';
import {
  Tooltip,
  TooltipTrigger,
  TooltipProvider,
  TooltipContent,
} from '@/components/ui/tooltip';

interface UrlBadgeProps {
  url: string;
  onClick: () => void;
  onRemove: () => void;
}

export const UrlBadge = ({ url, onClick, onRemove }: UrlBadgeProps) => (
  <Badge
    key={url}
    variant="outline"
    className="cursor-pointer group"
    onClick={onClick}
  >
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className="truncate max-w-[100px]">
          <span>{getUrlLabel(url)}</span>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          align="start"
          className="max-w-[200px] break-all p-2 text-xs"
        >
          <p>{url}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>

    <XCircle
      className="ml-1 w-3 h-3 shrink-0 text-muted-foreground group-hover:text-primary"
      onClick={(e) => {
        e.stopPropagation();
        onRemove();
      }}
    />
  </Badge>
);
