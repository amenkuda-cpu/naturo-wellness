import "server-only";
import type { StaffContext } from "@/lib/auth";
import { env } from "@/lib/env";
import { createUserClient } from "@/lib/supabase/server";
import { OrderingUnavailableError, type Repository } from "@/lib/orders/types";
import { createDevFileRepository } from "./dev-file";
import { localCatalog, localZones } from "./static-catalog";
import { createSupabaseRepository } from "./supabase";

/**
 * Chooses the active data source:
 *   1. Supabase, when NEXT_PUBLIC_SUPABASE_URL + keys are set (production path)
 *   2. Local JSON dev store, in development only
 *   3. Static catalogue: browse-only, ordering disabled (unconfigured production)
 */
function staticRepository(): Repository {
  const fail = async (): Promise<never> => {
    throw new OrderingUnavailableError();
  };
  return {
    kind: "static",
    canStoreOrders: false,
    loadCatalog: async () => localCatalog({ samplePrices: false }),
    loadDeliveryZones: async () => localZones({ samplePrices: false }).filter((z) => z.active),
    findPromotion: async () => null,
    createOrder: fail,
    getOrder: async () => null,
    getOrderByNumber: async () => null,
    listOrders: async () => [],
    listOrdersForCustomer: async () => [],
    updateOrder: fail,
    updateVariant: fail,
    setProductEnabled: fail,
  };
}

let cached: Repository | null = null;

export function getRepository(): Repository {
  if (cached) return cached;
  if (env.supabase.configured) cached = createSupabaseRepository();
  else if (env.dev.fileStore) cached = createDevFileRepository({ samplePrices: env.dev.samplePrices });
  else cached = staticRepository();
  return cached;
}

/**
 * Repository for admin reads/writes. With Supabase it acts AS the signed-in
 * staff member (RLS applies), never with the service-role key.
 */
export async function getStaffRepository(ctx: StaffContext): Promise<Repository> {
  if (ctx.mode === "supabase") {
    const client = await createUserClient();
    if (!client) throw new Error("Supabase auth is not configured.");
    return createSupabaseRepository(client);
  }
  return getRepository();
}
