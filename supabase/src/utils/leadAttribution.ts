/**
 * Attribution context for a lead, appended to the `message` field of
 * public.leads (the table has no UTM columns yet, so this stays honest
 * without a schema change).
 *
 * Lives in its own tiny module (no Supabase import) so QuoteLeadCard can
 * import it statically WITHOUT pulling the supabase client chunk into the
 * page bundle — the actual lead insert stays lazy (dynamic import) exactly
 * like FloatingWhatsAppButton.
 */
export function attributionSuffix(): string {
  try {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    const parts: string[] = [];
    for (const key of ["source", "medium", "campaign", "term", "content"]) {
      const value = params.get(`utm_${key}`);
      if (value) parts.push(`utm_${key}=${value.slice(0, 60)}`);
    }
    if (document.referrer) {
      parts.push(`ref=${document.referrer.slice(0, 160)}`);
    }
    return parts.length > 0 ? `\n(Web: ${parts.join("  ")})` : "";
  } catch {
    return "";
  }
}
