import { describe, expect, it } from "vitest";

import { canManageRecords } from "./roles";

describe("canManageRecords", () => {
  it("allows ADMIN to manage records", () => {
    expect(canManageRecords("ADMIN")).toBe(true);
  });

  it("allows ACCOUNTANT to manage records", () => {
    expect(canManageRecords("ACCOUNTANT")).toBe(true);
  });

  it("does not allow TEACHER to manage records (read-only role)", () => {
    expect(canManageRecords("TEACHER")).toBe(false);
  });
});
