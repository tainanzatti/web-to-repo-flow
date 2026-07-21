export function maskCPF(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  return d.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
export function maskPhone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}
export function validateCPF(cpf: string): boolean {
  const d = cpf.replace(/\D/g, ""); if (d.length !== 11) return false; if (/^(\d)\1{10}$/.test(d)) return false;
  let s = 0; for (let i = 0; i < 9; i++) s += parseInt(d[i]) * (10 - i);
  let r = (s * 10) % 11; if (r === 10) r = 0; if (r !== parseInt(d[9])) return false;
  s = 0; for (let i = 0; i < 10; i++) s += parseInt(d[i]) * (11 - i);
  r = (s * 10) % 11; if (r === 10) r = 0; return r === parseInt(d[10]);
}
export function validateEmail(email: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
export function validatePhone(phone: string): boolean { const d = phone.replace(/\D/g, ""); return d.length >= 10 && d.length <= 11; }
export function validatePassword(pw: string): { valid: boolean; message?: string } {
  if (pw.length < 8) return { valid: false, message: "Mínimo de 8 caracteres" };
  if (!/[A-Z]/.test(pw)) return { valid: false, message: "Inclua uma letra maiúscula" };
  if (!/[a-z]/.test(pw)) return { valid: false, message: "Inclua uma letra minúscula" };
  if (!/[0-9]/.test(pw)) return { valid: false, message: "Inclua um número" };
  return { valid: true };
}
export function validateBirthDate(date: string): boolean {
  const b = new Date(date); const t = new Date();
  let age = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) age--;
  return age >= 16;
}
export function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let s = 0;
  if (pw.length >= 8) s++; if (pw.length >= 12) s++; if (/[A-Z]/.test(pw)) s++;
  if (/[a-z]/.test(pw)) s++; if (/[0-9]/.test(pw)) s++; if (/[^A-Za-z0-9]/.test(pw)) s++;
  const labels = ["Muito fraca","Fraca","Razoável","Boa","Forte","Muito forte","Excelente"];
  const colors = ["bg-error-500","bg-error-500","bg-warning-500","bg-warning-500","bg-success-500","bg-success-500","bg-success-600"];
  return { score: s, label: labels[s] ?? labels[0], color: colors[s] ?? colors[0] };
}
