"use client";

import { Trash2 } from "lucide-react";
import { deleteOrderAction } from "@/app/admin/actions";

/** Trash button for one order in the admin list; asks before deleting. Admins only, unpaid orders only. */
export function DeleteOrderButton({ orderId, orderNumber, goodsLeft, compact = false }: { orderId: string; orderNumber: string; goodsLeft: boolean; compact?: boolean }) {
  return (
    <form
      action={deleteOrderAction}
      onSubmit={(e) => {
        const msg = `Delete order ${orderNumber} permanently?\n\nIts items and history are removed and this can't be undone.${goodsLeft ? "" : " Any tracked stock goes back on the shelf."}`;
        if (!window.confirm(msg)) e.preventDefault();
      }}
    >
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="confirm" value={orderNumber} />
      <button
        type="submit"
        title={`Delete ${orderNumber}`}
        aria-label={`Delete order ${orderNumber}`}
        className={
          compact
            ? "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--c-bad)] hover:bg-[var(--c-bad-bg)]"
            : "inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--c-bad)] transition hover:bg-[var(--c-bad-bg)]"
        }
      >
        <Trash2 className="h-4 w-4" aria-hidden />
        {compact && "Delete"}
      </button>
    </form>
  );
}
