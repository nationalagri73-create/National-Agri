import React, { createContext, useContext, useEffect, useState } from 'react';

export type Language = 'ar' | 'en';

interface I18nContextValue {
  lang: Language;
  isEn: boolean;
  setLang: (next: Language) => void;
  toggleLang: () => void;
  t: (ar: string, en: string) => string;
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'ar',
  isEn: false,
  setLang: () => {},
  toggleLang: () => {},
  t: (ar) => ar,
});

const STORAGE_KEY = 'basit_lang_pref';

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === 'en' || saved === 'ar') return saved;
    }
    return 'ar';
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, lang);
    }
  }, [lang]);

  const setLang = (next: Language) => setLangState(next);
  const toggleLang = () => setLangState((prev) => (prev === 'ar' ? 'en' : 'ar'));
  const t = (ar: string, en: string) => (lang === 'en' ? en : ar);

  return React.createElement(
    I18nContext.Provider,
    {
      value: {
        lang,
        isEn: lang === 'en',
        setLang,
        toggleLang,
        t,
      },
    },
    children,
  );
};

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}

export const NAV_LABELS = {
  brand: { ar: 'BASIT | باسط', en: 'BASIT' },
  subtitle: {
    ar: 'منصة الوطنية اللوجستية للغذاء والتوريد والتشغيل',
    en: 'Al-Wataniya Logistics Food & Supply Platform',
  },
  sectors: {
    marketplace: { ar: 'الماركت بليس', en: 'Marketplace' },
    business: { ar: 'الأعمال', en: 'Business' },
    cardHealthy: { ar: 'الكروت والصحي', en: 'Card & Healthy' },
    factory: { ar: 'بوابة المصنع', en: 'Factory Portal' },
    ops: { ar: 'التوصيل والفرص', en: 'Ops & Deals' },
    orders: { ar: 'الطلبات', en: 'Orders' },
    finance: { ar: 'المالية', en: 'Owner Vault' },
    governance: { ar: 'الحوكمة', en: 'Governance' },
  },
  signIn: { ar: 'دخول Google', en: 'Sign in' },
  myAccount: { ar: 'حسابي', en: 'Account' },
  currency: { ar: 'ج.م', en: 'EGP' },
} as const;
