import { AlertTriangle } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import type { Motif } from "@/lib/types";

/** Long-form page (policies, delivery info). `draft` adds a review notice. */
export function ProsePage({
  eyebrow,
  title,
  accent,
  intro,
  draft = false,
  motifs,
  children,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  intro?: string;
  draft?: boolean;
  motifs?: Motif[];
  children: React.ReactNode;
}) {
  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} accent={accent} intro={intro} motifs={motifs} />
      <div className="bg-warm py-16 lg:py-24">
        <div className="container-x">
          {draft && (
            <div role="note" className="mb-12 flex max-w-3xl items-start gap-3 rounded-2xl border border-ember/40 bg-ember/10 p-5 text-sm text-[#7a3d0a]">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
              <p>
                <strong>Draft for business and legal review.</strong> This page is a starting template, not legal advice.
                Naturo Wellness must review and approve it (including against Zimbabwe&apos;s Consumer Protection Act and
                Cyber and Data Protection Act) before launch.
              </p>
            </div>
          )}
          <div className="max-w-3xl space-y-6 text-lg leading-relaxed text-ink/80 [&_a]:font-medium [&_a]:text-forest [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mt-12 [&_h2]:font-display [&_h2]:text-3xl [&_h2]:font-extrabold [&_h2]:uppercase [&_h2]:tracking-tight [&_h2]:text-forest [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-2">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
