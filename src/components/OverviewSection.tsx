import React, { useMemo, useState } from 'react';
import { AlertTriangle, BookOpen, CheckCircle2, MessageSquare, Search, Volume2, ArrowRight } from 'lucide-react';
import { OFFLINE_MEDICAL_GLOSSARY } from '../data/seedData';
import { FamilyProfile, FollowUpQuestion, LabMetric, LabReport, SimplifiedTerm } from '../types';

interface OverviewSectionProps {
  profile: FamilyProfile;
  report: LabReport | null;
  previousReport?: LabReport;
  isOffline: boolean;
  onOpenVoice: () => void;
  onOpenCompare: () => void;
  onUpdateFollowUp: (
    reportId: string,
    followUpQuestions: FollowUpQuestion[],
    refinedAdvice: string,
    simplifiedTerms: SimplifiedTerm[]
  ) => Promise<void>;
  onAddSimplifiedTerm: (reportId: string, termObj: SimplifiedTerm) => Promise<void>;
}

function getStatusDisplay(status: LabMetric['status']) {
  switch (status) {
    case 'normal':
      return { label: 'Normal', textClass: 'text-emerald-700', barClass: 'bg-emerald-600' };
    case 'borderline':
      return { label: 'Borderline', textClass: 'text-amber-700', barClass: 'bg-amber-600' };
    case 'low':
      return { label: 'Low', textClass: 'text-red-700', barClass: 'bg-red-600' };
    case 'high':
    case 'critical':
      return { label: status === 'critical' ? 'Critical' : 'High', textClass: 'text-red-700', barClass: 'bg-red-600' };
  }
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({
  profile,
  report,
  previousReport,
  isOffline,
  onOpenVoice,
  onOpenCompare,
  onUpdateFollowUp,
  onAddSimplifiedTerm,
}) => {
  const [metricFilter, setMetricFilter] = useState<'all' | 'abnormal'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Medical Term Simplifier state
  const [termInput, setTermInput] = useState('');
  const [simplifiedResult, setSimplifiedResult] = useState<SimplifiedTerm | null>(null);
  const [simplifying, setSimplifying] = useState(false);
  const [simplifyError, setSimplifyError] = useState<string | null>(null);

  // Follow-up Questions state
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [refining, setRefining] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);

  const abnormalMetrics = useMemo(() => {
    if (!report) return [];
    return report.metrics.filter((m) => m.status !== 'normal');
  }, [report]);

  const filteredMetrics = useMemo(() => {
    if (!report) return [];
    return report.metrics.filter((m) => {
      if (metricFilter === 'abnormal' && m.status === 'normal') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.name.toLowerCase().includes(q) ||
          m.simpleExplanation.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [report, metricFilter, searchQuery]);

  if (!report) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
        <h2 className="font-display text-lg font-semibold text-slate-900">
          No lab reports saved for {profile.name} yet
        </h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Upload a lab report PDF, photo, or paste diagnostic text using the Upload Report button above to view plain-language insights and abnormal value alerts.
        </p>
      </div>
    );
  }

  const handleSimplifyTerm = async (termToLookup: string) => {
    const clean = termToLookup.trim();
    if (!clean) return;
    setTermInput(clean);
    setSimplifyError(null);

    // Check report glossary or offline glossary first
    const combinedGlossary = [...report.simplifiedTerms, ...OFFLINE_MEDICAL_GLOSSARY];
    const cached = combinedGlossary.find((t) =>
      t.term.toLowerCase().includes(clean.toLowerCase()) ||
      clean.toLowerCase().includes(t.term.toLowerCase().split(' ')[0])
    );

    if (isOffline) {
      if (cached) {
        setSimplifiedResult(cached);
      } else {
        setSimplifyError('Term not in offline glossary cache. Connect to the internet for live AI lookup.');
      }
      return;
    }

    setSimplifying(true);
    try {
      const resp = await fetch('/api/simplify-term', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term: clean, context: report.title }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Could not simplify term.');
      setSimplifiedResult(data);
      await onAddSimplifiedTerm(report.id, data);
    } catch (err) {
      if (cached) {
        setSimplifiedResult(cached);
      } else {
        setSimplifyError(err instanceof Error ? err.message : 'Unable to simplify term.');
      }
    } finally {
      setSimplifying(false);
    }
  };

  const handleRefineFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOffline) {
      setRefineError('Personalized AI refinement requires an internet connection.');
      return;
    }
    setRefining(true);
    setRefineError(null);
    const updatedQuestions = report.followUpQuestions.map((fq) => ({
      ...fq,
      userAnswer: answers[fq.id] ?? fq.userAnswer ?? '',
    }));

    try {
      const resp = await fetch('/api/refine-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportTitle: report.title,
          plainSummary: report.plainSummary,
          metrics: abnormalMetrics,
          qaPairs: updatedQuestions,
          profileAge: profile.age,
          conditions: profile.conditions,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to refine insights.');
      await onUpdateFollowUp(
        report.id,
        updatedQuestions,
        data.refinedAdvice,
        report.simplifiedTerms
      );
    } catch (err) {
      setRefineError(err instanceof Error ? err.message : 'Could not update personalized advice.');
    } finally {
      setRefining(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Report Plain-Language Header Panel */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>{report.labName}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{report.reportDate}</span>
              <span aria-hidden="true">·</span>
              <span>{report.category}</span>
            </div>
            <h2 className="font-display text-xl font-semibold text-slate-900">
              {report.title}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenVoice}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
              <span>Listen in Any Language</span>
            </button>
            {previousReport && (
              <button
                onClick={onOpenCompare}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Compare with {previousReport.reportDate}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <p className="text-sm text-slate-700 leading-relaxed max-w-4xl">
          {report.plainSummary}
        </p>

        <div className="pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            Informational support only — not a medical diagnosis. Please confirm abnormal findings with a healthcare professional.
          </span>
          <span className="font-mono tabular-nums">
            {report.metrics.length} parameters analyzed · {abnormalMetrics.length} out of range
          </span>
        </div>
      </section>

      {/* Abnormal Value Alerts */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            {abnormalMetrics.length > 0 ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            )}
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900">
                Abnormal Value Alerts
              </h3>
              <p className="text-xs text-slate-500">
                {abnormalMetrics.length > 0
                  ? `${abnormalMetrics.length} values sit outside standard laboratory reference ranges`
                  : 'All measured biomarkers in this report are within standard reference ranges'}
              </p>
            </div>
          </div>
        </div>

        {abnormalMetrics.length > 0 && (
          <div className="divide-y divide-slate-200/80 border-t border-slate-200/80">
            {abnormalMetrics.map((m) => {
              const style = getStatusDisplay(m.status);
              const prev = previousReport?.metrics.find((pm) => pm.key === m.key);
              const delta = prev ? +(m.value - prev.value).toFixed(2) : null;
              const rangeSpan = Math.max(m.refMax - m.refMin, 1);
              const minBound = Math.max(0, m.refMin - rangeSpan * 0.4);
              const maxBound = m.refMax + rangeSpan * 0.6;
              const markerPct = Math.min(
                98,
                Math.max(2, ((m.value - minBound) / Math.max(maxBound - minBound, 1)) * 100)
              );
              const refStartPct = Math.max(
                0,
                ((m.refMin - minBound) / Math.max(maxBound - minBound, 1)) * 100
              );
              const refWidthPct = Math.min(
                100 - refStartPct,
                ((m.refMax - m.refMin) / Math.max(maxBound - minBound, 1)) * 100
              );

              return (
                <div key={m.key} className="py-4 first:pt-4 last:pb-1 grid lg:grid-cols-12 gap-4 items-center">
                  <div className="lg:col-span-4 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{m.name}</span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className={`text-xs font-semibold ${style.textClass}`}>
                        {style.label}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 font-mono tabular-nums">
                      <span className="text-lg font-semibold text-slate-900">{m.value}</span>
                      <span className="text-xs text-slate-500">{m.unit}</span>
                      <span className="text-xs text-slate-400">
                        (Ref {m.refMin}–{m.refMax})
                      </span>
                      {delta !== null && (
                        <span className="text-xs text-slate-600">
                          · {delta > 0 ? `+${delta}` : delta} vs prior
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-3">
                    <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="absolute top-0 bottom-0 bg-emerald-500/25"
                        style={{ left: `${refStartPct}%`, width: `${refWidthPct}%` }}
                      />
                      <div
                        className={`absolute top-0 bottom-0 w-2 rounded-full ${style.barClass}`}
                        style={{ left: `calc(${markerPct}% - 4px)` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                      <span>{m.refMin}</span>
                      <span>Normal Zone</span>
                      <span>{m.refMax}</span>
                    </div>
                  </div>

                  <div className="lg:col-span-5 flex items-start justify-between gap-3">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {m.simpleExplanation}
                    </p>
                    <button
                      onClick={() => handleSimplifyTerm(m.name)}
                      className="text-xs font-medium text-teal-700 hover:text-teal-800 underline underline-offset-2 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Simplify
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Complete Biomarkers Table */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-display text-base font-semibold text-slate-900">
            Full Laboratory Parameters
          </h3>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter parameter..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 w-44"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                onClick={() => setMetricFilter('all')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  metricFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                All ({report.metrics.length})
              </button>
              <button
                onClick={() => setMetricFilter('abnormal')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  metricFilter === 'abnormal' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Out of Range ({abnormalMetrics.length})
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="py-2.5 pr-4 font-medium">Biomarker</th>
                <th className="py-2.5 px-4 font-medium text-right">Result</th>
                <th className="py-2.5 px-4 font-medium text-right">Reference Range</th>
                <th className="py-2.5 px-4 font-medium">Status</th>
                <th className="py-2.5 pl-4 font-medium">Plain Meaning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredMetrics.map((m) => {
                const style = getStatusDisplay(m.status);
                return (
                  <tr key={m.key} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 pr-4 font-medium text-slate-900 whitespace-nowrap">
                      {m.name}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-900 whitespace-nowrap">
                      {m.value} <span className="text-xs text-slate-400">{m.unit}</span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-xs text-slate-500 whitespace-nowrap">
                      {m.refMin}–{m.refMax} {m.unit}
                    </td>
                    <td className={`py-2.5 px-4 text-xs font-semibold whitespace-nowrap ${style.textClass}`}>
                      {style.label}
                    </td>
                    <td className="py-2.5 pl-4 text-xs text-slate-600 min-w-[220px]">
                      {m.simpleExplanation}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bottom 2-Column Interactive Tools: Medical Term Simplifier + Personalized Follow-up Questions */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Medical Term Simplifier */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-teal-700 shrink-0" />
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900">
                Medical Term Simplifier
              </h3>
              <p className="text-xs text-slate-500">
                Translate technical jargon from your lab report into everyday language
              </p>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSimplifyTerm(termInput);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={termInput}
              onChange={(e) => setTermInput(e.target.value)}
              placeholder="Enter any term (e.g. Dyslipidemia, eGFR, Ferritin)..."
              className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
            />
            <button
              type="submit"
              disabled={simplifying || !termInput.trim()}
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {simplifying ? 'Explaining...' : 'Simplify'}
            </button>
          </form>

          <div className="flex flex-wrap gap-2 text-xs">
            {['HbA1c', 'LDL Cholesterol', 'Dyslipidemia', 'TSH', 'Microcytosis'].map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => handleSimplifyTerm(sample)}
                className="px-2.5 py-1 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
              >
                {sample}
              </button>
            ))}
          </div>

          {simplifyError && (
            <p className="text-xs text-red-600">{simplifyError}</p>
          )}

          {simplifiedResult && (
            <div className="pt-3 border-t border-slate-200 space-y-1.5">
              <p className="text-sm font-semibold text-slate-900">{simplifiedResult.term}</p>
              <p className="text-sm text-slate-700 leading-relaxed">
                {simplifiedResult.simpleMeaning}
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Why doctors check it: {simplifiedResult.clinicalContext}
              </p>
            </div>
          )}

          {!simplifiedResult && report.simplifiedTerms.length > 0 && (
            <div className="pt-3 border-t border-slate-200 divide-y divide-slate-100">
              {report.simplifiedTerms.slice(0, 3).map((t) => (
                <div key={t.term} className="py-2.5 first:pt-0 last:pb-0">
                  <p className="text-xs font-semibold text-slate-900">{t.term}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{t.simpleMeaning}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Personalized Follow-Up Questions */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-5 h-5 text-teal-700 shrink-0" />
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900">
                Personalized Follow-Up Questions
              </h3>
              <p className="text-xs text-slate-500">
                Answer brief lifestyle questions to tailor your report guidance
              </p>
            </div>
          </div>

          {report.followUpQuestions.length === 0 ? (
            <p className="text-xs text-slate-500">
              No follow-up prompts attached to this historical report.
            </p>
          ) : (
            <form onSubmit={handleRefineFollowUp} className="space-y-3.5">
              {report.followUpQuestions.map((fq) => (
                <div key={fq.id} className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700">
                    {fq.question}
                  </label>
                  <input
                    type="text"
                    value={answers[fq.id] ?? fq.userAnswer ?? ''}
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [fq.id]: e.target.value }))
                    }
                    placeholder="Type your answer (e.g., Yes, fasted 10 hrs / Mild fatigue)..."
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
                  />
                </div>
              ))}

              {refineError && <p className="text-xs text-red-600">{refineError}</p>}

              <button
                type="submit"
                disabled={refining}
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
              >
                {refining ? 'Personalizing Guidance...' : 'Update Personalized Explanation'}
              </button>
            </form>
          )}

          {report.refinedAdvice && (
            <div className="pt-3 border-t border-slate-200 space-y-1">
              <p className="text-xs font-semibold text-teal-800">
                Tailored Informational Context
              </p>
              <p className="text-xs text-slate-700 leading-relaxed">
                {report.refinedAdvice}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
