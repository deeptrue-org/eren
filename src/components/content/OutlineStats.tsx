import { ContentOutline } from '@/types/content';

interface OutlineStatsProps {
  outlines: ContentOutline[];
}

export function OutlineStats({ outlines }: OutlineStatsProps) {
  return (
    <div className="grid grid-cols-4 gap-4 text-center">
      <div>
        <div className="text-2xl font-bold text-primary">{outlines.length}</div>
        <div className="text-sm text-muted-foreground">Outlines</div>
      </div>
      <div>
        <div className="text-2xl font-bold text-primary">
          {outlines.reduce((sum, outline) => sum + outline.sections.length, 0)}
        </div>
        <div className="text-sm text-muted-foreground">Sections</div>
      </div>
      <div>
        <div className="text-2xl font-bold text-primary">
          {outlines.reduce((sum, outline) => sum + outline.totalWordCount, 0)}
        </div>
        <div className="text-sm text-muted-foreground">Total Words</div>
      </div>
      <div>
        <div className="text-2xl font-bold text-primary">
          {outlines.reduce(
            (sum, outline) => sum + outline.internalNotes.length,
            0
          )}
        </div>
        <div className="text-sm text-muted-foreground">Notes</div>
      </div>
    </div>
  );
}
