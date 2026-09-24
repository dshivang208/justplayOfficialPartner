import type { TrendPoint } from "@/data/payouts";

export function EarningsChart({ data, height = 180 }: { data: TrendPoint[]; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.amount));
  const barWidth = 100 / data.length;
  const labelEvery = Math.max(1, Math.ceil(data.length / 8));

  return (
    <div>
      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        className="h-[180px] w-full overflow-visible"
      >
        {data.map((point, i) => {
          const barHeight = (point.amount / max) * (height - 4);
          const x = i * barWidth;
          return (
            <rect
              key={point.date}
              x={x + barWidth * 0.15}
              y={height - barHeight}
              width={barWidth * 0.7}
              height={barHeight}
              rx={barWidth * 0.15}
              className="fill-primary/70"
            >
              <title>
                {new Date(`${point.date}T00:00:00`).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })}
                {" \u2014 \u20B9"}
                {point.amount.toLocaleString("en-IN")}
              </title>
            </rect>
          );
        })}
      </svg>
      <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
        {data
          .filter((_, i) => i % labelEvery === 0)
          .map((point) => (
            <span key={point.date}>
              {new Date(`${point.date}T00:00:00`).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
              })}
            </span>
          ))}
      </div>
    </div>
  );
}
