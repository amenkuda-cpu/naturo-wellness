import type { PricedLine } from "@/lib/commerce/pricing";
import type {
  CurrencyCode,
  DeliveryZone,
  FulfilmentMethod,
  OrderStatus,
  PaymentMethodId,
  PaymentStatus,
  Product,
  Promotion,
  StockStatus,
} from "@/lib/types";

export interface OrderAddress {
  line1: string;
  suburb: string;
  city: string;
  instructions: string;
}

export interface OrderHistoryEntry {
  at: string;
  status: OrderStatus | null;
  paymentStatus: PaymentStatus | null;
  note: string;
  actor: string;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethodId;
  /** Provider-side reference (e.g. Paynow reference). */
  paymentReference: string | null;
  /** Server-only provider data (e.g. Paynow poll URL). Never sent to browsers. */
  paymentData: Record<string, string>;
  currency: CurrencyCode;
  customer: { fullName: string; phone: string; email: string | null };
  customerId: string | null;
  fulfilment: {
    method: FulfilmentMethod;
    zoneId: string | null;
    zoneName: string | null;
    address: OrderAddress | null;
  };
  lines: PricedLine[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  tax: number;
  total: number;
  promoCode: string | null;
  notes: string;
  accessTokenHash: string;
  history: OrderHistoryEntry[];
}

export type NewOrder = Omit<OrderRecord, "id" | "createdAt" | "history">;

/** What a customer may see about their order (no hashes or provider internals). */
export type PublicOrder = Omit<OrderRecord, "accessTokenHash" | "paymentData" | "customerId">;

export function toPublicOrder(order: OrderRecord): PublicOrder {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { accessTokenHash, paymentData, customerId, ...rest } = order;
  return rest;
}

export interface VariantUpdate {
  price?: number | null;
  stockStatus?: StockStatus;
  stockQuantity?: number | null;
}

export interface Repository {
  kind: "supabase" | "dev-file" | "static";
  /** Whether orders can be stored. */
  canStoreOrders: boolean;
  loadCatalog(): Promise<Product[]>;
  loadDeliveryZones(): Promise<DeliveryZone[]>;
  findPromotion(code: string): Promise<Promotion | null>;
  createOrder(order: NewOrder): Promise<OrderRecord>;
  getOrder(id: string): Promise<OrderRecord | null>;
  getOrderByNumber(orderNumber: string): Promise<OrderRecord | null>;
  listOrders(opts?: { limit?: number; status?: OrderStatus }): Promise<OrderRecord[]>;
  listOrdersForCustomer(customerId: string): Promise<OrderRecord[]>;
  updateOrder(
    id: string,
    patch: Partial<Pick<OrderRecord, "status" | "paymentStatus" | "paymentReference" | "paymentData">>,
    historyNote: Omit<OrderHistoryEntry, "at" | "status" | "paymentStatus">,
  ): Promise<OrderRecord>;
  updateVariant(productId: string, variantId: string, update: VariantUpdate): Promise<void>;
  setProductEnabled(productId: string, enabled: boolean): Promise<void>;
}

export class OrderingUnavailableError extends Error {
  constructor() {
    super("Online ordering is not configured yet.");
  }
}

export class StockConflictError extends Error {}
