import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function mapGeminiError(error: unknown): { status: number; message: string } {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes('GEMINI_API_KEY')) {
    return { status: 500, message: 'Server AI configuration missing. Please verify GEMINI_API_KEY in Settings > Secrets.' };
  }
  if (msg.includes('403') || msg.includes('PERMISSION_DENIED') || msg.includes('API_KEY_INVALID')) {
    return { status: 403, message: 'AI service key rejected. Please check GEMINI_API_KEY in Settings > Secrets.' };
  }
  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
    return { status: 429, message: 'AI quota temporarily reached. Please retry shortly.' };
  }
  return { status: 500, message: msg || 'Failed to process request with AI service.' };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'HealthVision API' });
  });

  // 1. Analyze uploaded medical report (Text, Image, or PDF base64)
  app.post('/api/analyze-report', async (req, res) => {
    try {
      const { reportText, fileBase64, mimeType, profileName, profileAge, conditions, historicalSummary } = req.body ?? {};
      if (!reportText && !fileBase64) {
        return res.status(400).json({ error: 'Please provide report text or upload a report file.' });
      }

      const ai = getAiClient();
      const systemInstruction = `You are HealthVision, an empathetic, precise clinical report translator.
Convert medical lab report data into clear, structured, plain-language insights.
CRITICAL SAFETY RULE: Present all analysis strictly as informational support, NEVER as a medical diagnosis. Always encourage confirming abnormal or concerning findings with a licensed healthcare professional.
Keep explanations accessible to patients and elderly caregivers.`;

      const prompt = `Analyze this medical lab report for ${profileName || 'Patient'} (Age: ${profileAge ?? 'Adult'}, Known conditions: ${Array.isArray(conditions) && conditions.length ? conditions.join(', ') : 'None listed'}).
Historical context: ${historicalSummary || 'No prior report summary provided.'}
${reportText ? `\nReport Text:\n${reportText}` : '\nExtract all biomarkers and findings from the attached lab report document/image.'}

Return valid JSON matching the schema. Normalize metric keys cleanly (e.g., glucose, hba1c, ldl, cholesterol, hdl, triglycerides, hemoglobin, vitd, tsh, creatinine, alt, ast).`;

      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
      if (fileBase64 && mimeType) {
        parts.push({ inlineData: { mimeType, data: fileBase64 } });
      }
      parts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: { parts },
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              labName: { type: Type.STRING },
              reportDate: { type: Type.STRING, description: 'YYYY-MM-DD format if available, otherwise today.' },
              category: {
                type: Type.STRING,
                enum: ['Complete Blood Count', 'Metabolic & Lipid', 'Thyroid & Vitamins', 'Comprehensive Panel'],
              },
              plainSummary: { type: Type.STRING },
              metrics: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    key: { type: Type.STRING },
                    name: { type: Type.STRING },
                    value: { type: Type.NUMBER },
                    unit: { type: Type.STRING },
                    refMin: { type: Type.NUMBER },
                    refMax: { type: Type.NUMBER },
                    status: { type: Type.STRING, enum: ['normal', 'borderline', 'high', 'low', 'critical'] },
                    simpleExplanation: { type: Type.STRING },
                  },
                  required: ['key', 'name', 'value', 'unit', 'refMin', 'refMax', 'status', 'simpleExplanation'],
                },
              },
              riskSignals: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    domain: { type: Type.STRING },
                    level: { type: Type.STRING, enum: ['Low', 'Moderate', 'Elevated'] },
                    summary: { type: Type.STRING },
                    drivers: { type: Type.ARRAY, items: { type: Type.STRING } },
                    preventiveActions: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ['domain', 'level', 'summary', 'drivers', 'preventiveActions'],
                },
              },
              simplifiedTerms: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    term: { type: Type.STRING },
                    simpleMeaning: { type: Type.STRING },
                    clinicalContext: { type: Type.STRING },
                  },
                  required: ['term', 'simpleMeaning', 'clinicalContext'],
                },
              },
              followUpQuestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    question: { type: Type.STRING },
                  },
                  required: ['id', 'question'],
                },
              },
            },
            required: ['title', 'labName', 'reportDate', 'category', 'plainSummary', 'metrics', 'riskSignals', 'simplifiedTerms', 'followUpQuestions'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      return res.json({ report: parsed });
    } catch (error) {
      const mapped = mapGeminiError(error);
      return res.status(mapped.status).json({ error: mapped.message });
    }
  });

  // 2. Medical Term Simplifier
  app.post('/api/simplify-term', async (req, res) => {
    try {
      const { term, context } = req.body ?? {};
      if (!term || typeof term !== 'string') {
        return res.status(400).json({ error: 'Medical term is required.' });
      }
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Explain the medical term "${term}" in simple, reassuring everyday language for a patient or elderly family member. Context: ${context || 'General lab report'}. Remind briefly that a clinician interprets results in full context.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              term: { type: Type.STRING },
              simpleMeaning: { type: Type.STRING },
              clinicalContext: { type: Type.STRING },
            },
            required: ['term', 'simpleMeaning', 'clinicalContext'],
          },
        },
      });
      const parsed = JSON.parse((response.text ?? '{}').trim());
      return res.json(parsed);
    } catch (error) {
      const mapped = mapGeminiError(error);
      return res.status(mapped.status).json({ error: mapped.message });
    }
  });

  // 3. Personalized Follow-Up Refinement
  app.post('/api/refine-insights', async (req, res) => {
    try {
      const { reportTitle, plainSummary, metrics, qaPairs, profileAge, conditions } = req.body ?? {};
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Report: ${reportTitle}\nPatient Age: ${profileAge}, Conditions: ${(conditions || []).join(', ') || 'None'}\nInitial Summary: ${plainSummary}\nAbnormal/Key Metrics: ${JSON.stringify(metrics)}\nPatient Follow-up Answers:\n${JSON.stringify(qaPairs)}\n\nProvide a concise, compassionate 3-4 sentence personalized explanation incorporating their lifestyle/symptom answers, practical next questions to ask their doctor, and a clear reminder that this is informational support rather than a medical diagnosis.`,
      });
      return res.json({ refinedAdvice: (response.text ?? '').trim() });
    } catch (error) {
      const mapped = mapGeminiError(error);
      return res.status(mapped.status).json({ error: mapped.message });
    }
  });

  // 4. Longitudinal AI Risk Forecast across historical reports
  app.post('/api/risk-forecast', async (req, res) => {
    try {
      const { profile, reports } = req.body ?? {};
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Review historical lab trends for ${profile?.name || 'Patient'} (Age ${profile?.age ?? 'Adult'}, Conditions: ${(profile?.conditions || []).join(', ') || 'None'}).\nReports (newest first): ${JSON.stringify((reports || []).slice(0, 5).map((r: any) => ({ date: r.reportDate, title: r.title, metrics: r.metrics })))}\nIdentify top 3-4 informational health risk patterns based on trajectory (improving vs rising markers) and preventive habits to discuss with a doctor.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              longitudinalNarrative: { type: Type.STRING },
              riskSignals: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    domain: { type: Type.STRING },
                    level: { type: Type.STRING, enum: ['Low', 'Moderate', 'Elevated'] },
                    summary: { type: Type.STRING },
                    drivers: { type: Type.ARRAY, items: { type: Type.STRING } },
                    preventiveActions: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ['domain', 'level', 'summary', 'drivers', 'preventiveActions'],
                },
              },
            },
            required: ['longitudinalNarrative', 'riskSignals'],
          },
        },
      });
      const parsed = JSON.parse((response.text ?? '{}').trim());
      return res.json(parsed);
    } catch (error) {
      const mapped = mapGeminiError(error);
      return res.status(mapped.status).json({ error: mapped.message });
    }
  });

  // 5. Multilingual Voice Assistant (Gemini translation + Gemini TTS audio)
  app.post('/api/voice-explain', async (req, res) => {
    try {
      const { profileName, summaryText, abnormalMetrics, languageLabel, voiceName } = req.body ?? {};
      const ai = getAiClient();

      // Step 1: Compose warm, patient-friendly spoken script in target language
      const scriptResp = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Create a warm, calm, clear spoken explanation in ${languageLabel || 'English'} for ${profileName || 'the patient'} (maximum 110 words, natural spoken sentences, no markdown symbols, no asterisks).
Summarize these findings simply:
Summary: ${summaryText}
Out-of-range values: ${JSON.stringify(abnormalMetrics || [])}
End by gently reminding them this is informational guidance and to review any abnormal results with their doctor.`,
      });
      const translatedScript = (scriptResp.text ?? '').trim();

      // Step 2: Generate spoken WAV audio with gemini-3.8-flash-lite-tts
      let audioBase64: string | null = null;
      let ttsWarning: string | null = null;
      try {
        const ttsResp = await ai.models.generateContent({
          model: 'gemini-3.8-flash-lite-tts',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: translatedScript,
                  speechMetadata: {
                    style: 'Warm, calm, reassuring healthcare educator speaking clearly',
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' },
              },
            },
          },
        });
        audioBase64 = ttsResp.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data ?? null;
      } catch (ttsErr) {
        ttsWarning = ttsErr instanceof Error ? ttsErr.message : 'TTS audio synthesis unavailable; showing translated transcript.';
      }

      return res.json({
        translatedScript,
        audioBase64,
        mimeType: audioBase64 ? 'audio/wav' : null,
        ttsWarning,
      });
    } catch (error) {
      const mapped = mapGeminiError(error);
      return res.status(mapped.status).json({ error: mapped.message });
    }
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HealthVision server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
