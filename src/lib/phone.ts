/**
 * International digits for WhatsApp links (wa.me/<digits>).
 * Numbers already in +263 / +27 form are kept. Local numbers starting 0:
 * South Africa when the order ships there or the number is 06…/08…,
 * otherwise Zimbabwe (07…).
 */
export function whatsappDigits(phone: string, zoneId?: string | null): string {
  const raw = phone.trim();
  const d = raw.replace(/\D/g, "");
  if (raw.startsWith("+") || d.startsWith("263") || d.startsWith("27")) return d;
  if (d.startsWith("0")) {
    const sa = zoneId === "south-africa" || /^0[68]/.test(d);
    return (sa ? "27" : "263") + d.slice(1);
  }
  return d;
}
