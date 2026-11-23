import { describe, expect, it } from "vitest";
import { ago, allowanceLabel, apTime, initials, peso, spell, until } from "@/lib/format";

describe("AP style formatting", () => {
  it("spells out one through nine and uses numerals from 10", () => {
    expect(spell(0)).toBe("zero");
    expect(spell(4)).toBe("four");
    expect(spell(4, true)).toBe("Four");
    expect(spell(10)).toBe("10");
    expect(spell(1200)).toBe("1,200");
  });

  it("formats pesos and allowances", () => {
    expect(peso(6000)).toBe("₱6,000");
    expect(allowanceLabel(3500)).toBe("₱3,500 a month");
    expect(allowanceLabel(0)).toBe("Unpaid");
  });

  it("writes times with a.m. and p.m. in Philippine time", () => {
    expect(apTime(new Date("2027-03-04T06:00:00Z"))).toBe("2 p.m."); // 14:00 Manila
    expect(apTime(new Date("2027-03-04T01:30:00Z"))).toBe("9:30 a.m.");
    expect(apTime(new Date("2027-03-04T04:00:00Z"))).toBe("noon");
  });

  it("describes elapsed and upcoming days", () => {
    const now = new Date("2027-03-04T04:00:00Z");
    expect(ago(new Date(now.getTime() - 2 * 3600_000).toISOString(), now)).toBe("Two hours ago");
    expect(ago(new Date(now.getTime() - 26 * 3600_000).toISOString(), now)).toBe("Yesterday");
    expect(ago(new Date(now.getTime() - 16 * 86400_000).toISOString(), now)).toBe("16 days ago");
    expect(until(new Date(now.getTime() + 2 * 86400_000).toISOString(), now)).toBe("In two days");
  });

  it("builds initials", () => {
    expect(initials("Bea Santos")).toBe("BS");
    expect(initials("  ")).toBe("?");
  });
});
