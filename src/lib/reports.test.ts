import { describe, expect, it } from "vitest";

import { groupTransactionsByMonth, summarizeByCategory } from "./reports";

describe("groupTransactionsByMonth", () => {
  const ref = new Date(Date.UTC(2026, 8, 15)); // 2026-09-15

  it("returns one bucket per month, most recent last, even with no data", () => {
    const points = groupTransactionsByMonth([], 3, ref);
    expect(points.map((p) => p.month)).toEqual([
      "2026-07",
      "2026-08",
      "2026-09",
    ]);
    expect(points.every((p) => p.income === 0 && p.expense === 0)).toBe(true);
  });

  it("buckets income and expense into the correct month", () => {
    const points = groupTransactionsByMonth(
      [
        {
          date: new Date(Date.UTC(2026, 7, 5)),
          type: "INCOME",
          amount: 500,
          categoryId: null,
        },
        {
          date: new Date(Date.UTC(2026, 7, 20)),
          type: "EXPENSE",
          amount: 200,
          categoryId: null,
        },
        {
          date: new Date(Date.UTC(2026, 8, 1)),
          type: "INCOME",
          amount: 300,
          categoryId: null,
        },
      ],
      3,
      ref,
    );
    const aug = points.find((p) => p.month === "2026-08")!;
    const sep = points.find((p) => p.month === "2026-09")!;
    expect(aug).toMatchObject({ income: 500, expense: 200 });
    expect(sep).toMatchObject({ income: 300, expense: 0 });
  });

  it("ignores transactions outside the requested window", () => {
    const points = groupTransactionsByMonth(
      [
        {
          date: new Date(Date.UTC(2025, 0, 1)),
          type: "INCOME",
          amount: 999,
          categoryId: null,
        },
      ],
      3,
      ref,
    );
    const total = points.reduce((sum, p) => sum + p.income, 0);
    expect(total).toBe(0);
  });
});

describe("summarizeByCategory", () => {
  const names = new Map([
    ["cat-aidat", "Aidat Geliri"],
    ["cat-kira", "Kira Gideri"],
  ]);

  it("sums per category and sorts descending", () => {
    const result = summarizeByCategory(
      [
        {
          date: new Date(),
          type: "INCOME",
          amount: 300,
          categoryId: "cat-aidat",
        },
        {
          date: new Date(),
          type: "INCOME",
          amount: 200,
          categoryId: "cat-aidat",
        },
        {
          date: new Date(),
          type: "EXPENSE",
          amount: 800,
          categoryId: "cat-kira",
        },
      ],
      names,
    );
    expect(result).toEqual([
      { categoryId: "cat-kira", name: "Kira Gideri", total: 800 },
      { categoryId: "cat-aidat", name: "Aidat Geliri", total: 500 },
    ]);
  });

  it("groups uncategorized transactions under 'Kategorisiz'", () => {
    const result = summarizeByCategory(
      [{ date: new Date(), type: "EXPENSE", amount: 100, categoryId: null }],
      names,
    );
    expect(result).toEqual([
      { categoryId: null, name: "Kategorisiz", total: 100 },
    ]);
  });

  it("falls back to a placeholder name for an unknown category id", () => {
    const result = summarizeByCategory(
      [
        {
          date: new Date(),
          type: "INCOME",
          amount: 50,
          categoryId: "cat-missing",
        },
      ],
      names,
    );
    expect(result[0].name).toBe("Bilinmeyen Kategori");
  });
});
