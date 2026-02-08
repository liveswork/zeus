import React from 'react';
import { ScanLine } from 'lucide-react';

interface ScanComandaButtonProps {
    onClick: () => void;
    disabled?: boolean;
}

export const ScanComandaButton: React.FC<ScanComandaButtonProps> = ({ onClick, disabled }) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-orange-500 text-white font-bold rounded-xl shadow-lg hover:bg-orange-600 transition-all transform hover:scale-105 active:scale-100 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
            <ScanLine size={24} />
            Escanear Comanda
        </button>
    );
};