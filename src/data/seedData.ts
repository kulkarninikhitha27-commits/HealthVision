import {
  DoctorConsultation,
  FamilyProfile,
  HealthReminder,
  LabReport,
  PrivacyAuditLog,
  SimplifiedTerm,
  VoiceLanguageOption,
} from '../types';

export const VOICE_LANGUAGES: VoiceLanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', voiceName: 'Kore' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', voiceName: 'Zephyr' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', voiceName: 'Puck' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்', voiceName: 'Kore' },
  { code: 'fr', label: 'French', nativeLabel: 'Français', voiceName: 'Charon' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', voiceName: 'Fenrir' },
];

export const DOCTOR_DIRECTORY = [
  {
    id: 'doc_1',
    name: 'Dr. Kavita Rao, MD',
    specialty: 'Preventive Cardiology & Lipidology',
    experience: '14 yrs clinical experience',
    hospital: 'Mercy Heart & Metabolic Center',
    nextAvailable: 'Tomorrow, 10:30 AM',
    avatarUrl: '/src/assets/images/doctor_specialist_1795679562508.jpg',
    languages: ['English', 'Hindi'],
  },
  {
    id: 'doc_2',
    name: 'Dr. Daniel Reyes, MD',
    specialty: 'Endocrinology & Diabetes Care',
    experience: '11 yrs clinical experience',
    hospital: 'Pacific Endocrine Clinic',
    nextAvailable: 'Thu, 2:00 PM',
    avatarUrl: '/src/assets/images/doctor_specialist_1795679562508.jpg',
    languages: ['English', 'Spanish'],
  },
  {
    id: 'doc_3',
    name: 'Dr. Meera Krishnan, MBBS, MD',
    specialty: 'Internal Medicine & Geriatrics',
    experience: '18 yrs clinical experience',
    hospital: 'CityCare Family Diagnostics',
    nextAvailable: 'Fri, 11:15 AM',
    avatarUrl: '/src/assets/images/doctor_specialist_1795679562508.jpg',
    languages: ['English', 'Tamil', 'Hindi'],
  },
];

export const OFFLINE_MEDICAL_GLOSSARY: SimplifiedTerm[] = [
  {
    term: 'HbA1c (Glycated Hemoglobin)',
    simpleMeaning: 'Shows your average blood sugar level over the past 2 to 3 months.',
    clinicalContext: 'Used by doctors to spot pre-diabetes or monitor long-term glucose control.',
  },
  {
    term: 'LDL Cholesterol',
    simpleMeaning: 'Often called "bad" cholesterol because excess LDL can slowly build up inside blood vessel walls.',
    clinicalContext: 'Keeping LDL within range supports clear arteries and lowers cardiovascular strain.',
  },
  {
    term: 'Hemoglobin (Hb)',
    simpleMeaning: 'The oxygen-carrying protein inside your red blood cells.',
    clinicalContext: 'Low hemoglobin can leave you feeling tired or short of breath (anemia).',
  },
  {
    term: 'TSH (Thyroid Stimulating Hormone)',
    simpleMeaning: 'A signal hormone from the brain that tells your thyroid gland how fast to run your metabolism.',
    clinicalContext: 'High TSH often suggests an underactive thyroid; low TSH can point to an overactive thyroid.',
  },
  {
    term: 'Dyslipidemia',
    simpleMeaning: 'An imbalance in blood fats, such as high LDL cholesterol or triglycerides, or low protective HDL.',
    clinicalContext: 'Often responds well to dietary fiber, regular movement, and doctor-guided follow-up.',
  },
  {
    term: 'Microcytosis (Low MCV)',
    simpleMeaning: 'Red blood cells that are slightly smaller than usual, commonly linked to low iron stores.',
    clinicalContext: 'Often evaluated alongside ferritin and hemoglobin by a physician.',
  },
];

