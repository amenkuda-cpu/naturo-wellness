import Link from "next/link";

/** Fallback for URLs outside the site layout. */
export default function RootNotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-cream px-6 text-center">
      <div>
        <p className="eyebrow text-botanical">Error 404</p>
        <h1 className="display mt-4 text-5xl text-forest">Page not found</h1>
        <p className="mt-4 text-ink/70">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/shop" className="inline-block rounded-full bg-forest px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-warm">
            Shop Naturo Wellness
          </Link>
          <Link href="/" className="inline-block rounded-full border border-forest px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-forest">
            Back home
          </Link>
        </div>
      </div>
    </main>
  );
}
