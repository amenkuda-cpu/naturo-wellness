"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="flex min-h-[70vh] items-center justify-center bg-cream px-6 text-center">
      <div>
        <p className="eyebrow text-botanical">Something went wrong</p>
        <h1 className="display mt-4 text-5xl text-forest">We hit a bump.</h1>
        <p className="mx-auto mt-4 max-w-md text-ink/70">Please try again. If the problem continues, contact us.</p>
        <button
          onClick={reset}
          className="mt-8 rounded-full bg-forest px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-warm"
        >
          Try again
        </button>
      </div>
    </section>
  );
}
