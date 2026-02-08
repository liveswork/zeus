export const formatCurrency = (value: number): string => {
  if (typeof value !== 'number' || isNaN(value)) {
    value = 0;
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR');
};

export const formatDateTime = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleString('pt-BR');
};

export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  const limited = cleaned.slice(0, 11);

  if (limited.length <= 2) return limited;
  if (limited.length <= 6) return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
  if (limited.length <= 10) return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`;
  return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
};

export const normalizePhoneNumber = (phone: string): string | null => {
  if (!phone || typeof phone !== 'string') return null;
  
  const digits = phone.replace(/\D/g, '');
  
  // Aceita números com 10 ou 11 dígitos (com ou sem 9 no celular)
  if (digits.length < 10 || digits.length > 11) return null;
  
  // Se tem 10 dígitos, adiciona o 9 no celular
  if (digits.length === 10) {
    const areaCode = digits.substring(0, 2);
    const number = digits.substring(2);
    return `${areaCode}9${number}`;
  }
  
  return digits;
};
