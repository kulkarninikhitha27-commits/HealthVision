import React, { useState } from 'react';
import { Lock, X } from 'lucide-react';
import { VOICE_LANGUAGES } from '../data/seedData';
import { FamilyProfile } from '../types';

interface AddProfileModalProps {
  onClose: () => void;
  onCreateProfile: (profile: Omit<FamilyProfile, 'id' | 'ownerId'>) => Promise<void>;
}

export const AddProfileModal: React.FC<AddProfileModalProps> = ({
  onClose,
  onCreateProfile,
}) => {
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('Parent');
  const [age, setAge] = useState('62');
  const [bloodType, setBloodType] = useState('O+');
  const [preferredLanguage, setPreferredLanguage] = useState('en');
  const [conditionsText, setConditionsText] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onCreateProfile({
        name: name.trim(),
        relation,
        age: Math.max(0, Math.min(125, Number(age) || 35)),
        bloodType,
        preferredLanguage,
        pinCode: pinCode.trim() || undefined,
        isLocked: false,
        conditions: conditionsText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        allergies: [],
        emergencyNotes: '',
        emergencyContacts: [],
        privacySettings: {
          allowAiAnalysis: true,
          shareTrendsWithDoctor: true,
          requirePin: pinCode.trim().length >= 4,
          offlineCacheEnabled: true,
        },
        goals: {
          sleepHours: 7,
          hydrationLiters: 2,
          activityMinutes: 30,
          nutritionScore: 80,
          sleepTarget: 8,
          hydrationTarget: 2.5,
          activityTarget: 40,
        },
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            Add Family Health Profile
          </h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rajesh Mehta"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Relation</label>
              <select
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="Parent">Parent</option>
                <option value="Spouse">Spouse</option>
                <option value="Child">Child</option>
                <option value="Self">Self</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-2.5 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Blood Type</label>
              <select
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value)}
                className="w-full px-2.5 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg"
              >
                {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((bt) => (
                  <option key={bt} value={bt}>{bt}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Preferred Voice Language
            </label>
            <select
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
            >
              {VOICE_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label} ({l.nativeLabel})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Ongoing Conditions (comma-separated)
            </label>
            <input
              type="text"
              value={conditionsText}
              onChange={(e) => setConditionsText(e.target.value)}
              placeholder="e.g. Hypertension, Type 2 Diabetes"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Optional 4-Digit Privacy PIN
            </label>
            <input
              type="password"
              maxLength={6}
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value)}
              placeholder="Leave blank for unlocked profile"
              className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-50 rounded-lg cursor-pointer"
            >
              {saving ? 'Creating...' : 'Create Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface PinUnlockModalProps {
  profile: FamilyProfile;
  onUnlock: () => void;
  onCancel: () => void;
}

export const PinUnlockModal: React.FC<PinUnlockModalProps> = ({
  profile,
  onUnlock,
  onCancel,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === (profile.pinCode || '1234')) {
      onUnlock();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl max-w-sm w-full p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <Lock className="w-5 h-5 text-teal-700" />
          <h3 className="font-display text-base font-semibold text-slate-900">
            Unlock {profile.name}’s Profile
          </h3>
        </div>
        <p className="text-xs text-slate-600">
          This family profile is protected by a privacy PIN. Enter PIN (demo default for Sunita: <span className="font-mono font-semibold">1234</span>).
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            autoFocus
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError(false);
            }}
            placeholder="Enter PIN..."
            className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg"
          />
          {error && <p className="text-xs text-red-600">Incorrect PIN. Please try again.</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
            >
              Unlock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
