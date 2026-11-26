import React, { useMemo, useState } from 'react';
import { LabMetric, LabReport } from '../types';

interface TrendChartProps {
  reports: LabReport[];
}

interface DataPoint {
  date: string;
  reportTitle: string;
  value: number;
  unit: string;
  refMin: number;
  refMax: number;
  status: LabMetric['status'];
}

export const TrendChart: React.FC<TrendChartProps> = ({ reports }) => {
  const availableKeys = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of reports) {
      for (const m of r.metrics) {
        if (!map.has(m.key)) {
          map.set(m.key, m.name);
        }
      }
    }
    return Array.from(map.entries()).map(([key, name]) => ({ key, name }));
  }, [reports]);

  const [selectedKey, setSelectedKey] = useState<string>(
    availableKeys[0]?.key || 'glucose'
  );
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const activeKey = availableKeys.some((k) => k.key === selectedKey)
    ? selectedKey
    : availableKeys[0]?.key || '';

  const points: DataPoint[] = useMemo(() => {
    return [...reports]
      .sort((a, b) => a.reportDate.localeCompare(b.reportDate))
      .map((r) => {
        const m = r.metrics.find((x) => x.key === activeKey);
        if (!m) return null;
        return {
          date: r.reportDate,
          reportTitle: r.title,
          value: m.value,
          unit: m.unit,
          refMin: m.refMin,
          refMax: m.refMax,
          status: m.status,
        };
      })
      .filter((x): x is DataPoint => x !== null);
  }, [reports, activeKey]);

  if (availableKeys.length === 0 || points.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 text-sm text-slate-600">
        Upload at least one lab report to visualize biomarker trends over time.
      </div>
    );
  }

  const width = 760;
  const height = 270;
  const padLeft = 54;
  const padRight = 28;
  const padTop = 26;
  const padBottom = 42;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const refMin = points[0].refMin;
  const refMax = points[0].refMax;
  const allVals = [...points.map((p) => p.value), refMin, refMax];
  const rawMin = Math.min(...allVals);
  const rawMax = Math.max(...allVals);
  const span = Math.max(rawMax - rawMin, 1);
  const yMin = Math.max(0, rawMin - span * 0.18);
  const yMax = rawMax + span * 0.18;

  const getX = (idx: number) =>
    points.length === 1
      ? padLeft + plotW / 2
      : padLeft + (idx / (points.length - 1)) * plotW;

  const getY = (val: number) =>
    padTop + ((yMax - val) / Math.max(yMax - yMin, 0.001)) * plotH;

  const refBandTop = getY(refMax);
  const refBandBottom = getY(refMin);
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(p.value).toFixed(1)}`)
    .join(' ');

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => yMin + (yMax - yMin) * t);
  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : points[points.length - 1];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-base font-semibold text-slate-900">
            Longitudinal Biomarker Trend
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Shaded band indicates healthy laboratory reference range ({refMin}–{refMax} {points[0].unit})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {availableKeys.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setSelectedKey(item.key);
                setHoveredIdx(null);
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeKey === item.key
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      {/* Active Point Precision Readout */}
      <div className="flex flex-wrap items-baseline justify-between gap-4 px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-lg">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
            {activePoint.value}
          </span>
          <span className="text-xs font-mono uppercase text-slate-500">
            {activePoint.unit}
          </span>
          <span className="text-xs text-slate-400">·</span>
          <span
            className={`text-xs font-medium ${
              activePoint.status === 'normal'
                ? 'text-emerald-700'
                : activePoint.status === 'borderline'
                  ? 'text-amber-700'
                  : 'text-red-700'
            }`}
          >
            {activePoint.status === 'normal'
              ? 'Within Reference Range'
              : activePoint.status === 'borderline'
                ? 'Borderline Watch'
                : activePoint.status === 'low'
                  ? 'Below Range'
                  : 'Above Range'}
          </span>
        </div>
        <div className="text-xs text-slate-600 font-mono tabular-nums">
          {activePoint.date} · {activePoint.reportTitle}
        </div>
      </div>

      {/* SVG Plot */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[540px] select-none"
          role="img"
          aria-label="Biomarker historical trend chart"
        >
          {/* Normal Reference Band */}
          <rect
            x={padLeft}
            y={Math.min(refBandTop, refBandBottom)}
            width={plotW}
            height={Math.max(Math.abs(refBandBottom - refBandTop), 2)}
            fill="#10B981"
            fillOpacity={0.09}
          />
          <line
            x1={padLeft}
            x2={padLeft + plotW}
            y1={refBandTop}
            y2={refBandTop}
            stroke="#10B981"
            strokeDasharray="4 4"
            strokeOpacity={0.45}
          />
          <line
            x1={padLeft}
            x2={padLeft + plotW}
            y1={refBandBottom}
            y2={refBandBottom}
            stroke="#10B981"
            strokeDasharray="4 4"
            strokeOpacity={0.45}
          />

          {/* Horizontal Grid Lines */}
          {yTicks.map((tick, idx) => {
            const yPos = getY(tick);
            return (
              <g key={idx}>
                <line
                  x1={padLeft}
                  x2={padLeft + plotW}
                  y1={yPos}
                  y2={yPos}
                  stroke="#E2E8F0"
                  strokeWidth={1}
                />
                <text
                  x={padLeft - 8}
                  y={yPos + 4}
                  textAnchor="end"
                  className="fill-slate-400 text-[10px] font-mono"
                >
                  {Number.isInteger(tick) ? tick : tick.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Crosshair Guide */}
          {hoveredIdx !== null && (
            <line
              x1={getX(hoveredIdx)}
              x2={getX(hoveredIdx)}
              y1={padTop}
              y2={padTop + plotH}
              stroke="#0F766E"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          )}

          {/* Trend Line */}
          {points.length > 1 && (
            <path
              d={linePath}
              fill="none"
              stroke="#0F766E"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Points & X Axis Labels */}
          {points.map((p, idx) => {
            const cx = getX(idx);
            const cy = getY(p.value);
            const isHovered = hoveredIdx === idx;
            const dotColor =
              p.status === 'normal'
                ? '#059669'
                : p.status === 'borderline'
                  ? '#D97706'
                  : '#DC2626';

            return (
              <g
                key={p.date + idx}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => setHoveredIdx(idx)}
              >
                <circle cx={cx} cy={cy} r={16} fill="transparent" />
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 6 : 4.5}
                  fill="#FFFFFF"
                  stroke={dotColor}
                  strokeWidth={2.5}
                />
                <text
                  x={cx}
                  y={height - 14}
                  textAnchor="middle"
                  className="fill-slate-500 text-[11px] font-mono"
                >
                  {p.date}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
