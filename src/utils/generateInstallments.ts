import { Debt } from "../types";

export const generateInstallments = (debt: Debt) => {
  const installments = [];
  const valuePerInstallment = debt.totalAmount / debt.installments;

  for (let i = 1; i <= debt.installments; i++) {
    const dueDate = new Date(debt.dueDate);
    dueDate.setMonth(dueDate.getMonth() + i - 1);

    installments.push({
      number: i,
      value: valuePerInstallment,
      dueDate,
      paid: i <= debt.paidInstallments,
    });
  }

  return installments;
};