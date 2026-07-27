"use client";

import { useState } from "react";
import {
  CHART_BAR_GAP,
  CHART_BAR_RADIUS,
  CHART_COLORS,
  CHART_MAX_BAR_THICKNESS,
  CHART_VIEWBOX_HEIGHT,
  CHART_VIEWBOX_WIDTH,
} from "./theme";

export interface CategoryBarDatum {
  label: string;
  value: number;
}

interface CategoryBarChartProps {
  data: CategoryBarDatum[];
  valueFormatter?: (value: number) => string;
  emptyMessage?: string;
}

const TOP_PADDING = 28;
const BOTTOM_PADDING = 32;

function topRoundedRectPath(x: number, yTop: number, width: number, height: number, radius: number) {
  const r = Math.max(0, Math.min(radius, width / 2, height));
  const yBottom = yTop + height;
  if (height <= 0) return "";
  return `M ${x} ${yBottom} L ${x} ${yTop + r} Q ${x} ${yTop} ${x + r} ${yTop} L ${
    x + width - r
  } ${yTop} Q ${x + width} ${yTop} ${x + width} ${yTop + r} L ${x + width} ${yBottom} Z`;
}

export function CategoryBarChart({
  data,
  valueFormatter = (value) => value.toLocaleString(),
  emptyMessage = "No data yet.",
}: CategoryBarChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return <p className="font-body text-body-md text-on-surface-variant">{emptyMessage}</p>;
  }

  const maxValue = Math.max(1, ...data.map((d) => d.value));
  const plotHeight = CHART_VIEWBOX_HEIGHT - TOP_PADDING - BOTTOM_PADDING;
  const baselineY = CHART_VIEWBOX_HEIGHT - BOTTOM_PADDING;
  const slotWidth = CHART_VIEWBOX_WIDTH / data.length;
  const barWidth = Math.min(CHART_MAX_BAR_THICKNESS, slotWidth - CHART_BAR_GAP * 2);

  const gridLines = [0, 0.33, 0.66, 1].map((fraction) => baselineY - plotHeight * fraction);

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${CHART_VIEWBOX_WIDTH} ${CHART_VIEWBOX_HEIGHT}`}
        className="w-full"
        role="img"
        aria-label="Bar chart"
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

        {data.map((d, i) => {
          const barHeight = (d.value / maxValue) * plotHeight;
          const slotX = i * slotWidth;
          const x = slotX + (slotWidth - barWidth) / 2;
          const yTop = baselineY - barHeight;

          return (
            <g
              key={d.label}
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex((prev) => (prev === i ? null : prev))}
            >
              <title>{`${d.label}: ${valueFormatter(d.value)}`}</title>
              <path
                d={topRoundedRectPath(x, yTop, barWidth, barHeight, CHART_BAR_RADIUS)}
                fill={hoverIndex === i ? CHART_COLORS.accent : CHART_COLORS.series}
              />
              <text
                x={slotX + slotWidth / 2}
                y={yTop - 8}
                textAnchor="middle"
                fontSize={12}
                fill={CHART_COLORS.mutedText}
              >
                {valueFormatter(d.value)}
              </text>
              <text
                x={slotX + slotWidth / 2}
                y={baselineY + 20}
                textAnchor="middle"
                fontSize={12}
                fill={CHART_COLORS.mutedText}
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
