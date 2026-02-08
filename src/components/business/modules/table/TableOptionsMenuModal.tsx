import React from 'react';
import { Modal } from '../../../ui/Modal';
import { Printer, XCircle, Trash2, Repeat } from 'lucide-react';

interface TableOptionsMenuModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderStatus?: 'ocupada' | 'pagamento'; // Status para lógica condicional
    onPrintKitchen: () => void;
    onCancelItems: () => void;
    onCancelTable: () => void;
    onReopenTable: () => void; // Nova prop
}

export const TableOptionsMenuModal: React.FC<TableOptionsMenuModalProps> = ({ 
    isOpen, 
    onClose, 
    orderStatus,
    onPrintKitchen, 
    onCancelItems, 
    onCancelTable,
    onReopenTable 
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Opções da Mesa" size="lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* --- BOTÃO CONDICIONAL PARA REABRIR A MESA --- */}
                {orderStatus === 'pagamento' && (
                     <button onClick={onReopenTable} className="md:col-span-2 p-4 bg-green-50 hover:bg-green-100 rounded-lg text-center font-semibold text-green-800 flex items-center justify-center gap-2">
                        <Repeat size={24} />
                        Reabrir Mesa para Lançamentos
                    </button>
                )}

                <button onClick={onPrintKitchen} disabled={orderStatus === 'pagamento'} className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-center font-semibold text-blue-800 disabled:bg-gray-100 disabled:text-gray-400">
                    <Printer size={32} className="mx-auto mb-2" />
                    Reimprimir Comanda
                </button>
                <button onClick={onCancelItems} disabled={orderStatus === 'pagamento'} className="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-center font-semibold text-yellow-800 disabled:bg-gray-100 disabled:text-gray-400">
                    <XCircle size={32} className="mx-auto mb-2" />
                    Cancelar Itens
                </button>
                <button onClick={onCancelTable} className="md:col-span-2 p-4 bg-red-50 hover:bg-red-100 rounded-lg text-center font-semibold text-red-800">
                    <Trash2 size={32} className="mx-auto mb-2" />
                    Cancelar Mesa
                </button>
            </div>
        </Modal>
    );
};