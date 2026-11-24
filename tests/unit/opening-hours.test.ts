import { describe, expect, it } from "vitest";
import { openStatus } from "@/components/contact/opening-hours";
import { siteConfig } from "@/config/site";

const at = (day: number, hh: number, mm = 0) => openStatus(siteConfig.openingHours, { day, minutes: hh * 60 + mm });

describe("opening hours", () => {
  it("knows weekday, Saturday and Sunday hours", () => {
    expect(at(1, 8)).toEqual({ open: true, text: "Open now · until 17:00" });
    expect(at(3, 16, 59).open).toBe(true);
    expect(at(3, 17)).toEqual({ open: false, text: "Closed · opens tomorrow at 08:00" });
    expect(at(2, 7, 30)).toEqual({ open: false, text: "Closed · opens today at 08:00" });
    expect(at(6, 12, 30)).toEqual({ open: true, text: "Open now · until 13:00" });
    expect(at(6, 13)).toEqual({ open: false, text: "Closed · opens Monday at 08:00" });
    expect(at(0, 11)).toEqual({ open: false, text: "Closed · opens tomorrow at 08:00" });
    expect(at(5, 18)).toEqual({ open: false, text: "Closed · opens tomorrow at 09:00" });
  });
});
