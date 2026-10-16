import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { env } from "@/lib/env";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

async function NextParam({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : "/account";
  return <LoginForm next={safe} />;
}

export default function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  return (
    <div className="bg-cream pb-24 pt-32 lg:pt-40">
      <div className="container-x max-w-lg">
        <p className="eyebrow text-botanical">Your account</p>
        <h1 className="display mt-4 text-[clamp(2.6rem,7vw,4.5rem)] text-forest">
          Sign <span className="serif-accent normal-case text-botanical">in</span>
        </h1>
        <div className="mt-10 rounded-[2rem] bg-warm p-8">
          {env.supabase.authConfigured ? (
            <Suspense fallback={null}>
              <NextParam searchParams={searchParams} />
            </Suspense>
          ) : (
            <div>
              <p className="font-semibold text-forest">Customer accounts are coming soon.</p>
              <p className="mt-2 text-ink/70">
                You don&apos;t need an account to order. Checkout as a guest and keep your private order link to track it.
              </p>
              <Link href="/shop" className="mt-6 inline-block font-semibold text-forest underline underline-offset-4">Go to the shop</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
