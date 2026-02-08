import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../../../ui/Modal';

// Um modal pequeno e focado para adicionar observações.

interface ObservationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (text: string) => void;
    initialValue?: string;
}

export const ObservationModal: React.FC<ObservationModalProps> = ({ isOpen, onClose, onSave, initialValue = '' }) => {
    const [observation, setObservation] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isOpen) {
            setObservation(initialValue);
            setTimeout(() => textareaRef.current?.focus(), 100);
        }
    }, [isOpen, initialValue]);

    const handleSave = () => {
        onSave(observation);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Adicionar Observação ao Item" size="lg">
            <div className="space-y-4">
                <textarea
                    ref={textareaRef}
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
                    rows={4}
                    placeholder="Ex: Sem cebola, ponto da carne mal passado..."
                    className="w-full p-2 border rounded"
                ></textarea>
                <div className="flex justify-end space-x-4">
                    <button onClick={onClose} className="bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-400">Cancelar</button>
                    <button onClick={handleSave} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700">Salvar</button>
                </div>
            </div>
        </Modal>
    );
};