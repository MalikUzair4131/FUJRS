"use client";

import { useRef, useState } from "react";
import { CHART_COLORS, CHART_VIEWBOX_HEIGHT, CHART_VIEWBOX_WIDTH } from "./theme";

export interface RevenueTrendDatum {
  label: string;
  value: number;
}

interface RevenueTrendChartProps {
  data: RevenueTrendDatum[];
  valueFormatter?: (value: number) => string;
  emptyMessage?: string;
}

const TOP_PADDING = 24;
const BOTTOM_PADDING = 28;

export function RevenueTrendChart({
  data,
  valueFormatter = (value) => value.toLocaleString(),
  emptyMessage = "No data yet.",
}: RevenueTrendChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return <p className="font-body text-body-md text-on-surface-variant">{emptyMessage}</p>;
  }

  const maxValue = Math.max(1, ...data.map((d) => d.value));
  const plotHeight = CHART_VIEWBOX_HEIGHT - TOP_PADDING - BOTTOM_PADDING;
  const baselineY = CHART_VIEWBOX_HEIGHT - BOTTOM_PADDING;
  const stepX = data.length > 1 ? CHART_VIEWBOX_WIDTH / (data.length - 1) : 0;

  const points = data.map((d, i) => ({
    x: data.length > 1 ? i * stepX : CHART_VIEWBOX_WIDTH / 2,
    y: baselineY - (d.value / maxValue) * plotHeight,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`;

  const gridLines = [0, 0.5, 1].map((fraction) => baselineY - plotHeight * fraction);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || data.length === 0) return;
    const relativeX = (e.clientX - rect.left) / rect.width;
    const index = Math.round(relativeX * (data.length - 1));
    setHoverIndex(Math.max(0, Math.min(data.length - 1, index)));
  }

  const active = hoverIndex !== null ? points[hoverIndex] : null;
  const activeDatum = hoverIndex !== null ? data[hoverIndex] : null;
  const lastLabelIndices = new Set(
    [0, Math.floor((data.length - 1) / 2), data.length - 1].filter((i) => i >= 0)
  );

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoverIndex(null)}
    >
      <svg
        viewBox={`0 0 ${CHART_VIEWBOX_WIDTH} ${CHART_VIEWBOX_HEIGHT}`}
        className="w-full"
        role="img"
        aria-label="Revenue over time"
      >
        {gridLines.map((y) => (
          <line
            key={y}
            x1={0}
            x2={CHART_VIEWBOX_WIDTH}
            y1={y}
            y2={y}
            stroke={CHART_COLORS.grid}
            strokeWidth={1}
          />
        ))}

        <path d={areaPath} fill={CHART_COLORS.seriesFill} stroke="none" />
        <path
          d={linePath}
          fill="none"
          stroke={CHART_COLORS.series}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {active && (
          <line
            x1={active.x}
            x2={active.x}
            y1={TOP_PADDING}
            y2={baselineY}
            stroke={CHART_COLORS.grid}
            strokeWidth={1}
          />
        )}

        {points.map((p, i) => {
          const isLast = i === points.length - 1;
          const isHovered = hoverIndex === i;
          if (!isLast && !isHovered) return null;
          return (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={5}
              fill={CHART_COLORS.series}
              stroke={CHART_COLORS.surface}
              strokeWidth={2}
            />
          );
        })}

        {points[points.length - 1] && (
          <text
            x={points[points.length - 1].x}
            y={points[points.length - 1].y - 12}
            textAnchor="end"
            fontSize={12}
            fill={CHART_COLORS.mutedText}
          >
            {valueFormatter(data[data.length - 1].value)}
          </text>
        )}

        {data.map((d, i) =>
          lastLabelIndices.has(i) ? (
            <text
              key={d.label}
              x={points[i].x}
              y={baselineY + 20}
              textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}
              fontSize={12}
              fill={CHART_COLORS.mutedText}
            >
              {d.label}
            </text>
          ) : null
        )}
      </svg>

      {active && activeDatum && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full border border-outline-variant bg-surface-container-lowest px-3 py-2 font-body text-label-sm shadow-sm"
          style={{
            left: `${(active.x / CHART_VIEWBOX_WIDTH) * 100}%`,
            top: `${(active.y / CHART_VIEWBOX_HEIGHT) * 100}%`,
          }}
        >
          <p className="text-on-surface-variant">{activeDatum.label}</p>
          <p className="font-medium text-on-surface">{valueFormatter(activeDatum.value)}</p>
        </div>
      )}
    </div>
  );
}
