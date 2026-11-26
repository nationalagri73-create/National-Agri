import React, { useState } from 'react';
import {
  Briefcase,
  CheckCircle2,
  FileSignature,
  Plus,
  QrCode,
  ShieldAlert,
  X,
} from 'lucide-react';
import {
  CommissionRule,
  FaydOpportunity,
  OpportunityKind,
  UserProfile,
  UsufructContract,
  UsufructProposal,
} from '../types/fayd';
import {
  createFaydOpportunity,
  respondAsSiteOwnerToProposal,
  submitUsufructProposal,
} from '../services/faydFirestore';

interface OpportunitiesTabProps {
  uid: string | null;
  userProfile: UserProfile | null;
  opportunities: FaydOpportunity[];
  proposals: UsufructProposal[];
  contracts: UsufructContract[];
  commissionRule: CommissionRule;
  onRequireAuth: () => void;
  onShowQr: (title: string, subtitle: string, payload: string) => void;
}

const PROPOSAL_STATUS_AR: Record<string, string> = {
  awaiting_site_owner: 'بانتظار موافقة مالك الموقع',
  awaiting_admin: 'بانتظار اعتماد الإدارة وإصدار العقد',
  contract_issued: 'تم إصدار عقد الانتفاع',
  rejected: 'مرفوض',
};

