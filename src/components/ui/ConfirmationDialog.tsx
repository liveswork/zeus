import React from 'react';
import { useUI } from '../../contexts/UIContext';
import { Modal } from './Modal'; // Reutilizando seu componente de Modal

export const ConfirmationDialog: React.FC = () => {
  const { confirmationConfig, closeConfirmation } = useUI();

  if (!confirmationConfig.isOpen) {
    return null;
  }

  const handleConfirm = () => {
    confirmationConfig.onConfirm();
    closeConfirmation();
  };

  const handleCancel = () => {
    if (confirmationConfig.onCancel) {
      confirmationConfig.onCancel();
    }
    closeConfirmation();
  };

  return (
    <Modal isOpen={confirmationConfig.isOpen} onClose={handleCancel} title="Confirmação" size="md">
      <div className="space-y-6">
        <p className="text-gray-700">{confirmationConfig.message}</p>
        <div className="flex justify-end space-x-4 pt-4 border-t">
          <button onClick={handleCancel} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg">
            Cancelar
          </button>
          <button onClick={handleConfirm} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg">
            Confirmar
          </button>
        </div>
      </div>
    </Modal>
  );
};