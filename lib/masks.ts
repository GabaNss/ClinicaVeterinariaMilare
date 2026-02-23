export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function formatCpfCnpj(value: string | null | undefined) {
  const digits = onlyDigits(value ?? "");

  if (!digits) return "";

  if (digits.length <= 11) {
    const a = digits.slice(0, 3);
    const b = digits.slice(3, 6);
    const c = digits.slice(6, 9);
    const d = digits.slice(9, 11);
    return [a, b, c].filter(Boolean).join(".") + (d ? `-${d}` : "");
  }

  const a = digits.slice(0, 2);
  const b = digits.slice(2, 5);
  const c = digits.slice(5, 8);
  const d = digits.slice(8, 12);
  const e = digits.slice(12, 14);
  return a + (b ? `.${b}` : "") + (c ? `.${c}` : "") + (d ? `/${d}` : "") + (e ? `-${e}` : "");
}

export function formatPhone(value: string | null | undefined) {
  const digits = onlyDigits(value ?? "").slice(0, 11);
  if (!digits) return "";

  const ddd = digits.slice(0, 2);
  const middle = digits.length > 10 ? digits.slice(2, 7) : digits.slice(2, 6);
  const end = digits.length > 10 ? digits.slice(7, 11) : digits.slice(6, 10);

  return `(${ddd}) ${middle}${end ? `-${end}` : ""}`.trim();
}

