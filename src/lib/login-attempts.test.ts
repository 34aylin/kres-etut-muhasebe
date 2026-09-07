import { describe, expect, it } from "vitest";

import {
  isLockedOut,
  LOCKOUT_MINUTES,
  MAX_FAILED_ATTEMPTS,
  recordFailedAttempt,
  resetLoginAttempts,
} from "./login-attempts";

describe("isLockedOut", () => {
  it("is not locked when lockedUntil is null", () => {
    expect(isLockedOut(null)).toBe(false);
  });

  it("is locked when lockedUntil is in the future", () => {
    const now = new Date("2026-01-01T12:00:00Z");
    const lockedUntil = new Date("2026-01-01T12:05:00Z");
    expect(isLockedOut(lockedUntil, now)).toBe(true);
  });

  it("is not locked once lockedUntil has passed", () => {
    const now = new Date("2026-01-01T12:10:00Z");
    const lockedUntil = new Date("2026-01-01T12:05:00Z");
    expect(isLockedOut(lockedUntil, now)).toBe(false);
  });
});

describe("recordFailedAttempt", () => {
  const now = new Date("2026-01-01T12:00:00Z");

  it("increments the counter below the threshold without locking", () => {
    const result = recordFailedAttempt(0, now);
    expect(result).toEqual({ failedLoginAttempts: 1, lockedUntil: null });
  });

  it("locks the account once the threshold is reached", () => {
    const result = recordFailedAttempt(MAX_FAILED_ATTEMPTS - 1, now);
    expect(result.failedLoginAttempts).toBe(0);
    expect(result.lockedUntil).toEqual(
      new Date(now.getTime() + LOCKOUT_MINUTES * 60 * 1000),
    );
  });

  it("keeps locking (does not extend indefinitely from repeated calls with a high counter)", () => {
    const result = recordFailedAttempt(MAX_FAILED_ATTEMPTS + 10, now);
    expect(result.lockedUntil).not.toBeNull();
    expect(result.failedLoginAttempts).toBe(0);
  });
});

describe("resetLoginAttempts", () => {
  it("clears the counter and lock", () => {
    expect(resetLoginAttempts()).toEqual({
      failedLoginAttempts: 0,
      lockedUntil: null,
    });
  });
});
