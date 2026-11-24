/** Shown instantly when switching tabs, while the page's data loads. */
export default function AdminLoading() {
  const block = "animate-pulse rounded-[28px] bg-[var(--a-card)]";
  return (
    <div aria-busy="true" aria-label="Loading" className="mt-2">
      <div className="mb-6 h-11 w-64 animate-pulse rounded-full bg-[var(--a-card)]" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className={`${block} h-56 md:col-span-2`} />
        <div className={`${block} h-56`} />
        <div className={`${block} h-72 md:col-span-3`} />
      </div>
    </div>
  );
}
