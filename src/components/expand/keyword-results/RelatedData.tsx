'use client';

// Helper function for parsing rising values
const parseRisingValue = (
  formattedValue: string,
  allRisingItems: { formattedValue: string }[]
): number => {
  if (formattedValue === 'Breakout') {
    const otherValues = allRisingItems
      .map((r) => r.formattedValue)
      .filter((v) => v !== 'Breakout')
      .map((v) => parseFloat(v.replace(/[^0-9,.]/g, '')))
      .filter((v) => !isNaN(v));
    const maxOther = otherValues.length > 0 ? Math.max(...otherValues) : 5000;
    return maxOther * 1.2;
  }
  const numericValue = parseFloat(formattedValue.replace(/[^0-9,.]/g, ''));
  return isNaN(numericValue) ? 0 : numericValue;
};

export const TopDataList = ({
  title,
  data,
}: {
  title: string;
  data: { topic: string; value: number; type?: string }[];
}) => {
  return (
    <div key={`top-${title}`}>
      <h5 className="mb-1 text-sm font-medium">{title}</h5>
      <div className="space-y-1">
        {data.slice(0, 5).map((item, index) => (
          <div
            key={`${item.topic}-${index}`}
            className="flex justify-between items-center"
          >
            <span className="w-1/2 text-sm truncate">
              {item.topic}{' '}
              {item.type && (
                <span className="text-muted-foreground">({item.type})</span>
              )}
            </span>
            <div className="flex gap-2 items-center w-1/2">
              <div className="overflow-hidden flex-grow h-4 rounded-full bg-muted">
                <div
                  className="h-4 rounded-full bg-primary"
                  style={{ width: `${item.value}%` }}
                ></div>
              </div>
              <span className="w-8 text-sm tabular-nums text-right">
                {item.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const RisingDataList = ({
  title,
  data,
}: {
  title: string;
  data: { topic: string; formattedValue: string; type?: string }[];
}) => {
  const risingData = data.slice(0, 5).map((q) => ({
    ...q,
    numericValue: parseRisingValue(q.formattedValue, data),
  }));

  const maxVal = Math.max(...risingData.map((d) => d.numericValue));

  return (
    <div key={`rising-${title}`}>
      <h5 className="mb-1 text-sm font-medium">{title}</h5>
      <div className="space-y-1">
        {risingData.map((q, index) => {
          const widthPercent = maxVal > 0 ? (q.numericValue / maxVal) * 100 : 0;
          const isBreakout = q.formattedValue === 'Breakout';
          return (
            <div
              key={`${q.topic}-${index}`}
              className="flex justify-between items-center"
            >
              <span className="w-1/2 text-sm truncate">
                {q.topic}{' '}
                {q.type && (
                  <span className="text-muted-foreground">({q.type})</span>
                )}
              </span>
              <div className="flex gap-2 items-center w-1/2">
                <div className="overflow-hidden flex-grow h-4 rounded-full bg-muted">
                  <div
                    className={`h-4 rounded-full ${
                      isBreakout ? 'bg-destructive' : 'bg-primary'
                    }`}
                    style={{ width: `${widthPercent}%` }}
                  ></div>
                </div>
                <span
                  className={`w-24 text-right text-sm tabular-nums ${
                    isBreakout ? 'font-semibold text-destructive' : ''
                  }`}
                >
                  {q.formattedValue}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export function RelatedDataSection({
  title,
  topData,
  risingData,
  dataType,
}: {
  title: string;
  topData?: any[];
  risingData?: any[];
  dataType: 'queries' | 'topics';
}) {
  const hasTopData = topData && topData.length > 0;
  const hasRisingData = risingData && risingData.length > 0;

  const mapToTop = (d: any) => ({
    topic: d.query || d.topic,
    value: d.value,
    type: d.type,
  });
  const mapToRising = (d: any) => ({
    topic: d.query || d.topic,
    formattedValue: d.formattedValue,
    type: d.type,
  });

  return (
    <div>
      <h4 className="mb-2 font-semibold">{title}</h4>
      {!hasTopData && !hasRisingData ? (
        <p className="text-sm text-muted-foreground">
          No related {dataType} data.
        </p>
      ) : (
        <div className="space-y-4">
          {hasTopData && (
            <TopDataList title="Top" data={topData.map(mapToTop)} />
          )}
          {hasRisingData && (
            <RisingDataList title="Rising" data={risingData.map(mapToRising)} />
          )}
        </div>
      )}
    </div>
  );
}

