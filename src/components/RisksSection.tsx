import React, { useState } from 'react';
import { ShieldAlert, TrendingUp, Check } from 'lucide-react';
import { FamilyProfile, LabReport, RiskSignal } from '../types';

interface RisksSectionProps {
  profile: FamilyProfile;
  reports: LabReport[];
  latestReport: LabReport | null;
  isOffline: boolean;
}

export const RisksSection: React.FC<RisksSectionProps> = ({
  profile,
  reports,
  latestReport,
  isOffline,
}) => {
  const [forecastSignals, setForecastSignals] = useState<RiskSignal[] | null>(null);
  const [narrative, setNarrative] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayedSignals = forecastSignals || latestReport?.riskSignals || [];

  const handleRunForecast = async () => {
    if (isOffline) {
      setError('Longitudinal AI Risk Forecasting requires an internet connection.');
      return;
    }
    if (reports.length === 0) return;

    setLoading(true);
    setError(null);
    try {
      const resp = await fetch('/api/risk-forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: { name: profile.name, age: profile.age, conditions: profile.conditions },
          reports,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to generate AI risk forecast.');
      setForecastSignals(data.riskSignals || []);
      setNarrative(data.longitudinalNarrative || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate forecast.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-display text-lg font-semibold text-slate-900">
                AI Health Risk Prediction & Early Signals
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Synthesizes current biomarkers and historical report trajectories for preventive discussion with your doctor
              </p>
            </div>
          </div>

          <button
            onClick={handleRunForecast}
            disabled={loading || reports.length === 0}
            className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {loading ? 'Analyzing History...' : 'Refresh Multi-Report Forecast'}
          </button>
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {narrative && (
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-lg text-sm text-slate-700 leading-relaxed">
            {narrative}
          </div>
        )}

        <p className="text-xs text-slate-500 border-t border-slate-200/80 pt-3">
          Informational support only: Risk signals highlight statistical lab patterns to help you prepare questions for a physician, not a medical diagnosis.
        </p>
      </section>

      {displayedSignals.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-sm text-slate-600">
          No elevated risk patterns detected in the currently selected report.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedSignals.map((sig, idx) => {
            const levelStyle =
              sig.level === 'Elevated'
                ? 'text-red-700'
                : sig.level === 'Moderate'
                  ? 'text-amber-700'
                  : 'text-emerald-700';

            return (
              <article
                key={sig.domain + idx}
                className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className={`font-semibold inline-flex items-center gap-1.5 ${levelStyle}`}>
                      <ShieldAlert className="w-3.5 h-3.5" />
                      {sig.level} Watch
                    </span>
                    <span className="text-slate-400 font-mono">{reports.length} reports reviewed</span>
                  </div>

                  <h3 className="font-display text-base font-semibold text-slate-900">
                    {sig.domain}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{sig.summary}</p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                      Contributing Readings
                    </p>
                    <p className="text-xs font-mono text-slate-800 mt-1">
                      {sig.drivers.join(' · ')}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                      Questions & Preventive Habits
                    </p>
                    <ul className="mt-1.5 space-y-1">
                      {sig.preventiveActions.map((act, aIdx) => (
                        <li key={aIdx} className="flex items-start gap-1.5 text-xs text-slate-700">
                          <Check className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
