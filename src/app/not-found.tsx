import Link from "next/link";

/** Fallback for URLs outside the site layout. */
export default function RootNotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-cream px-6 text-center">
      <div>
        <p className="eyebrow text-botanical">Error 404</p>
        <h1 className="display mt-4 text-5xl text-forest">Page not found</h1>
        <Link href="/" className="mt-8 inline-block rounded-full bg-forest px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-warm">
          Back home
        </Link>
      </div>
    </main>
  );
}
