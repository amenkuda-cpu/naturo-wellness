/** Visible only when development conveniences are active. */
export function DevNotice({
  samplePricing,
  dataSource,
}: {
  samplePricing: boolean;
  dataSource: "supabase" | "dev-file" | "static";
}) {
  if (dataSource === "supabase" && !samplePricing) return null;
  const parts =
    dataSource === "static"
      ? ["Browse-only: online ordering not configured"]
      : [
          "Development preview",
          samplePricing ? "sample prices" : null,
          dataSource === "dev-file" ? "orders saved locally" : null,
        ].filter(Boolean);
  return (
    <div className="pointer-events-none fixed bottom-3 right-3 z-[55] max-w-[calc(100vw-1.5rem)] rounded-full bg-ink/85 px-3 py-1.5 text-[0.65rem] font-medium uppercase tracking-[0.14em] text-warm shadow-lg backdrop-blur">
      <span className="sm:hidden">{dataSource === "static" ? "Browse-only" : "Dev preview"}</span>
      <span className="hidden sm:inline">{parts.join(" · ")}</span>
    </div>
  );
}
