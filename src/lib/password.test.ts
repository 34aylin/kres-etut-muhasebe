import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("verifies a matching plain-text password against its hash", async () => {
    const hash = await hashPassword("Demo1234!");
    await expect(verifyPassword("Demo1234!", hash)).resolves.toBe(true);
  });

  it("rejects a non-matching password", async () => {
    const hash = await hashPassword("Demo1234!");
    await expect(verifyPassword("WrongPassword", hash)).resolves.toBe(false);
  });
});
