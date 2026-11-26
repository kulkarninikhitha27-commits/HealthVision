import React, { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import {
  Activity,
  AlertCircle,
  Download,
  FilePlus2,
  GitCompare,
  HeartHandshake,
  Lock,
  LogOut,
  Menu,
  Plus,
  Shield,
  TrendingUp,
  Volume2,
  WifiOff,
  X,
} from 'lucide-react';
import { auth, googleProvider, testFirestoreConnection } from './firebase';
import {
  appendAuditLogInDb,
  createConsultationInDb,
  createProfileInDb,
  createReminderInDb,
  createReportInDb,
  deleteReminderInDb,
  ensureUserAccountAndSeed,
  loadOfflineVault,
  saveOfflineVault,
  toggleReminderInDb,
  updateProfileSectionInDb,
  updateReportFollowUpInDb,
  cancelConsultationInDb,
} from './services/firestoreService';
import {
  AppSection,
  DoctorConsultation,
  EmergencyContact,
  FamilyProfile,
  FollowUpQuestion,
  HealthGoals,
  HealthReminder,
  LabReport,
  PrivacyAuditLog,
  PrivacySettings,
  SimplifiedTerm,
} from './types';
import { exportHealthSummaryPdf } from './utils/pdfExport';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginScreen } from './components/LoginScreen';
import { OverviewSection } from './components/OverviewSection';
import { ComparisonSection } from './components/ComparisonSection';
import { RisksSection } from './components/RisksSection';
import { VoiceSection } from './components/VoiceSection';
import { CareSection } from './components/CareSection';
import { PrivacySection } from './components/PrivacySection';
import { UploadReportModal } from './components/UploadReportModal';
import { AddProfileModal, PinUnlockModal } from './components/ProfileModals';

