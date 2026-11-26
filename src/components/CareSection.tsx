import React, { useState } from 'react';
import { Bell, Calendar, HeartPulse, Phone, Plus, Stethoscope, Trash2, CheckCircle2 } from 'lucide-react';
import { DOCTOR_DIRECTORY } from '../data/seedData';
import {
  DoctorConsultation,
  EmergencyContact,
  FamilyProfile,
  HealthGoals,
  HealthReminder,
  LabReport,
} from '../types';

interface CareSectionProps {
  profile: FamilyProfile;
  reports: LabReport[];
  reminders: HealthReminder[];
  consultations: DoctorConsultation[];
  onUpdateGoals: (profileId: string, goals: HealthGoals) => Promise<void>;
  onAddReminder: (reminder: Omit<HealthReminder, 'id' | 'ownerId'>) => Promise<void>;
  onToggleReminder: (reminderId: string, completed: boolean) => Promise<void>;
  onDeleteReminder: (reminderId: string) => Promise<void>;
  onBookConsultation: (consult: Omit<DoctorConsultation, 'id' | 'ownerId' | 'status'>) => Promise<void>;
  onCancelConsultation: (consultId: string) => Promise<void>;
  onUpdateEmergencyInfo: (
    profileId: string,
    contacts: EmergencyContact[],
    emergencyNotes: string,
    allergies: string[]
  ) => Promise<void>;
}

