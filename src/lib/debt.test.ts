import { describe, expect, it } from "vitest";

import {
  computeChargeSummary,
  computeParentDebtSummary,
  sumPayments,
} from "./debt";

describe("sumPayments", () => {
  it("sums only INCOME-type payments", () => {
    const total = sumPayments([
      { amount: 100, type: "INCOME" },
      { amount: 50, type: "INCOME" },
      { amount: 30, type: "EXPENSE" },
    ]);
    expect(total).toBe(150);
  });

  it("returns 0 for an empty list", () => {
    expect(sumPayments([])).toBe(0);
  });
});

describe("computeChargeSummary", () => {
  it("is PENDING when there are no payments", () => {
    const summary = computeChargeSummary({ amount: 500, payments: [] });
    expect(summary).toEqual({
      amount: 500,
      paid: 0,
      remaining: 500,
      status: "PENDING",
    });
  });

  it("is PARTIAL when some but not all of the amount is paid", () => {
    const summary = computeChargeSummary({
      amount: 500,
      payments: [{ amount: 200, type: "INCOME" }],
    });
    expect(summary).toEqual({
      amount: 500,
      paid: 200,
      remaining: 300,
      status: "PARTIAL",
    });
  });

  it("is PAID once payments cover the full amount", () => {
    const summary = computeChargeSummary({
      amount: 500,
      payments: [
        { amount: 200, type: "INCOME" },
        { amount: 300, type: "INCOME" },
      ],
    });
    expect(summary).toEqual({
      amount: 500,
      paid: 500,
      remaining: 0,
      status: "PAID",
    });
  });

  it("stays PAID (not negative-remaining-as-owed) on overpayment", () => {
    const summary = computeChargeSummary({
      amount: 500,
      payments: [{ amount: 600, type: "INCOME" }],
    });
    expect(summary.status).toBe("PAID");
    expect(summary.remaining).toBe(-100);
  });

  it("ignores EXPENSE-type transactions even if linked to the charge", () => {
    // Regresyon testi: bir tahsilat kaydı /transactions üzerinden yanlışlıkla
    // GİDER'e çevrilirse borç "ödenmemiş" görünmeli, "ödenmiş" değil.
    const summary = computeChargeSummary({
      amount: 500,
      payments: [{ amount: 500, type: "EXPENSE" }],
    });
    expect(summary).toEqual({
      amount: 500,
      paid: 0,
      remaining: 500,
      status: "PENDING",
    });
  });
});

describe("computeParentDebtSummary", () => {
  it("aggregates totals across multiple charges consistently", () => {
    const summary = computeParentDebtSummary([
      { amount: 500, payments: [{ amount: 500, type: "INCOME" }] }, // ödendi
      { amount: 500, payments: [{ amount: 200, type: "INCOME" }] }, // kısmi
      { amount: 500, payments: [] }, // bekliyor
    ]);

    expect(summary.totalCharged).toBe(1500);
    expect(summary.totalPaid).toBe(700);
    expect(summary.remainingDebt).toBe(800);
    // totalCharged - totalPaid === remainingDebt her zaman doğru olmalı
    // (ekrandaki üç kartın birbiriyle çelişmemesini garanti eden invariant).
    expect(summary.totalCharged - summary.totalPaid).toBe(
      summary.remainingDebt,
    );
  });

  it("returns all zeros when there are no charges", () => {
    expect(computeParentDebtSummary([])).toEqual({
      totalCharged: 0,
      totalPaid: 0,
      remainingDebt: 0,
    });
  });
});