function HealthVisionApp() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [offlineVaultMode, setOfflineVaultMode] = useState(false);

  const [browserOffline, setBrowserOffline] = useState(!navigator.onLine);
  const [simulatedOffline, setSimulatedOffline] = useState(false);
  const isOffline = browserOffline || simulatedOffline || offlineVaultMode;

  const [vaultLoading, setVaultLoading] = useState(false);
  const [profiles, setProfiles] = useState<FamilyProfile[]>([]);
  const [reports, setReports] = useState<LabReport[]>([]);
  const [reminders, setReminders] = useState<HealthReminder[]>([]);
  const [consultations, setConsultations] = useState<DoctorConsultation[]>([]);
  const [auditLogs, setAuditLogs] = useState<PrivacyAuditLog[]>([]);

  const [activeProfileId, setActiveProfileId] = useState<string>('');
  const [unlockedProfileIds, setUnlockedProfileIds] = useState<Record<string, boolean>>({});
  const [pendingPinProfile, setPendingPinProfile] = useState<FamilyProfile | null>(null);

  const [activeSection, setActiveSection] = useState<AppSection>('overview');
  const [selectedReportId, setSelectedReportId] = useState<string>('');

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAddProfileModal, setShowAddProfileModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cachedVaultAvailable = useMemo(() => loadOfflineVault() !== null, [authLoading]);

  // Monitor online/offline state
  useEffect(() => {
    const onOnline = () => setBrowserOffline(false);
    const onOffline = () => setBrowserOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Auth listener & data hydration
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);

      if (firebaseUser) {
        setOfflineVaultMode(false);
        setVaultLoading(true);
        try {
          await testFirestoreConnection();
          const vault = await ensureUserAccountAndSeed(
            firebaseUser.uid,
            firebaseUser.displayName || 'HealthVision Member',
            firebaseUser.email || ''
          );
          setProfiles(vault.profiles);
          setReports(vault.reports);
          setReminders(vault.reminders);
          setConsultations(vault.consultations);
          setAuditLogs(vault.auditLogs);
          if (vault.profiles[0]) {
            setActiveProfileId(vault.profiles[0].id);
          }
        } catch (err) {
          const cached = loadOfflineVault(firebaseUser.uid);
          if (cached) {
            setProfiles(cached.profiles);
            setReports(cached.reports);
            setReminders(cached.reminders);
            setConsultations(cached.consultations);
            setAuditLogs(cached.auditLogs);
            if (cached.profiles[0]) setActiveProfileId(cached.profiles[0].id);
          } else {
            setAuthError(
              err instanceof Error ? err.message : 'Could not load your HealthVision vault.'
            );
          }
        } finally {
          setVaultLoading(false);
        }
      }
    });
    return () => unsub();
  }, []);

  // Keep offline cache synced on every state update
  const activeUid = user?.uid || localStorage.getItem('healthvision_last_uid') || '';
  useEffect(() => {
    if (activeUid && profiles.length > 0) {
      saveOfflineVault(activeUid, {
        profiles,
        reports,
        reminders,
        consultations,
        auditLogs,
      });
    }
  }, [activeUid, profiles, reports, reminders, consultations, auditLogs]);

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError(
        err instanceof Error
          ? err.message
          : 'Google sign-in was cancelled or blocked. Please try again.'
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleOpenOfflineVault = () => {
    const cached = loadOfflineVault();
    if (!cached) return;
    setProfiles(cached.profiles);
    setReports(cached.reports);
    setReminders(cached.reminders);
    setConsultations(cached.consultations);
    setAuditLogs(cached.auditLogs);
    if (cached.profiles[0]) setActiveProfileId(cached.profiles[0].id);
    setOfflineVaultMode(true);
  };

  const handleSignOut = async () => {
    setOfflineVaultMode(false);
    setProfiles([]);
    setReports([]);
    setReminders([]);
    setConsultations([]);
    setAuditLogs([]);
    await signOut(auth);
  };

  const activeProfile = useMemo(
    () => profiles.find((p) => p.id === activeProfileId) || profiles[0] || null,
    [profiles, activeProfileId]
  );

  const profileReports = useMemo(
    () =>
      reports
        .filter((r) => r.profileId === activeProfile?.id)
        .sort((a, b) => b.reportDate.localeCompare(a.reportDate)),
    [reports, activeProfile]
  );

  const activeReport = useMemo(
    () =>
      profileReports.find((r) => r.id === selectedReportId) ||
      profileReports[0] ||
      null,
    [profileReports, selectedReportId]
  );

  const previousReport = useMemo(() => {
    if (!activeReport) return undefined;
    const idx = profileReports.findIndex((r) => r.id === activeReport.id);
    return idx >= 0 && idx + 1 < profileReports.length
      ? profileReports[idx + 1]
      : undefined;
  }, [profileReports, activeReport]);

  const profileReminders = useMemo(
    () => reminders.filter((r) => r.profileId === activeProfile?.id),
    [reminders, activeProfile]
  );

  const profileConsultations = useMemo(
    () => consultations.filter((c) => c.profileId === activeProfile?.id),
    [consultations, activeProfile]
  );

  const profileAuditLogs = useMemo(
    () => auditLogs.filter((l) => l.profileId === activeProfile?.id),
    [auditLogs, activeProfile]
  );

  const logPrivacyEvent = async (profileId: string, action: string, target: string) => {
    const newLog: PrivacyAuditLog = {
      id: `aud_${Date.now()}`,
      ownerId: activeUid,
      profileId,
      action,
      actor: user?.displayName || 'Account Owner',
      target,
      timestampLabel: `${new Date().toISOString().slice(0, 10)} · ${new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}`,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    if (user && !isOffline) {
      await appendAuditLogInDb(user.uid, newLog);
    }
  };

  const handleSelectProfile = (p: FamilyProfile) => {
    setMobileMenuOpen(false);
    if (p.id === activeProfile?.id) return;
    if (p.privacySettings.requirePin && !unlockedProfileIds[p.id]) {
      setPendingPinProfile(p);
      return;
    }
    setActiveProfileId(p.id);
    setSelectedReportId('');
  };

  const handleCreateProfile = async (
    draft: Omit<FamilyProfile, 'id' | 'ownerId'>
  ) => {
    const newProfile: FamilyProfile = {
      ...draft,
      id: `prof_${Date.now()}`,
      ownerId: activeUid,
    };
    setProfiles((prev) => [...prev, newProfile]);
    setActiveProfileId(newProfile.id);
    setUnlockedProfileIds((prev) => ({ ...prev, [newProfile.id]: true }));
    if (user && !isOffline) {
      await createProfileInDb(user.uid, newProfile);
      await logPrivacyEvent(newProfile.id, 'Created Family Health Profile', newProfile.name);
    }
  };

  const handleReportAnalyzed = async (
    draft: Omit<LabReport, 'id' | 'ownerId' | 'profileId'>
  ) => {
    if (!activeProfile) return;
    const newReport: LabReport = {
      ...draft,
      id: `rep_${Date.now()}`,
      ownerId: activeUid,
      profileId: activeProfile.id,
    };
    setReports((prev) => [newReport, ...prev]);
    setSelectedReportId(newReport.id);
    setActiveSection('overview');
    if (user && !isOffline) {
      await createReportInDb(user.uid, newReport);
      await logPrivacyEvent(activeProfile.id, 'Analyzed New Lab Report', newReport.title);
    }
  };

  const handleUpdateFollowUp = async (
    reportId: string,
    followUpQuestions: FollowUpQuestion[],
    refinedAdvice: string,
    simplifiedTerms: SimplifiedTerm[]
  ) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? { ...r, followUpQuestions, refinedAdvice, simplifiedTerms }
          : r
      )
    );
    if (user && !isOffline) {
      await updateReportFollowUpInDb(user.uid, reportId, {
        followUpQuestions,
        refinedAdvice,
        simplifiedTerms,
      });
    }
  };

  const handleAddSimplifiedTerm = async (reportId: string, termObj: SimplifiedTerm) => {
    const target = reports.find((r) => r.id === reportId);
    if (!target) return;
    const exists = target.simplifiedTerms.some(
      (t) => t.term.toLowerCase() === termObj.term.toLowerCase()
    );
    if (exists) return;
    const nextTerms = [termObj, ...target.simplifiedTerms].slice(0, 20);
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, simplifiedTerms: nextTerms } : r))
    );
    if (user && !isOffline) {
      await updateReportFollowUpInDb(user.uid, reportId, {
        followUpQuestions: target.followUpQuestions,
        refinedAdvice: target.refinedAdvice || '',
        simplifiedTerms: nextTerms,
      });
    }
  };

  const handleUpdateGoals = async (profileId: string, goals: HealthGoals) => {
    setProfiles((prev) => prev.map((p) => (p.id === profileId ? { ...p, goals } : p)));
    if (user && !isOffline) {
      await updateProfileSectionInDb(user.uid, profileId, { goals });
    }
  };

  const handleAddReminder = async (draft: Omit<HealthReminder, 'id' | 'ownerId'>) => {
    const newRem: HealthReminder = {
      ...draft,
      id: `rem_${Date.now()}`,
      ownerId: activeUid,
    };
    setReminders((prev) => [newRem, ...prev]);
    if (user && !isOffline) {
      await createReminderInDb(user.uid, newRem);
    }
  };

  const handleToggleReminder = async (reminderId: string, completed: boolean) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === reminderId ? { ...r, completed } : r))
    );
    if (user && !isOffline) {
      await toggleReminderInDb(user.uid, reminderId, completed);
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== reminderId));
    if (user && !isOffline) {
      await deleteReminderInDb(user.uid, reminderId);
    }
  };

  const handleBookConsultation = async (
    draft: Omit<DoctorConsultation, 'id' | 'ownerId' | 'status'>
  ) => {
    const newConsult: DoctorConsultation = {
      ...draft,
      id: `con_${Date.now()}`,
      ownerId: activeUid,
      status: 'scheduled',
    };
    setConsultations((prev) => [newConsult, ...prev]);
    if (user && !isOffline) {
      await createConsultationInDb(user.uid, newConsult);
      await logPrivacyEvent(
        draft.profileId,
        `Scheduled ${draft.mode} Consultation`,
        draft.doctorName
      );
    }
  };

  const handleCancelConsultation = async (consultId: string) => {
    setConsultations((prev) =>
      prev.map((c) => (c.id === consultId ? { ...c, status: 'cancelled' } : c))
    );
    if (user && !isOffline) {
      await cancelConsultationInDb(user.uid, consultId);
    }
  };

  const handleUpdateEmergencyInfo = async (
    profileId: string,
    emergencyContacts: EmergencyContact[],
    emergencyNotes: string,
    allergies: string[]
  ) => {
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === profileId
          ? { ...p, emergencyContacts, emergencyNotes, allergies }
          : p
      )
    );
    if (user && !isOffline) {
      await updateProfileSectionInDb(user.uid, profileId, {
        emergencyContacts,
        emergencyNotes,
        allergies,
      });
    }
  };

  const handleUpdatePrivacy = async (
    profileId: string,
    privacySettings: PrivacySettings,
    pinCode?: string,
    isLocked?: boolean
  ) => {
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === profileId
          ? {
              ...p,
              privacySettings,
              pinCode: pinCode ?? p.pinCode,
              isLocked: isLocked ?? p.isLocked,
            }
          : p
      )
    );
    if (user && !isOffline) {
      await updateProfileSectionInDb(user.uid, profileId, {
        privacySettings,
        ...(pinCode ? { pinCode } : {}),
        ...(typeof isLocked === 'boolean' ? { isLocked } : {}),
      });
      await logPrivacyEvent(profileId, 'Updated Privacy Permissions', 'Profile Settings');
    }
  };

  const handleExportPdf = async () => {
    if (!activeProfile || !activeReport) return;
    exportHealthSummaryPdf(activeProfile, activeReport, previousReport);
    await logPrivacyEvent(
      activeProfile.id,
      'Exported PDF Health Summary',
      activeReport.title
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-sm text-slate-600 font-medium">Loading HealthVision...</div>
      </div>
    );
  }

  if (!user && !offlineVaultMode) {
    return (
      <LoginScreen
        onGoogleLogin={handleGoogleLogin}
        onOfflineVaultAccess={handleOpenOfflineVault}
        hasOfflineVault={cachedVaultAvailable}
        isSigningIn={isSigningIn}
        authError={authError}
      />
    );
  }

  if (vaultLoading || !activeProfile) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <p className="font-display text-base font-semibold text-slate-900">
            Preparing your family health vault...
          </p>
          <p className="text-xs text-slate-500">
            Syncing saved reports, trends, and privacy settings
          </p>
        </div>
      </div>
    );
  }

  const navItems: { id: AppSection; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Alerts & Report', icon: <AlertCircle className="w-4 h-4" /> },
    { id: 'comparison', label: 'Compare & Trends', icon: <GitCompare className="w-4 h-4" /> },
    { id: 'risks', label: 'AI Risk Signals', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'voice', label: 'Voice Assistant', icon: <Volume2 className="w-4 h-4" /> },
    { id: 'care', label: 'Care, Goals & ID', icon: <HeartHandshake className="w-4 h-4" /> },
    { id: 'privacy', label: 'Privacy & Offline', icon: <Shield className="w-4 h-4" /> },
  ];

  const abnormalCount =
    activeReport?.metrics.filter((m) => m.status !== 'normal').length ?? 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row">
      {/* Sidebar Navigation (Desktop fixed + Mobile Drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[264px] bg-white border-r border-slate-200 flex flex-col justify-between transition-transform lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 space-y-6 overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-700 shrink-0" />
              <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
                HealthVision
              </span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1 text-slate-500 hover:text-slate-800"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Family Health Profiles */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Family Profiles
              </span>
              <button
                onClick={() => setShowAddProfileModal(true)}
                className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-800 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            <div className="space-y-1">
              {profiles.map((p) => {
                const isSelected = p.id === activeProfile.id;
                const locked =
                  p.privacySettings.requirePin && !unlockedProfileIds[p.id] && !isSelected;

                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectProfile(p)}
                    className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50 text-teal-950 border border-teal-200'
                        : 'hover:bg-slate-100 text-slate-700 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {p.avatarUrl ? (
                        <img
                          src={p.avatarUrl}
                          alt={p.name}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0 bg-slate-100"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-teal-700 text-white text-xs font-semibold flex items-center justify-center shrink-0">
                          {p.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{p.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {p.relation} · {p.age} yrs
                        </p>
                      </div>
                    </div>
                    {locked && <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Workspace Sections */}
          <nav className="space-y-1 pt-2 border-t border-slate-200">
            <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Analysis & Tools
            </p>
            {navItems.map((item) => {
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Account Footer */}
        <div className="p-4 border-t border-slate-200 space-y-2.5">
          <div className="text-xs">
            <p className="font-semibold text-slate-900 truncate">
              {user?.displayName || 'Offline Vault User'}
            </p>
            <p className="text-[11px] text-slate-500 truncate">
              {user?.email || 'Cached local session'}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{offlineVaultMode ? 'Exit Offline Vault' : 'Sign Out'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Contract: Breadcrumb Left — Actions Right */}
        <header className="bg-white border-b border-slate-200 px-6 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 text-slate-600 hover:text-slate-900"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-slate-400 hidden sm:inline whitespace-nowrap">
                HealthVision
              </span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <span className="font-display font-semibold text-slate-900 truncate">
                {activeProfile.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {activeReport && (
              <button
                onClick={handleExportPdf}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export PDF Summary</span>
                <span className="sm:hidden">PDF</span>
              </button>
            )}
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              <span>Upload Report</span>
            </button>
          </div>
        </header>

        {/* Sub-Header Profile Metadata & Report Switcher */}
        <div className="bg-white border-b border-slate-200/80 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span>{activeProfile.relation}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">Age {activeProfile.age}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">Blood {activeProfile.bloodType}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {profileReports.length} saved {profileReports.length === 1 ? 'report' : 'reports'}
            </span>
            {abnormalCount > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-amber-700">
                  {abnormalCount} abnormal alerts
                </span>
              </>
            )}
            {isOffline && (
              <>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 font-medium text-amber-800">
                  <WifiOff className="w-3.5 h-3.5" /> Offline Vault Active
                </span>
              </>
            )}
          </div>

          {profileReports.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-xs text-slate-500 mr-1 whitespace-nowrap">Report:</span>
              {profileReports.map((r) => {
                const selected = activeReport?.id === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedReportId(r.id)}
                    className={`px-2.5 py-1 text-xs font-mono rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      selected
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {r.reportDate}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Main Workspace Content */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-6">
          {activeSection === 'overview' && (
            <OverviewSection
              profile={activeProfile}
              report={activeReport}
              previousReport={previousReport}
              isOffline={isOffline}
              onOpenVoice={() => setActiveSection('voice')}
              onOpenCompare={() => setActiveSection('comparison')}
              onUpdateFollowUp={handleUpdateFollowUp}
              onAddSimplifiedTerm={handleAddSimplifiedTerm}
            />
          )}

          {activeSection === 'comparison' && (
            <ComparisonSection reports={profileReports} />
          )}

          {activeSection === 'risks' && (
            <RisksSection
              profile={activeProfile}
              reports={profileReports}
              latestReport={activeReport}
              isOffline={isOffline}
            />
          )}

          {activeSection === 'voice' && (
            <VoiceSection
              profile={activeProfile}
              report={activeReport}
              isOffline={isOffline}
            />
          )}

          {activeSection === 'care' && (
            <CareSection
              profile={activeProfile}
              reports={profileReports}
              reminders={profileReminders}
              consultations={profileConsultations}
              onUpdateGoals={handleUpdateGoals}
              onAddReminder={handleAddReminder}
              onToggleReminder={handleToggleReminder}
              onDeleteReminder={handleDeleteReminder}
              onBookConsultation={handleBookConsultation}
              onCancelConsultation={handleCancelConsultation}
              onUpdateEmergencyInfo={handleUpdateEmergencyInfo}
            />
          )}

          {activeSection === 'privacy' && (
            <PrivacySection
              profile={activeProfile}
              userEmail={user?.email || 'Local Offline User'}
              auditLogs={profileAuditLogs}
              isOffline={isOffline}
              simulatedOffline={simulatedOffline}
              onToggleSimulatedOffline={() => setSimulatedOffline((v) => !v)}
              onUpdatePrivacy={handleUpdatePrivacy}
              onLockProfileNow={(pid) => {
                setUnlockedProfileIds((prev) => ({ ...prev, [pid]: false }));
                const fallback = profiles.find((p) => p.id !== pid);
                if (fallback) setActiveProfileId(fallback.id);
              }}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      {showUploadModal && (
        <UploadReportModal
          profile={activeProfile}
          existingReports={profileReports}
          isOffline={isOffline}
          onClose={() => setShowUploadModal(false)}
          onReportAnalyzed={handleReportAnalyzed}
        />
      )}

      {showAddProfileModal && (
        <AddProfileModal
          onClose={() => setShowAddProfileModal(false)}
          onCreateProfile={handleCreateProfile}
        />
      )}

      {pendingPinProfile && (
        <PinUnlockModal
          profile={pendingPinProfile}
          onUnlock={() => {
            setUnlockedProfileIds((prev) => ({
              ...prev,
              [pendingPinProfile.id]: true,
            }));
            setActiveProfileId(pendingPinProfile.id);
            setSelectedReportId('');
            setPendingPinProfile(null);
          }}
          onCancel={() => setPendingPinProfile(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <HealthVisionApp />
    </ErrorBoundary>
  );
}
