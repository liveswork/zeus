import React from "react";
import { formatCurrency, formatDate } from "../../../../utils/formatters";
import { generateInstallments } from "../../../../utils/generateInstallments";
import { Debt } from '../../../../types';

interface Props {
  debt: Debt | null;
  onClose: () => void;
}

export const DebtDetailModal: React.FC<Props> = ({ debt, onClose }) => {
  if (!debt) return null;

  const installments = generateInstallments(debt);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[500px]">
        <h2 className="text-xl font-bold mb-4">{debt.name}</h2>
        <p>Total: {formatCurrency(debt.totalAmount)}</p>
        <p>Parcelas: {debt.installments}</p>

        <h3 className="font-semibold mt-4">Parcelas</h3>
        <ul className="divide-y">
          {installments.map((inst) => (
            <li key={inst.number} className="flex justify-between py-2">
              <span>
                Parcela {inst.number} - {formatDate(inst.dueDate)}
              </span>
              <span className={inst.paid ? "text-green-600" : "text-red-600"}>
                {formatCurrency(inst.value)} {inst.paid ? "✔" : "❌"}
              </span>
            </li>
          ))}
        </ul>

        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};
