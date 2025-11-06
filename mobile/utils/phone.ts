export const normalizePhone = (s: string) => (s || '').replace(/\D+/g, '').slice(0, 9);

export const isPhone = (digits: string) => /^7\d{8}$/.test(digits || '');

export const formatPhone = (s: string) => {
  const d = normalizePhone(s);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0,2)} ${d.slice(2)}`;
  if (d.length <= 7) return `${d.slice(0,2)} ${d.slice(2,5)} ${d.slice(5)}`;
  return `${d.slice(0,2)} ${d.slice(2,5)} ${d.slice(5,7)} ${d.slice(7,9)}`;
};

// Naive cursor helper: keeps caret at end after formatting
export const nextSelectionAtEnd = (formatted: string) => {
  const len = (formatted || '').length;
  return { start: len, end: len } as const;
};
