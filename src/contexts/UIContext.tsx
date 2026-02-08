import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import toast from 'react-hot-toast'; // <<< MUDANÇA 1: Importar o 'toast'

interface AlertConfig {
  isOpen: boolean;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface ConfirmationConfig {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

interface UIContextType {
  showAlert: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  showConfirmation: (message: string, onConfirm: () => void) => void;
  alertConfig: AlertConfig;
  confirmationConfig: ConfirmationConfig;
  closeAlert: () => void;
  closeConfirmation: () => void;
}

const UIContext = createContext<UIContextType | null>(null);

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};

interface UIProviderProps {
  children: ReactNode;
}

export const UIProvider: React.FC<UIProviderProps> = ({ children }) => {
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({
    isOpen: false,
    message: '',
    type: 'success'
  });

  const [confirmationConfig, setConfirmationConfig] = useState<ConfirmationConfig>({
    isOpen: false,
    message: '',
    onConfirm: () => {},
    onCancel: () => {}
  });

  const showAlert = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    switch (type) {
      case 'success':
        toast.success(message);
        break;
      case 'error':
        toast.error(message);
        break;
      case 'warning':
        toast(message, { icon: '⚠️' }); // toast não tem 'warning' por padrão
        break;
      case 'info':
        toast(message, { icon: 'ℹ️' }); // toast não tem 'info' por padrão
        break;
      default:
        toast(message);
        break;
    }
    // Mantemos a lógica antiga para não quebrar outras partes do sistema que possam usar o alertConfig
    setAlertConfig({ isOpen: true, message, type });
  }, []);

const showConfirmation = useCallback((message: string, onConfirmAction: () => void, onCancelAction?: () => void) => {
    setConfirmationConfig({
        isOpen: true,
        message,
        onConfirm: () => {
            setConfirmationConfig({ isOpen: false, message: '', onConfirm: () => {}, onCancel: () => {} });
            onConfirmAction();
        },
        onCancel: () => {
            setConfirmationConfig({ isOpen: false, message: '', onConfirm: () => {}, onCancel: () => {} });
            if (onCancelAction) onCancelAction();
        }
    });
}, []);

  const closeAlert = () => {
    setAlertConfig({ isOpen: false, message: '', type: 'success' });
  };

const closeConfirmation = () => {
    setConfirmationConfig({ isOpen: false, message: '', onConfirm: () => {}, onCancel: () => {} });
};

  const value = {
    showAlert,
    showConfirmation,
    alertConfig,
    confirmationConfig,
    closeAlert,
    closeConfirmation,
  };

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
};