'use client';

export function InterestByRegion({
  data,
}: {
  data: { geoName: string; value: number[] }[];
}) {
  const filteredAndSortedData = data
    .filter((region) => {
      return (
        region.value &&
        region.value.length > 0 &&
        region.value[0] >= 0 &&
        region.geoName &&
        region.geoName.trim() !== ''
      );
    })
    .sort((a, b) => {
      const valueA = a.value?.[0] ?? 0;
      const valueB = b.value?.[0] ?? 0;
      return valueB - valueA;
    })
    .slice(0, 10);

  const maxVal =
    filteredAndSortedData.length > 0
      ? Math.max(...filteredAndSortedData.map((r) => r.value?.[0] ?? 0))
      : 0;

  if (filteredAndSortedData.length === 0) {
    return (
      <div>
        <h4 className="mb-2 font-semibold">Interest by Region</h4>
        <div className="text-sm text-muted-foreground">
          No regional data available
        </div>
      </div>
    );
  }

  return (
    <div>
      <h4 className="mb-2 font-semibold">Interest by Region</h4>
      <div className="text-sm">
        {filteredAndSortedData.map((region, index) => {
          const rawPercent = maxVal > 0 ? (region.value[0] / maxVal) * 100 : 0;
          const widthPercent =
            region.value[0] > 0 ? Math.max(rawPercent, 2) : rawPercent;

          return (
            <div
              key={`${region.geoName}-${index}`}
              className="flex justify-between items-center mb-1"
            >
              <span className="w-1/3 truncate">{region.geoName}</span>
              <div className="flex gap-2 items-center w-2/3">
                <div className="overflow-hidden flex-grow h-4 rounded-full bg-muted">
                  <div
                    className={`h-4 rounded-full ${
                      region.value[0] === 0
                        ? 'bg-gray-300'
                        : region.value[0] < 5
                        ? 'bg-blue-400'
                        : 'bg-primary'
                    }`}
                    style={{ width: `${widthPercent}%` }}
                  ></div>
                </div>
                <span className="w-8 text-sm tabular-nums text-right">
                  {region.value[0] === 0 ? '<1' : region.value[0]}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

