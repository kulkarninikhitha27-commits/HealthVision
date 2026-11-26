import React from 'react';
import { ShieldCheck, ArrowRight, WifiOff, FileText, Globe, Activity } from 'lucide-react';

interface LoginScreenProps {
  onGoogleLogin: () => void;
  onOfflineVaultAccess?: () => void;
  hasOfflineVault: boolean;
  isSigningIn: boolean;
  authError: string | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onGoogleLogin,
  onOfflineVaultAccess,
  hasOfflineVault,
  isSigningIn,
  authError,
}) => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Clean 3-zone Top Bar */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            HealthVision
          </span>
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <span className="whitespace-nowrap shrink-0">Report Intelligence</span>
            <span className="whitespace-nowrap shrink-0">Multilingual Voice</span>
            <span className="whitespace-nowrap shrink-0">Family Vault</span>
            <span className="whitespace-nowrap shrink-0">Privacy Controls</span>
          </nav>
          <button
            onClick={onGoogleLogin}
            disabled={isSigningIn}
            className="px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            {isSigningIn ? 'Signing in...' : 'Sign In'}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 lg:py-16 grid lg:grid-cols-12 gap-10 items-center">
        {/* Left Hero Column */}
        <div className="lg:col-span-7 space-y-6">
          <p className="text-xs font-medium tracking-wide text-teal-700 uppercase">
            Personal & Family Lab Intelligence
          </p>
          <h1
            className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-slate-900 leading-[1.15] tracking-tight"
            style={{ textWrap: 'balance' }}
          >
            Understand every lab report in plain, accessible language.
          </h1>
          <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
            HealthVision turns complex diagnostic reports into clear abnormal value alerts,
            side-by-side trend comparisons, multilingual voice explanations, and privacy-protected
            family health records.
          </p>

          <div className="grid sm:grid-cols-3 gap-5 pt-2 border-t border-slate-200">
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <FileText className="w-4 h-4 text-teal-700 shrink-0" />
                <span>Report Comparison</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Track biomarker shifts and reference ranges across months.
              </p>
            </div>
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Globe className="w-4 h-4 text-teal-700 shrink-0" />
                <span>Multilingual Voice</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Listen to explanations in English, Hindi, Spanish, Tamil, French, or Arabic.
              </p>
            </div>
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Activity className="w-4 h-4 text-teal-700 shrink-0" />
                <span>Offline Ready</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Saved family reports and emergency contacts stay accessible offline.
              </p>
            </div>
          </div>
        </div>

        {/* Right Sign-In Card */}
        <div className="lg:col-span-5">
          <div className="bg-white border border-slate-200 rounded-xl p-7 space-y-6">
            <div>
              <h2 className="font-display text-xl font-semibold text-slate-900">
                Sign in to HealthVision
              </h2>
              <p className="mt-1.5 text-sm text-slate-600">
                Access your private family health vault, saved lab trends, and AI report assistant.
              </p>
            </div>

            {authError && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                {authError}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={onGoogleLogin}
                disabled={isSigningIn}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
              >
                <span>{isSigningIn ? 'Connecting with Google...' : 'Continue with Google'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {hasOfflineVault && onOfflineVaultAccess && (
                <button
                  onClick={onOfflineVaultAccess}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <WifiOff className="w-4 h-4 text-slate-600" />
                  <span>Open Saved Offline Vault</span>
                </button>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 space-y-2.5">
              <div className="flex items-start gap-2.5 text-xs text-slate-600">
                <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <span>
                  Owner-isolated cloud storage with per-profile PIN protection and explicit sharing controls.
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Informational support only: HealthVision does not provide medical diagnoses. Always confirm concerning lab results with a licensed physician.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
