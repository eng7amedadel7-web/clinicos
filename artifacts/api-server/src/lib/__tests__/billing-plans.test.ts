import { describe, expect, it } from "vitest";
import { planFromPrice, priceCatalog } from "../billing-plans";

describe("planFromPrice", () => {
  it("resolves a known price id to its plan and interval", () => {
    expect(planFromPrice(priceCatalog.growth.year)).toEqual({ plan: "growth", interval: "year" });
    expect(planFromPrice(priceCatalog.starter.month)).toEqual({ plan: "starter", interval: "month" });
  });

  it("fails closed (null) for an unrecognized price id", () => {
    expect(planFromPrice("pri_unknown")).toBeNull();
    expect(planFromPrice(undefined)).toBeNull();
    expect(planFromPrice("")).toBeNull();
  });

  it("covers every plan/interval combination in the catalog", () => {
    for (const plan of ["starter", "growth", "pro"] as const) {
      for (const interval of ["month", "year"] as const) {
        expect(planFromPrice(priceCatalog[plan][interval])).toEqual({ plan, interval });
      }
    }
  });
});
