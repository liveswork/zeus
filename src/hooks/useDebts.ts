import { useState } from "react";
import { Debt } from "../types";

export const useDebts = () => {
  const [debts, setDebts] = useState<Debt[]>([]);

  const addDebt = (debt: Debt) => {
    setDebts((prev) => [...prev, debt]);
  };

  const updateDebt = (id: string, updatedDebt: Partial<Debt>) => {
    setDebts((prev) =>
      prev.map((debt) => (debt.id === id ? { ...debt, ...updatedDebt } : debt))
    );
  };

  return { debts, addDebt, updateDebt };
};