/** Admin operations data: live delivery tracking, customer queries, expenses and unit costs. */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Delivery {
  orderId: string;
  riderName: string | null;
  riderPhone: string | null;
  riderTokenHash: string | null;
  dest: LatLng | null;
  destLabel: string | null;
  startedAt: string | null;
  deliveredAt: string | null;
  updatedAt: string;
}

export interface Ping extends LatLng {
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  at: string;
}

export type EnquiryTopic = "order" | "wholesale" | "feedback" | "general";
export type EnquiryStatus = "new" | "open" | "resolved";

export interface Enquiry {
  id: string;
  orderId: string | null;
  orderNumber: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  topic: EnquiryTopic;
  message: string;
  status: EnquiryStatus;
  staffNote: string;
  createdAt: string;
}

export const EXPENSE_CATEGORIES = [
  "ingredients",
  "packaging",
  "delivery",
  "marketing",
  "wages",
  "rent",
  "utilities",
  "fees",
  "other",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface Expense {
  id: string;
  spentOn: string; // YYYY-MM-DD
  category: ExpenseCategory;
  description: string;
  amount: number; // cents
  createdBy: string;
  createdAt: string;
}

export type MessageChannel = "email" | "whatsapp" | "sms";

export interface Message {
  id: string;
  enquiryId: string | null;
  orderId: string | null;
  customerName: string;
  toEmail: string | null;
  toPhone: string | null;
  channel: MessageChannel;
  subject: string;
  body: string;
  /** sent = delivered to the email service; handed_off = opened in WhatsApp/SMS on the admin's device. */
  status: "sent" | "handed_off" | "failed";
  error: string | null;
  sentBy: string;
  createdAt: string;
}

export interface OpsRepository {
  listMessages(filter?: { enquiryId?: string; orderId?: string; limit?: number }): Promise<Message[]>;
  addMessage(m: Omit<Message, "id" | "createdAt">): Promise<Message>;
  /** False when the ops tables are not in the database yet (migration pending). */
  ready(): Promise<boolean>;
  getDelivery(orderId: string): Promise<Delivery | null>;
  listDeliveries(orderIds: string[]): Promise<Delivery[]>;
  upsertDelivery(orderId: string, patch: Partial<Omit<Delivery, "orderId" | "updatedAt">>): Promise<Delivery>;
  addPing(orderId: string, ping: Omit<Ping, "at">): Promise<void>;
  listPings(orderId: string, limit?: number): Promise<Ping[]>;
  listEnquiries(limit?: number): Promise<Enquiry[]>;
  createEnquiry(e: Omit<Enquiry, "id" | "status" | "staffNote" | "createdAt">): Promise<Enquiry>;
  updateEnquiry(id: string, patch: { status?: EnquiryStatus; staffNote?: string }): Promise<void>;
  listExpenses(sinceIso?: string): Promise<Expense[]>;
  addExpense(e: Omit<Expense, "id" | "createdAt">): Promise<void>;
  deleteExpense(id: string): Promise<void>;
  /** variantId → unit cost in cents. */
  listVariantCosts(): Promise<Record<string, number | null>>;
  setVariantCost(variantId: string, cost: number | null): Promise<void>;
}
