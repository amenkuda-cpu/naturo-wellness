import { formatMoney, fromPrice } from "@/lib/commerce/pricing";
import { cn } from "@/lib/cn";
import type { Product, ProductVariant, StockStatus } from "@/lib/types";

export function PriceTag({
  product,
  variant,
  className,
  sample = false,
}: {
  product: Product;
  variant?: ProductVariant;
  className?: string;
  sample?: boolean;
}) {
  const price = variant ? variant.price : fromPrice(product);
  if (price === null) {
    return <span className={cn("font-medium opacity-75", className)}>Price coming soon</span>;
  }
  const many = !variant && product.variants.filter((v) => v.price !== null).length > 1;
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-2", className)}>
      <span className="font-semibold tabular-nums">
        {many && <span className="mr-1 text-[0.8em] font-normal opacity-70">from</span>}
        {formatMoney(price, product.currency)}
      </span>
      {sample && (
        <span className="rounded-full border border-current/35 px-2 py-0.5 font-sans text-[0.6rem] font-semibold uppercase tracking-[0.14em] opacity-80">
          Sample price
        </span>
      )}
    </span>
  );
}

const stockCopy: Record<StockStatus, { label: string; tone: string } | null> = {
  in_stock: { label: "In stock", tone: "bg-leaf" },
  low_stock: { label: "Low stock", tone: "bg-ember" },
  out_of_stock: { label: "Out of stock", tone: "bg-hibiscus" },
  unknown: null,
};

export function StockBadge({ status, className }: { status: StockStatus; className?: string }) {
  const copy = stockCopy[status];
  if (!copy) return null;
  return (
    <span className={cn("inline-flex items-center gap-2 text-xs font-medium", className)}>
      <span className={cn("h-2 w-2 rounded-full", copy.tone)} aria-hidden />
      {copy.label}
    </span>
  );
}
