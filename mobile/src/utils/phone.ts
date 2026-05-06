export function normalizePhone(value: string): string {
  return value.replace(/[()\s-]/g, "");
}

export function isValidPhone(value: string): boolean {
  const phone = normalizePhone(value);
  const digits = phone.replace(/\D/g, "");
  return phone.startsWith("+998") ? digits.length >= 12 : digits.length >= 9;
}
