import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '../../../../ui/Modal';
import { useAuth } from '../../../../../contexts/AuthContext';
import { db } from '../../../../../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';

type PrintFormat = '80mm' | '58mm' | 'a4';

export type RetailPdvPrintSettings = {
  enabled: boolean;

  allowNegativeStock: boolean;

  customerReceipt: {
    enabled: boolean;
    copies: number;      // 0..5
    format: PrintFormat;
  };

  counterReceipt: {
    enabled: boolean;
    copies: number;      // 0..5
    format: PrintFormat;
  };
};

const DEFAULT_SETTINGS: RetailPdvPrintSettings = {
  enabled: true,
  allowNegativeStock: false,
  customerReceipt: { enabled: true, copies: 1, format: '80mm' },
  counterReceipt: { enabled: true, copies: 1, format: '80mm' },
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (settings: RetailPdvPrintSettings) => void;
}

export const RetailPrintSettingsModal: React.FC<Props> = ({ isOpen, onClose, onSaved }) => {
  const { userProfile } = useAuth();

  const currentFromProfile: RetailPdvPrintSettings | null = useMemo(() => {
    const anyProfile: any = userProfile || {};
    return (
      anyProfile?.printSettings?.retailPdv ||
      anyProfile?.retailPdvPrintSettings ||
      null
    );
  }, [userProfile]);

  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<RetailPdvPrintSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (!isOpen) return;
    setSettings(
      currentFromProfile
        ? { ...DEFAULT_SETTINGS, ...currentFromProfile, allowNegativeStock: Boolean((currentFromProfile as any).allowNegativeStock) }
        : DEFAULT_SETTINGS
    );
  }, [isOpen, currentFromProfile]);

  const save = async () => {
    if (!userProfile?.uid) return;
    setSaving(true);
    try {
      const ref = doc(db, 'users', userProfile.uid);

      // ✅ grava num namespace estável
      await updateDoc(ref, {
        'printSettings.retailPdv': settings,
      });

      onSaved?.(settings);
      onClose();
    } catch (e) {
      console.error('Erro ao salvar printSettings.retailPdv', e);
      alert('Erro ao salvar configurações de impressão.');
    } finally {
      setSaving(false);
    }
  };

  const formats: PrintFormat[] = ['80mm', '58mm', 'a4'];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configurações de Impressão • PDV (Retail)" size="3xl">
      <div className="space-y-6">
        <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg flex items-center justify-between">
          <div>
            <div className="font-bold text-gray-900">Impressão habilitada</div>
            <div className="text-sm text-gray-500">Controla se o PDV imprime automaticamente ao finalizar a venda.</div>
          </div>
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => setSettings((p) => ({ ...p, enabled: e.target.checked }))}
            className="w-5 h-5"
          />
        </div>

        <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg flex items-center justify-between">
          <div>
            <div className="font-bold text-gray-900">Permitir venda com estoque negativo</div>
            <div className="text-sm text-gray-500">
              Se desativado, o PDV bloqueia a venda quando o estoque não for suficiente.
            </div>
          </div>

          <input
            type="checkbox"
            checked={settings.allowNegativeStock}
            onChange={(e) => setSettings((p) => ({ ...p, allowNegativeStock: e.target.checked }))}
            className="w-5 h-5"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Via Cliente */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="font-bold">Via Cliente (Cupom)</div>
              <input
                type="checkbox"
                checked={settings.customerReceipt.enabled}
                onChange={(e) =>
                  setSettings((p) => ({
                    ...p,
                    customerReceipt: { ...p.customerReceipt, enabled: e.target.checked },
                  }))
                }
                className="w-5 h-5"
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-600">Cópias</label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  value={settings.customerReceipt.copies}
                  onChange={(e) =>
                    setSettings((p) => ({
                      ...p,
                      customerReceipt: { ...p.customerReceipt, copies: clamp(Number(e.target.value || 0), 0, 5) },
                    }))
                  }
                  className="w-full border rounded p-2"
                  disabled={!settings.customerReceipt.enabled}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600">Formato</label>
                <select
                  value={settings.customerReceipt.format}
                  onChange={(e) =>
                    setSettings((p) => ({
                      ...p,
                      customerReceipt: { ...p.customerReceipt, format: e.target.value as PrintFormat },
                    }))
                  }
                  className="w-full border rounded p-2 bg-white"
                  disabled={!settings.customerReceipt.enabled}
                >
                  {formats.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-3">Recomendado: 80mm • 1 cópia</p>
          </div>

          {/* Via Caixa */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="font-bold">Via Caixa (Conferência)</div>
              <input
                type="checkbox"
                checked={settings.counterReceipt.enabled}
                onChange={(e) =>
                  setSettings((p) => ({
                    ...p,
                    counterReceipt: { ...p.counterReceipt, enabled: e.target.checked },
                  }))
                }
                className="w-5 h-5"
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-600">Cópias</label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  value={settings.counterReceipt.copies}
                  onChange={(e) =>
                    setSettings((p) => ({
                      ...p,
                      counterReceipt: { ...p.counterReceipt, copies: clamp(Number(e.target.value || 0), 0, 5) },
                    }))
                  }
                  className="w-full border rounded p-2"
                  disabled={!settings.counterReceipt.enabled}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600">Formato</label>
                <select
                  value={settings.counterReceipt.format}
                  onChange={(e) =>
                    setSettings((p) => ({
                      ...p,
                      counterReceipt: { ...p.counterReceipt, format: e.target.value as PrintFormat },
                    }))
                  }
                  className="w-full border rounded p-2 bg-white"
                  disabled={!settings.counterReceipt.enabled}
                >
                  {formats.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-3">Recomendado: 80mm • 1 cópia</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded" disabled={saving}>
            Cancelar
          </button>
          <button
            onClick={save}
            className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            disabled={saving}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </Modal>
  );
};