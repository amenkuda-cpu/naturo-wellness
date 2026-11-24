import "server-only";

/**
 * Server-side environment. Never import this file from a Client Component:
 * it reads secrets (the Supabase service-role key and Paynow integration key).
 */
const isProduction = process.env.NODE_ENV === "production";
const flag = (name: string) => process.env[name] === "true";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && supabaseServiceRoleKey);

export const env = {
  isProduction,
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),

  supabase: {
    configured: supabaseConfigured,
    /** Auth needs only the public URL + anon key. */
    authConfigured: Boolean(supabaseUrl && supabaseAnonKey),
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
    serviceRoleKey: supabaseServiceRoleKey,
  },

  /**
   * Development-only conveniences. Every one of these is forced OFF when
   * NODE_ENV === "production", whatever the env var says.
   */
  dev: {
    /** Local JSON order store (.naturo-dev/store.json) when Supabase is absent. */
    fileStore: !isProduction && !supabaseConfigured && process.env.NATURO_DEV_STORE !== "false",
    /** Clearly labelled SAMPLE prices so the cart & checkout can be exercised. */
    samplePrices: !isProduction && flag("NATURO_DEV_SAMPLE_PRICES"),
    /** Unauthenticated admin access for local development only. */
    admin: !isProduction && !supabaseConfigured && flag("NATURO_DEV_ADMIN"),
  },

  payments: {
    cashOnDelivery: flag("PAYMENT_COD_ENABLED"),
    manual: flag("PAYMENT_MANUAL_ENABLED"),
    manualInstructions:
      process.env.PAYMENT_MANUAL_INSTRUCTIONS ||
      "Our team will contact you with payment details to confirm your order.",
    paynow: {
      integrationId: process.env.PAYNOW_INTEGRATION_ID || "",
      integrationKey: process.env.PAYNOW_INTEGRATION_KEY || "",
      authEmail: process.env.PAYNOW_MERCHANT_EMAIL || "",
      enabled:
        flag("PAYMENT_PAYNOW_ENABLED") &&
        Boolean(process.env.PAYNOW_INTEGRATION_ID && process.env.PAYNOW_INTEGRATION_KEY),
    },
    /** Pesepay (https://pesepay.com): hosted checkout for EcoCash, InnBucks, O'mari, Zimswitch, Visa & Mastercard. */
    pesepay: {
      // Trimmed: secrets pasted through a terminal can pick up a trailing newline.
      integrationKey: (process.env.PESEPAY_INTEGRATION_KEY || "").trim(),
      encryptionKey: (process.env.PESEPAY_ENCRYPTION_KEY || "").trim(),
      sandbox: flag("PESEPAY_SANDBOX"),
      enabled:
        flag("PAYMENT_PESEPAY_ENABLED") &&
        Boolean((process.env.PESEPAY_INTEGRATION_KEY || "").trim() && (process.env.PESEPAY_ENCRYPTION_KEY || "").trim().length === 32),
    },
  },

  /** Where deliveries start from (the Naturo kitchen / dispatch point). */
  dispatch: {
    lat: Number(process.env.NATURO_DISPATCH_LAT || -17.8292),
    lng: Number(process.env.NATURO_DISPATCH_LNG || 31.0522),
    label: process.env.NATURO_DISPATCH_LABEL || "Naturo kitchen, Harare",
  },

  /**
   * Outgoing email: admin sign-in codes, payment receipts, replies to customers.
   * Zoho ZeptoMail HTTP API (preferred) or Resend; both work from Cloudflare Workers.
   * Each kind of email has its own sender on getnaturo.com.
   */
  email: {
    zeptoToken: (process.env.ZEPTOMAIL_TOKEN || "").trim(),
    /** ZeptoMail API host for the account's data centre (.com, .eu, .in, .com.au …). */
    zeptoUrl: (process.env.ZEPTOMAIL_API_URL || "https://api.zeptomail.com").replace(/\/+$/, ""),
    resendKey: (process.env.RESEND_API_KEY || "").trim(),
    from: {
      noreply: process.env.EMAIL_FROM_NOREPLY || "Naturo Wellness <noreply@getnaturo.com>",
      billing: process.env.EMAIL_FROM_BILLING || "Naturo Wellness Billing <billing@getnaturo.com>",
      support: process.env.EMAIL_FROM_SUPPORT || process.env.EMAIL_FROM || "Naturo Wellness <support@getnaturo.com>",
    },
    supportAddress: process.env.EMAIL_SUPPORT_ADDRESS || "support@getnaturo.com",
    replyTo: process.env.EMAIL_REPLY_TO || "",
    configured: Boolean((process.env.ZEPTOMAIL_TOKEN || "").trim() || (process.env.RESEND_API_KEY || "").trim()),
  },
} as const;

export type ServerEnv = typeof env;
