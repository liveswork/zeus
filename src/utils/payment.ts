import { Debt } from "../types";

export const markInstallmentAsPaid = (debt: Debt, installmentNumber: number): Debt => {
  if (installmentNumber <= debt.paidInstallments) return debt;

  return {
    ...debt,
    paidInstallments: installmentNumber,
  };
};

export const isDebtFullyPaid = (debt: Debt): boolean => {
  return debt.paidInstallments >= debt.installments;
};