export const SAMPLE_CLINICAL_REPORT_TEXT = `COMPREHENSIVE METABOLIC & LIPID PANEL — Quest Diagnostics
Patient Fasting: 10 Hours | Date: 2026-11-20
- Fasting Blood Glucose: 114 mg/dL (Ref: 70 - 99)
- HbA1c: 6.1 % (Ref: 4.0 - 5.6)
- Total Cholesterol: 224 mg/dL (Ref: 125 - 200)
- LDL Cholesterol: 148 mg/dL (Ref: 0 - 99)
- HDL Cholesterol: 44 mg/dL (Ref: 40 - 60)
- Triglycerides: 168 mg/dL (Ref: 0 - 149)
- Hemoglobin: 14.1 g/dL (Ref: 13.5 - 17.5)
- Vitamin D (25-OH): 21 ng/mL (Ref: 30 - 100)
- TSH: 2.3 mIU/L (Ref: 0.4 - 4.0)`;

export function createSeedData(ownerId: string): {
  profiles: FamilyProfile[];
  reports: LabReport[];
  reminders: HealthReminder[];
  consultations: DoctorConsultation[];
  auditLogs: PrivacyAuditLog[];
} {
  const profiles: FamilyProfile[] = [
    {
      id: 'prof_aarav',
      ownerId,
      name: 'Aarav Mehta',
      relation: 'Self',
      age: 34,
      bloodType: 'O+',
      avatarUrl: '/src/assets/images/avatar_aarav_1795679561374.jpg',
      preferredLanguage: 'en',
      pinCode: '2468',
      isLocked: false,
      conditions: ['Borderline Pre-diabetes', 'Elevated LDL'],
      allergies: ['Penicillin'],
      emergencyNotes: 'Carries glucose tablets during endurance runs. Mild seasonal asthma.',
      emergencyContacts: [
        { id: 'ec_1', name: 'Priya Mehta', relation: 'Spouse', phone: '+1 (415) 555-0148' },
        { id: 'ec_2', name: 'Dr. Kavita Rao', relation: 'Primary Cardiologist', phone: '+1 (415) 555-0192' },
      ],
      privacySettings: {
        allowAiAnalysis: true,
        shareTrendsWithDoctor: true,
        requirePin: false,
        offlineCacheEnabled: true,
      },
      goals: {
        sleepHours: 6.5,
        hydrationLiters: 2.2,
        activityMinutes: 35,
        nutritionScore: 76,
        sleepTarget: 7.5,
        hydrationTarget: 3.0,
        activityTarget: 45,
      },
    },
    {
      id: 'prof_sunita',
      ownerId,
      name: 'Sunita Mehta',
      relation: 'Mother',
      age: 67,
      bloodType: 'B+',
      avatarUrl: '/src/assets/images/avatar_sunita_1795679561689.jpg',
      preferredLanguage: 'hi',
      pinCode: '1234',
      isLocked: false,
      conditions: ['Hypothyroidism', 'Mild Iron-Deficiency Anemia'],
      allergies: ['Sulfa Drugs'],
      emergencyNotes: 'Takes Levothyroxine 50mcg every morning before breakfast.',
      emergencyContacts: [
        { id: 'ec_3', name: 'Aarav Mehta', relation: 'Son / Caregiver', phone: '+1 (415) 555-0110' },
      ],
      privacySettings: {
        allowAiAnalysis: true,
        shareTrendsWithDoctor: true,
        requirePin: true,
        offlineCacheEnabled: true,
      },
      goals: {
        sleepHours: 7.0,
        hydrationLiters: 1.8,
        activityMinutes: 25,
        nutritionScore: 82,
        sleepTarget: 8.0,
        hydrationTarget: 2.2,
        activityTarget: 30,
      },
    },
    {
      id: 'prof_maya',
      ownerId,
      name: 'Maya Mehta',
      relation: 'Daughter',
      age: 9,
      bloodType: 'O+',
      avatarUrl: '/src/assets/images/avatar_maya_1795679562647.jpg',
      preferredLanguage: 'en',
      pinCode: '0000',
      isLocked: false,
      conditions: ['Annual Pediatric Wellness'],
      allergies: ['Peanuts (mild)'],
      emergencyNotes: 'Pediatric wellness monitoring; peanut avoidance plan at school.',
      emergencyContacts: [
        { id: 'ec_4', name: 'Aarav Mehta', relation: 'Father', phone: '+1 (415) 555-0110' },
        { id: 'ec_5', name: 'Priya Mehta', relation: 'Mother', phone: '+1 (415) 555-0148' },
      ],
      privacySettings: {
        allowAiAnalysis: true,
        shareTrendsWithDoctor: false,
        requirePin: false,
        offlineCacheEnabled: true,
      },
      goals: {
        sleepHours: 9.0,
        hydrationLiters: 1.5,
        activityMinutes: 55,
        nutritionScore: 88,
        sleepTarget: 9.5,
        hydrationTarget: 1.6,
        activityTarget: 60,
      },
    },
  ];

  const reports: LabReport[] = [
    {
      id: 'rep_aarav_nov',
      ownerId,
      profileId: 'prof_aarav',
      title: 'Comprehensive Metabolic & Lipid Panel',
      labName: 'Pacific Clinical Diagnostics',
      reportDate: '2026-11-18',
      category: 'Comprehensive Panel',
      plainSummary:
        'Your latest panel shows mild upward drift in fasting glucose (112 mg/dL) and LDL cholesterol (142 mg/dL), alongside low Vitamin D (22 ng/mL). Hemoglobin, kidney markers, and thyroid function remain comfortably within healthy ranges. This is informational guidance—please review your lipid and glycemic trends with your physician.',
      metrics: [
        {
          key: 'glucose',
          name: 'Fasting Glucose',
          value: 112,
          unit: 'mg/dL',
          refMin: 70,
          refMax: 99,
          status: 'borderline',
          simpleExplanation: 'Slightly above the normal fasting ceiling of 99 mg/dL, signaling early insulin sensitivity watch.',
        },
        {
          key: 'hba1c',
          name: 'HbA1c',
          value: 6.0,
          unit: '%',
          refMin: 4.0,
          refMax: 5.6,
          status: 'borderline',
          simpleExplanation: 'Your 3-month blood sugar average sits in the pre-diabetes monitoring zone (5.7%–6.4%).',
        },
        {
          key: 'ldl',
          name: 'LDL Cholesterol',
          value: 142,
          unit: 'mg/dL',
          refMin: 0,
          refMax: 99,
          status: 'high',
          simpleExplanation: 'Elevated low-density cholesterol; reducing saturated fats and adding soluble fiber can help.',
        },
        {
          key: 'cholesterol',
          name: 'Total Cholesterol',
          value: 218,
          unit: 'mg/dL',
          refMin: 125,
          refMax: 200,
          status: 'high',
          simpleExplanation: 'Moderately above 200 mg/dL, primarily driven by your LDL reading.',
        },
        {
          key: 'hdl',
          name: 'HDL Cholesterol',
          value: 46,
          unit: 'mg/dL',
          refMin: 40,
          refMax: 60,
          status: 'normal',
          simpleExplanation: 'Protective cholesterol is within normal bounds, though raising it above 50 is helpful.',
        },
        {
          key: 'hemoglobin',
          name: 'Hemoglobin',
          value: 14.6,
          unit: 'g/dL',
          refMin: 13.5,
          refMax: 17.5,
          status: 'normal',
          simpleExplanation: 'Healthy red blood cell oxygen-carrying capacity.',
        },
        {
          key: 'vitd',
          name: 'Vitamin D (25-OH)',
          value: 22,
          unit: 'ng/mL',
          refMin: 30,
          refMax: 100,
          status: 'low',
          simpleExplanation: 'Below the 30 ng/mL sufficiency floor; common in indoor schedules and winter months.',
        },
        {
          key: 'tsh',
          name: 'TSH',
          value: 2.1,
          unit: 'mIU/L',
          refMin: 0.4,
          refMax: 4.0,
          status: 'normal',
          simpleExplanation: 'Thyroid signaling is steady and balanced.',
        },
      ],
      riskSignals: [
        {
          domain: 'Metabolic & Glycemic Trend',
          level: 'Moderate',
          summary: 'Fasting glucose rose from 98 to 112 mg/dL and HbA1c reached 6.0% over the past 6 months.',
          drivers: ['Fasting Glucose 112 mg/dL', 'HbA1c 6.0%'],
          preventiveActions: ['Walk 15 minutes after evening meals', 'Discuss 90-day HbA1c re-check with physician'],
        },
        {
          domain: 'Cardiovascular Lipid Profile',
          level: 'Elevated',
          summary: 'LDL cholesterol increased by 14 mg/dL since August, sitting above optimal cardiovascular targets.',
          drivers: ['LDL Cholesterol 142 mg/dL', 'Total Cholesterol 218 mg/dL'],
          preventiveActions: ['Increase soluble fiber (oats, legumes)', 'Review lipid targets during Cardiology consult'],
        },
        {
          domain: 'Bone & Micronutrient Status',
          level: 'Moderate',
          summary: 'Vitamin D dipped to 22 ng/mL, which can affect energy and calcium absorption.',
          drivers: ['Vitamin D 22 ng/mL'],
          preventiveActions: ['Ask doctor about Vitamin D3 supplementation dosage'],
        },
      ],
      simplifiedTerms: [
        {
          term: 'HbA1c',
          simpleMeaning: 'A 3-month memory of your average blood sugar levels.',
          clinicalContext: 'Levels between 5.7% and 6.4% suggest pre-diabetic range.',
        },
        {
          term: 'LDL Cholesterol',
          simpleMeaning: 'Lipid particles that can deposit plaque along artery walls when high.',
          clinicalContext: 'Optimal levels are typically kept under 100 mg/dL.',
        },
        {
          term: '25-OH Vitamin D',
          simpleMeaning: 'The main storage form of Vitamin D measured in your bloodstream.',
          clinicalContext: 'Supports immune balance, mood, and bone mineralization.',
        },
      ],
      followUpQuestions: [
        {
          id: 'fq_1',
          question: 'Did you complete a full 8–12 hour water-only fast before this morning blood draw?',
          userAnswer: '',
        },
        {
          id: 'fq_2',
          question: 'Have you noticed afternoon fatigue, increased thirst, or disrupted sleep over the past month?',
          userAnswer: '',
        },
        {
          id: 'fq_3',
          question: 'Are you currently taking any Vitamin D supplements or lipid-lowering medications?',
          userAnswer: '',
        },
      ],
    },
    {
      id: 'rep_aarav_aug',
      ownerId,
      profileId: 'prof_aarav',
      title: 'Quarterly Metabolic Follow-Up',
      labName: 'Pacific Clinical Diagnostics',
      reportDate: '2026-08-12',
      category: 'Metabolic & Lipid',
      plainSummary:
        'August panel showed borderline glucose (104 mg/dL) and mildly elevated LDL (128 mg/dL). Vitamin D was closer to normal at 28 ng/mL.',
      metrics: [
        { key: 'glucose', name: 'Fasting Glucose', value: 104, unit: 'mg/dL', refMin: 70, refMax: 99, status: 'borderline', simpleExplanation: 'Mildly above normal fasting upper bound.' },
        { key: 'hba1c', name: 'HbA1c', value: 5.8, unit: '%', refMin: 4.0, refMax: 5.6, status: 'borderline', simpleExplanation: 'Early pre-diabetic range.' },
        { key: 'ldl', name: 'LDL Cholesterol', value: 128, unit: 'mg/dL', refMin: 0, refMax: 99, status: 'high', simpleExplanation: 'Above optimal LDL threshold.' },
        { key: 'cholesterol', name: 'Total Cholesterol', value: 204, unit: 'mg/dL', refMin: 125, refMax: 200, status: 'borderline', simpleExplanation: 'Just above 200 mg/dL.' },
        { key: 'hdl', name: 'HDL Cholesterol', value: 48, unit: 'mg/dL', refMin: 40, refMax: 60, status: 'normal', simpleExplanation: 'Normal protective HDL.' },
        { key: 'hemoglobin', name: 'Hemoglobin', value: 14.8, unit: 'g/dL', refMin: 13.5, refMax: 17.5, status: 'normal', simpleExplanation: 'Healthy oxygen transport.' },
        { key: 'vitd', name: 'Vitamin D (25-OH)', value: 28, unit: 'ng/mL', refMin: 30, refMax: 100, status: 'borderline', simpleExplanation: 'Slightly below 30 ng/mL.' },
        { key: 'tsh', name: 'TSH', value: 2.0, unit: 'mIU/L', refMin: 0.4, refMax: 4.0, status: 'normal', simpleExplanation: 'Normal thyroid activity.' },
      ],
      riskSignals: [
        {
          domain: 'Metabolic & Glycemic Trend',
          level: 'Moderate',
          summary: 'Fasting glucose crossed slightly above 100 mg/dL.',
          drivers: ['Fasting Glucose 104 mg/dL'],
          preventiveActions: ['Limit refined carbohydrates at dinner'],
        },
      ],
      simplifiedTerms: [
        { term: 'Fasting Glucose', simpleMeaning: 'Blood sugar measured after not eating overnight.', clinicalContext: 'Normal fasting range is 70 to 99 mg/dL.' },
      ],
      followUpQuestions: [
        { id: 'fq_aug_1', question: 'How many minutes of brisk walking did you average per week in July–August?', userAnswer: 'About 90 minutes/week.' },
      ],
    },
    {
      id: 'rep_aarav_may',
      ownerId,
      profileId: 'prof_aarav',
      title: 'Annual Preventive Baseline',
      labName: 'Bayview Wellness Lab',
      reportDate: '2026-05-04',
      category: 'Comprehensive Panel',
      plainSummary:
        'May baseline was largely nominal. Glucose was 98 mg/dL and LDL was borderline at 116 mg/dL.',
      metrics: [
        { key: 'glucose', name: 'Fasting Glucose', value: 98, unit: 'mg/dL', refMin: 70, refMax: 99, status: 'normal', simpleExplanation: 'At the upper end of normal.' },
        { key: 'hba1c', name: 'HbA1c', value: 5.5, unit: '%', refMin: 4.0, refMax: 5.6, status: 'normal', simpleExplanation: 'Within normal range.' },
        { key: 'ldl', name: 'LDL Cholesterol', value: 116, unit: 'mg/dL', refMin: 0, refMax: 99, status: 'borderline', simpleExplanation: 'Slightly above ideal 99 mg/dL.' },
        { key: 'cholesterol', name: 'Total Cholesterol', value: 192, unit: 'mg/dL', refMin: 125, refMax: 200, status: 'normal', simpleExplanation: 'Within normal ceiling.' },
        { key: 'hdl', name: 'HDL Cholesterol', value: 50, unit: 'mg/dL', refMin: 40, refMax: 60, status: 'normal', simpleExplanation: 'Healthy HDL.' },
        { key: 'hemoglobin', name: 'Hemoglobin', value: 14.9, unit: 'g/dL', refMin: 13.5, refMax: 17.5, status: 'normal', simpleExplanation: 'Normal hemoglobin.' },
        { key: 'vitd', name: 'Vitamin D (25-OH)', value: 33, unit: 'ng/mL', refMin: 30, refMax: 100, status: 'normal', simpleExplanation: 'Sufficient Vitamin D.' },
        { key: 'tsh', name: 'TSH', value: 1.9, unit: 'mIU/L', refMin: 0.4, refMax: 4.0, status: 'normal', simpleExplanation: 'Healthy thyroid score.' },
      ],
      riskSignals: [
        {
          domain: 'Cardiovascular Lipid Profile',
          level: 'Low',
          summary: 'LDL slightly above optimal but total cholesterol remained below 200 mg/dL.',
          drivers: ['LDL 116 mg/dL'],
          preventiveActions: ['Maintain routine aerobic exercise'],
        },
      ],
      simplifiedTerms: [],
      followUpQuestions: [],
    },
    {
      id: 'rep_sunita_nov',
      ownerId,
      profileId: 'prof_sunita',
      title: 'Senior Thyroid, CBC & Glucose Review',
      labName: 'CityCare Family Diagnostics',
      reportDate: '2026-11-10',
      category: 'Thyroid & Vitamins',
      plainSummary:
        'Sunita’s hemoglobin improved from 10.1 to 10.9 g/dL, though it remains mildly below the normal floor (12.0 g/dL). TSH is slightly elevated at 5.4 mIU/L, suggesting her physician may want to review her thyroid dose.',
      metrics: [
        { key: 'hemoglobin', name: 'Hemoglobin', value: 10.9, unit: 'g/dL', refMin: 12.0, refMax: 15.5, status: 'low', simpleExplanation: 'Mild anemia; improving compared to July, worth continuing iron-rich meals as guided by her doctor.' },
        { key: 'tsh', name: 'TSH', value: 5.4, unit: 'mIU/L', refMin: 0.4, refMax: 4.0, status: 'high', simpleExplanation: 'Slightly elevated TSH can indicate the thyroid needs a small medication adjustment.' },
        { key: 'glucose', name: 'Fasting Glucose', value: 96, unit: 'mg/dL', refMin: 70, refMax: 99, status: 'normal', simpleExplanation: 'Blood sugar is well controlled.' },
        { key: 'cholesterol', name: 'Total Cholesterol', value: 186, unit: 'mg/dL', refMin: 125, refMax: 200, status: 'normal', simpleExplanation: 'Cholesterol is in a healthy range.' },
        { key: 'vitd', name: 'Vitamin D (25-OH)', value: 26, unit: 'ng/mL', refMin: 30, refMax: 100, status: 'low', simpleExplanation: 'Slightly low Vitamin D; supports bone strength in seniors.' },
      ],
      riskSignals: [
        {
          domain: 'Hematologic / Iron Reserve',
          level: 'Moderate',
          summary: 'Hemoglobin at 10.9 g/dL indicates mild anemia, though trending upward.',
          drivers: ['Hemoglobin 10.9 g/dL'],
          preventiveActions: ['Confirm ferritin & iron panel with Dr. Krishnan'],
        },
        {
          domain: 'Thyroid & Endocrine Balance',
          level: 'Moderate',
          summary: 'TSH at 5.4 mIU/L sits above the 4.0 mIU/L target ceiling.',
          drivers: ['TSH 5.4 mIU/L'],
          preventiveActions: ['Ensure Levothyroxine is taken on an empty stomach 45 mins before tea/coffee'],
        },
      ],
      simplifiedTerms: [
        { term: 'TSH', simpleMeaning: 'Hormone messenger that signals the thyroid gland.', clinicalContext: 'Higher TSH means the body is asking the thyroid to work harder.' },
        { term: 'Hemoglobin', simpleMeaning: 'Protein that carries oxygen through the blood.', clinicalContext: 'Helps prevent fatigue and dizziness.' },
      ],
      followUpQuestions: [
        { id: 'fq_sun_1', question: 'Is Sunita experiencing unusual daytime tiredness, cold sensitivity, or dizziness when standing?', userAnswer: '' },
        { id: 'fq_sun_2', question: 'Is thyroid medication taken consistently with plain water before morning tea?', userAnswer: '' },
      ],
    },
    {
      id: 'rep_sunita_jul',
      ownerId,
      profileId: 'prof_sunita',
      title: 'Mid-Year Geriatric Blood Panel',
      labName: 'CityCare Family Diagnostics',
      reportDate: '2026-07-05',
      category: 'Complete Blood Count',
      plainSummary:
        'July results showed lower hemoglobin (10.1 g/dL) and elevated TSH (6.1 mIU/L).',
      metrics: [
        { key: 'hemoglobin', name: 'Hemoglobin', value: 10.1, unit: 'g/dL', refMin: 12.0, refMax: 15.5, status: 'low', simpleExplanation: 'Low hemoglobin consistent with mild anemia.' },
        { key: 'tsh', name: 'TSH', value: 6.1, unit: 'mIU/L', refMin: 0.4, refMax: 4.0, status: 'high', simpleExplanation: 'Above normal thyroid range.' },
        { key: 'glucose', name: 'Fasting Glucose', value: 94, unit: 'mg/dL', refMin: 70, refMax: 99, status: 'normal', simpleExplanation: 'Normal fasting glucose.' },
        { key: 'cholesterol', name: 'Total Cholesterol', value: 190, unit: 'mg/dL', refMin: 125, refMax: 200, status: 'normal', simpleExplanation: 'Normal cholesterol.' },
        { key: 'vitd', name: 'Vitamin D (25-OH)', value: 21, unit: 'ng/mL', refMin: 30, refMax: 100, status: 'low', simpleExplanation: 'Low Vitamin D.' },
      ],
      riskSignals: [],
      simplifiedTerms: [],
      followUpQuestions: [],
    },
    {
      id: 'rep_maya_oct',
      ownerId,
      profileId: 'prof_maya',
      title: 'Pediatric Annual Wellness Check',
      labName: 'Sunrise Children’s Lab',
      reportDate: '2026-10-22',
      category: 'Complete Blood Count',
      plainSummary:
        'Maya’s pediatric blood panel looks great overall. Hemoglobin and fasting glucose are healthy; Vitamin D is just slightly below optimal at 29 ng/mL.',
      metrics: [
        { key: 'hemoglobin', name: 'Hemoglobin', value: 12.8, unit: 'g/dL', refMin: 11.5, refMax: 15.5, status: 'normal', simpleExplanation: 'Healthy red blood cell level for age 9.' },
        { key: 'glucose', name: 'Fasting Glucose', value: 84, unit: 'mg/dL', refMin: 70, refMax: 99, status: 'normal', simpleExplanation: 'Healthy blood sugar.' },
        { key: 'vitd', name: 'Vitamin D (25-OH)', value: 29, unit: 'ng/mL', refMin: 30, refMax: 100, status: 'borderline', simpleExplanation: 'Right on the borderline of 30 ng/mL; outdoor playtime helps naturally.' },
      ],
      riskSignals: [
        {
          domain: 'Pediatric Growth & Nutrition',
          level: 'Low',
          summary: 'All major markers healthy; slight seasonal Vitamin D dip.',
          drivers: ['Vitamin D 29 ng/mL'],
          preventiveActions: ['Encourage 20–30 mins outdoor play and Vitamin D-fortified foods'],
        },
      ],
      simplifiedTerms: [],
      followUpQuestions: [
        { id: 'fq_may_1', question: 'Does Maya spend at least 20 minutes outdoors during daylight hours?', userAnswer: '' },
      ],
    },
  ];

  const reminders: HealthReminder[] = [
    {
      id: 'rem_1',
      ownerId,
      profileId: 'prof_aarav',
      title: '90-Day Repeat Lipid & HbA1c Fasting Blood Test',
      dueDate: '2027-02-15',
      type: 'lab_test',
      completed: false,
      notes: 'Fast 10 hours before morning lab draw.',
    },
    {
      id: 'rem_2',
      ownerId,
      profileId: 'prof_aarav',
      title: 'Review Vitamin D dosage with Primary Care',
      dueDate: '2026-12-03',
      type: 'appointment',
      completed: false,
      notes: 'Bring Nov 18 PDF Health Summary.',
    },
    {
      id: 'rem_3',
      ownerId,
      profileId: 'prof_sunita',
      title: 'Morning Levothyroxine 50mcg + Iron Checkup',
      dueDate: '2026-11-30',
      type: 'medication',
      completed: false,
      notes: 'Take with plain water before breakfast.',
    },
  ];

  const consultations: DoctorConsultation[] = [
    {
      id: 'con_1',
      ownerId,
      profileId: 'prof_aarav',
      doctorName: 'Dr. Kavita Rao, MD',
      specialty: 'Preventive Cardiology & Lipidology',
      mode: 'Video',
      scheduledDate: '2026-12-04',
      timeSlot: '10:30 AM',
      attachedReportId: 'rep_aarav_nov',
      status: 'scheduled',
      notes: 'Reviewing upward LDL (142 mg/dL) and HbA1c (6.0%) trends.',
    },
  ];

  const auditLogs: PrivacyAuditLog[] = [
    {
      id: 'aud_1',
      ownerId,
      profileId: 'prof_aarav',
      action: 'Shared Nov 2026 Lipid Summary',
      actor: 'Aarav Mehta (Owner)',
      target: 'Dr. Kavita Rao, MD',
      timestampLabel: '2026-11-20 · 09:14 AM',
    },
    {
      id: 'aud_2',
      ownerId,
      profileId: 'prof_aarav',
      action: 'Offline Device Cache Synced',
      actor: 'HealthVision Local Vault',
      target: '3 Saved Lab Reports',
      timestampLabel: '2026-11-24 · 08:40 PM',
    },
    {
      id: 'aud_3',
      ownerId,
      profileId: 'prof_sunita',
      action: 'Profile PIN Lock Enabled',
      actor: 'Aarav Mehta (Caregiver)',
      target: 'Sunita Mehta Profile',
      timestampLabel: '2026-11-12 · 04:22 PM',
    },
  ];

  return { profiles, reports, reminders, consultations, auditLogs };
}