export const OpportunitiesTab: React.FC<OpportunitiesTabProps> = ({
  uid,
  userProfile,
  opportunities,
  proposals,
  contracts,
  commissionRule,
  onRequireAuth,
  onShowQr,
}) => {
  const [showCreateOpp, setShowCreateOpp] = useState(false);
  const [oppKind, setOppKind] = useState<OpportunityKind>('commercial_site');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('مواقع تجارية');
  const [city, setCity] = useState('القاهرة');
  const [description, setDescription] = useState('');
  const [commercialTerms, setCommercialTerms] = useState('');
  const [costOrInvestmentEGP, setCostOrInvestmentEGP] = useState('150000');
  const [oppMsg, setOppMsg] = useState<string | null>(null);
  const [submittingOpp, setSubmittingOpp] = useState(false);

  const [proposalTarget, setProposalTarget] = useState<FaydOpportunity | null>(null);
  const [proposerPct, setProposerPct] = useState(50);
  const [platformPct, setPlatformPct] = useState(
    Math.max(1, commissionRule.defaultUsufructPlatformPct),
  );
  const [termsSummary, setTermsSummary] = useState('');
  const [propMsg, setPropMsg] = useState<string | null>(null);
  const [submittingProp, setSubmittingProp] = useState(false);

  const siteOwnerPct = 100 - proposerPct - platformPct;
  const isSplitValid =
    proposerPct > 0 &&
    siteOwnerPct > 0 &&
    platformPct >= 1 &&
    proposerPct + siteOwnerPct + platformPct === 100;

  const handleCreateOpp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) {
      onRequireAuth();
      return;
    }
    const cost = Number(costOrInvestmentEGP);
    if (title.trim().length < 4) {
      setOppMsg('عنوان الفرصة يجب أن يكون 4 أحرف على الأقل.');
      return;
    }
    if (description.trim().length < 10) {
      setOppMsg('الوصف التشغيلي يجب أن يكون 10 أحرف على الأقل.');
      return;
    }
    if (commercialTerms.trim().length < 10) {
      setOppMsg('الشروط التجارية الإلزامية يجب أن لا تقل عن 10 أحرف (حظر الافتراضات المجانية).');
      return;
    }
    if (!Number.isFinite(cost) || cost <= 0) {
      setOppMsg('يجب تحديد تكلفة أو استثمار مالي أكبر من الصفر (ممنوع الموارد المجانية).');
      return;
    }

    setSubmittingOpp(true);
    setOppMsg(null);
    try {
      const oppId = await createFaydOpportunity({
        ownerUid: uid,
        ownerName: userProfile?.displayName || 'شريك فيض',
        oppKind,
        title: title.trim(),
        category: category.trim(),
        city: city.trim(),
        description: description.trim(),
        commercialTerms: commercialTerms.trim(),
        costOrInvestmentEGP: cost,
      });
      setOppMsg(
        `تم تسجيل الفرصة (${oppId}) بـ freeResourceBlocked=true وبانتظار اعتماد الإدارة المركزية.`,
      );
      setTitle('');
      setDescription('');
      setCommercialTerms('');
      setShowCreateOpp(false);
    } catch (err) {
      setOppMsg(err instanceof Error ? err.message : 'تعذر تسجيل الفرصة.');
    } finally {
      setSubmittingOpp(false);
    }
  };

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) {
      onRequireAuth();
      return;
    }
    if (!proposalTarget) return;
    if (!isSplitValid) {
      setPropMsg('يجب أن يكون مجموع نسب الأرباح مساوياً لـ 100% بالضبط.');
      return;
    }
    if (termsSummary.trim().length < 10) {
      setPropMsg('يرجى كتابة ملخص الشروط التجارية (10 أحرف على الأقل).');
      return;
    }

    setSubmittingProp(true);
    setPropMsg(null);
    try {
      await submitUsufructProposal({
        opportunity: proposalTarget,
        proposerUid: uid,
        proposerName: userProfile?.displayName || 'مقدم مقترح',
        proposerProfitPct: proposerPct,
        siteOwnerProfitPct: siteOwnerPct,
        platformUsufructPct: platformPct,
        termsSummary: termsSummary.trim(),
      });
      setProposalTarget(null);
      setTermsSummary('');
    } catch (err) {
      setPropMsg(err instanceof Error ? err.message : 'تعذر تقديم مقترح الانتفاع.');
    } finally {
      setSubmittingProp(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            فرص فيض وعقود الانتفاع المشترك
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
            <span>التزام مالي صريح &gt; 0</span>
            <span aria-hidden="true">·</span>
            <span>توزيع أرباح منضبط = 100%</span>
            <span aria-hidden="true">·</span>
            <span>موافقة ثلاثية لإصدار العقد</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setOppMsg(null);
            setShowCreateOpp((v) => !v);
          }}
          className="min-h-[44px] px-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#4F2487] text-white text-xs font-semibold hover:bg-[#3f1c6d] transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          إضافة فرصة استثمارية / موقع
        </button>
      </div>

      {oppMsg && (
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{oppMsg}</span>
        </div>
      )}

      {/* Create Opportunity Form */}
      {showCreateOpp && (
        <form
          onSubmit={handleCreateOpp}
          className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              تسجيل فرصة تجارية جديدة (حظر الموارد المجانية مفعل)
            </h2>
            <button
              type="button"
              onClick={() => setShowCreateOpp(false)}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                نوع الفرصة
              </label>
              <select
                value={oppKind}
                onChange={(e) => setOppKind(e.target.value as OpportunityKind)}
                className="w-full min-h-[44px] px-3 text-xs bg-white border border-slate-300 rounded-xl"
              >
                <option value="commercial_site">موقع تجاري مجهز</option>
                <option value="project_expertise">مشروع وخبرة تشغيلية</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                التكلفة / الاستثمار المالي (ج.م &gt; 0)
              </label>
              <input
                type="number"
                min={1}
                value={costOrInvestmentEGP}
                onChange={(e) => setCostOrInvestmentEGP(e.target.value)}
                className="w-full min-h-[44px] px-3 text-xs bg-white border border-slate-300 rounded-xl tabular-nums"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                عنوان الفرصة
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: تشغيل مطعم وكافيتريا بمجمع شركات العاشر"
                maxLength={160}
                className="w-full min-h-[44px] px-3 text-xs bg-white border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                التصنيف
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                maxLength={80}
                className="w-full min-h-[44px] px-3 text-xs bg-white border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                المدينة
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                maxLength={80}
                className="w-full min-h-[44px] px-3 text-xs bg-white border border-slate-300 rounded-xl"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                الوصف التفصيلي للفرصة (10 أحرف على الأقل)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={800}
                className="w-full p-3 text-xs bg-white border border-slate-300 rounded-xl"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                الشروط التجارية الصريحة (10 أحرف على الأقل — بدون افتراضات مجانية)
              </label>
              <textarea
                rows={2}
                value={commercialTerms}
                onChange={(e) => setCommercialTerms(e.target.value)}
                placeholder="مثال: عقد انتفاع لمدة 3 سنوات مقابل استثمار التجهيزات ومشاركة صافي الربح"
                maxLength={500}
                className="w-full p-3 text-xs bg-white border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <span className="text-[11px] text-amber-700 font-semibold inline-flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              يتم إرسالها بحالة pending_admin لحين اعتماد الإدارة المركزية
            </span>
            <button
              type="submit"
              disabled={submittingOpp}
              className="min-h-[44px] px-5 rounded-xl bg-[#4F2487] text-white text-xs font-semibold hover:bg-[#3f1c6d] disabled:opacity-50 cursor-pointer"
            >
              {submittingOpp ? 'جاري التسجيل...' : 'حفظ الفرصة'}
            </button>
          </div>
        </form>
      )}

      {/* Opportunities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {opportunities.map((opp) => (
          <article
            key={opp.oppId}
            className="bg-white border border-slate-200/90 rounded-2xl p-5 flex flex-col justify-between gap-4"
          >
            <div>
              <div className="text-xs text-slate-500">
                {opp.oppKind === 'commercial_site' ? 'موقع تجاري' : 'مشروع وخبرة'} · {opp.city} · {opp.ownerName}
              </div>
              <h3 className="mt-1.5 text-base font-bold text-slate-900">
                {opp.title}
              </h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                {opp.description}
              </p>
              <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                <span className="font-semibold text-slate-900">الشروط التجارية: </span>
                {opp.commercialTerms}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <div className="tabular-nums">
                <div className="text-[11px] text-slate-500">الاستثمار / الالتزام</div>
                <div className="text-base font-bold text-slate-900">
                  {opp.costOrInvestmentEGP.toLocaleString('en-US')} ج.م
                </div>
              </div>

              {opp.approvalStatus === 'approved' ? (
                <button
                  type="button"
                  onClick={() => {
                    setPropMsg(null);
                    setProposalTarget(opp);
                  }}
                  className="min-h-[44px] px-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-[#4F2487] transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Briefcase className="w-4 h-4" />
                  تقديم مقترح انتفاع
                </button>
              ) : (
                <span className="text-xs font-semibold text-amber-700">
                  {opp.approvalStatus === 'pending_admin'
                    ? 'بانتظار اعتماد الإدارة'
                    : opp.approvalStatus}
                </span>
              )}
            </div>
          </article>
        ))}
      </div>

      {/* Active Proposals & Issued Contracts */}
      {uid && (proposals.length > 0 || contracts.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <section className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                مقترحات عقود الانتفاع ({proposals.length})
              </h3>
            </div>
            {proposals.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                لا توجد مقترحات انتفاع مرتبطة بحسابك حالياً.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {proposals.map((prop) => {
                  const canSiteOwnerRespond =
                    prop.opportunityOwnerUid === uid &&
                    prop.status === 'awaiting_site_owner';
                  return (
                    <li key={prop.proposalId} className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-bold text-slate-900">
                            مقترح {prop.proposerName} · {prop.proposalId}
                          </div>
                          <div className="mt-1 text-xs text-slate-500 tabular-nums">
                            المبادر {prop.proposerProfitPct}% · مالك الموقع {prop.siteOwnerProfitPct}% · المنصة {prop.platformUsufructPct}%
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-[#4F2487]">
                          {PROPOSAL_STATUS_AR[prop.status] || prop.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{prop.termsSummary}</p>
                      {canSiteOwnerRespond && (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              respondAsSiteOwnerToProposal(prop.proposalId, true)
                            }
                            className="min-h-[40px] px-3.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 cursor-pointer"
                          >
                            موافقة مالك الموقع (إرسال للإدارة)
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              respondAsSiteOwnerToProposal(prop.proposalId, false)
                            }
                            className="min-h-[40px] px-3.5 rounded-xl border border-slate-200 text-red-600 text-xs font-semibold hover:bg-red-50 cursor-pointer"
                          >
                            رفض
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                عقود الانتفاع الصادرة ({contracts.length})
              </h3>
            </div>
            {contracts.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                لم تصدر عقود انتفاع نشطة لحسابك بعد.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {contracts.map((cnt) => (
                  <li key={cnt.contractId} className="p-4 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        <FileSignature className="w-4 h-4 text-emerald-600" />
                        <span>عقد انتفاع رقم {cnt.contractId}</span>
                      </div>
                      <div className="mt-1 text-xs text-slate-500 tabular-nums">
                        {cnt.proposerProfitPct}% / {cnt.siteOwnerProfitPct}% / {cnt.platformUsufructPct}% · الحالة: {cnt.contractStatus}
                      </div>
                      <p className="mt-1 text-xs text-slate-600">{cnt.commercialTerms}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onShowQr(
                          'عقد انتفاع فيض الموثق',
                          `عقد رقم ${cnt.contractId} · مجموع النسب 100%`,
                          `FAYD:CONTRACT:${cnt.contractId}:${cnt.proposalId}`,
                        )
                      }
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer shrink-0"
                      aria-label="عرض رمز QR للعقد"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {/* Proposal Modal */}
      {proposalTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
          <form
            onSubmit={handleSubmitProposal}
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xl"
          >
            <div className="w-10 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  مقترح عقد انتفاع مشترك
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{proposalTarget.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setProposalTarget(null)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block text-[11px] text-slate-500 mb-1">
                    نسبة المبادر %
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={95}
                    value={proposerPct}
                    onChange={(e) => setProposerPct(Number(e.target.value) || 0)}
                    className="w-full text-center font-bold text-sm bg-white border border-slate-300 rounded-lg py-1 tabular-nums"
                  />
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="block text-[11px] text-slate-500 mb-1">
                    مالك الموقع %
                  </span>
                  <div
                    className={`font-bold text-sm py-1.5 tabular-nums ${
                      siteOwnerPct > 0 ? 'text-slate-900' : 'text-red-600'
                    }`}
                  >
                    {siteOwnerPct}%
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block text-[11px] text-slate-500 mb-1">
                    نسبة فيض %
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={platformPct}
                    onChange={(e) => setPlatformPct(Number(e.target.value) || 0)}
                    className="w-full text-center font-bold text-sm bg-white border border-slate-300 rounded-lg py-1 tabular-nums"
                  />
                </div>
              </div>

              <div className="text-xs font-semibold text-center tabular-nums">
                المجموع:{' '}
                <span className={isSplitValid ? 'text-emerald-700' : 'text-red-600'}>
                  {proposerPct + siteOwnerPct + platformPct}%
                </span>{' '}
                {isSplitValid ? '(متطابق مع القواعد)' : '(يجب أن يساوي 100%)'}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ملخص الشروط والتوزيع التجاري (10 أحرف على الأقل)
                </label>
                <textarea
                  rows={3}
                  value={termsSummary}
                  onChange={(e) => setTermsSummary(e.target.value)}
                  maxLength={600}
                  placeholder="توضيح آلية التشغيل وتوريد الإعاشة وتوزيع العوائد الشهرية..."
                  className="w-full p-3 text-xs bg-white border border-slate-300 rounded-xl"
                />
              </div>

              {propMsg && (
                <p role="alert" className="text-xs font-semibold text-red-600">
                  {propMsg}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submittingProp || !isSplitValid}
              className="mt-5 w-full min-h-[48px] rounded-xl bg-[#4F2487] text-white text-sm font-semibold hover:bg-[#3f1c6d] disabled:opacity-50 cursor-pointer"
            >
              {submittingProp
                ? 'جاري التقديم...'
                : uid
                  ? 'إرسال مقترح الانتفاع'
                  : 'تسجيل الدخول لتقديم المقترح'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
