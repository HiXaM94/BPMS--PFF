import { createContext, useContext, useState, useCallback } from 'react';
import { languages } from '../i18n';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState(() => {
    const saved = localStorage.getItem('flowly_lang');
    return saved && languages[saved] ? saved : 'en';
  });

  const t = useCallback(
    (key) => {
      const keys = key.split('.');
      let result = languages[locale].translations;
      for (const k of keys) {
        result = result?.[k];
        if (result === undefined) break;
      }
      if (result === undefined) {
        // Fallback to English
        let fallback = languages.en.translations;
        for (const k of keys) {
          fallback = fallback?.[k];
          if (fallback === undefined) break;
        }
        return fallback ?? key;
      }
      return result;
    },
    [locale]
  );

  const switchLanguage = useCallback((lang) => {
    if (languages[lang]) {
      setLocale(lang);
      localStorage.setItem('flowly_lang', lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = 'ltr';
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ locale, t, switchLanguage, languages }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
