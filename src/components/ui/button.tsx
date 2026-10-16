import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "sun" | "outline" | "ghost" | "light";
type Size = "md" | "lg" | "sm";

const base =
  "group/btn relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-sans font-semibold uppercase tracking-[0.14em] transition-[transform,background-color,color,box-shadow] duration-300 ease-[var(--ease-expo)] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 select-none";

const variants: Record<Variant, string> = {
  primary: "bg-forest text-warm hover:bg-botanical shadow-[0_10px_30px_-12px_rgba(23,63,43,0.55)]",
  sun: "bg-sun text-forest hover:bg-citrus shadow-[0_10px_30px_-12px_rgba(180,140,20,0.6)]",
  outline: "border border-current text-forest hover:bg-forest hover:text-warm",
  ghost: "text-forest hover:bg-forest/5",
  light: "bg-warm text-forest hover:bg-sun",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-4 text-[0.68rem]",
  md: "h-12 px-6 text-[0.72rem]",
  lg: "h-14 px-8 text-[0.76rem]",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: { variant?: Variant; size?: Size; className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

/** Inner label with a subtle vertical text-roll on hover. */
export function ButtonLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative block overflow-hidden">
      <span className="block transition-transform duration-500 ease-[var(--ease-expo)] group-hover/btn:-translate-y-full motion-reduce:transition-none">
        {children}
      </span>
      <span
        aria-hidden
        className="absolute inset-0 block translate-y-full transition-transform duration-500 ease-[var(--ease-expo)] group-hover/btn:translate-y-0 motion-reduce:hidden"
      >
        {children}
      </span>
    </span>
  );
}

export function ButtonLink({
  href,
  children,
  variant,
  size,
  className,
  icon,
  ...rest
}: {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
  icon?: React.ReactNode;
} & Omit<React.ComponentProps<typeof Link>, "href" | "className" | "children">) {
  return (
    <Link href={href} className={buttonClasses({ variant, size, className })} {...rest}>
      <ButtonLabel>{children}</ButtonLabel>
      {icon}
    </Link>
  );
}
