import React, { useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Landmark,
  Lock,
  Mic,
  MicOff,
  Plus,
  Printer,
  Receipt,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { useI18n } from '../i18n/translations';
import {
  collectOwnerReceivablePayment,
  createOwnerInvoiceRecord,
  createOwnerPayableRecord,
  createOwnerReceivableRecord,
  logOwnerFinancialAction,
  payOwnerSupplierInstallment,
  recordOwnerFinancialEntry,
  updateOwnerInvoiceStatus,
} from '../services/faydFirestore';
import {
  BasitSectorKey,
  OwnerClientReceivable,
  OwnerFinancialAccount,
  OwnerFinancialAuditLog,
  OwnerFinancialEntry,
  OwnerInvoice,
  OwnerSupplierPayable,
  VoiceDraftTransaction,
} from '../types/fayd';

interface OwnerFinancialVaultProps {
  isPlatformOwner: boolean;
  ownerEmail: string | null;
  accounts: OwnerFinancialAccount[];
  entries: OwnerFinancialEntry[];
  invoices: OwnerInvoice[];
  receivables: OwnerClientReceivable[];
  payables: OwnerSupplierPayable[];
  auditLogs: OwnerFinancialAuditLog[];
}

export const OwnerFinancialVault: React.FC<OwnerFinancialVaultProps> = ({
  isPlatformOwner,
  ownerEmail,
  accounts,
  entries,
  invoices,
  receivables,
  payables,
  auditLogs,
}) => {
  const { t } = useI18n();

  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Voice Capture + Review Draft State (NO auto-save)
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscriptInput, setVoiceTranscriptInput] = useState('');
  const [parsingVoice, setParsingVoice] = useState(false);
  const [voiceDraft, setVoiceDraft] = useState<VoiceDraftTransaction | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Manual Ledger Entry State
  const [direction, setDirection] = useState<'inflow' | 'outflow'>('inflow');
  const [entryKind, setEntryKind] = useState<NonNullable<OwnerFinancialEntry['entryKind']>>('revenue');
  const [sector, setSector] = useState<BasitSectorKey>('marketplace');
  const [sourceOrBeneficiary, setSourceOrBeneficiary] = useState('');
  const [purpose, setPurpose] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<OwnerFinancialEntry['expenseCategory']>('none');
  const [channel, setChannel] = useState<OwnerFinancialAccount['accountId']>('bank');
  const [grossEGP, setGrossEGP] = useState(5000);
  const [commissionPct, setCommissionPct] = useState(0);

  // Invoice Creation State
  const [invSector, setInvSector] = useState<OwnerInvoice['sector']>('business');
  const [invClient, setInvClient] = useState('');
  const [invDesc, setInvDesc] = useState('');
  const [invAmount, setInvAmount] = useState(12000);
  const [invDueDate, setInvDueDate] = useState(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));

  // Receivables & Payables State
  const [rcvClient, setRcvClient] = useState('');
  const [rcvPurpose, setRcvPurpose] = useState('');
  const [rcvTotal, setRcvTotal] = useState(15000);
  const [paySupplier, setPaySupplier] = useState('');
  const [payPurpose, setPayPurpose] = useState('');
  const [payTotal, setPayTotal] = useState(8500);

  const stats = useMemo(() => {
    const totalLiquidity = accounts.reduce((s, a) => s + a.balanceEGP, 0);
    const totalInflows = entries
      .filter((e) => e.direction === 'inflow')
      .reduce((s, e) => s + e.netEGP, 0);
    const totalOutflows = entries
      .filter((e) => e.direction === 'outflow')
      .reduce((s, e) => s + e.grossEGP, 0);
    const netProfit = totalInflows - totalOutflows;
    const outstandingReceivables = receivables.reduce(
      (s, r) => s + Math.max(0, r.totalAmountEGP - r.collectedAmountEGP),
      0,
    );
    const outstandingDebts = payables.reduce(
      (s, p) => s + Math.max(0, p.totalAmountEGP - p.paidAmountEGP),
      0,
    );
    return {
      totalLiquidity,
      totalInflows,
      totalOutflows,
      netProfit,
      outstandingReceivables,
      outstandingDebts,
    };
  }, [accounts, entries, receivables, payables]);

  if (!isPlatformOwner || !ownerEmail) {
    return (
      <div className="bg-[#FFFFFF] border border-[#ECE4E8] rounded-3xl p-8 text-center space-y-3 max-w-xl mx-auto my-8">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-[#3B123F]/10 text-[#3B123F] flex items-center justify-center">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[#1D152B]">
          {t('الخزينة المالية محصورة لمالك المنصة فقط', 'Owner Financial Vault — Restricted Access')}
        </h2>
        <p className="text-xs text-[#6B6478] leading-relaxed">
          {t(
            'هذه الوحدة الإدارية والمحاسبية محمية بقواعد Firestore الصارمة ولا يمكن عرضها أو تعديلها إلا من حساب مالك منصة BASIT الموثق.',
            'This central treasury and financial ledger is strictly isolated via Firestore rules to verified platform owner accounts.',
          )}
        </p>
      </div>
    );
  }

  const getAccountMeta = (ch: OwnerFinancialAccount['accountId']) => {
    const found = accounts.find((a) => a.accountId === ch);
    return {
      balance: found?.balanceEGP ?? 0,
      label: found?.labelAr ?? ch,
    };
  };

  const callParseVoiceApi = async (payload: {
    audioBase64?: string;
    mimeType?: string;
    transcript?: string;
  }) => {
    setParsingVoice(true);
    setErrorMsg(null);
    setNotice(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error(t('يرجى تسجيل الدخول بحساب المالك', 'Owner sign-in required'));

      const res = await fetch('/api/finance/parse-voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...payload,
          lang: t('ar', 'en'),
        }),
      });
      const data = (await res.json()) as {
        status?: string;
        draft?: VoiceDraftTransaction;
        error?: string;
      };
      if (!res.ok || !data.draft) {
        throw new Error(data.error || t('تعذر تحليل الإملاء الصوتي', 'Voice parsing failed'));
      }
      setVoiceDraft(data.draft);
      setNotice(
        t(
          'تم استخراج مسودة القيد الصوتي بنجاح — يرجى المراجعة والتعديل قبل التأكيد والترحيل.',
          'Voice transaction draft extracted — review and edit fields below before confirming.',
        ),
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t('فشل تحليل الصوت', 'Failed'));
    } finally {
      setParsingVoice(false);
    }
  };

  const handleToggleRecording = async () => {
    setErrorMsg(null);
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setErrorMsg(
        t(
          'الميكروفون غير متاح في هذا المتصفح، يمكنك كتابة النص الصوتي في الخانة أدناه.',
          'Microphone recording unavailable; type or dictate text into the box below.',
        ),
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = String(reader.result || '');
          const base64 = result.includes(',') ? result.split(',')[1] : result;
          void callParseVoiceApi({
            audioBase64: base64,
            mimeType: blob.type || 'audio/webm',
            transcript: voiceTranscriptInput,
          });
        };
        reader.readAsDataURL(blob);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t('تعذر الوصول للميكروفون', 'Mic permission denied'));
    }
  };

  const handleConfirmVoiceDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voiceDraft) return;
    if (voiceDraft.grossEGP <= 0) {
      setErrorMsg(t('أدخل المبلغ الصحيح أكبر من صفر قبل الاعتماد.', 'Enter a valid amount > 0 before confirming.'));
      return;
    }
    setBusy(true);
    setErrorMsg(null);
    try {
      const acc = getAccountMeta(voiceDraft.channel);
      const entryId = await recordOwnerFinancialEntry({
        actorEmail: ownerEmail,
        direction: voiceDraft.direction,
        entryKind: voiceDraft.entryKind,
        sector: voiceDraft.sector,
        sourceOrBeneficiary: voiceDraft.sourceOrBeneficiary,
        purpose: voiceDraft.purpose,
        expenseCategory: voiceDraft.direction === 'inflow' ? 'none' : voiceDraft.expenseCategory,
        channel: voiceDraft.channel,
        grossEGP: voiceDraft.grossEGP,
        commissionPct: voiceDraft.commissionPct,
        entryDate: voiceDraft.entryDate,
        voiceInputUsed: true,
        voiceTranscript: voiceDraft.transcriptNormalized,
        currentAccountBalance: acc.balance,
        currentAccountLabel: acc.label,
      });
      setNotice(
        t(`تم اعتماد وترحيل القيد الصوتي رقم ${entryId} إلى دفتر المالك.`, `Confirmed & posted voice transaction ${entryId}.`),
      );
      setVoiceDraft(null);
      setVoiceTranscriptInput('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t('تعذر حفظ القيد', 'Save failed'));
    } finally {
      setBusy(false);
    }
  };

  const handleManualEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrorMsg(null);
    try {
      const acc = getAccountMeta(channel);
      const id = await recordOwnerFinancialEntry({
        actorEmail: ownerEmail,
        direction,
        entryKind,
        sector,
        sourceOrBeneficiary,
        purpose,
        expenseCategory: direction === 'inflow' ? 'none' : expenseCategory,
        channel,
        grossEGP,
        commissionPct,
        currentAccountBalance: acc.balance,
        currentAccountLabel: acc.label,
      });
      setNotice(t(`تم ترحيل القيد المالي (${id}) وتحديث الخزينة.`, `Entry ${id} posted.`));
      setSourceOrBeneficiary('');
      setPurpose('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t('تعذر حفظ القيد', 'Failed'));
    } finally {
      setBusy(false);
    }
  };

  const handleExportCsv = async () => {
    const headers = ['EntryID', 'Date', 'Direction', 'Kind', 'Sector', 'Party', 'Purpose', 'Channel', 'GrossEGP', 'NetEGP'];
    const rows = entries.map((e) => [
      e.entryId,
      e.entryDate,
      e.direction,
      e.entryKind || e.direction,
      e.sector || 'general',
      `"${e.sourceOrBeneficiary.replace(/"/g, '""')}"`,
      `"${e.purpose.replace(/"/g, '""')}"`,
      e.channel,
      String(e.grossEGP),
      String(e.netEGP),
    ]);
    const csv = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `basit-owner-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    await logOwnerFinancialAction({
      actorEmail: ownerEmail,
      actionAr: 'تصدير كشف مالي CSV من خزينة المالك',
      category: 'pdf_export',
      amountEGP: stats.totalLiquidity,
      details: `${entries.length} entries exported`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Owner Financial Header */}
      <section className="rounded-3xl bg-[#501C5A] text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-[#D4AF37]">
            OWNER FINANCIAL MANAGEMENT · {ownerEmail}
          </p>
          <h1 className="mt-1 text-2xl font-bold">
            {t('النظام المالي المركزي لمالك منصة BASIT', 'BASIT Central Owner Financial Vault')}
          </h1>
          <p className="mt-1 text-xs text-purple-200">
            {t(
              'إدارة الإيرادات والمصروفات والفواتير والديون والأرباح والخسائر والإملاء الصوتي المعتمد يدوياً.',
              'Central P&L, invoices, receivables, debts & owner-confirmed voice ledger.',
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 no-print">
          <button
            type="button"
            onClick={() => void handleExportCsv()}
            className="min-h-[42px] px-4 inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#D4AF37]" />
            {t('تصدير CSV', 'Export CSV')}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="min-h-[42px] px-4 inline-flex items-center gap-1.5 rounded-xl bg-[#D4AF37] text-[#2A104D] hover:bg-[#eab308] text-xs font-bold cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            {t('طباعة التقرير الرسمي', 'Print Report')}
          </button>
        </div>
      </section>

      {notice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
          {notice}
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
          {errorMsg}
        </div>
      )}

      {/* KPI Summary Grid + Accounts */}
      <section className="grid grid-cols-2 lg:grid-cols-6 gap-3 tabular-nums">
        <div className="bg-[#FFFFFF] border border-[#ECE4E8] rounded-2xl p-4">
          <p className="text-[11px] text-[#6B6478]">{t('إجمالي السيولة', 'Total Liquidity')}</p>
          <p className="mt-1 text-lg font-bold text-[#3B123F]">{stats.totalLiquidity.toLocaleString()} ج.م</p>
        </div>
        <div className="bg-[#FFFFFF] border border-[#ECE4E8] rounded-2xl p-4">
          <p className="text-[11px] text-[#6B6478] flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            {t('الإيرادات', 'Inflows')}
          </p>
          <p className="mt-1 text-lg font-bold text-emerald-700">{stats.totalInflows.toLocaleString()} ج.م</p>
        </div>
        <div className="bg-[#FFFFFF] border border-[#ECE4E8] rounded-2xl p-4">
          <p className="text-[11px] text-[#6B6478] flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5 text-red-600" />
            {t('المصروفات', 'Outflows')}
          </p>
          <p className="mt-1 text-lg font-bold text-red-700">{stats.totalOutflows.toLocaleString()} ج.م</p>
        </div>
        <div className="bg-[#FFFFFF] border border-[#ECE4E8] rounded-2xl p-4">
          <p className="text-[11px] text-[#6B6478]">{t('صافي الربح / الخسارة', 'Net P&L')}</p>
          <p className={`mt-1 text-lg font-bold ${stats.netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            {stats.netProfit.toLocaleString()} ج.م
          </p>
        </div>
        <div className="bg-[#FFFFFF] border border-[#ECE4E8] rounded-2xl p-4">
          <p className="text-[11px] text-[#6B6478]">{t('مستحقات التحصيل', 'Receivables')}</p>
          <p className="mt-1 text-lg font-bold text-[#1D152B]">{stats.outstandingReceivables.toLocaleString()} ج.م</p>
        </div>
        <div className="bg-[#FFFFFF] border border-[#ECE4E8] rounded-2xl p-4">
          <p className="text-[11px] text-[#6B6478]">{t('ديون ومستحقات علينا', 'Debts / Payables')}</p>
          <p className="mt-1 text-lg font-bold text-amber-700">{stats.outstandingDebts.toLocaleString()} ج.م</p>
        </div>
      </section>

      {/* Account Channels */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3 tabular-nums">
        {accounts.map((acc) => (
          <div key={acc.accountId} className="bg-[#FFFFFF] border border-[#ECE4E8] rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#1D152B]">{acc.labelAr}</p>
              <p className="text-[11px] text-[#6B6478]">{acc.accountId}</p>
            </div>
            <div className="text-end">
              <p className="text-base font-bold text-[#3B123F]">{acc.balanceEGP.toLocaleString()} ج.م</p>
            </div>
          </div>
        ))}
      </section>

      {/* VOICE TRANSACTION ENTRY + REVIEW & CONFIRM WORKFLOW */}
      <section className="bg-[#FFFFFF] border border-[#3B123F]/30 rounded-3xl p-5 space-y-4 no-print">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-[#1D152B] inline-flex items-center gap-2">
              <Mic className="w-5 h-5 text-[#3B123F]" />
              {t('تسجيل العمليات المالية بالصوت (مراجعة وتأكيد إجباري)', 'Voice Financial Capture (Review & Confirm Required)')}
            </h2>
            <p className="text-xs text-[#6B6478]">
              {t(
                'سجّل صوتك أو اكتب وصف العملية (مثال: "تحصيل 15000 جنيه من مصنع ها-بي للبنك")، ثم راجع المسودة وأكدها يدوياً.',
                'Record audio or enter dictated text; the system prepares an editable draft that posts ONLY after your explicit confirmation.',
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 text-xs">
          <button
            type="button"
            onClick={() => void handleToggleRecording()}
            disabled={parsingVoice}
            className={`min-h-[44px] px-4 inline-flex items-center justify-center gap-2 rounded-xl font-bold cursor-pointer whitespace-nowrap ${
              isRecording
                ? 'bg-red-600 text-white'
                : 'bg-[#3B123F] text-white hover:bg-[#501C5A]'
            }`}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-[#D4AF37]" />}
            {isRecording
              ? t('إيقاف التسجيل والتحليل', 'Stop & Analyze Audio')
              : t('تسجيل صوتي بالميكروفون', 'Record Voice')}
          </button>

          <input
            type="text"
            value={voiceTranscriptInput}
            onChange={(e) => setVoiceTranscriptInput(e.target.value)}
            placeholder={t(
              'أو اكتب النص هنا: مثال "صرف 4200 جنيه مواد خام لمطبخ العين من الخزينة"',
              'Or type dictated transaction text here...',
            )}
            className="flex-1 min-h-[44px] px-3 rounded-xl border border-[#ECE4E8] bg-white"
          />

          <button
            type="button"
            disabled={parsingVoice || voiceTranscriptInput.trim().length < 3}
            onClick={() => void callParseVoiceApi({ transcript: voiceTranscriptInput })}
            className="min-h-[44px] px-4 rounded-xl bg-[#D4AF37] text-[#2A104D] font-bold hover:bg-[#eab308] cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            {parsingVoice ? t('جاري التحليل...', 'Extracting Draft...') : t('تحويل لمسودة مراجعة', 'Extract Draft')}
          </button>
        </div>

        {voiceDraft && (
          <form
            onSubmit={handleConfirmVoiceDraft}
            className="p-4 rounded-2xl bg-[#FFFEFC] border border-[#3B123F]/40 space-y-3 text-xs"
          >
            <div className="flex items-center justify-between">
              <p className="font-bold text-[#3B123F] inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                {t('مسودة مراجعة وتأكيد القيد الصوتي (لم تُحفظ بعد)', 'Draft Pending Owner Review (Not Posted Yet)')}
              </p>
              <button
                type="button"
                onClick={() => setVoiceDraft(null)}
                className="min-h-[34px] px-2 rounded-lg hover:bg-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {voiceDraft.confidenceNote && (
              <p className="text-[#6B6478]">{voiceDraft.confidenceNote}</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <select
                value={voiceDraft.direction}
                onChange={(e) =>
                  setVoiceDraft({
                    ...voiceDraft,
                    direction: e.target.value as 'inflow' | 'outflow',
                  })
                }
                className="min-h-[40px] px-2.5 rounded-xl border border-[#ECE4E8] bg-white"
              >
                <option value="inflow">{t('إيراد / مقبوض (+)', 'Inflow (+)')}</option>
                <option value="outflow">{t('مصروف / سداد (-)', 'Outflow (-)')}</option>
              </select>
              <select
                value={voiceDraft.sector}
                onChange={(e) =>
                  setVoiceDraft({
                    ...voiceDraft,
                    sector: e.target.value as BasitSectorKey,
                  })
                }
                className="min-h-[40px] px-2.5 rounded-xl border border-[#ECE4E8] bg-white"
              >
                <option value="marketplace">Marketplace</option>
                <option value="business">Business</option>
                <option value="card">Card</option>
                <option value="healthy">Healthy</option>
                <option value="factory">Factory</option>
                <option value="logistics">Logistics</option>
                <option value="general">General</option>
              </select>
              <select
                value={voiceDraft.channel}
                onChange={(e) =>
                  setVoiceDraft({
                    ...voiceDraft,
                    channel: e.target.value as OwnerFinancialAccount['accountId'],
                  })
                }
                className="min-h-[40px] px-2.5 rounded-xl border border-[#ECE4E8] bg-white"
              >
                <option value="bank">{t('البنك', 'Bank')}</option>
                <option value="e_wallet">{t('المحفظة الإلكترونية', 'E-Wallet')}</option>
                <option value="treasury">{t('الخزينة', 'Treasury')}</option>
              </select>
              <input
                type="number"
                min={1}
                value={voiceDraft.grossEGP}
                onChange={(e) =>
                  setVoiceDraft({
                    ...voiceDraft,
                    grossEGP: Math.max(0, Number(e.target.value) || 0),
                  })
                }
                className="min-h-[40px] px-2.5 rounded-xl border border-[#ECE4E8] bg-white tabular-nums font-bold"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                required
                value={voiceDraft.sourceOrBeneficiary}
                onChange={(e) =>
                  setVoiceDraft({ ...voiceDraft, sourceOrBeneficiary: e.target.value })
                }
                placeholder={t('الجهة / العميل / المورد', 'Party / Source')}
                className="min-h-[40px] px-2.5 rounded-xl border border-[#ECE4E8] bg-white"
              />
              <input
                type="text"
                required
                value={voiceDraft.purpose}
                onChange={(e) => setVoiceDraft({ ...voiceDraft, purpose: e.target.value })}
                placeholder={t('البيان والغرض', 'Purpose')}
                className="min-h-[40px] px-2.5 rounded-xl border border-[#ECE4E8] bg-white"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={busy}
                className="min-h-[42px] px-5 inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 text-white font-bold hover:bg-emerald-800 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                {t('اعتماد وترحيل القيد للدفتـر', 'Confirm & Post to Ledger')}
              </button>
              <button
                type="button"
                onClick={() => setVoiceDraft(null)}
                className="min-h-[42px] px-4 rounded-xl border border-[#ECE4E8] bg-white font-semibold cursor-pointer"
              >
                {t('إلغاء المسودة', 'Discard')}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* MANUAL LEDGER ENTRY + INVOICE ISSUANCE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 no-print text-xs">
        <form
          onSubmit={handleManualEntrySubmit}
          className="bg-[#FFFFFF] border border-[#ECE4E8] rounded-2xl p-5 space-y-3"
        >
          <h3 className="text-base font-bold text-[#1D152B] inline-flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[#3B123F]" />
            {t('إدخال قيد مالي يدوي (إيراد / مصروف)', 'Manual Ledger Entry')}
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as 'inflow' | 'outflow')}
              className="min-h-[40px] px-2.5 rounded-xl border border-[#ECE4E8] bg-white"
            >
              <option value="inflow">{t('إيراد / قبض', 'Inflow')}</option>
              <option value="outflow">{t('مصروف / دفع', 'Outflow')}</option>
            </select>
            <select
              value={entryKind}
              onChange={(e) => setEntryKind(e.target.value as NonNullable<OwnerFinancialEntry['entryKind']>)}
              className="min-h-[40px] px-2.5 rounded-xl border border-[#ECE4E8] bg-white"
            >
              <option value="revenue">{t('إيراد', 'Revenue')}</option>
              <option value="expense">{t('مصروف', 'Expense')}</option>
              <option value="receivable">{t('تحصيل عميل', 'Receivable')}</option>
              <option value="payable">{t('سداد مورد', 'Payable')}</option>
              <option value="debt">{t('دين / التزام', 'Debt')}</option>
            </select>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value as BasitSectorKey)}
              className="min-h-[40px] px-2.5 rounded-xl border border-[#ECE4E8] bg-white"
            >
              <option value="marketplace">Marketplace</option>
              <option value="business">Business</option>
              <option value="card">Card</option>
              <option value="healthy">Healthy</option>
              <option value="factory">Factory</option>
              <option value="logistics">Logistics</option>
              <option value="general">General</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              required
              value={sourceOrBeneficiary}
              onChange={(e) => setSourceOrBeneficiary(e.target.value)}
              placeholder={t('الجهة / المورد / العميل', 'Counterparty')}
              className="min-h-[40px] px-3 rounded-xl border border-[#ECE4E8] bg-white"
            />
            <input
              type="text"
              required
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder={t('البيان التفصيلي', 'Purpose')}
              className="min-h-[40px] px-3 rounded-xl border border-[#ECE4E8] bg-white"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as OwnerFinancialAccount['accountId'])}
              className="min-h-[40px] px-2.5 rounded-xl border border-[#ECE4E8] bg-white"
            >
              <option value="bank">{t('البنك', 'Bank')}</option>
              <option value="e_wallet">{t('المحفظة', 'E-Wallet')}</option>
              <option value="treasury">{t('الخزينة', 'Treasury')}</option>
            </select>
            <input
              type="number"
              min={1}
              value={grossEGP}
              onChange={(e) => setGrossEGP(Math.max(1, Number(e.target.value) || 1))}
              className="min-h-[40px] px-2.5 rounded-xl border border-[#ECE4E8] bg-white tabular-nums"
            />
            {direction === 'outflow' ? (
              <select
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value as OwnerFinancialEntry['expenseCategory'])}
                className="min-h-[40px] px-2.5 rounded-xl border border-[#ECE4E8] bg-white"
              >
                <option value="raw_materials">{t('مواد خام', 'Raw Materials')}</option>
                <option value="salaries">{t('رواتب', 'Salaries')}</option>
                <option value="logistics">{t('لوجستيات', 'Logistics')}</option>
                <option value="marketing">{t('تسويق', 'Marketing')}</option>
                <option value="commissions">{t('عمولات', 'Commissions')}</option>
                <option value="other">{t('أخرى', 'Other')}</option>
              </select>
            ) : (
              <input
                type="number"
                min={0}
                max={100}
                value={commissionPct}
                onChange={(e) => setCommissionPct(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                placeholder={t('عمولة %', 'Fee %')}
                className="min-h-[40px] px-2.5 rounded-xl border border-[#ECE4E8] bg-white tabular-nums"
              />
            )}
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full min-h-[42px] rounded-xl bg-[#3B123F] text-white font-bold hover:bg-[#501C5A] cursor-pointer"
          >
            {t('تسجيل في الخزينة', 'Post Ledger Entry')}
          </button>
        </form>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              const id = await createOwnerInvoiceRecord({
                actorEmail: ownerEmail,
                sector: invSector,
                clientOrEntityName: invClient,
                description: invDesc,
                amountEGP: invAmount,
                dueDate: invDueDate,
                issueImmediately: true,
              });
              setNotice(t(`تم إصدار الفاتورة رقم ${id}.`, `Invoice ${id} issued.`));
              setInvClient('');
              setInvDesc('');
            } catch (err) {
              setErrorMsg(err instanceof Error ? err.message : t('تعذر إصدار الفاتورة', 'Failed'));
            } finally {
              setBusy(false);
            }
          }}
          className="bg-[#FFFFFF] border border-[#ECE4E8] rounded-2xl p-5 space-y-3"
        >
          <h3 className="text-base font-bold text-[#1D152B] inline-flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#3B123F]" />
            {t('إصدار فاتورة رسمية', 'Issue Owner Invoice')}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={invSector}
              onChange={(e) => setInvSector(e.target.value as OwnerInvoice['sector'])}
              className="min-h-[40px] px-2.5 rounded-xl border border-[#ECE4E8] bg-white"
            >
              <option value="business">BASIT Business</option>
              <option value="factory">Factory System</option>
              <option value="marketplace">Marketplace</option>
              <option value="card">BASIT Card</option>
              <option value="healthy">BASIT Healthy</option>
              <option value="logistics">Logistics</option>
            </select>
            <input
              type="text"
              required
              value={invClient}
              onChange={(e) => setInvClient(e.target.value)}
              placeholder={t('اسم العميل أو المصنع', 'Client / Entity')}
              className="min-h-[40px] px-3 rounded-xl border border-[#ECE4E8] bg-white"
            />
          </div>
          <input
            type="text"
            required
            value={invDesc}
            onChange={(e) => setInvDesc(e.target.value)}
            placeholder={t('بند الفاتورة ووصف التوريد', 'Invoice Description')}
            className="w-full min-h-[40px] px-3 rounded-xl border border-[#ECE4E8] bg-white"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min={1}
              value={invAmount}
              onChange={(e) => setInvAmount(Math.max(1, Number(e.target.value) || 1))}
              className="min-h-[40px] px-3 rounded-xl border border-[#ECE4E8] bg-white tabular-nums"
            />
            <input
              type="date"
              value={invDueDate}
              onChange={(e) => setInvDueDate(e.target.value)}
              className="min-h-[40px] px-3 rounded-xl border border-[#ECE4E8] bg-white"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full min-h-[42px] rounded-xl bg-[#D4AF37] text-[#2A104D] font-bold hover:bg-[#eab308] cursor-pointer"
          >
            {t('إصدار وحفظ الفاتورة', 'Issue Invoice')}
          </button>
        </form>
      </div>

      {/* INVOICES, RECEIVABLES & DEBTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
        <div className="bg-[#FFFFFF] border border-[#ECE4E8] rounded-2xl p-4 space-y-2.5">
          <h3 className="font-bold text-[#1D152B] flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-[#3B123F]" />
            {t('الفواتير', 'Invoices')} ({invoices.length})
          </h3>
          {invoices.slice(0, 6).map((inv) => (
            <div key={inv.invoiceId} className="p-2.5 rounded-xl bg-[#FFFEFC] border border-[#ECE4E8] space-y-1">
              <div className="flex items-center justify-between font-bold">
                <span>{inv.invoiceNumber}</span>
                <span className="tabular-nums text-[#3B123F]">{inv.amountEGP.toLocaleString()} ج.م</span>
              </div>
              <p className="text-[#6B6478]">{inv.clientOrEntityName} · {inv.status}</p>
              {inv.status !== 'paid' && (
                <button
                  type="button"
                  onClick={() =>
                    void updateOwnerInvoiceStatus({
                      invoice: inv,
                      nextStatus: 'paid',
                      actorEmail: ownerEmail,
                    })
                  }
                  className="min-h-[30px] px-2.5 rounded-lg bg-emerald-700 text-white font-semibold cursor-pointer"
                >
                  {t('تحصيل الفاتورة', 'Mark Paid')}
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="bg-[#FFFFFF] border border-[#ECE4E8] rounded-2xl p-4 space-y-2.5">
          <h3 className="font-bold text-[#1D152B] flex items-center gap-1.5">
            <Landmark className="w-4 h-4 text-emerald-700" />
            {t('المقبوضات والمستحقات لدى الغير', 'Receivables')}
          </h3>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await createOwnerReceivableRecord({
                actorEmail: ownerEmail,
                clientName: rcvClient,
                purpose: rcvPurpose,
                totalAmountEGP: rcvTotal,
                dueDate: invDueDate,
              });
              setRcvClient('');
              setRcvPurpose('');
            }}
            className="flex flex-wrap gap-1.5 no-print"
          >
            <input
              type="text"
              required
              value={rcvClient}
              onChange={(e) => setRcvClient(e.target.value)}
              placeholder={t('العميل', 'Client')}
              className="flex-1 min-h-[36px] px-2 rounded-lg border border-[#ECE4E8] bg-white"
            />
            <input
              type="text"
              required
              value={rcvPurpose}
              onChange={(e) => setRcvPurpose(e.target.value)}
              placeholder={t('الغرض', 'Purpose')}
              className="flex-1 min-h-[36px] px-2 rounded-lg border border-[#ECE4E8] bg-white"
            />
            <input
              type="number"
              min={1}
              value={rcvTotal}
              onChange={(e) => setRcvTotal(Math.max(1, Number(e.target.value) || 1))}
              className="w-24 min-h-[36px] px-2 rounded-lg border border-[#ECE4E8] bg-white tabular-nums"
            />
            <button type="submit" className="min-h-[36px] px-2.5 rounded-lg bg-[#3B123F] text-white cursor-pointer">
              <Plus className="w-4 h-4" />
            </button>
          </form>
          {receivables.slice(0, 5).map((r) => (
            <div key={r.receivableId} className="p-2.5 rounded-xl bg-[#FFFEFC] border border-[#ECE4E8] flex items-center justify-between gap-2">
              <div>
                <p className="font-bold">{r.clientName}</p>
                <p className="text-[#6B6478] tabular-nums">
                  {r.collectedAmountEGP}/{r.totalAmountEGP} ج.م
                </p>
              </div>
              {r.status !== 'collected' && (
                <button
                  type="button"
                  onClick={() =>
                    void collectOwnerReceivablePayment({
                      receivable: r,
                      addAmountEGP: r.totalAmountEGP - r.collectedAmountEGP,
                      actorEmail: ownerEmail,
                    })
                  }
                  className="min-h-[32px] px-2.5 rounded-lg bg-emerald-700 text-white font-semibold cursor-pointer"
                >
                  {t('تحصيل', 'Collect')}
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="bg-[#FFFFFF] border border-[#ECE4E8] rounded-2xl p-4 space-y-2.5">
          <h3 className="font-bold text-[#1D152B] flex items-center gap-1.5">
            <Landmark className="w-4 h-4 text-amber-700" />
            {t('الديون ومستحقات الموردين', 'Supplier Debts & Payables')}
          </h3>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await createOwnerPayableRecord({
                actorEmail: ownerEmail,
                supplierName: paySupplier,
                purpose: payPurpose,
                totalAmountEGP: payTotal,
                scheduledPaymentDate: invDueDate,
              });
              setPaySupplier('');
              setPayPurpose('');
            }}
            className="flex flex-wrap gap-1.5 no-print"
          >
            <input
              type="text"
              required
              value={paySupplier}
              onChange={(e) => setPaySupplier(e.target.value)}
              placeholder={t('المورد', 'Supplier')}
              className="flex-1 min-h-[36px] px-2 rounded-lg border border-[#ECE4E8] bg-white"
            />
            <input
              type="text"
              required
              value={payPurpose}
              onChange={(e) => setPayPurpose(e.target.value)}
              placeholder={t('البيان', 'Note')}
              className="flex-1 min-h-[36px] px-2 rounded-lg border border-[#ECE4E8] bg-white"
            />
            <input
              type="number"
              min={1}
              value={payTotal}
              onChange={(e) => setPayTotal(Math.max(1, Number(e.target.value) || 1))}
              className="w-24 min-h-[36px] px-2 rounded-lg border border-[#ECE4E8] bg-white tabular-nums"
            />
            <button type="submit" className="min-h-[36px] px-2.5 rounded-lg bg-[#3B123F] text-white cursor-pointer">
              <Plus className="w-4 h-4" />
            </button>
          </form>
          {payables.slice(0, 5).map((p) => (
            <div key={p.payableId} className="p-2.5 rounded-xl bg-[#FFFEFC] border border-[#ECE4E8] flex items-center justify-between gap-2">
              <div>
                <p className="font-bold">{p.supplierName}</p>
                <p className="text-[#6B6478] tabular-nums">
                  {p.paidAmountEGP}/{p.totalAmountEGP} ج.م
                </p>
              </div>
              {p.status !== 'paid' && (
                <button
                  type="button"
                  onClick={() =>
                    void payOwnerSupplierInstallment({
                      payable: p,
                      addAmountEGP: p.totalAmountEGP - p.paidAmountEGP,
                      actorEmail: ownerEmail,
                    })
                  }
                  className="min-h-[32px] px-2.5 rounded-lg bg-[#3B123F] text-white font-semibold cursor-pointer"
                >
                  {t('سداد', 'Pay')}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* RECENT LEDGER TABLE + IMMUTABLE AUDIT LOG */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
        <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#ECE4E8] rounded-2xl p-4 sm:p-5 space-y-3">
          <h3 className="text-base font-bold text-[#1D152B]">
            {t('دفتر القيود المالية المؤكدة', 'Confirmed Ledger Entries')} ({entries.length})
          </h3>

          {/* Mobile Card List (Zero horizontal table scrolling on phone) */}
          <div className="md:hidden divide-y divide-[#ECE4E8]">
            {entries.slice(0, 15).map((e) => (
              <div key={e.entryId} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-bold text-[#1D152B] truncate">{e.sourceOrBeneficiary}</div>
                  <div className="text-[11px] text-[#6B6478] truncate">
                    {e.entryDate} · {e.purpose} {e.voiceInputUsed ? '· Voice' : ''}
                  </div>
                </div>
                <div
                  className={`font-bold tabular-nums shrink-0 ${
                    e.direction === 'inflow' ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  {e.direction === 'inflow' ? '+' : '-'}
                  {e.netEGP.toLocaleString()} {t('ج.م', 'EGP')}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Ledger Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="border-b border-[#ECE4E8] text-[#6B6478]">
                  <th className="py-2 px-2 text-start">{t('التاريخ', 'Date')}</th>
                  <th className="py-2 px-2 text-start">{t('الجهة / البيان', 'Party & Purpose')}</th>
                  <th className="py-2 px-2 text-start">{t('القطاع', 'Sector')}</th>
                  <th className="py-2 px-2 text-end">{t('الصافي', 'Net EGP')}</th>
                </tr>
              </thead>
              <tbody>
                {entries.slice(0, 15).map((e) => (
                  <tr key={e.entryId} className="border-b border-[#ECE4E8]/60">
                    <td className="py-2 px-2 tabular-nums text-[#6B6478]">{e.entryDate}</td>
                    <td className="py-2 px-2">
                      <span className="font-bold text-[#1D152B]">{e.sourceOrBeneficiary}</span>
                      <span className="block text-[11px] text-[#6B6478]">
                        {e.purpose} {e.voiceInputUsed ? '· Voice Confirmed' : ''}
                      </span>
                    </td>
                    <td className="py-2 px-2">{e.sector || 'general'}</td>
                    <td
                      className={`py-2 px-2 text-end font-bold tabular-nums ${
                        e.direction === 'inflow' ? 'text-emerald-700' : 'text-red-700'
                      }`}
                    >
                      {e.direction === 'inflow' ? '+' : '-'}
                      {e.netEGP.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-5 bg-[#FFFFFF] border border-[#ECE4E8] rounded-2xl p-5 space-y-2.5">
          <h3 className="text-base font-bold text-[#1D152B]">
            {t('سجل التدقيق المالي غير القابل للتعديل', 'Immutable Financial Audit Log')}
          </h3>
          {auditLogs.slice(0, 12).map((log) => (
            <div key={log.logId} className="p-2.5 rounded-xl bg-[#FFFEFC] border border-[#ECE4E8] space-y-0.5">
              <div className="flex items-center justify-between gap-2 font-bold">
                <span className="text-[#1D152B]">{log.actionAr}</span>
                <span className="tabular-nums text-[#3B123F]">{log.amountEGP.toLocaleString()} ج.م</span>
              </div>
              <p className="text-[11px] text-[#6B6478]">{log.details} · {log.actorEmail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
