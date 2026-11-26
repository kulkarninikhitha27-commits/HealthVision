import React, { useEffect, useRef, useState } from 'react';
import { Volume2, Play, Pause, Globe, RotateCcw } from 'lucide-react';
import { VOICE_LANGUAGES } from '../data/seedData';
import { FamilyProfile, LabReport } from '../types';

interface VoiceSectionProps {
  profile: FamilyProfile;
  report: LabReport | null;
  isOffline: boolean;
}

export const VoiceSection: React.FC<VoiceSectionProps> = ({
  profile,
  report,
  isOffline,
}) => {
  const [selectedLang, setSelectedLang] = useState(
    VOICE_LANGUAGES.find((l) => l.code === profile.preferredLanguage)?.code || 'en'
  );
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ttsNotice, setTtsNotice] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      window.speechSynthesis?.cancel();
    };
  }, [audioUrl]);

  if (!report) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-sm text-slate-600">
        Select or upload a medical report to generate multilingual voice explanations.
      </div>
    );
  }

  const langOption = VOICE_LANGUAGES.find((l) => l.code === selectedLang) || VOICE_LANGUAGES[0];

  const handleGenerateVoice = async () => {
    window.speechSynthesis?.cancel();
    setIsPlaying(false);
    setError(null);
    setTtsNotice(null);

    const abnormal = report.metrics
      .filter((m) => m.status !== 'normal')
      .map((m) => ({
        name: m.name,
        value: `${m.value} ${m.unit}`,
        status: m.status,
        note: m.simpleExplanation,
      }));

    if (isOffline) {
      const offlineText = `${report.plainSummary} ${
        abnormal.length
          ? 'Items outside standard range: ' +
            abnormal.map((a) => `${a.name} is ${a.value} (${a.status})`).join('. ')
          : ''
      } Please confirm these results with your doctor.`;
      setTranscript(offlineText);
      setTtsNotice('Offline mode active: using device speech synthesis in English.');
      if ('speechSynthesis' in window) {
        const utter = new SpeechSynthesisUtterance(offlineText);
        utter.rate = playbackRate;
        utter.onstart = () => setIsPlaying(true);
        utter.onend = () => setIsPlaying(false);
        window.speechSynthesis.speak(utter);
      }
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch('/api/voice-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileName: profile.name,
          summaryText: report.plainSummary,
          abnormalMetrics: abnormal,
          languageLabel: `${langOption.label} (${langOption.nativeLabel})`,
          voiceName: langOption.voiceName,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Voice generation failed.');

      setTranscript(data.translatedScript || '');
      if (data.ttsWarning) setTtsNotice(data.ttsWarning);

      if (data.audioBase64) {
        const binary = atob(data.audioBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'audio/wav' });
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        const nextUrl = URL.createObjectURL(blob);
        setAudioUrl(nextUrl);

        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.playbackRate = playbackRate;
            audioRef.current.play().catch(() => {});
          }
        }, 80);
      } else if ('speechSynthesis' in window && data.translatedScript) {
        const utter = new SpeechSynthesisUtterance(data.translatedScript);
        utter.lang = selectedLang;
        utter.rate = playbackRate;
        utter.onstart = () => setIsPlaying(true);
        utter.onend = () => setIsPlaying(false);
        window.speechSynthesis.speak(utter);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate spoken explanation.');
    } finally {
      setLoading(false);
    }
  };

  const togglePlayPause = () => {
    if (audioRef.current && audioUrl) {
      if (audioRef.current.paused) {
        audioRef.current.playbackRate = playbackRate;
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    } else if ('speechSynthesis' in window && transcript) {
      if (isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
      } else {
        const utter = new SpeechSynthesisUtterance(transcript);
        utter.lang = selectedLang;
        utter.rate = playbackRate;
        utter.onstart = () => setIsPlaying(true);
        utter.onend = () => setIsPlaying(false);
        window.speechSynthesis.speak(utter);
      }
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Globe className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-display text-lg font-semibold text-slate-900">
                Multilingual Voice Assistant
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Hear a calm, accessible explanation of {profile.name}’s report ({report.title}) in your preferred language
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {[0.85, 1, 1.15].map((rate) => (
              <button
                key={rate}
                onClick={() => {
                  setPlaybackRate(rate);
                  if (audioRef.current) audioRef.current.playbackRate = rate;
                }}
                className={`px-2.5 py-1 text-xs font-mono rounded-md transition-colors cursor-pointer ${
                  playbackRate === rate ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>

        {/* Language Selector Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {VOICE_LANGUAGES.map((lang) => {
            const active = selectedLang === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => setSelectedLang(lang.code)}
                className={`p-3 text-left rounded-lg border transition-colors cursor-pointer ${
                  active
                    ? 'bg-teal-50 border-teal-600 text-teal-900'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-sm font-semibold">{lang.nativeLabel}</div>
                <div className="text-xs text-slate-500 mt-0.5">{lang.label}</div>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={handleGenerateVoice}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
            <span>
              {loading
                ? `Preparing ${langOption.label} Audio...`
                : `Explain Report in ${langOption.label}`}
            </span>
          </button>

          {(audioUrl || transcript) && (
            <button
              onClick={togglePlayPause}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? 'Pause' : 'Play / Resume'}</span>
            </button>
          )}

          {audioUrl && (
            <button
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.currentTime = 0;
                  audioRef.current.play();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Replay</span>
            </button>
          )}
        </div>

        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            controls
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            className="w-full mt-2"
          />
        )}

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {ttsNotice && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            {ttsNotice}
          </p>
        )}

        {transcript && (
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700">
                Spoken Transcript ({langOption.label})
              </span>
              <span>Informational guidance · Confirm concerns with a physician</span>
            </div>
            <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
              {transcript}
            </p>
          </div>
        )}
      </section>
    </div>
  );
};
