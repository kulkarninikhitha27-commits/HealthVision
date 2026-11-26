export type MetricStatus = 'normal' | 'borderline' | 'high' | 'low' | 'critical';

export interface LabMetric {
  key: string;
  name: string;
  value: number;
  unit: string;
  refMin: number;
  refMax: number;
  status: MetricStatus;
  simpleExplanation: string;
}

export interface RiskSignal {
  domain: string;
  level: 'Low' | 'Moderate' | 'Elevated';
  summary: string;
  drivers: string[];
  preventiveActions: string[];
}

export interface SimplifiedTerm {
  term: string;
  simpleMeaning: string;
  clinicalContext: string;
}

export interface FollowUpQuestion {
  id: string;
  question: string;
  userAnswer: string;
}

export interface LabReport {
  id: string;
  ownerId: string;
  profileId: string;
  title: string;
  labName: string;
  reportDate: string;
  category: 'Complete Blood Count' | 'Metabolic & Lipid' | 'Thyroid & Vitamins' | 'Comprehensive Panel';
  plainSummary: string;
  metrics: LabMetric[];
  riskSignals: RiskSignal[];
  simplifiedTerms: SimplifiedTerm[];
  followUpQuestions: FollowUpQuestion[];
  refinedAdvice?: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
}

export interface PrivacySettings {
  allowAiAnalysis: boolean;
  shareTrendsWithDoctor: boolean;
  requirePin: boolean;
  offlineCacheEnabled: boolean;
}

export interface HealthGoals {
  sleepHours: number;
  hydrationLiters: number;
  activityMinutes: number;
  nutritionScore: number;
  sleepTarget: number;
  hydrationTarget: number;
  activityTarget: number;
}

export interface FamilyProfile {
  id: string;
  ownerId: string;
  name: string;
  relation: string;
  age: number;
  bloodType: string;
  avatarUrl?: string;
  preferredLanguage: string;
  pinCode?: string;
  isLocked: boolean;
  conditions: string[];
  allergies: string[];
  emergencyNotes?: string;
  emergencyContacts: EmergencyContact[];
  privacySettings: PrivacySettings;
  goals: HealthGoals;
}

export interface HealthReminder {
  id: string;
  ownerId: string;
  profileId: string;
  title: string;
  dueDate: string;
  type: 'lab_test' | 'appointment' | 'medication' | 'checkup';
  completed: boolean;
  notes?: string;
}

export interface DoctorConsultation {
  id: string;
  ownerId: string;
  profileId: string;
  doctorName: string;
  specialty: string;
  mode: 'Video' | 'In-Clinic' | 'Second Opinion';
  scheduledDate: string;
  timeSlot: string;
  attachedReportId?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

export interface PrivacyAuditLog {
  id: string;
  ownerId: string;
  profileId: string;
  action: string;
  actor: string;
  target: string;
  timestampLabel: string;
}

export type AppSection =
  | 'overview'
  | 'comparison'
  | 'risks'
  | 'voice'
  | 'care'
  | 'privacy';

export interface VoiceLanguageOption {
  code: string;
  label: string;
  nativeLabel: string;
  voiceName: 'Kore' | 'Puck' | 'Zephyr' | 'Charon' | 'Fenrir';
}
