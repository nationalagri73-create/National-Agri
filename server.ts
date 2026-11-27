import express, { Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.join(__dirname, 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as {
  projectId: string;
  firestoreDatabaseId?: string;
};

const adminApp = getApps().length
  ? getApp()
  : initializeApp({
      projectId: firebaseConfig.projectId,
    });
const adminAuth = getAuth(adminApp);

const BOOTSTRAPPED_OWNER_EMAILS = new Set([
  'hamzaelhelaly08@gmail.com',
  'national.agri73@gmail.com',
]);

function getGenAIClient(): GoogleGenAI {
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

async function verifyPlatformOwnerToken(req: Request): Promise<{
  uid: string;
  email: string;
}> {
  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    throw Object.assign(new Error('Missing Authorization Bearer token.'), {
      statusCode: 401,
    });
  }
  const decoded = await adminAuth.verifyIdToken(match[1]);
  const email = (decoded.email || '').toLowerCase();
  if (!decoded.email_verified || !BOOTSTRAPPED_OWNER_EMAILS.has(email)) {
    throw Object.assign(
      new Error('Owner Financial Management access requires a verified platform owner account.'),
      { statusCode: 403 },
    );
  }
  return { uid: decoded.uid, email };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '6mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, service: 'basit-platform' });
  });

  app.post('/api/auth/verify-token', async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization || '';
      const match = authHeader.match(/^Bearer\s+(.+)$/i);
      if (!match) {
        res.status(401).json({ error: 'Missing Authorization Bearer token.' });
        return;
      }
      const decoded = await adminAuth.verifyIdToken(match[1]);
      const email = (decoded.email || '').toLowerCase();
      res.json({
        verified: true,
        uid: decoded.uid,
        email: decoded.email || null,
        emailVerified: Boolean(decoded.email_verified),
        phoneNumber: decoded.phone_number || null,
        isBootstrappedOwner:
          Boolean(decoded.email_verified) && BOOTSTRAPPED_OWNER_EMAILS.has(email),
      });
    } catch {
      res.status(401).json({ error: 'Invalid or expired Firebase ID token.' });
    }
  });

  app.post('/api/finance/parse-voice', async (req: Request, res: Response) => {
    try {
      await verifyPlatformOwnerToken(req);

      const { audioBase64, mimeType, transcript, lang } = req.body as {
        audioBase64?: string;
        mimeType?: string;
        transcript?: string;
        lang?: 'ar' | 'en';
      };

      const hasAudio = typeof audioBase64 === 'string' && audioBase64.trim().length > 20;
      const hasTranscript = typeof transcript === 'string' && transcript.trim().length >= 3;

      if (!hasAudio && !hasTranscript) {
        res.status(400).json({
          error:
            lang === 'en'
              ? 'Provide a voice recording or spoken/typed transaction description.'
              : 'يرجى إرسال تسجيل صوتي أو وصف واضح للعملية المالية.',
        });
        return;
      }

      const ai = getGenAIClient();
      const todayIso = new Date().toISOString().slice(0, 10);

      const instructionPrompt = `You are a bilingual Arabic/English financial data extraction assistant for BASIT | باسط (Al-Wataniya Logistics).
Extract a structured draft financial transaction from the provided voice audio or transcript.
Today's ISO date is ${todayIso}.
Rules:
- Never fabricate amounts; if no number is stated clearly, set grossEGP to 0 and explain in confidenceNote.
- Map direction to "inflow" (revenue, collection, receipt, إيداع، تحصيل، إيراد، قبض) or "outflow" (expense, payment, salary, debt payout, مصروف، سداد، رواتب، مشتريات).
- Map entryKind to one of: "revenue", "expense", "receivable", "payable", "debt".
- Map sector to one of: "marketplace", "business", "card", "healthy", "factory", "logistics", "general".
- Map expenseCategory to one of: "none" (for inflows), "salaries", "raw_materials", "marketing", "commissions", "logistics", "other".
- Map channel to one of: "bank" (تحويل بنكي/بنك), "e_wallet" (فودافون كاش/إنستاباي/محفظة), "treasury" (خزينة/كاش/نقدي). Default "treasury" if cash or unclear.
- Return concise Arabic/English strings matching the user's phrasing for sourceOrBeneficiary, purpose, and transcriptNormalized.
${hasTranscript ? `\nSpoken/Entered text: "${transcript!.trim()}"` : ''}`;

      const parts: Array<
        { text: string } | { inlineData: { mimeType: string; data: string } }
      > = [];

      if (hasAudio) {
        parts.push({
          inlineData: {
            mimeType: typeof mimeType === 'string' && mimeType.trim() ? mimeType : 'audio/webm',
            data: audioBase64!.trim(),
          },
        });
      }
      parts.push({ text: instructionPrompt });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              direction: {
                type: Type.STRING,
                enum: ['inflow', 'outflow'],
              },
              entryKind: {
                type: Type.STRING,
                enum: ['revenue', 'expense', 'receivable', 'payable', 'debt'],
              },
              sector: {
                type: Type.STRING,
                enum: ['marketplace', 'business', 'card', 'healthy', 'factory', 'logistics', 'general'],
              },
              sourceOrBeneficiary: { type: Type.STRING },
              purpose: { type: Type.STRING },
              expenseCategory: {
                type: Type.STRING,
                enum: ['none', 'salaries', 'raw_materials', 'marketing', 'commissions', 'logistics', 'other'],
              },
              channel: {
                type: Type.STRING,
                enum: ['bank', 'e_wallet', 'treasury'],
              },
              grossEGP: { type: Type.NUMBER },
              commissionPct: { type: Type.NUMBER },
              entryDate: { type: Type.STRING },
              transcriptNormalized: { type: Type.STRING },
              confidenceNote: { type: Type.STRING },
            },
            required: [
              'direction',
              'entryKind',
              'sector',
              'sourceOrBeneficiary',
              'purpose',
              'expenseCategory',
              'channel',
              'grossEGP',
              'commissionPct',
              'entryDate',
              'transcriptNormalized',
              'confidenceNote',
            ],
          },
        },
      });

      const rawText = (response.text || '{}').trim();
      const parsed = JSON.parse(rawText) as Record<string, unknown>;

      res.json({
        status: 'draft_pending_review',
        draft: {
          direction: parsed.direction === 'outflow' ? 'outflow' : 'inflow',
          entryKind: typeof parsed.entryKind === 'string' ? parsed.entryKind : 'revenue',
          sector: typeof parsed.sector === 'string' ? parsed.sector : 'general',
          sourceOrBeneficiary:
            typeof parsed.sourceOrBeneficiary === 'string' && parsed.sourceOrBeneficiary.trim()
              ? parsed.sourceOrBeneficiary.trim().slice(0, 160)
              : 'جهة تشغيلية',
          purpose:
            typeof parsed.purpose === 'string' && parsed.purpose.trim()
              ? parsed.purpose.trim().slice(0, 280)
              : 'قيد مالي بالمدخل الصوتي',
          expenseCategory:
            typeof parsed.expenseCategory === 'string' ? parsed.expenseCategory : 'none',
          channel:
            parsed.channel === 'bank' || parsed.channel === 'e_wallet' ? parsed.channel : 'treasury',
          grossEGP: Number.isFinite(Number(parsed.grossEGP))
            ? Math.max(0, Math.round(Number(parsed.grossEGP)))
            : 0,
          commissionPct: Number.isFinite(Number(parsed.commissionPct))
            ? Math.max(0, Math.min(100, Number(parsed.commissionPct)))
            : 0,
          entryDate:
            typeof parsed.entryDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsed.entryDate)
              ? parsed.entryDate
              : todayIso,
          transcriptNormalized:
            typeof parsed.transcriptNormalized === 'string'
              ? parsed.transcriptNormalized.trim().slice(0, 900)
              : (transcript || '').trim().slice(0, 900),
          confidenceNote:
            typeof parsed.confidenceNote === 'string' ? parsed.confidenceNote.trim() : '',
        },
      });
    } catch (error) {
      const statusCode =
        typeof error === 'object' && error !== null && 'statusCode' in error
          ? Number((error as { statusCode?: number }).statusCode || 500)
          : 500;
      const message =
        error instanceof Error ? error.message : 'Failed to parse voice transaction.';
      console.error('[/api/finance/parse-voice]', message);
      res.status(statusCode).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.get('/@vite/client', async (req: Request, res: Response, next) => {
      try {
        const result = await vite.transformRequest(req.originalUrl);
        if (!result) {
          next();
          return;
        }
        const safeCode = result.code.replace(
          /const transport = normalizeModuleRunnerTransport\(\(\(\) => \{[\s\S]*?\}\)\(\)\);/,
          'const transport = normalizeModuleRunnerTransport({ async connect() {}, async disconnect() {}, send() {} });',
        );
        res.type('application/javascript').send(safeCode);
      } catch {
        next();
      }
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT || 3000);
  app.listen(port, '0.0.0.0', () => {
    console.log(`BASIT platform server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
