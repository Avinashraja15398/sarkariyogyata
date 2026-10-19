export type AgeRules = { min?: number; max?: number; relax?: Record<string, number>; female_extra?: number };
export function ageOn(dob: string, on: Date) {
  const b = new Date(dob); let y = on.getFullYear() - b.getFullYear(); let m = on.getMonth() - b.getMonth();
  if (on.getDate() < b.getDate()) m--; if (m < 0) { y--; m += 12; }
  return { y, m, months: y * 12 + m };
}
export function checkAge(dob: string, cat: string, female: boolean, rules: AgeRules | null, asOn: string | null) {
  if (!dob || !rules || !asOn || rules.max == null) return { state: 'unknown' as const, text: 'Is bharti ke liye age rule available nahi hai. Notification dekhein.' };
  const a = ageOn(dob, new Date(asOn));
  const extra = (rules.relax?.[cat] ?? 0) + (female ? rules.female_extra ?? 0 : 0);
  const lo = (rules.min ?? 18) * 12, hi = (rules.max + extra) * 12;
  const ok = a.months >= lo && a.months <= hi;
  const base = `${asOn} ko aapki age ${a.y} saal ${a.m} mahine hogi. Limit: ${rules.min ?? 18}-${rules.max + extra} saal.`;
  return { state: ok ? ('yes' as const) : ('no' as const), text: base };
}
