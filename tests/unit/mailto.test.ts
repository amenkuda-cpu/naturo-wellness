import { describe, expect, it } from "vitest";
import { mailtoUrl } from "@/components/admin/message-composer";

describe("mailtoUrl", () => {
  it("fills in recipient, subject and body", () => {
    const url = mailtoUrl({ to: "tari@example.com", subject: "Your order", body: "Hi Tari,\n\nDelivery is $3 & free collection." });
    expect(url.startsWith("mailto:tari@example.com?")).toBe(true);
    const q = new URLSearchParams(url.split("?")[1]);
    expect(q.get("subject")).toBe("Your order");
    expect(q.get("body")).toBe("Hi Tari,\n\nDelivery is $3 & free collection.");
  });

  it("puts many customers in Bcc", () => {
    const url = mailtoUrl({ to: "info@getnaturo.com", bcc: ["a@x.com", "b@y.com"], subject: "News", body: "Hi" });
    const q = new URLSearchParams(url.split("?")[1]);
    expect(q.get("bcc")).toBe("a@x.com,b@y.com");
    expect(url.startsWith("mailto:info@getnaturo.com?bcc=")).toBe(true);
  });
});
