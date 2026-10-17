import React, { createContext, useContext, useState, useEffect } from 'react';
import translations from '../data/translations.json';
import { setInternalLanguage, subscribeLanguage } from '../lib/i18n';

const LanguageContext = createContext();

const STORAGE_KEY = 'sahaaya_language';

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'en' || saved === 'te') return saved;
    } catch (e) {
      // localStorage may fail in private mode
    }
    return 'te'; // Default to Telugu as specified
  });

  useEffect(() => {
    // Keep lib/i18n synced with React state
    setInternalLanguage(language);
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch (e) {}
  }, [language]);

  const setLanguage = (lang) => {
    if (lang === 'en' || lang === 'te') {
      setLanguageState(lang);
    }
  };

  const toggleLanguage = () => {
    setLanguageState(prev => (prev === 'te' ? 'en' : 'te'));
  };

  const t = (key) => {
    const dict = translations[language] || translations.en;
    if (!key) return '';

    // Support nested lookup if key contains dot e.g. "reasons.KV-001"
    if (key.includes('.')) {
      const parts = key.split('.');
      let val = dict;
      for (const p of parts) {
        if (val && typeof val === 'object' && p in val) {
          val = val[p];
        } else {
          val = undefined;
          break;
        }
      }
      if (val !== undefined) return val;

      // Fallback to English
      let fallbackVal = translations.en;
      for (const p of parts) {
        if (fallbackVal && typeof fallbackVal === 'object' && p in fallbackVal) {
          fallbackVal = fallbackVal[p];
        } else {
          fallbackVal = undefined;
          break;
        }
      }
      return fallbackVal !== undefined ? fallbackVal : key;
    }

    return dict[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
