import React, { useState } from 'react';
import { FileUp, X, FileText } from 'lucide-react';
import { SAMPLE_CLINICAL_REPORT_TEXT } from '../data/seedData';
import { FamilyProfile, LabReport } from '../types';

interface UploadReportModalProps {
  profile: FamilyProfile;
  existingReports: LabReport[];
  isOffline: boolean;
  onClose: () => void;
  onReportAnalyzed: (report: Omit<LabReport, 'id' | 'ownerId' | 'profileId'>) => Promise<void>;
}

export const UploadReportModal: React.FC<UploadReportModalProps> = ({
  profile,
  existingReports,
  isOffline,
  onClose,
  onReportAnalyzed,
}) => {
  const [reportText, setReportText] = useState('');
  const [fileInfo, setFileInfo] = useState<{ name: string; base64: string; mimeType: string } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('Please select a file smaller than 10 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || '';
      setFileInfo({
        name: file.name,
        base64,
        mimeType: file.type || 'application/pdf',
      });
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOffline) {
      setError('AI report analysis requires an internet connection.');
      return;
    }
    if (!profile.privacySettings.allowAiAnalysis) {
      setError('AI analysis is currently turned off in this profile’s Privacy Dashboard.');
      return;
    }
    if (!reportText.trim() && !fileInfo) {
      setError('Upload a lab report image/PDF or paste report text first.');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const latest = existingReports[0];
      const historicalSummary = latest
        ? `Prior report (${latest.reportDate}): ${latest.metrics.map((m) => `${m.name}: ${m.value} ${m.unit}`).join(', ')}`
        : 'No prior report available.';

      const resp = await fetch('/api/analyze-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportText: reportText.trim() || undefined,
          fileBase64: fileInfo?.base64,
          mimeType: fileInfo?.mimeType,
          profileName: profile.name,
          profileAge: profile.age,
          conditions: profile.conditions,
          historicalSummary,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to analyze lab report.');

      const analyzed = data.report;
      await onReportAnalyzed({
        title: analyzed.title || 'Uploaded Lab Panel',
        labName: analyzed.labName || 'Diagnostic Lab',
        reportDate: analyzed.reportDate || new Date().toISOString().slice(0, 10),
        category: analyzed.category || 'Comprehensive Panel',
        plainSummary: analyzed.plainSummary || 'Report analyzed.',
        metrics: analyzed.metrics || [],
        riskSignals: analyzed.riskSignals || [],
        simplifiedTerms: analyzed.simplifiedTerms || [],
        followUpQuestions: (analyzed.followUpQuestions || []).map((q: { id: string; question: string }) => ({
          id: q.id || `fq_${Date.now()}`,
          question: q.question,
          userAnswer: '',
        })),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to analyze report.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900">
              Analyze Lab Report for {profile.name}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload a report photo/PDF or paste lab values for instant plain-language insights
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Dropzone */}
          <label className="block border border-dashed border-slate-300 hover:border-teal-600 bg-slate-50 rounded-xl p-5 text-center cursor-pointer transition-colors">
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <FileUp className="w-6 h-6 text-teal-700 mx-auto" />
            <p className="mt-2 text-xs font-semibold text-slate-800">
              {fileInfo ? `Selected: ${fileInfo.name}` : 'Click to attach PDF, JPG, or PNG lab report'}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Supports diagnostic printouts and lab portal PDFs up to 10 MB
            </p>
          </label>

          {/* Paste Text Option */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-700">
                Or paste lab report text directly
              </label>
              <button
                type="button"
                onClick={() => setReportText(SAMPLE_CLINICAL_REPORT_TEXT)}
                className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-800 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Load Sample Report</span>
              </button>
            </div>
            <textarea
              rows={6}
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="Paste lab test rows (e.g., Fasting Glucose: 114 mg/dL, HbA1c: 6.1%, LDL: 148 mg/dL)..."
              className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200">
            <span className="text-[11px] text-slate-500">
              Informational support only — not a medical diagnosis.
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={analyzing}
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-50 rounded-lg cursor-pointer"
              >
                {analyzing ? 'Analyzing Report...' : 'Analyze Report'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
