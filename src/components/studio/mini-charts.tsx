// Dependency-free SVG charts for the analytics dashboard.

export function AreaChart({
  data,
  height = 140,
  label,
}: {
  data: { day: string; value: number }[];
  height?: number;
  label?: string;
}) {
  const w = 640;
  const max = Math.max(1, ...data.map((d) => d.value));
  const step = data.length > 1 ? w / (data.length - 1) : w;
  const pt = (d: { value: number }, i: number) =>
    `${(i * step).toFixed(1)},${(height - (d.value / max) * (height - 8) - 2).toFixed(1)}`;
  const line = data.map(pt).join(" ");
  const area = `0,${height} ${line} ${w},${height}`;

  return (
    <figure className="w-full">
      <svg
        viewBox={`0 0 ${w} ${height}`}
        preserveAspectRatio="none"
        className="h-36 w-full"
        role="img"
        aria-label={label ?? "Time series chart"}
      >
        <polygon points={area} fill="var(--color-accent)" fillOpacity="0.12" />
        <polyline
          points={line}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <figcaption className="mt-1 flex justify-between text-[11px] text-muted">
        <span>{data[0]?.day.slice(5)}</span>
        <span>{data[data.length - 1]?.day.slice(5)}</span>
      </figcaption>
    </figure>
  );
}

export function BarList({
  items,
}: {
  items: { label: string; value: number; href?: string; color?: string }[];
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="flex flex-col gap-2">
      {items.map((it, idx) => (
        <li key={idx} className="text-sm">
          <div className="mb-0.5 flex justify-between gap-3">
            <span className="truncate">{it.label}</span>
            <span className="shrink-0 tabular-nums text-muted">
              {it.value.toLocaleString()}
            </span>
          </div>
          <div className="h-2 rounded-full bg-line">
            <div
              className="h-2 rounded-full"
              style={{
                width: `${(it.value / max) * 100}%`,
                backgroundColor: it.color ?? "var(--color-accent)",
              }}
            />
          </div>
        </li>
      ))}
      {items.length === 0 && <li className="text-sm text-muted">No data yet.</li>}
    </ul>
  );
}
