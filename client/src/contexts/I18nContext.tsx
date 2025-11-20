import { createContext, useContext, useState, useEffect, type ReactNode} from 'react';


export type Language = 'en' | 'zh';


export type TranslationFunction = (key: string, params?: Record<string, string | number>) => string;


interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationFunction;
  isLoading: boolean;
}


const I18nContext = createContext<I18nContextType | undefined>(undefined);


interface LanguageFile {
  [key: string]: any;
}


async function loadLanguageFile(language: Language): Promise<LanguageFile> {
  try {
    const module = await import(`../locales/${language}.json`);
    return module.default;
  } catch (error) {
    console.error(`Failed to load language file for ${language}:`, error);

    if (language !== 'en') {
      const module = await import('../locales/en.json');
      return module.default;
    }
    return {};
  }
}


function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : '';
  }, obj) || path;
}


function replaceParams(text: string, params?: Record<string, string | number>): string {
  if (!params) return text;
  
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key]?.toString() || match;
  });
}


interface I18nProviderProps {
  children: ReactNode;
  defaultLanguage?: Language;
}

export function I18nProvider({ children, defaultLanguage = 'en' }: I18nProviderProps) {
  const [language, setLanguage] = useState<Language>(defaultLanguage);
  const [translations, setTranslations] = useState<LanguageFile>({});
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    const loadTranslations = async () => {
      setIsLoading(true);
      try {
        const translations = await loadLanguageFile(language);
        setTranslations(translations);
      } catch (error) {
        console.error('Failed to load translations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslations();
  }, [language]);


  const t: TranslationFunction = (key: string, params?: Record<string, string | number>) => {
    const translation = getNestedValue(translations, key);
    return replaceParams(translation, params);
  };


  const handleSetLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage);

    localStorage.setItem('preferred-language', newLanguage);
  };


  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'zh')) {
      setLanguage(savedLanguage);
    }
  }, []);

  const value: I18nContextType = {
    language,
    setLanguage: handleSetLanguage,
    t,
    isLoading,
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}


export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}


export function LanguageSwitcher() {
  const { language, setLanguage } = useI18n();

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <button
        onClick={() => setLanguage('en')}
        style={{
          padding: '4px 8px',
          fontSize: '12px',
          backgroundColor: language === 'en' ? '#2563eb' : '#f3f4f6',
          color: language === 'en' ? 'white' : '#374151',
          border: '1px solid #d1d5db',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('zh')}
        style={{
          padding: '4px 8px',
          fontSize: '12px',
          backgroundColor: language === 'zh' ? '#2563eb' : '#f3f4f6',
          color: language === 'zh' ? 'white' : '#374151',
          border: '1px solid #d1d5db',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        中文
      </button>
    </div>
  );
}
