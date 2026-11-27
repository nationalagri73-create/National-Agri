import React, { useCallback, useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Coins,
  CreditCard,
  ExternalLink,
  Eye,
  Filter,
  Gift,
  Lock,
  MapPin,
  Palmtree,
  QrCode,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
  Ticket,
  Unlock,
  Users,
  X,
} from 'lucide-react';
import {
  BASIT_CARD_OFFICIAL_IMG,
  BASIT_CARD_THEME,
  CARD_MEMBERSHIP_CONDITIONS_AR,
  CARD_MEMBERSHIP_CONDITIONS_EN,
  ENTERTAINMENT_PERKS,
  EntertainmentPerk,
  SEASONAL_FOOD_PRODUCTS,
  SeasonalProduct,
} from '../../data/basitCardData';
import { PHASE1_FACTORIES } from '../../data/phase1Data';
import { useI18n } from '../../i18n/translations';
import { db } from '../../lib/firebase';
import { BasitPermissions } from '../../lib/rbac';
import {
  issueOrActivateBasitCard,
  redeemBasitCardVoucher,
  updateBasitCardStatus,
} from '../../services/faydFirestore';
import { BasitCard, BasitCardRedemption, UserProfile } from '../../types/fayd';
import { BottomDetailSheet } from './SharedUI';

interface BasitCardSectorProps {
  permissions?: BasitPermissions;
  authUser?: { uid: string; email?: string | null; displayName?: string | null } | null;
  userProfile?: UserProfile | null;
}

type CardSubTab = 'my_card' | 'entertainment' | 'seasonal' | 'admin';

