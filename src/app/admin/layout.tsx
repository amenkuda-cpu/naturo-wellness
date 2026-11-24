import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { THEME_BOOT_SCRIPT } from "@/lib/admin-theme";

/** The admin uses the Amey dashboard typeface for its calm, legible feel. */
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-admin",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: { default: "Naturo Admin", template: "%s | Naturo Admin" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#0d0e13" };

// Every admin view reads the session at request time.
export const instant = false;

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      id="admin-root"
      data-theme="dark"
      suppressHydrationWarning
      className={`${jakarta.variable} admin-theme min-h-screen`}
      style={{ fontFamily: "var(--font-admin), ui-sans-serif, system-ui, sans-serif" }}
    >
      {/* Applies the saved light/dark choice before first paint. */}
      <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      {children}
    </div>
  );
}
