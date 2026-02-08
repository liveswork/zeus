import React from 'react';
import { useTranslation } from 'react-i18next';

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 border-l border-gray-300 pl-4 ml-4">
      <button
        onClick={() => changeLanguage('pt-BR')}
        className={i18n.language === 'pt-BR' ? 'text-blue-600' : 'hover:text-blue-500 transition-colors'}
      >
        PT-BR
      </button>
      <span className="text-gray-300">|</span>
      <button
        onClick={() => changeLanguage('en-US')}
        className={i18n.language === 'en-US' ? 'text-blue-600' : 'hover:text-blue-500 transition-colors'}
      >
        EN
      </button>
      <span className="text-gray-300">|</span>
      <button
        onClick={() => changeLanguage('es-ES')}
        className={i18n.language === 'es-ES' ? 'text-blue-600' : 'hover:text-blue-500 transition-colors'}
      >
        ES
      </button>
    </div>
  );
};