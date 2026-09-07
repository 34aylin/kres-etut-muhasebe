import { describe, expect, it } from "vitest";

import { toCsv } from "./csv";

describe("toCsv", () => {
  it("returns an empty string for no rows", () => {
    expect(toCsv([])).toBe("");
  });

  it("writes a header row followed by data rows", () => {
    const csv = toCsv([
      { ad: "Ayşe", tutar: 500 },
      { ad: "Ali", tutar: 300 },
    ]);
    const lines = csv.replace(/^﻿/, "").split("\r\n");
    expect(lines).toEqual(["ad,tutar", "Ayşe,500", "Ali,300"]);
  });

  it("quotes fields containing commas, quotes, or newlines", () => {
    const csv = toCsv([{ aciklama: 'Kira, "Eylül" ödemesi\ndevamı' }]);
    const lines = csv.replace(/^﻿/, "").split("\r\n");
    expect(lines[1]).toBe('"Kira, ""Eylül"" ödemesi\ndevamı"');
  });

  it("prefixes the output with a UTF-8 BOM for Excel compatibility", () => {
    const csv = toCsv([{ a: 1 }]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });
});
