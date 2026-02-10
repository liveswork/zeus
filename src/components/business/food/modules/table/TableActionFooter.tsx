import React, { ReactNode } from 'react';
import { FileText, DollarSign, Settings, PlusCircle, Printer, MoreVertical } from 'lucide-react';

interface TableActionFooterProps {
  onPreClose: () => void;
  onCloseout: () => void;
  onOptions: () => void;
  onMoreOptions: () => void;
  customAction?: ReactNode; // New prop for custom action
}

export const TableActionFooter: React.FC<TableActionFooterProps> = ({ onPreClose, onCloseout, onOptions }) => {
  return (
    <footer className="flex-shrink-0 bg-white shadow-lg p-3 border-t-2 border-gray-200">
      <div className="flex justify-center items-center space-x-4">
        <button
          onClick={onPreClose}
          className="flex-1 flex items-center justify-center p-3 rounded-lg bg-blue-500 hover:bg-blue-600 transition text-white font-semibold"
        >
          <FileText size={20} className="mr-2" /> Pré-fechamento (F5)
        </button>
        <button
          onClick={onCloseout}
          className="flex-1 flex items-center justify-center p-3 rounded-lg bg-green-600 hover:bg-green-700 transition text-white font-semibold"
        >
          <DollarSign size={20} className="mr-2" /> Fechamento (F6)
        </button>
        <button
          onClick={onOptions}
          className="flex-1 flex items-center justify-center p-3 rounded-lg bg-gray-600 hover:bg-gray-700 transition text-white font-semibold"
        >
          <Settings size={20} className="mr-2" /> Opções
        </button>
      </div>
    </footer>
  );
};