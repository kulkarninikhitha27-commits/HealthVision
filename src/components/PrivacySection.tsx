import React, { useState } from 'react';
import { Lock, ShieldCheck, Unlock, WifiOff } from 'lucide-react';
import { FamilyProfile, PrivacyAuditLog, PrivacySettings } from '../types';

interface PrivacySectionProps {
  profile: FamilyProfile;
  userEmail: string;
  auditLogs: PrivacyAuditLog[];
  isOffline: boolean;
  simulatedOffline: boolean;
  onToggleSimulatedOffline: () => void;
  onUpdatePrivacy: (
    profileId: string,
    privacySettings: PrivacySettings,
    pinCode?: string,
    isLocked?: boolean
  ) => Promise<void>;
  onLockProfileNow: (profileId: string) => void;
}

export const PrivacySection: React.FC<PrivacySectionProps> = ({
  profile,
  userEmail,
  auditLogs,
  isOffline,
  simulatedOffline,
  onToggleSimulatedOffline,
  onUpdatePrivacy,
  onLockProfileNow,
}) => {
  const [pinInput, setPinInput] = useState(profile.pinCode || '1234');
  const [pinSavedMsg, setPinSavedMsg] = useState<string | null>(null);

  const toggleSetting = async (key: keyof PrivacySettings) => {
    const nextSettings: PrivacySettings = {
      ...profile.privacySettings,
      [key]: !profile.privacySettings[key],
    };
    await onUpdatePrivacy(profile.id, nextSettings, pinInput, false);
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim().length < 4) return;
    await onUpdatePrivacy(
      profile.id,
      { ...profile.privacySettings, requirePin: true },
      pinInput.trim(),
      false
    );
    setPinSavedMsg('4-digit profile PIN updated.');
    setTimeout(() => setPinSavedMsg(null), 3000);
  };

  const accessEntities = [
    {
      actor: `Account Owner (${userEmail || 'Verified Account'})`,
      scope: 'Full Read, Upload, Compare, Export',
      status: 'Active Owner',
    },
    {
      actor: 'HealthVision AI Assistant (Gemini)',
      scope: 'On-demand plain-language translation & risk support',
      status: profile.privacySettings.allowAiAnalysis ? 'Permitted' : 'Paused by User',
    },
    {
      actor: 'Consulting Physician',
      scope: 'Shared report summaries & longitudinal trends',
      status: profile.privacySettings.shareTrendsWithDoctor ? 'Shared on Consult' : 'Revoked',
    },
    {
      actor: 'Local Browser Offline Vault',
      scope: 'Encrypted device cache for offline emergency & report viewing',
      status: profile.privacySettings.offlineCacheEnabled ? 'Cached Locally' : 'Disabled',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Privacy & Access Controls */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-display text-lg font-semibold text-slate-900">
                Privacy & Permission Dashboard — {profile.name}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Inspect who can view this family member’s reports and manage PIN lock and offline storage
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {profile.privacySettings.requirePin && (
              <button
                onClick={() => onLockProfileNow(profile.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Profile Now</span>
              </button>
            )}
          </div>
        </div>

        {/* Access Matrix Table */}
        <div className="overflow-x-auto border-t border-slate-200 pt-2">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="py-2.5 pr-4 font-medium">Viewer / System</th>
                <th className="py-2.5 px-4 font-medium">Data Scope</th>
                <th className="py-2.5 pl-4 font-medium text-right">Permission State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {accessEntities.map((item) => (
                <tr key={item.actor}>
                  <td className="py-3 pr-4 font-medium text-slate-900">{item.actor}</td>
                  <td className="py-3 px-4 text-slate-600">{item.scope}</td>
                  <td className="py-3 pl-4 text-right font-semibold text-teal-800 whitespace-nowrap">
                    {item.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Interactive Permission Toggles */}
        <div className="grid sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200">
          {[
            {
              key: 'allowAiAnalysis' as keyof PrivacySettings,
              title: 'AI Report Simplification & Risk Insights',
              desc: 'Allow HealthVision to summarize uploaded reports and generate follow-up questions.',
            },
            {
              key: 'shareTrendsWithDoctor' as keyof PrivacySettings,
              title: 'Share Longitudinal Trends with Doctors',
              desc: 'Include prior report comparisons when scheduling a physician consultation.',
            },
            {
              key: 'requirePin' as keyof PrivacySettings,
              title: 'Require PIN to Switch to This Profile',
              desc: 'Protect sensitive family records with a 4-digit PIN inside the family switcher.',
            },
            {
              key: 'offlineCacheEnabled' as keyof PrivacySettings,
              title: 'Offline Report Vault Access',
              desc: 'Keep saved reports and emergency ID readable even without internet connectivity.',
            },
          ].map((ctrl) => {
            const enabled = profile.privacySettings[ctrl.key];
            return (
              <div
                key={ctrl.key}
                className="flex items-start justify-between gap-4 p-4 bg-slate-50 border border-slate-200/80 rounded-lg"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-900">{ctrl.title}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{ctrl.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSetting(ctrl.key)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors shrink-0 cursor-pointer ${
                    enabled
                      ? 'bg-teal-700 text-white'
                      : 'bg-white border border-slate-300 text-slate-600'
                  }`}
                >
                  {enabled ? 'Enabled' : 'Off'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* PIN Setup & Offline Mode Verification */}
      <div className="grid lg:grid-cols-2 gap-6">
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            {profile.privacySettings.requirePin ? (
              <Lock className="w-4 h-4 text-teal-700" />
            ) : (
              <Unlock className="w-4 h-4 text-slate-500" />
            )}
            <h3 className="font-display text-base font-semibold text-slate-900">
              Profile PIN Protection
            </h3>
          </div>
          <p className="text-xs text-slate-600">
            Set a 4-digit PIN for {profile.name} so other family members cannot open private reports without unlocking.
          </p>
          <form onSubmit={handleSavePin} className="flex items-center gap-2.5">
            <input
              type="password"
              maxLength={6}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="4-digit PIN"
              className="w-36 px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg"
            />
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
            >
              Save & Enable PIN
            </button>
            {pinSavedMsg && <span className="text-xs text-emerald-700">{pinSavedMsg}</span>}
          </form>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-teal-700" />
            <h3 className="font-display text-base font-semibold text-slate-900">
              Offline Access & Device Cache
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            HealthVision caches your saved reports, comparison history, medical glossary, and emergency contacts locally so you can inspect them in clinics or areas with no internet.
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <span className="text-xs font-mono text-slate-700">
              Current Connection: {isOffline ? 'Offline Vault Mode' : 'Online & Synced'}
            </span>
            <button
              type="button"
              onClick={onToggleSimulatedOffline}
              className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                simulatedOffline
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {simulatedOffline ? 'Exit Offline Preview' : 'Test Offline Mode'}
            </button>
          </div>
        </section>
      </div>

      {/* Privacy Audit Log */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h3 className="font-display text-base font-semibold text-slate-900">
          Recent Access & Export History
        </h3>
        <div className="divide-y divide-slate-100 border-t border-slate-200">
          {auditLogs.length === 0 ? (
            <p className="py-4 text-xs text-slate-500">No access events logged yet.</p>
          ) : (
            auditLogs.slice(0, 8).map((log) => (
              <div key={log.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-medium text-slate-900">{log.action}</span>
                  <span className="text-slate-400 mx-1.5">·</span>
                  <span className="text-slate-600">{log.target}</span>
                </div>
                <div className="font-mono text-slate-500">
                  {log.actor} · {log.timestampLabel}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
