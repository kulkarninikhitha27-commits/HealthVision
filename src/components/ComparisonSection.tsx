import React, { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { LabReport } from '../types';
import { TrendChart } from './TrendChart';

interface ComparisonSectionProps {
  reports: LabReport[];
}

export const ComparisonSection: React.FC<ComparisonSectionProps> = ({ reports }) => {
  const sortedReports = useMemo(
    () => [...reports].sort((a, b) => b.reportDate.localeCompare(a.reportDate)),
    [reports]
  );

  const [currentId, setCurrentId] = useState<string>(sortedReports[0]?.id || '');
  const [baselineId, setBaselineId] = useState<string>(
    sortedReports[1]?.id || sortedReports[0]?.id || ''
  );

  const currentReport =
    sortedReports.find((r) => r.id === currentId) || sortedReports[0];
  const baselineReport =
    sortedReports.find((r) => r.id === baselineId) ||
    sortedReports[1] ||
    sortedReports[0];

  const comparisonRows = useMemo(() => {
    if (!currentReport || !baselineReport) return [];
    return currentReport.metrics.map((curr) => {
      const prev = baselineReport.metrics.find((m) => m.key === curr.key);
      const delta = prev ? +(curr.value - prev.value).toFixed(2) : null;
      const pct =
        prev && prev.value !== 0
          ? +(((curr.value - prev.value) / prev.value) * 100).toFixed(1)
          : null;
      return {
        key: curr.key,
        name: curr.name,
        unit: curr.unit,
        refMin: curr.refMin,
        refMax: curr.refMax,
        prevVal: prev?.value ?? null,
        prevStatus: prev?.status ?? null,
        currVal: curr.value,
        currStatus: curr.status,
        delta,
        pct,
      };
    });
  }, [currentReport, baselineReport]);

  if (sortedReports.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-sm text-slate-600">
        No saved reports available for comparison yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Side-by-Side Comparison Matrix */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900">
              Side-by-Side Report Comparison
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Compare any two historical lab panels to track biomarker shifts and status transitions
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 whitespace-nowrap">Baseline:</label>
              <select
                value={baselineReport?.id || ''}
                onChange={(e) => setBaselineId(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
              >
                {sortedReports.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.reportDate} — {r.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 whitespace-nowrap">Compare To:</label>
              <select
                value={currentReport?.id || ''}
                onChange={(e) => setCurrentId(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
              >
                {sortedReports.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.reportDate} — {r.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {sortedReports.length < 2 && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3.5 py-2.5">
            Only one report is currently saved for this profile. Upload another report to compare historical deltas.
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="py-2.5 pr-4 font-medium">Biomarker</th>
                <th className="py-2.5 px-4 font-medium text-right">
                  Baseline ({baselineReport?.reportDate})
                </th>
                <th className="py-2.5 px-4 font-medium text-right">
                  Selected ({currentReport?.reportDate})
                </th>
                <th className="py-2.5 px-4 font-medium text-right">Change</th>
                <th className="py-2.5 px-4 font-medium text-right">Reference</th>
                <th className="py-2.5 pl-4 font-medium">Trajectory</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {comparisonRows.map((row) => {
                const isChanged = row.delta !== null && row.delta !== 0;
                const statusColor =
                  row.currStatus === 'normal'
                    ? 'text-emerald-700'
                    : row.currStatus === 'borderline'
                      ? 'text-amber-700'
                      : 'text-red-700';

                return (
                  <tr key={row.key} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 pr-4 font-medium text-slate-900 whitespace-nowrap">
                      {row.name}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-600 whitespace-nowrap">
                      {row.prevVal !== null ? `${row.prevVal} ${row.unit}` : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                      {row.currVal} <span className="text-xs font-normal text-slate-400">{row.unit}</span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums whitespace-nowrap">
                      {row.delta === null ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        <span className="inline-flex items-center justify-end gap-1 text-xs font-medium text-slate-700">
                          {row.delta > 0 ? (
                            <ArrowUpRight className="w-3.5 h-3.5 text-amber-600" />
                          ) : row.delta < 0 ? (
                            <ArrowDownRight className="w-3.5 h-3.5 text-teal-700" />
                          ) : (
                            <Minus className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          {row.delta > 0 ? `+${row.delta}` : row.delta}
                          {row.pct !== null && isChanged ? ` (${row.pct > 0 ? `+${row.pct}` : row.pct}%)` : ''}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-xs text-slate-500 whitespace-nowrap">
                      {row.refMin}–{row.refMax}
                    </td>
                    <td className="py-2.5 pl-4 text-xs whitespace-nowrap">
                      {row.prevStatus && row.prevStatus !== row.currStatus ? (
                        <span className={statusColor}>
                          {row.prevStatus} → <strong className="font-semibold">{row.currStatus}</strong>
                        </span>
                      ) : (
                        <span className={`font-medium capitalize ${statusColor}`}>
                          {row.currStatus}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Longitudinal Trend Chart */}
      <TrendChart reports={sortedReports} />
    </div>
  );
};
