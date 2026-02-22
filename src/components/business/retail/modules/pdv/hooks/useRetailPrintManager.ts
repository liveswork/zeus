import { useMemo } from 'react';
import { useAuth } from '../../../../../../contexts/AuthContext';
import { usePrint } from '../../../../../../contexts/PrintContext';
import type { RetailPdvPrintSettings } from '../RetailPrintSettingsModal';

const DEFAULT_SETTINGS: RetailPdvPrintSettings = {
  enabled: true,
  customerReceipt: { enabled: true, copies: 1, format: '80mm' },
  counterReceipt: { enabled: true, copies: 1, format: '80mm' },
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export const useRetailPrintManager = () => {
  const { userProfile } = useAuth();
  const { requestPrint } = usePrint();

  const settings: RetailPdvPrintSettings = useMemo(() => {
    const anyProfile: any = userProfile || {};
    const cfg =
      anyProfile?.printSettings?.retailPdv ||
      anyProfile?.retailPdvPrintSettings ||
      null;

    return cfg ? { ...DEFAULT_SETTINGS, ...cfg } : DEFAULT_SETTINGS;
  }, [userProfile]);

  /**
   * Imprime conforme config:
   * - via cliente: retailReceipt
   * - via caixa: retailCounter
   *
   * Observação: como o PrintContext reseta printData após imprimir,
   * precisamos espaçar as cópias com pequenos delays.
   */
  const printRetailSale = async (order: any) => {
    if (!settings.enabled) return;

    // Via Cliente
    if (settings.customerReceipt.enabled && settings.customerReceipt.copies > 0) {
      for (let i = 0; i < settings.customerReceipt.copies; i++) {
        requestPrint({ type: 'retailCustomer', order, format: settings.customerReceipt.format });
        await sleep(900); // espaçamento seguro
      }
    }

    // Via Caixa
    if (settings.counterReceipt.enabled && settings.counterReceipt.copies > 0) {
      for (let i = 0; i < settings.counterReceipt.copies; i++) {
        requestPrint({ type: 'retailCounter', order, format: settings.counterReceipt.format });
        await sleep(900);
      }
    }
  };

  return {
    settings,
    printRetailSale,
  };
};