export const CareSection: React.FC<CareSectionProps> = ({
  profile,
  reports,
  reminders,
  consultations,
  onUpdateGoals,
  onAddReminder,
  onToggleReminder,
  onDeleteReminder,
  onBookConsultation,
  onCancelConsultation,
  onUpdateEmergencyInfo,
}) => {
  const [goals, setGoals] = useState<HealthGoals>(profile.goals);
  const [savingGoals, setSavingGoals] = useState(false);

  // Sync local goals when switching profile
  React.useEffect(() => {
    setGoals(profile.goals);
  }, [profile]);

  // Reminder form
  const [remTitle, setRemTitle] = useState('');
  const [remDate, setRemDate] = useState('2026-12-15');
  const [remType, setRemType] = useState<HealthReminder['type']>('lab_test');

  // Consultation booking modal/inline state
  const [selectedDoctor, setSelectedDoctor] = useState(DOCTOR_DIRECTORY[0].name);
  const [consultMode, setConsultMode] = useState<DoctorConsultation['mode']>('Video');
  const [consultDate, setConsultDate] = useState('2026-12-06');
  const [consultTime, setConsultTime] = useState('10:30 AM');
  const [attachedReportId, setAttachedReportId] = useState(reports[0]?.id || '');
  const [consultNotes, setConsultNotes] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Emergency contact form
  const [ecName, setEcName] = useState('');
  const [ecRelation, setEcRelation] = useState('');
  const [ecPhone, setEcPhone] = useState('');
  const [allergyInput, setAllergyInput] = useState('');

  const adjustGoal = async (key: keyof HealthGoals, delta: number, min: number, max: number) => {
    const next = {
      ...goals,
      [key]: Math.min(max, Math.max(min, +(goals[key] + delta).toFixed(1))),
    };
    setGoals(next);
    setSavingGoals(true);
    try {
      await onUpdateGoals(profile.id, next);
    } finally {
      setSavingGoals(false);
    }
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remTitle.trim()) return;
    await onAddReminder({
      profileId: profile.id,
      title: remTitle.trim(),
      dueDate: remDate,
      type: remType,
      completed: false,
      notes: '',
    });
    setRemTitle('');
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    const doc = DOCTOR_DIRECTORY.find((d) => d.name === selectedDoctor) || DOCTOR_DIRECTORY[0];
    await onBookConsultation({
      profileId: profile.id,
      doctorName: doc.name,
      specialty: doc.specialty,
      mode: consultMode,
      scheduledDate: consultDate,
      timeSlot: consultTime,
      attachedReportId: attachedReportId || undefined,
      notes: consultNotes.trim(),
    });
    setConsultNotes('');
    setBookingSuccess(true);
    setTimeout(() => setBookingSuccess(false), 3500);
  };

  const handleAddEmergencyContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ecName.trim() || !ecPhone.trim()) return;
    const nextContacts: EmergencyContact[] = [
      ...profile.emergencyContacts,
      {
        id: `ec_${Date.now()}`,
        name: ecName.trim(),
        relation: ecRelation.trim() || 'Family',
        phone: ecPhone.trim(),
      },
    ];
    await onUpdateEmergencyInfo(
      profile.id,
      nextContacts,
      profile.emergencyNotes || '',
      profile.allergies
    );
    setEcName('');
    setEcRelation('');
    setEcPhone('');
  };

  const handleRemoveEmergencyContact = async (contactId: string) => {
    const nextContacts = profile.emergencyContacts.filter((c) => c.id !== contactId);
    await onUpdateEmergencyInfo(
      profile.id,
      nextContacts,
      profile.emergencyNotes || '',
      profile.allergies
    );
  };

  const handleAddAllergy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allergyInput.trim()) return;
    const nextAllergies = [...profile.allergies, allergyInput.trim()];
    await onUpdateEmergencyInfo(
      profile.id,
      profile.emergencyContacts,
      profile.emergencyNotes || '',
      nextAllergies
    );
    setAllergyInput('');
  };

  const goalCards = [
    {
      label: 'Sleep Duration',
      current: goals.sleepHours,
      target: goals.sleepTarget,
      unit: 'hrs/night',
      step: 0.5,
      min: 3,
      max: 12,
      key: 'sleepHours' as keyof HealthGoals,
    },
    {
      label: 'Daily Hydration',
      current: goals.hydrationLiters,
      target: goals.hydrationTarget,
      unit: 'L/day',
      step: 0.2,
      min: 0.5,
      max: 5,
      key: 'hydrationLiters' as keyof HealthGoals,
    },
    {
      label: 'Physical Activity',
      current: goals.activityMinutes,
      target: goals.activityTarget,
      unit: 'mins/day',
      step: 5,
      min: 0,
      max: 180,
      key: 'activityMinutes' as keyof HealthGoals,
    },
    {
      label: 'Nutrition Balance',
      current: goals.nutritionScore,
      target: 90,
      unit: '/ 100',
      step: 5,
      min: 20,
      max: 100,
      key: 'nutritionScore' as keyof HealthGoals,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Health Goal Setting */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900">
              Daily Health Goals
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Track sleep, hydration, movement, and nutrition habits supporting {profile.name}’s lab targets
            </p>
          </div>
          {savingGoals && (
            <span className="text-xs text-teal-700 font-medium">Saving...</span>
          )}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {goalCards.map((g) => {
            const pct = Math.min(100, Math.round((g.current / Math.max(g.target, 1)) * 100));
            return (
              <div
                key={g.key}
                className="p-4 bg-slate-50 border border-slate-200/80 rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-medium text-slate-700">{g.label}</span>
                  <span className="font-mono tabular-nums">Target {g.target}</span>
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
                    {g.current}
                  </span>
                  <span className="text-xs text-slate-500">{g.unit}</span>
                </div>

                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-700 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => adjustGoal(g.key, -g.step, g.min, g.max)}
                    className="px-2.5 py-1 text-xs font-mono font-medium bg-white border border-slate-200 rounded hover:bg-slate-100 cursor-pointer"
                  >
                    -{g.step}
                  </button>
                  <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                    {pct}% of goal
                  </span>
                  <button
                    onClick={() => adjustGoal(g.key, g.step, g.min, g.max)}
                    className="px-2.5 py-1 text-xs font-mono font-medium bg-white border border-slate-200 rounded hover:bg-slate-100 cursor-pointer"
                  >
                    +{g.step}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Doctor Consultation + Smart Notifications */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Doctor Consultation */}
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2.5">
            <Stethoscope className="w-5 h-5 text-teal-700 shrink-0" />
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900">
                Doctor Consultation
              </h3>
              <p className="text-xs text-slate-500">
                Connect with a physician and share your selected HealthVision lab summary
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-200/80 border-t border-b border-slate-200/80">
            {DOCTOR_DIRECTORY.map((doc) => {
              const selected = selectedDoctor === doc.name;
              return (
                <div
                  key={doc.id}
                  className="py-3.5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={doc.avatarUrl}
                      alt={doc.name}
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0 bg-slate-100"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{doc.name}</p>
                      <p className="text-xs text-slate-600 truncate">
                        {doc.specialty} · {doc.languages.join(', ')}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {doc.hospital} · Next: {doc.nextAvailable}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedDoctor(doc.name)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      selected
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {selected ? 'Selected' : 'Select'}
                  </button>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleBook} className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Consultation Mode
              </label>
              <select
                value={consultMode}
                onChange={(e) => setConsultMode(e.target.value as DoctorConsultation['mode'])}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="Video">Video Telehealth</option>
                <option value="In-Clinic">In-Clinic Visit</option>
                <option value="Second Opinion">Written Second Opinion</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Attach Lab Report
              </label>
              <select
                value={attachedReportId}
                onChange={(e) => setAttachedReportId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="">No report attached</option>
                {reports.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.reportDate} — {r.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={consultDate}
                onChange={(e) => setConsultDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Time Slot</label>
              <select
                value={consultTime}
                onChange={(e) => setConsultTime(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
              >
                <option value="09:30 AM">09:30 AM</option>
                <option value="10:30 AM">10:30 AM</option>
                <option value="02:00 PM">02:00 PM</option>
                <option value="04:15 PM">04:15 PM</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <input
                type="text"
                value={consultNotes}
                onChange={(e) => setConsultNotes(e.target.value)}
                placeholder="Questions or symptoms to share with the doctor..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div className="sm:col-span-2 flex items-center justify-between gap-3">
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors cursor-pointer"
              >
                Schedule with {selectedDoctor.split(',')[0]}
              </button>
              {bookingSuccess && (
                <span className="text-xs text-emerald-700 font-medium inline-flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Appointment scheduled
                </span>
              )}
            </div>
          </form>

          {consultations.length > 0 && (
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <p className="text-xs font-semibold text-slate-700">Upcoming & Past Consultations</p>
              <div className="divide-y divide-slate-100">
                {consultations.map((c) => (
                  <div key={c.id} className="py-2 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <p className="font-medium text-slate-900">
                        {c.doctorName} · {c.mode}
                      </p>
                      <p className="text-slate-500 font-mono">
                        {c.scheduledDate} at {c.timeSlot} · Status: <span className="capitalize">{c.status}</span>
                      </p>
                    </div>
                    {c.status === 'scheduled' && (
                      <button
                        onClick={() => onCancelConsultation(c.id)}
                        className="text-xs text-red-600 hover:underline cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Smart Notifications & Reminders */}
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-teal-700 shrink-0" />
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900">
                Smart Checkup Reminders
              </h3>
              <p className="text-xs text-slate-500">
                Upcoming re-tests, medications, and doctor follow-ups
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateReminder} className="space-y-2.5">
            <input
              type="text"
              value={remTitle}
              onChange={(e) => setRemTitle(e.target.value)}
              placeholder="Reminder title (e.g., Repeat HbA1c test)..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
            />
            <div className="flex gap-2">
              <input
                type="date"
                value={remDate}
                onChange={(e) => setRemDate(e.target.value)}
                className="flex-1 px-2.5 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg"
              />
              <select
                value={remType}
                onChange={(e) => setRemType(e.target.value as HealthReminder['type'])}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="lab_test">Lab Test</option>
                <option value="appointment">Appointment</option>
                <option value="medication">Medication</option>
                <option value="checkup">Checkup</option>
              </select>
              <button
                type="submit"
                disabled={!remTitle.trim()}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-50 rounded-lg inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </form>

          <div className="divide-y divide-slate-100 border-t border-slate-200">
            {reminders.length === 0 ? (
              <p className="py-4 text-xs text-slate-500">No reminders added for {profile.name}.</p>
            ) : (
              reminders.map((rem) => (
                <div key={rem.id} className="py-3 flex items-start justify-between gap-3">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rem.completed}
                      onChange={() => onToggleReminder(rem.id, !rem.completed)}
                      className="mt-0.5 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                    />
                    <div>
                      <p
                        className={`text-xs font-medium ${
                          rem.completed ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {rem.title}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        <span>{rem.dueDate}</span>
                        <span>·</span>
                        <span className="capitalize">{rem.type.replace('_', ' ')}</span>
                      </p>
                    </div>
                  </label>
                  <button
                    onClick={() => onDeleteReminder(rem.id)}
                    aria-label="Delete reminder"
                    className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Emergency Contacts & Medical ID */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <HeartPulse className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900">
                Emergency Medical ID & Contacts
              </h3>
              <p className="text-xs text-slate-500">
                Available offline during emergencies · Blood Type {profile.bloodType} · Age {profile.age}
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 pt-2 border-t border-slate-200/80">
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Critical Medical Details
            </p>
            <div className="text-xs space-y-2 text-slate-700">
              <p>
                <span className="text-slate-500">Blood Group:</span>{' '}
                <strong className="font-mono text-slate-900">{profile.bloodType}</strong>
              </p>
              <p>
                <span className="text-slate-500">Known Conditions:</span>{' '}
                {profile.conditions.length ? profile.conditions.join(' · ') : 'None listed'}
              </p>
              <p>
                <span className="text-slate-500">Allergies:</span>{' '}
                <span className="text-red-700 font-medium">
                  {profile.allergies.length ? profile.allergies.join(' · ') : 'None listed'}
                </span>
              </p>
              {profile.emergencyNotes && (
                <p className="text-slate-600 pt-1">{profile.emergencyNotes}</p>
              )}
            </div>

            <form onSubmit={handleAddAllergy} className="flex gap-2 pt-1">
              <input
                type="text"
                value={allergyInput}
                onChange={(e) => setAllergyInput(e.target.value)}
                placeholder="Add allergy (e.g., Ibuprofen)..."
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
              <button
                type="submit"
                disabled={!allergyInput.trim()}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg cursor-pointer"
              >
                Add Allergy
              </button>
            </form>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Emergency Contacts
            </p>

            <div className="divide-y divide-slate-100">
              {profile.emergencyContacts.map((ec) => (
                <div key={ec.id} className="py-2 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-900">
                        {ec.name} <span className="font-normal text-slate-500">· {ec.relation}</span>
                      </p>
                      <p className="font-mono text-slate-600">{ec.phone}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveEmergencyContact(ec.id)}
                    className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                    aria-label="Remove emergency contact"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddEmergencyContact} className="grid grid-cols-3 gap-2 pt-1">
              <input
                type="text"
                value={ecName}
                onChange={(e) => setEcName(e.target.value)}
                placeholder="Contact name"
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
              <input
                type="text"
                value={ecRelation}
                onChange={(e) => setEcRelation(e.target.value)}
                placeholder="Relation"
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
              <div className="flex gap-1.5">
                <input
                  type="tel"
                  value={ecPhone}
                  onChange={(e) => setEcPhone(e.target.value)}
                  placeholder="Phone"
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg"
                />
                <button
                  type="submit"
                  disabled={!ecName.trim() || !ecPhone.trim()}
                  className="px-2.5 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-50 rounded-lg shrink-0 cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};
