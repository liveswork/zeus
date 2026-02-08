import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  'pt-BR': {
    translation: {
      'pdv.finalizeSale': 'Finalizar Venda (F12)',
      'menusbar.marketing': 'Marketing',
      'menusbar.sales': 'Vendas',
      'menusbar.purchases': 'Compras',
      'menusbar.cashier': 'Caixa',
      'menusbar.financial': 'Financeiro',
      'menusbar.registrations': 'Cadastros',
      'menusbar.extencoes': 'Extensões',
    }
  },
  'en-US': {
    translation: {
      'pdv.finalizeSale': 'Finalize Sale (F12)',
      'menusbar.marketing': 'Marketing',
      'menusbar.sales': 'Sales',
      'menusbar.purchases': 'Purchases',
      'menusbar.cashier': 'Cashier',
      'menusbar.financial': 'Financial',
      'menusbar.registrations': 'Registrations',
      'menusbar.extencoes': 'Extensions',
    }
  },
  'es-ES': {
    translation: {
      'pdv.finalizeSale': 'Finalizar Venta (F12)',
      'menusbar.marketing': 'Marketing',
      'menusbar.sales': 'Ventas',
      'menusbar.purchases': 'Compras',
      'menusbar.cashier': 'Caja',
      'menusbar.financial': 'Financiero',
      'menusbar.registrations': 'Registros',
      'menusbar.extencoes': 'Extensiones',
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'pt-BR',
    fallbackLng: 'pt-BR',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;