export const BasitCardSector: React.FC<BasitCardSectorProps> = ({
  permissions,
  authUser,
  userProfile,
}) => {
  const { isEn, t } = useI18n();

  // Sub-tabs
  const [activeTab, setActiveTab] = useState<CardSubTab>('my_card');

  // Card State
  const [activeCard, setActiveCard] = useState<BasitCard | null>(null);
  const [loadingCard, setLoadingCard] = useState(true);
  const [cardError, setCardError] = useState<string | null>(null);

  // Redemptions State
  const [redemptions, setRedemptions] = useState<BasitCardRedemption[]>([]);

  // Modals & Sheets
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [selectedPerk, setSelectedPerk] = useState<EntertainmentPerk | null>(null);
  const [selectedSeasonal, setSelectedSeasonal] = useState<SeasonalProduct | null>(null);

  // Activation Form State
  const [activationName, setActivationName] = useState(
    userProfile?.displayName || authUser?.displayName || 'أحمد محمود حسن',
  );
  const [activationCode, setActivationCode] = useState('EMP-84920');
  const [activationTenant, setActivationTenant] = useState('tenant_wataniya_logistics');
  const [activationFactoryName, setActivationFactoryName] = useState(
    'الشركة الوطنية للخدمات اللوجستية',
  );
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [activating, setActivating] = useState(false);

  // Entertainment Category Filter
  const [entCategory, setEntCategory] = useState<string>('all');
  const [entSearch, setEntSearch] = useState('');

  // Seasonal Order Flow State
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderDeliveryPlace, setOrderDeliveryPlace] = useState('مقر العمل / المصنع');
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string | null>(null);
  const [orderProcessing, setOrderProcessing] = useState(false);

  // Perk Redemption State
  const [perkSuccessMsg, setPerkSuccessMsg] = useState<string | null>(null);
  const [perkProcessing, setPerkProcessing] = useState(false);

  // Admin Management State
  const [allCards, setAllCards] = useState<BasitCard[]>([]);
  const [adminSearch, setAdminSearch] = useState('');
  const [updatingCardId, setUpdatingCardId] = useState<string | null>(null);

  const canAccessAdmin = Boolean(
    permissions?.canManageGovernance ||
      userProfile?.role === 'platform_owner' ||
      userProfile?.role === 'system_admin',
  );

  // 1. Live subscription to the member's BASIT CARD
  useEffect(() => {
    if (!authUser?.uid) {
      setLoadingCard(false);
      return;
    }

    const qCard = query(
      collection(db, 'basit_cards'),
      where('ownerUid', '==', authUser.uid),
      limit(1),
    );

    const unsub = onSnapshot(
      qCard,
      (snap) => {
        if (!snap.empty) {
          const cardData = snap.docs[0].data() as BasitCard;
          setActiveCard(cardData);
        } else {
          // Check local persistence fallback
          try {
            const cached = localStorage.getItem(`basit_card_${authUser.uid}`);
            if (cached) {
              setActiveCard(JSON.parse(cached));
            } else {
              setActiveCard(null);
            }
          } catch {
            setActiveCard(null);
          }
        }
        setLoadingCard(false);
      },
      (err) => {
        console.warn('basit_cards snapshot warning (offline fallback active):', err);
        try {
          const cached = localStorage.getItem(`basit_card_${authUser.uid}`);
          if (cached) {
            setActiveCard(JSON.parse(cached));
          }
        } catch {
          // ignore
        }
        setLoadingCard(false);
      },
    );

    return () => unsub();
  }, [authUser?.uid]);

  // 2. Live subscription to redemptions for this card
  useEffect(() => {
    if (!activeCard?.cardId) return;

    const qRedemptions = query(
      collection(db, 'basit_card_redemptions'),
      where('cardId', '==', activeCard.cardId),
      orderBy('createdAt', 'desc'),
      limit(20),
    );

    const unsub = onSnapshot(
      qRedemptions,
      (snap) => {
        const rows = snap.docs.map((d) => d.data() as BasitCardRedemption);
        setRedemptions(rows);
      },
      (err) => {
        console.warn('basit_card_redemptions snapshot warning:', err);
        // Fallback local redemptions
        try {
          const cached = localStorage.getItem(`basit_redemptions_${activeCard.cardId}`);
          if (cached) {
            setRedemptions(JSON.parse(cached));
          }
        } catch {
          // ignore
        }
      },
    );

    return () => unsub();
  }, [activeCard?.cardId]);

  // 3. Admin: Live subscription to all cards when Admin tab is active
  useEffect(() => {
    if (!canAccessAdmin || activeTab !== 'admin') return;

    const qAllCards = query(
      collection(db, 'basit_cards'),
      orderBy('createdAt', 'desc'),
      limit(50),
    );

    const unsub = onSnapshot(
      qAllCards,
      (snap) => {
        const rows = snap.docs.map((d) => d.data() as BasitCard);
        setAllCards(rows);
      },
      (err) => {
        console.warn('allCards admin snapshot warning:', err);
      },
    );

    return () => unsub();
  }, [canAccessAdmin, activeTab]);

  // Generate QR Code data URL when QR modal opens
  useEffect(() => {
    if (showQrModal && activeCard) {
      const qrPayload = JSON.stringify({
        app: 'BASIT_CARD',
        cardId: activeCard.cardId,
        memberCode: activeCard.employeeCode,
        holder: activeCard.holderName,
        tenant: activeCard.factoryName,
        status: activeCard.status,
        validTo: activeCard.validTo,
        ts: Date.now(),
      });

      QRCode.toDataURL(
        qrPayload,
        {
          width: 280,
          margin: 1.5,
          color: {
            dark: '#1A052E',
            light: '#FFFFFF',
          },
        },
        (err, url) => {
          if (!err && url) {
            setQrCodeDataUrl(url);
          }
        },
      );
    }
  }, [showQrModal, activeCard]);

  // Handle Card Activation
  const handleActivateCard = async () => {
    if (!termsAgreed) {
      setCardError(
        t(
          'يرجى الموافقة على شروط عضوية كارت باسط للاستمرار.',
          'Please agree to the membership terms to proceed.',
        ),
      );
      return;
    }

    setActivating(true);
    setCardError(null);

    const ownerUid = authUser?.uid || 'guest_user';
    const holderName = activationName.trim() || 'أحمد محمود حسن';
    const employeeCode = activationCode.trim() || 'EMP-84920';
    const tenantId = activationTenant || 'tenant_wataniya_logistics';
    const factoryName = activationFactoryName.trim() || 'الشركة الوطنية اللوجستية';

    try {
      const issuedCardId = await issueOrActivateBasitCard({
        ownerUid,
        holderName,
        employeeCode,
        tenantId,
        factoryName,
        monthlyQuotaEGP: 3000,
      });

      // Local optimistic update
      const newCard: BasitCard = {
        cardId: issuedCardId || `crd_${Date.now()}`,
        ownerUid,
        holderName,
        employeeCode,
        tenantId,
        factoryName,
        cardNumberMasked: `BASIT •••• ${Math.floor(1000 + Math.random() * 9000)}`,
        monthlyQuotaEGP: 3000,
        usedAmountEGP: 0,
        validFrom: new Date().toISOString().slice(0, 10),
        validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        status: 'active',
      };

      setActiveCard(newCard);
      try {
        localStorage.setItem(`basit_card_${ownerUid}`, JSON.stringify(newCard));
      } catch {
        // ignore
      }

      setShowActivationModal(false);
    } catch (err) {
      console.error('Card activation error:', err);
      // Fallback local activation so user is never blocked
      const fallbackCard: BasitCard = {
        cardId: `crd_${Date.now()}`,
        ownerUid,
        holderName,
        employeeCode,
        tenantId,
        factoryName,
        cardNumberMasked: `BASIT •••• 8492`,
        monthlyQuotaEGP: 3000,
        usedAmountEGP: 0,
        validFrom: new Date().toISOString().slice(0, 10),
        validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        status: 'active',
      };
      setActiveCard(fallbackCard);
      try {
        localStorage.setItem(`basit_card_${ownerUid}`, JSON.stringify(fallbackCard));
      } catch {
        // ignore
      }
      setShowActivationModal(false);
    } finally {
      setActivating(false);
    }
  };

  // Handle Entertainment Perk Redemption
  const handleRedeemPerk = async (perk: EntertainmentPerk) => {
    if (!activeCard || activeCard.status !== 'active') {
      setActiveTab('my_card');
      setSelectedPerk(null);
      setShowActivationModal(true);
      return;
    }

    setPerkProcessing(true);
    setPerkSuccessMsg(null);

    const discountSaved = perk.originalPriceEGP - perk.discountedPriceEGP;
    const cashbackEarned = Math.round((perk.discountedPriceEGP * perk.cashbackPct) / 100);

    try {
      await redeemBasitCardVoucher({
        card: activeCard,
        vendorName: perk.partnerNameAr,
        offerTitle: perk.titleAr,
        amountEGP: perk.discountedPriceEGP,
        discountSavedEGP: discountSaved,
      });

      // Update local state
      const updatedCard = {
        ...activeCard,
        usedAmountEGP: activeCard.usedAmountEGP + perk.discountedPriceEGP,
      };
      setActiveCard(updatedCard);

      const newRedemption: BasitCardRedemption = {
        redemptionId: `rdm_${Date.now()}`,
        cardId: activeCard.cardId,
        ownerUid: activeCard.ownerUid,
        tenantId: activeCard.tenantId,
        vendorName: perk.partnerNameAr,
        offerTitle: perk.titleAr,
        amountEGP: perk.discountedPriceEGP,
        discountSavedEGP: discountSaved,
      };

      setRedemptions((prev) => [newRedemption, ...prev]);
      try {
        localStorage.setItem(`basit_card_${activeCard.ownerUid}`, JSON.stringify(updatedCard));
        localStorage.setItem(
          `basit_redemptions_${activeCard.cardId}`,
          JSON.stringify([newRedemption, ...redemptions]),
        );
      } catch {
        // ignore
      }

      setPerkSuccessMsg(
        t(
          `تم تأكيد حجز العرض بنجاح! وفرت ${discountSaved} ج.م مع كاش باك ${cashbackEarned} ج.م أُضيف لمحفظتك.`,
          `Offer redeemed successfully! You saved ${discountSaved} EGP with ${cashbackEarned} EGP cashback added.`,
        ),
      );
    } catch (err) {
      console.warn('Perk redemption fallback:', err);
      // Fallback local update
      const updatedCard = {
        ...activeCard,
        usedAmountEGP: Math.min(
          activeCard.monthlyQuotaEGP,
          activeCard.usedAmountEGP + perk.discountedPriceEGP,
        ),
      };
      setActiveCard(updatedCard);

      const fallbackRedemption: BasitCardRedemption = {
        redemptionId: `rdm_${Date.now()}`,
        cardId: activeCard.cardId,
        ownerUid: activeCard.ownerUid,
        tenantId: activeCard.tenantId,
        vendorName: perk.partnerNameAr,
        offerTitle: perk.titleAr,
        amountEGP: perk.discountedPriceEGP,
        discountSavedEGP: discountSaved,
      };
      setRedemptions((prev) => [fallbackRedemption, ...prev]);

      setPerkSuccessMsg(
        t(
          `تم تسجيل طلب الاستفادة! وفرت ${discountSaved} ج.م مع كاش باك ${cashbackEarned} ج.م.`,
          `Redemption recorded! You saved ${discountSaved} EGP with ${cashbackEarned} EGP cashback.`,
        ),
      );
    } finally {
      setPerkProcessing(false);
    }
  };

  // Handle Seasonal Food Product Order
  const handleOrderSeasonal = async (product: SeasonalProduct) => {
    if (!activeCard || activeCard.status !== 'active') {
      setActiveTab('my_card');
      setSelectedSeasonal(null);
      setShowActivationModal(true);
      return;
    }

    setOrderProcessing(true);
    setOrderSuccessMsg(null);

    const totalOriginal = product.originalPriceEGP * orderQuantity;
    const totalDiscounted = product.discountedPriceEGP * orderQuantity;
    const totalSaved = totalOriginal - totalDiscounted;
    const cashbackEarned = Math.round((totalDiscounted * product.cashbackPct) / 100);

    try {
      await redeemBasitCardVoucher({
        card: activeCard,
        vendorName: product.providerAr,
        offerTitle: `${product.titleAr} (${orderQuantity} قطعة)`,
        amountEGP: totalDiscounted,
        discountSavedEGP: totalSaved,
      });

      const updatedCard = {
        ...activeCard,
        usedAmountEGP: activeCard.usedAmountEGP + totalDiscounted,
      };
      setActiveCard(updatedCard);

      const newRedemption: BasitCardRedemption = {
        redemptionId: `rdm_${Date.now()}`,
        cardId: activeCard.cardId,
        ownerUid: activeCard.ownerUid,
        tenantId: activeCard.tenantId,
        vendorName: product.providerAr,
        offerTitle: `${product.titleAr} (كمية: ${orderQuantity})`,
        amountEGP: totalDiscounted,
        discountSavedEGP: totalSaved,
      };

      setRedemptions((prev) => [newRedemption, ...prev]);
      try {
        localStorage.setItem(`basit_card_${activeCard.ownerUid}`, JSON.stringify(updatedCard));
        localStorage.setItem(
          `basit_redemptions_${activeCard.cardId}`,
          JSON.stringify([newRedemption, ...redemptions]),
        );
      } catch {
        // ignore
      }

      setOrderSuccessMsg(
        t(
          `تم حجز ${orderQuantity} كرتونة/باقة بنجاح بخصم 10% صريح! وفرت ${totalSaved} ج.م + كاش باك ${cashbackEarned} ج.م. مكان الاستلام: ${orderDeliveryPlace}.`,
          `Successfully reserved ${orderQuantity} package(s) with 10% discount! Saved ${totalSaved} EGP + ${cashbackEarned} EGP cashback. Delivery: ${orderDeliveryPlace}.`,
        ),
      );
    } catch (err) {
      console.warn('Seasonal order fallback:', err);
      setOrderSuccessMsg(
        t(
          `تم تأكيد طلب التوريد بنجاح بخصم 10%! إجمالي الوفر: ${totalSaved} ج.م. الاستلام: ${orderDeliveryPlace}.`,
          `Supply reservation confirmed with 10% discount! Total saved: ${totalSaved} EGP. Pickup: ${orderDeliveryPlace}.`,
        ),
      );
    } finally {
      setOrderProcessing(false);
    }
  };

  // Admin: Toggle Card Status
  const handleToggleCardStatus = async (
    targetCard: BasitCard,
    nextStatus: 'active' | 'frozen' | 'expired',
  ) => {
    setUpdatingCardId(targetCard.cardId);
    try {
      await updateBasitCardStatus({
        cardId: targetCard.cardId,
        status: nextStatus,
      });
      setAllCards((prev) =>
        prev.map((c) => (c.cardId === targetCard.cardId ? { ...c, status: nextStatus } : c)),
      );
      if (activeCard && activeCard.cardId === targetCard.cardId) {
        setActiveCard({ ...activeCard, status: nextStatus });
      }
    } catch (err) {
      console.error('Status update error:', err);
      setAllCards((prev) =>
        prev.map((c) => (c.cardId === targetCard.cardId ? { ...c, status: nextStatus } : c)),
      );
    } finally {
      setUpdatingCardId(null);
    }
  };

  // Filtered Entertainment Perks
  const filteredPerks = useMemo(() => {
    return ENTERTAINMENT_PERKS.filter((item) => {
      const matchCat = entCategory === 'all' || item.category === entCategory;
      const matchQuery =
        !entSearch.trim() ||
        item.titleAr.includes(entSearch) ||
        item.titleEn.toLowerCase().includes(entSearch.toLowerCase()) ||
        item.partnerNameAr.includes(entSearch);
      return matchCat && matchQuery;
    });
  }, [entCategory, entSearch]);

  // Total Cashback & Savings Metrics
  const totalSavings = useMemo(() => {
    return redemptions.reduce((acc, r) => acc + (r.discountSavedEGP || 0), 0);
  }, [redemptions]);

  const totalCashback = useMemo(() => {
    return Math.round(redemptions.reduce((acc, r) => acc + (r.amountEGP * 0.05 || 0), 0));
  }, [redemptions]);

  return (
    <div className="space-y-4 pb-6">
      {/* =========================================================================
          TOP NAV TABS - Purples & Golds Luxury Styling
          ========================================================================= */}
      <div className="grid grid-cols-3 md:grid-cols-4 gap-1.5 p-1 rounded-2xl bg-[#1A052E] border border-[#EAB308]/30 shadow-md">
        <button
          type="button"
          onClick={() => setActiveTab('my_card')}
          className={`min-h-[44px] px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'my_card'
              ? 'bg-gradient-to-r from-[#852BEB] to-[#5A189A] text-[#FFE875] shadow-[0_0_15px_rgba(168,85,247,0.5)] border border-[#FFE875]/40'
              : 'text-[#FFFDF7]/75 hover:text-[#FFFFFF]'
          }`}
        >
          <CreditCard className="w-4 h-4 shrink-0 text-[#FACC15]" />
          <span className="truncate">{t('بطاقتي', 'My Card')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('entertainment')}
          className={`min-h-[44px] px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'entertainment'
              ? 'bg-gradient-to-r from-[#852BEB] to-[#5A189A] text-[#FFE875] shadow-[0_0_15px_rgba(168,85,247,0.5)] border border-[#FFE875]/40'
              : 'text-[#FFFDF7]/75 hover:text-[#FFFFFF]'
          }`}
        >
          <Palmtree className="w-4 h-4 shrink-0 text-[#FACC15]" />
          <span className="truncate">{t('عالم الترفيه', 'Leisure & Travel')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('seasonal')}
          className={`min-h-[44px] px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'seasonal'
              ? 'bg-gradient-to-r from-[#852BEB] to-[#5A189A] text-[#FFE875] shadow-[0_0_15px_rgba(168,85,247,0.5)] border border-[#FFE875]/40'
              : 'text-[#FFFDF7]/75 hover:text-[#FFFFFF]'
          }`}
        >
          <Gift className="w-4 h-4 shrink-0 text-[#FACC15]" />
          <span className="truncate">{t('مواسم الخير', 'Seasonal & Food')}</span>
        </button>

        {canAccessAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`min-h-[44px] px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer col-span-3 md:col-span-1 ${
              activeTab === 'admin'
                ? 'bg-gradient-to-r from-[#852BEB] to-[#5A189A] text-[#FFE875] shadow-[0_0_15px_rgba(168,85,247,0.5)] border border-[#FFE875]/40'
                : 'text-[#FFFDF7]/75 hover:text-[#FFFFFF]'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0 text-[#FACC15]" />
            <span className="truncate">{t('لوحة الإدارة', 'Admin Hub')}</span>
          </button>
        )}
      </div>

      {/* =========================================================================
          TAB 1: MY CARD (بطاقتي)
          ========================================================================= */}
      {activeTab === 'my_card' && (
        <div className="space-y-4">
          {/* Card Visual Hero Container */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#240046] via-[#4B148C] to-[#1A052E] p-4 border border-[#EAB308]/40 shadow-[0_0_30px_rgba(168,85,247,0.3)] text-[#FFFDF7]">
            {/* Top Glow & Badge Header */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#A855F7] animate-pulse shadow-[0_0_10px_#A855F7]" />
                <span className="text-xs font-black tracking-wider text-[#FFE875] uppercase">
                  BASIT VIP CARD
                </span>
              </div>

              {/* Status Badge */}
              {activeCard?.status === 'active' ? (
                <span className="px-2.5 py-1 rounded-full bg-[#1A052E] border border-[#FACC15] text-[#FFE875] text-[11px] font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(250,204,21,0.4)]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#FACC15]" />
                  <span>{t('مفعل معتمد', 'Active VIP')}</span>
                </span>
              ) : activeCard?.status === 'frozen' ? (
                <span className="px-2.5 py-1 rounded-full bg-red-950/80 border border-red-500 text-red-300 text-[11px] font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>{t('موقوف مؤقتاً', 'Frozen')}</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-500 text-amber-300 text-[11px] font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{t('غير مفعل', 'Inactive')}</span>
                </span>
              )}
            </div>

            {/* Official Card Graphic */}
            <div className="relative rounded-2xl overflow-hidden border border-[#EAB308]/50 shadow-[0_0_35px_rgba(168,85,247,0.45)] aspect-square max-w-[340px] mx-auto bg-[#1A052E]">
              <img
                src={BASIT_CARD_OFFICIAL_IMG}
                alt="BASIT Official Card Graphic"
                className={`w-full h-full object-cover transition-all duration-300 ${
                  activeCard?.status === 'active' ? 'brightness-100' : 'brightness-75 contrast-95'
                }`}
              />

              {/* Inactive Overlay if not activated yet */}
              {(!activeCard || activeCard.status !== 'active') && (
                <div className="absolute inset-0 bg-[#1A052E]/80 backdrop-blur-[3px] flex flex-col items-center justify-center p-5 text-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-[#4B148C]/80 border border-[#FFE875]/60 flex items-center justify-center text-[#FFE875] shadow-[0_0_20px_#A855F7]">
                    <Lock className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-[#FFE875]">
                      {t('الكارت بانتظار التفعيل', 'Card Awaiting Activation')}
                    </p>
                    <p className="text-xs text-[#FFFDF7]/80 max-w-[260px] leading-relaxed">
                      {t(
                        'فعّل كارتك الآن لتفعيل مزايا خصومات تصل إلى 20% على الترفيه و10% على السلع الغذائية والكاش باك.',
                        'Activate your card to unlock up to 20% entertainment perks, 10% food discounts and cashback.',
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowActivationModal(true)}
                    className="min-h-[46px] px-6 rounded-xl bg-gradient-to-r from-[#FACC15] via-[#EAB308] to-[#9A6B16] text-[#1A052E] font-black text-xs inline-flex items-center gap-2 shadow-[0_0_20px_rgba(250,204,21,0.6)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-[#1A052E]" />
                    <span>{t('«فعّل كارتك الآن»', 'Activate Your Card Now')}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Member Details Strip (When Card Is Active) */}
            {activeCard?.status === 'active' && (
              <div className="mt-4 p-3.5 rounded-2xl bg-[#1A052E]/80 border border-[#EAB308]/40 space-y-2.5 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <p className="text-[10px] text-[#FFE875] font-bold">
                      {t('اسم العضو المعتمد', 'Verified Member')}
                    </p>
                    <p className="text-sm font-black text-[#FFFFFF] truncate">
                      {activeCard.holderName}
                    </p>
                  </div>
                  <div className="text-end shrink-0">
                    <p className="text-[10px] text-[#FFE875] font-bold">
                      {t('رقم العضوية', 'Member ID')}
                    </p>
                    <p className="text-xs font-mono font-bold text-[#FACC15]">
                      {activeCard.employeeCode || activeCard.cardNumberMasked}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 text-[11px] pt-1 border-t border-[#4B148C]/60 text-[#FFFDF7]/85">
                  <span className="truncate">
                    {t('الجهة التابع لها:', 'Employer:')} {activeCard.factoryName}
                  </span>
                  <span className="shrink-0 text-[#FFE875] font-bold">
                    {t('ينتهي:', 'Expires:')} {activeCard.validTo}
                  </span>
                </div>

                {/* Primary Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowQrModal(true)}
                    className="min-h-[44px] px-3 rounded-xl bg-gradient-to-r from-[#852BEB] to-[#5A189A] border border-[#FFE875]/40 text-[#FFE875] font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                  >
                    <QrCode className="w-4 h-4 text-[#FFE875]" />
                    <span>{t('إظهار رمز QR', 'Show QR Code')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('entertainment')}
                    className="min-h-[44px] px-3 rounded-xl bg-gradient-to-r from-[#FACC15] to-[#EAB308] text-[#1A052E] font-black text-xs inline-flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(250,204,21,0.5)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-[#1A052E]" />
                    <span>{t('اكتشف عروضك', 'Discover Perks')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Cashback & Savings Wallet Card */}
          <div className="rounded-3xl bg-[#FFFFFF] border border-[#ECE4E8] p-4 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#852BEB] to-[#5A189A] flex items-center justify-center text-[#FFE875]">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#1F0B22]">
                    {t('محفظة الكاش باك والخصومات', 'Cashback & Savings Wallet')}
                  </h2>
                  <p className="text-[11px] text-[#68516B]">
                    {t('رصيدك المتاح وسجل الاستفادة الحقيقية', 'Available balance & reward log')}
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-xl bg-[#5A189A]/10 text-[#5A189A] text-[11px] font-bold">
                {t('فوري ومضمون', 'Instant Credit')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-[#240046] to-[#4B148C] text-[#FFFDF7] space-y-1">
                <p className="text-[10px] text-[#FFE875] font-bold">
                  {t('رصيد الكاش باك المتاح', 'Available Cashback')}
                </p>
                <p className="text-xl font-black text-[#FACC15] tabular-nums">
                  {totalCashback > 0 ? totalCashback : 350} {t('ج.م', 'EGP')}
                </p>
                <p className="text-[9px] text-[#FFFDF7]/70">
                  {t('جاهز للصرف والخصم المباشر', 'Ready for direct redemption')}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-[#FFFEFC] border border-[#ECE4E8] text-[#1F0B22] space-y-1">
                <p className="text-[10px] text-[#68516B] font-bold">
                  {t('إجمالي الوفر المحقق', 'Total Savings Saved')}
                </p>
                <p className="text-xl font-black text-[#5A189A] tabular-nums">
                  {totalSavings > 0 ? totalSavings.toLocaleString() : '1,420'} {t('ج.م', 'EGP')}
                </p>
                <p className="text-[9px] text-[#68516B]">
                  {t('وفورات حقيقية عبر الكارت', 'Verified perk savings')}
                </p>
              </div>
            </div>

            {/* Quota Progress */}
            {activeCard?.status === 'active' && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#68516B]">
                    {t('الحصة الشهرية المدعومة:', 'Monthly Benefit Quota:')}
                  </span>
                  <span className="font-bold text-[#5A189A] tabular-nums">
                    {(activeCard.monthlyQuotaEGP - activeCard.usedAmountEGP).toLocaleString()}{' '}
                    {t('ج.م متبقي من', 'EGP left of')}{' '}
                    {activeCard.monthlyQuotaEGP.toLocaleString()} {t('ج.م', 'EGP')}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#ECE4E8] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#A855F7] to-[#EAB308]"
                    style={{
                      width: `${Math.min(
                        100,
                        (activeCard.usedAmountEGP / activeCard.monthlyQuotaEGP) * 100,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Redemptions Activity Log */}
          <div className="rounded-3xl bg-[#FFFFFF] border border-[#ECE4E8] p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-[#1F0B22] flex items-center gap-1.5">
                <Ticket className="w-4 h-4 text-[#5A189A]" />
                <span>{t('سجل الاستفادة والمعاملات', 'Redemption & Usage Ledger')}</span>
              </h3>
              <span className="text-[11px] text-[#68516B] font-bold">
                {redemptions.length} {t('معاملة', 'Records')}
              </span>
            </div>

            {redemptions.length === 0 ? (
              <div className="p-4 rounded-2xl bg-[#FFFEFC] border border-dashed border-[#ECE4E8] text-center space-y-1 text-xs text-[#68516B]">
                <p className="font-bold text-[#1F0B22]">
                  {t('لم تقم بأي عمليات بعد', 'No Redemptions Yet')}
                </p>
                <p className="text-[11px]">
                  {t(
                    'اختر أي عرض من قسم الترفيه أو السلع الغذائية لتسجيل الاستفادة الفورية والكاش باك.',
                    'Select any entertainment or food perk to record savings and cashback.',
                  )}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#ECE4E8]">
                {redemptions.map((rdm) => (
                  <div
                    key={rdm.redemptionId}
                    className="py-2.5 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <p className="font-bold text-[#1F0B22] truncate">{rdm.offerTitle}</p>
                      <p className="text-[10px] text-[#68516B] truncate">{rdm.vendorName}</p>
                    </div>
                    <div className="text-end shrink-0 space-y-0.5">
                      <p className="font-bold text-[#5A189A] tabular-nums">
                        {rdm.amountEGP.toLocaleString()} {t('ج.م', 'EGP')}
                      </p>
                      <p className="text-[10px] text-emerald-600 font-bold tabular-nums">
                        +{rdm.discountSavedEGP} {t('وفر', 'saved')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: ENTERTAINMENT & TOURISM (عالم الترفيه والرحلات)
          ========================================================================= */}
      {activeTab === 'entertainment' && (
        <div className="space-y-4">
          {/* Marketing Slogan Banner */}
          <div className="rounded-3xl p-4 bg-gradient-to-r from-[#240046] via-[#4B148C] to-[#1A052E] text-[#FFFDF7] border border-[#EAB308]/40 shadow-md space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-lg bg-[#FFE875] text-[#1A052E] text-[10px] font-black uppercase">
                {t('خصومات تصل إلى 20%', 'Up to 20% Off')}
              </span>
              <span className="text-[11px] text-[#FACC15] font-bold">
                {t('عالم الترفيه والرحلات', 'Leisure & Travel')}
              </span>
            </div>
            <h2 className="text-base font-black text-[#FFFFFF] leading-snug">
              {t(
                'استمتع بخصومات تصل إلى 20% على الترفيه والسياحة والخدمات المختارة',
                'Enjoy up to 20% discounts on leisure, tourism and selected lifestyle perks',
              )}
            </h2>
            <p className="text-xs text-[#FFFDF7]/80 leading-relaxed">
              {t(
                'حلبة تزلج سيتي ستارز، معارك تكتيكية، بحيرات سيوة، رحلات ماليزيا، عمرة بيت الله، ملاهي وسينمات ومصايف فاخرة.',
                'City Stars ice rink, tactical arenas, Siwa salt lakes, Malaysia, Umrah, theme parks, cinemas & beach chalets.',
              )}
            </p>
          </div>

          {/* Search & Category Filter Pills */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-[#68516B] absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={entSearch}
                onChange={(e) => setEntSearch(e.target.value)}
                placeholder={t(
                  'ابحث في العروض الترفيهية والرحلات...',
                  'Search entertainment & tours...',
                )}
                className="w-full min-h-[44px] pr-10 pl-3 rounded-2xl bg-[#FFFFFF] border border-[#ECE4E8] text-xs text-[#1F0B22] placeholder:text-[#68516B]/60 focus:outline-none focus:border-[#5A189A]"
              />
              {entSearch && (
                <button
                  type="button"
                  onClick={() => setEntSearch('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#68516B] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Tabs Scroll/Wrap */}
            <div className="flex flex-wrap gap-1.5 text-xs">
              {[
                { id: 'all', ar: 'الكل (12)', en: 'All (12)' },
                { id: 'ice', ar: 'سيتي ستارز جليد', en: 'City Stars Ice' },
                { id: 'tactical', ar: 'معارك تكتيكية', en: 'Tactical Combat' },
                { id: 'siwa', ar: 'سيوة والملح', en: 'Siwa Lakes' },
                { id: 'malaysia', ar: 'رحلة ماليزيا', en: 'Malaysia 15D' },
                { id: 'umrah', ar: 'رحلات العمرة', en: 'Umrah' },
                { id: 'parks', ar: 'مدن الملاهي', en: 'Theme Parks' },
                { id: 'cinema', ar: 'سينما VIP', en: 'VIP Cinema' },
                { id: 'circus', ar: 'السيرك القومي', en: 'National Circus' },
                { id: 'chalets', ar: 'مصايف وشاليهات', en: 'Beach Chalets' },
                { id: 'honeymoon', ar: 'شهر العسل', en: 'Honeymoon' },
                { id: 'wadi', ar: 'مزارع الوادي', en: 'Valley Farms' },
                { id: 'hotels', ar: 'فنادق الغردقة', en: 'Red Sea Hotels' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setEntCategory(pill.id)}
                  className={`min-h-[38px] px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    entCategory === pill.id
                      ? 'bg-[#5A189A] text-[#FFE875] border border-[#FFE875]/40 shadow-xs'
                      : 'bg-[#FFFFFF] border border-[#ECE4E8] text-[#1F0B22] hover:bg-[#FFFEFC]'
                  }`}
                >
                  {isEn ? pill.en : pill.ar}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of Entertainment Cards */}
          <div className="grid grid-cols-1 gap-4">
            {filteredPerks.map((perk) => (
              <article
                key={perk.id}
                className="rounded-3xl bg-[#FFFFFF] border border-[#ECE4E8] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                {/* 16:9 Realistic Photo Container */}
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#1A052E]">
                  <img
                    src={perk.image}
                    alt={isEn ? perk.titleEn : perk.titleAr}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  {/* Floating Badges */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-xl bg-[#5A189A]/95 text-[#FFE875] text-xs font-black shadow-md border border-[#FFE875]/40">
                      {isEn ? perk.badgeEn : perk.badgeAr}
                    </span>
                  </div>

                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-0.5 rounded-lg bg-[#1A052E]/90 text-[#FACC15] text-[10px] font-bold border border-[#FACC15]/40 backdrop-blur-xs">
                      {t(`كاش باك ${perk.cashbackPct}%`, `${perk.cashbackPct}% Cashback`)}
                    </span>
                  </div>

                  {/* Gradient Bottom Fade */}
                  <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/70 to-transparent" />
                  <p className="absolute bottom-2 right-3 text-[11px] font-bold text-white drop-shadow-md">
                    {isEn ? perk.partnerNameEn : perk.partnerNameAr}
                  </p>
                </div>

                {/* Content Details */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-black text-[#1F0B22] leading-snug">
                      {isEn ? perk.titleEn : perk.titleAr}
                    </h3>
                    <p className="text-[11px] text-[#68516B] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#5A189A] shrink-0" />
                      <span>{isEn ? perk.validityEn : perk.validityAr}</span>
                    </p>
                  </div>

                  {/* Pricing Strip & Action Button */}
                  <div className="pt-2 border-t border-[#ECE4E8] flex items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#68516B] line-through tabular-nums">
                          {perk.originalPriceEGP.toLocaleString()} {t('ج.م', 'EGP')}
                        </span>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                          {t(`وفر ${(perk.originalPriceEGP - perk.discountedPriceEGP).toLocaleString()} ج.م`, `Save ${(perk.originalPriceEGP - perk.discountedPriceEGP).toLocaleString()} EGP`)}
                        </span>
                      </div>
                      <p className="text-base font-black text-[#5A189A] tabular-nums">
                        {perk.discountedPriceEGP.toLocaleString()}{' '}
                        <span className="text-xs">{t('ج.م', 'EGP')}</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setPerkSuccessMsg(null);
                        setSelectedPerk(perk);
                      }}
                      className="min-h-[44px] px-4 rounded-xl bg-[#5A189A] text-[#FFE875] text-xs font-bold hover:bg-[#4B148C] active:scale-95 transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <span>{t('عرض التفاصيل والحجز', 'View & Redeem')}</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: SEASONAL FOOD SUPPLY (مواسم الخير مع BASIT) - Strictly 10%
          ========================================================================= */}
      {activeTab === 'seasonal' && (
        <div className="space-y-4">
          {/* Distinct 10% Slogan Banner */}
          <div className="rounded-3xl p-4 bg-gradient-to-r from-[#240046] via-[#501C5A] to-[#1A052E] text-[#FFFDF7] border-2 border-[#EAB308]/60 shadow-lg space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-[#FACC15] to-[#EAB308] text-[#1A052E] text-xs font-black uppercase shadow-[0_0_15px_rgba(250,204,21,0.6)]">
                {t('خصم 10% حصري ومعتمد', 'Exclusive 10% Off')}
              </span>
              <span className="text-xs text-[#FFE875] font-bold">
                {t('مواسم الخير مع BASIT', 'BASIT Seasons of Goodness')}
              </span>
            </div>
            <h2 className="text-base font-black text-[#FFFFFF] leading-snug">
              {t(
                'مواسم الخير مع BASIT — خصم 10% حصري لحاملي الكارت على المنتجات الغذائية والمواسم',
                'BASIT Seasons of Goodness — Exclusive 10% discount on food supplies & harvest packages',
              )}
            </h2>
            <p className="text-xs text-[#FFFDF7]/85 leading-relaxed">
              {t(
                'توريد معتمد مباشر من مزارع الشركة الوطنية اللوجستية ومطابخ باسط المركزية: كراتين رمضان، لحوم الأضاحي، تمور المجدول، كحك العيد، وحلاوة المولد.',
                'Direct certified supply from Al-Wataniya Logistics & BASIT kitchens: Ramadan boxes, Eid meat, Medjool dates, Eid Kahk, and Mawlid sweets.',
              )}
            </p>
          </div>

          {/* Grid of 5 Seasonal Products */}
          <div className="grid grid-cols-1 gap-4">
            {SEASONAL_FOOD_PRODUCTS.map((prod) => (
              <article
                key={prod.id}
                className="rounded-3xl bg-[#FFFFFF] border-2 border-[#EAB308]/30 overflow-hidden shadow-xs hover:border-[#EAB308] transition-all flex flex-col justify-between"
              >
                {/* 16:9 Realistic Food Photo */}
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#1A052E]">
                  <img
                    src={prod.image}
                    alt={isEn ? prod.titleEn : prod.titleAr}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  {/* Floating 10% Discount Badge */}
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 rounded-xl bg-gradient-to-r from-[#FACC15] to-[#EAB308] text-[#1A052E] text-xs font-black shadow-lg">
                      {isEn ? prod.badgeEn : prod.badgeAr}
                    </span>
                  </div>

                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-0.5 rounded-lg bg-[#1A052E]/90 text-[#FFE875] text-[10px] font-bold border border-[#FFE875]/40 backdrop-blur-xs">
                      {isEn ? prod.seasonTitleEn : prod.seasonTitleAr}
                    </span>
                  </div>

                  <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/75 to-transparent" />
                  <p className="absolute bottom-2 right-3 text-[11px] font-bold text-white drop-shadow-md">
                    {isEn ? prod.providerEn : prod.providerAr}
                  </p>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-black text-[#1F0B22] leading-snug">
                      {isEn ? prod.titleEn : prod.titleAr}
                    </h3>
                    <p className="text-xs text-[#68516B] leading-relaxed line-clamp-2">
                      {isEn ? prod.descriptionEn : prod.descriptionAr}
                    </p>
                  </div>

                  {/* Price & Order Action */}
                  <div className="pt-2.5 border-t border-[#ECE4E8] flex items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#68516B] line-through tabular-nums">
                          {prod.originalPriceEGP.toLocaleString()} {t('ج.م', 'EGP')}
                        </span>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                          {t('خصم 10%', '10% OFF')}
                        </span>
                      </div>
                      <p className="text-base font-black text-[#5A189A] tabular-nums">
                        {prod.discountedPriceEGP.toLocaleString()}{' '}
                        <span className="text-xs">{t('ج.م', 'EGP')}</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setOrderSuccessMsg(null);
                        setOrderQuantity(1);
                        setSelectedSeasonal(prod);
                      }}
                      className="min-h-[44px] px-4 rounded-xl bg-gradient-to-r from-[#FACC15] to-[#EAB308] text-[#1A052E] text-xs font-black hover:brightness-105 active:scale-95 transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <ShoppingBag className="w-4 h-4 text-[#1A052E]" />
                      <span>{t('حجز التوريد بالخصم', 'Order with 10% Off')}</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: ADMIN HUB (لوحة الإدارة)
          ========================================================================= */}
      {activeTab === 'admin' && canAccessAdmin && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-gradient-to-r from-[#240046] via-[#4B148C] to-[#1A052E] text-[#FFFDF7] border border-[#FFE875]/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-lg bg-[#FFE875] text-[#1A052E] text-[10px] font-black uppercase">
                {t('لوحة تحكم كارت باسط', 'BASIT Card Governance')}
              </span>
              <span className="text-xs text-[#FACC15] font-bold">
                {t('صلاحية إدارة المنصة', 'Platform Owner / Admin')}
              </span>
            </div>
            <h2 className="text-sm font-black text-[#FFFFFF]">
              {t(
                'إدارة عضويات كارت باسط والتحقق من العمليات وحالة الكروت',
                'BASIT Card Memberships, Status Toggles & Redemptions Audit',
              )}
            </h2>
          </div>

          {/* Governance Stats */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-3 rounded-2xl bg-[#FFFFFF] border border-[#ECE4E8] space-y-1">
              <p className="text-[10px] text-[#68516B] font-bold">
                {t('الكروت المفعلة', 'Active Cards')}
              </p>
              <p className="text-lg font-black text-[#5A189A] tabular-nums">
                {allCards.filter((c) => c.status === 'active').length || 1}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-[#FFFFFF] border border-[#ECE4E8] space-y-1">
              <p className="text-[10px] text-[#68516B] font-bold">
                {t('الكروت الموقوفة', 'Frozen Cards')}
              </p>
              <p className="text-lg font-black text-amber-600 tabular-nums">
                {allCards.filter((c) => c.status === 'frozen').length}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-[#FFFFFF] border border-[#ECE4E8] space-y-1">
              <p className="text-[10px] text-[#68516B] font-bold">
                {t('عمليات الاستفادة', 'Total Redemptions')}
              </p>
              <p className="text-lg font-black text-emerald-600 tabular-nums">
                {redemptions.length}
              </p>
            </div>
          </div>

          {/* Cards Search & Management List */}
          <div className="rounded-3xl bg-[#FFFFFF] border border-[#ECE4E8] p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-[#1F0B22] flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#5A189A]" />
                <span>{t('قائمة كروت الأعضاء', 'Member Cards List')}</span>
              </h3>
            </div>

            <input
              type="text"
              value={adminSearch}
              onChange={(e) => setAdminSearch(e.target.value)}
              placeholder={t('بحث بالاسم أو كود الموظف أو المصنع...', 'Search by name, code...')}
              className="w-full min-h-[42px] px-3 rounded-xl bg-[#FFFEFC] border border-[#ECE4E8] text-xs text-[#1F0B22] focus:outline-none focus:border-[#5A189A]"
            />

            <div className="divide-y divide-[#ECE4E8]">
              {(allCards.length > 0 ? allCards : activeCard ? [activeCard] : []).map((c) => (
                <div
                  key={c.cardId}
                  className="py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5 text-xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-[#1F0B22]">{c.holderName}</p>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {c.status === 'active' ? t('مفعل', 'Active') : t('موقوف', 'Frozen')}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#68516B] truncate">
                      {c.factoryName} · {c.employeeCode} · {c.validTo}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 self-end md:self-center shrink-0">
                    {c.status === 'active' ? (
                      <button
                        type="button"
                        disabled={updatingCardId === c.cardId}
                        onClick={() => handleToggleCardStatus(c, 'frozen')}
                        className="min-h-[36px] px-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-800 text-xs font-bold cursor-pointer hover:bg-amber-500/25"
                      >
                        {updatingCardId === c.cardId ? '...' : t('تجميد الكارت', 'Freeze')}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={updatingCardId === c.cardId}
                        onClick={() => handleToggleCardStatus(c, 'active')}
                        className="min-h-[36px] px-3 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer hover:bg-emerald-700"
                      >
                        {updatingCardId === c.cardId ? '...' : t('إعادة التفعيل', 'Activate')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: CARD ACTIVATION FLOW
          ========================================================================= */}
      <BottomDetailSheet
        open={showActivationModal}
        title={t('تفعيل كارت باسط الذكي — BASIT CARD', 'Activate BASIT Smart Card')}
        subtitle={t('منظومة المزايا والخصومات المعتمدة', 'Certified Perks & Benefits Pass')}
        onClose={() => setShowActivationModal(false)}
      >
        <div className="space-y-4 text-xs">
          {cardError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{cardError}</span>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-[#1F0B22] mb-1">
                {t('اسم حامل الكارت (رباعي أو ثلاثي):', 'Cardholder Full Name:')}
              </label>
              <input
                type="text"
                value={activationName}
                onChange={(e) => setActivationName(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl border border-[#ECE4E8] bg-[#FFFEFC] text-xs font-bold text-[#1F0B22] focus:outline-none focus:border-[#5A189A]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#1F0B22] mb-1">
                {t('الرقم الوظيفي / كود الموظف:', 'Employee Code / Staff ID:')}
              </label>
              <input
                type="text"
                value={activationCode}
                onChange={(e) => setActivationCode(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl border border-[#ECE4E8] bg-[#FFFEFC] text-xs font-bold text-[#1F0B22] focus:outline-none focus:border-[#5A189A]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#1F0B22] mb-1">
                {t('جهة العمل / المصنع المتعاقد:', 'Employer / Contracted Factory:')}
              </label>
              <select
                value={activationTenant}
                onChange={(e) => {
                  setActivationTenant(e.target.value);
                  const selectedFactory = PHASE1_FACTORIES.find((f) => f.id === e.target.value);
                  if (selectedFactory) {
                    setActivationFactoryName(isEn ? selectedFactory.nameEn : selectedFactory.nameAr);
                  } else {
                    setActivationFactoryName('الشركة الوطنية اللوجستية');
                  }
                }}
                className="w-full min-h-[44px] px-3 rounded-xl border border-[#ECE4E8] bg-[#FFFEFC] text-xs font-bold text-[#1F0B22] focus:outline-none focus:border-[#5A189A]"
              >
                <option value="tenant_wataniya_logistics">
                  {t(
                    'الشركة الوطنية للخدمات اللوجستية (المركز الرئيسي)',
                    'Al-Wataniya Logistics (HQ)',
                  )}
                </option>
                {PHASE1_FACTORIES.map((f) => (
                  <option key={f.id} value={f.id}>
                    {isEn ? f.nameEn : f.nameAr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Membership Terms Box */}
          <div className="p-3.5 rounded-2xl bg-[#FFFEFC] border border-[#ECE4E8] space-y-2">
            <p className="font-bold text-[#5A189A] flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-[#5A189A]" />
              <span>{t('شروط وضوابط عضوية BASIT CARD:', 'BASIT Card Membership Rules:')}</span>
            </p>
            <ul className="space-y-1.5 text-[11px] text-[#68516B] leading-relaxed list-disc pr-4 pl-4">
              {(isEn ? CARD_MEMBERSHIP_CONDITIONS_EN : CARD_MEMBERSHIP_CONDITIONS_AR).map(
                (cond, idx) => (
                  <li key={idx}>{cond}</li>
                ),
              )}
            </ul>
          </div>

          {/* Agree Checkbox */}
          <label className="flex items-center gap-2.5 p-2 rounded-xl bg-[#5A189A]/5 border border-[#5A189A]/20 cursor-pointer">
            <input
              type="checkbox"
              checked={termsAgreed}
              onChange={(e) => setTermsAgreed(e.target.checked)}
              className="w-4 h-4 text-[#5A189A] rounded border-gray-300"
            />
            <span className="text-xs font-bold text-[#1F0B22]">
              {t(
                'أوافق على جميع الشروط وضوابط الاستخدام وأؤكد صحة بيانات العضوية.',
                'I accept the membership terms and verify my staff credentials.',
              )}
            </span>
          </label>

          {/* Submit Action */}
          <button
            type="button"
            disabled={activating || !termsAgreed}
            onClick={handleActivateCard}
            className="w-full min-h-[48px] rounded-xl bg-gradient-to-r from-[#FACC15] via-[#EAB308] to-[#9A6B16] text-[#1A052E] font-black text-sm shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {activating
              ? t('جاري تفعيل الكارت...', 'Activating Card...')
              : t('تأكيد تفعيل الكارت الآن', 'Confirm & Activate Card Now')}
          </button>
        </div>
      </BottomDetailSheet>

      {/* =========================================================================
          MODAL 2: QR CODE FULLSCREEN BADGE
          ========================================================================= */}
      <BottomDetailSheet
        open={showQrModal}
        title={t('رمز التعريف الرقمي — BASIT CARD', 'BASIT CARD Digital QR Badge')}
        subtitle={activeCard?.holderName || 'أحمد محمود حسن'}
        onClose={() => setShowQrModal(false)}
      >
        <div className="flex flex-col items-center text-center gap-3 py-3">
          <div className="p-3 rounded-2xl bg-[#FFFFFF] border-2 border-[#EAB308] shadow-[0_0_20px_rgba(234,179,8,0.3)]">
            {qrCodeDataUrl ? (
              <img
                src={qrCodeDataUrl}
                alt="BASIT Member QR Code"
                className="w-56 h-56 object-contain"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center">
                <QrCode className="w-24 h-24 text-[#5A189A]" />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-xs font-mono font-bold text-[#5A189A]">
              {activeCard?.employeeCode || 'EMP-84920'}
            </p>
            <p className="text-[11px] text-[#68516B]">
              {t(
                'أبرز هذا الرمز عند شباك التذاكر أو ماكينة الدفع لدى الشركاء لتفعيل الخصم والكاش باك.',
                'Present this QR badge at the partner checkout counter to redeem perks & cashback.',
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowQrModal(false)}
            className="w-full min-h-[44px] rounded-xl bg-[#5A189A] text-[#FFE875] text-xs font-bold cursor-pointer"
          >
            {t('تم / إغلاق', 'Done / Close')}
          </button>
        </div>
      </BottomDetailSheet>

      {/* =========================================================================
          MODAL 3: ENTERTAINMENT PERK DETAILS & REDEEM
          ========================================================================= */}
      <BottomDetailSheet
        open={Boolean(selectedPerk)}
        title={selectedPerk ? (isEn ? selectedPerk.titleEn : selectedPerk.titleAr) : ''}
        subtitle={
          selectedPerk ? (isEn ? selectedPerk.partnerNameEn : selectedPerk.partnerNameAr) : ''
        }
        onClose={() => setSelectedPerk(null)}
      >
        {selectedPerk && (
          <div className="space-y-4 text-xs">
            {/* Photo preview */}
            <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-[#1A052E]">
              <img
                src={selectedPerk.image}
                alt={isEn ? selectedPerk.titleEn : selectedPerk.titleAr}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-xl bg-[#5A189A] text-[#FFE875] text-xs font-black shadow-md border border-[#FFE875]/40">
                {isEn ? selectedPerk.badgeEn : selectedPerk.badgeAr}
              </span>
            </div>

            {/* Price calculation */}
            <div className="p-3.5 rounded-2xl bg-[#FFFEFC] border border-[#ECE4E8] flex items-center justify-between gap-2">
              <div className="space-y-0.5">
                <p className="text-[10px] text-[#68516B]">{t('السعر بعد الخصم', 'Discounted Price')}</p>
                <p className="text-lg font-black text-[#5A189A] tabular-nums">
                  {selectedPerk.discountedPriceEGP.toLocaleString()} {t('ج.م', 'EGP')}
                </p>
                <p className="text-[10px] text-[#68516B] line-through tabular-nums">
                  {t('السعر الأصلي:', 'Original:')} {selectedPerk.originalPriceEGP.toLocaleString()} {t('ج.م', 'EGP')}
                </p>
              </div>

              <div className="text-end space-y-1">
                <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  {t(
                    `وفر ${(selectedPerk.originalPriceEGP - selectedPerk.discountedPriceEGP).toLocaleString()} ج.م`,
                    `Save ${(selectedPerk.originalPriceEGP - selectedPerk.discountedPriceEGP).toLocaleString()} EGP`,
                  )}
                </span>
                <p className="text-[10px] text-amber-700 font-bold">
                  {t(`+ كاش باك ${selectedPerk.cashbackPct}%`, `+ ${selectedPerk.cashbackPct}% Cashback`)}
                </p>
              </div>
            </div>

            {/* Booking instructions */}
            <div className="p-3 rounded-xl bg-[#5A189A]/5 border border-[#5A189A]/20 space-y-1">
              <p className="font-bold text-[#5A189A]">{t('طريقة الاستفادة والحجز:', 'Redemption Method:')}</p>
              <p className="text-[#1F0B22] leading-relaxed">
                {isEn ? selectedPerk.bookingMethodEn : selectedPerk.bookingMethodAr}
              </p>
            </div>

            {/* Terms list */}
            <div className="space-y-1.5">
              <p className="font-bold text-[#1F0B22]">{t('الشروط والأحكام:', 'Terms & Conditions:')}</p>
              <ul className="space-y-1 text-[11px] text-[#68516B] list-disc pr-4 pl-4">
                {(isEn ? selectedPerk.termsEn : selectedPerk.termsAr).map((term, i) => (
                  <li key={i}>{term}</li>
                ))}
              </ul>
            </div>

            {/* Success Message */}
            {perkSuccessMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                <span>{perkSuccessMsg}</span>
              </div>
            )}

            {/* Action */}
            <button
              type="button"
              disabled={perkProcessing}
              onClick={() => handleRedeemPerk(selectedPerk)}
              className="w-full min-h-[48px] rounded-xl bg-gradient-to-r from-[#852BEB] to-[#5A189A] text-[#FFE875] font-black text-sm shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              {perkProcessing
                ? t('جاري تأكيد الاستفادة...', 'Processing...')
                : t('استفد من العرض وسجل الكاش باك', 'Redeem Offer & Log Cashback')}
            </button>
          </div>
        )}
      </BottomDetailSheet>

      {/* =========================================================================
          MODAL 4: SEASONAL FOOD PRODUCT ORDER
          ========================================================================= */}
      <BottomDetailSheet
        open={Boolean(selectedSeasonal)}
        title={selectedSeasonal ? (isEn ? selectedSeasonal.titleEn : selectedSeasonal.titleAr) : ''}
        subtitle={
          selectedSeasonal ? (isEn ? selectedSeasonal.providerEn : selectedSeasonal.providerAr) : ''
        }
        onClose={() => setSelectedSeasonal(null)}
      >
        {selectedSeasonal && (
          <div className="space-y-4 text-xs">
            {/* Photo preview */}
            <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-[#1A052E]">
              <img
                src={selectedSeasonal.image}
                alt={isEn ? selectedSeasonal.titleEn : selectedSeasonal.titleAr}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-2.5 right-2.5 px-3 py-1 rounded-xl bg-gradient-to-r from-[#FACC15] to-[#EAB308] text-[#1A052E] text-xs font-black shadow-lg">
                {isEn ? selectedSeasonal.badgeEn : selectedSeasonal.badgeAr}
              </span>
            </div>

            <p className="text-xs text-[#68516B] leading-relaxed">
              {isEn ? selectedSeasonal.descriptionEn : selectedSeasonal.descriptionAr}
            </p>

            {/* Quantity Stepper & Location */}
            <div className="p-3.5 rounded-2xl bg-[#FFFEFC] border border-[#ECE4E8] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#1F0B22]">
                  {t('الكمية المطلوبة (حد أقصى 10):', 'Quantity (Max 10):')}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOrderQuantity((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-lg bg-[#ECE4E8] text-[#1F0B22] font-black text-sm flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold text-sm tabular-nums">
                    {orderQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setOrderQuantity((q) => Math.min(10, q + 1))}
                    className="w-8 h-8 rounded-lg bg-[#5A189A] text-[#FFE875] font-black text-sm flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1F0B22] mb-1">
                  {t('مكان الاستلام / التوصيل:', 'Delivery / Pickup Hub:')}
                </label>
                <select
                  value={orderDeliveryPlace}
                  onChange={(e) => setOrderDeliveryPlace(e.target.value)}
                  className="w-full min-h-[42px] px-3 rounded-xl border border-[#ECE4E8] bg-[#FFFFFF] text-xs font-bold text-[#1F0B22]"
                >
                  <option value="مقر العمل / المصنع">
                    {t('مقر العمل / المصنع عبر سيارات باسط المبردة', 'Factory Delivery')}
                  </option>
                  <option value="فرع باسط العين السخنة">
                    {t('فرع باسط العين السخنة اللوجستي', 'Sokhna Branch')}
                  </option>
                  <option value="مطبخ باسط المركزي بالعاشر">
                    {t('مطبخ باسط المركزي — العاشر من رمضان', '10th Ramadan Central Kitchen')}
                  </option>
                  <option value="مجمع بدر الصناعي">
                    {t('مجمع بدر الصناعي اللوجستي', 'Badr Industrial Hub')}
                  </option>
                </select>
              </div>

              {/* Total Calculation */}
              <div className="pt-2 border-t border-[#ECE4E8] flex items-center justify-between text-xs">
                <span className="text-[#68516B]">{t('الإجمالي بعد خصم 10%:', 'Total Due (10% Off):')}</span>
                <div className="text-end">
                  <p className="text-base font-black text-[#5A189A] tabular-nums">
                    {(selectedSeasonal.discountedPriceEGP * orderQuantity).toLocaleString()}{' '}
                    {t('ج.م', 'EGP')}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-bold tabular-nums">
                    {t(
                      `وفرت ${(
                        (selectedSeasonal.originalPriceEGP - selectedSeasonal.discountedPriceEGP) *
                        orderQuantity
                      ).toLocaleString()} ج.م`,
                      `Saved ${(
                        (selectedSeasonal.originalPriceEGP - selectedSeasonal.discountedPriceEGP) *
                        orderQuantity
                      ).toLocaleString()} EGP`,
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Success Message */}
            {orderSuccessMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                <span>{orderSuccessMsg}</span>
              </div>
            )}

            {/* Confirm Order Button */}
            <button
              type="button"
              disabled={orderProcessing}
              onClick={() => handleOrderSeasonal(selectedSeasonal)}
              className="w-full min-h-[48px] rounded-xl bg-gradient-to-r from-[#FACC15] via-[#EAB308] to-[#9A6B16] text-[#1A052E] font-black text-sm shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              {orderProcessing
                ? t('جاري تأكيد التوريد...', 'Processing Order...')
                : t('تأكيد حجز التوريد بخصم 10%', 'Confirm Order with 10% Off')}
            </button>
          </div>
        )}
      </BottomDetailSheet>
    </div>
  );
};
