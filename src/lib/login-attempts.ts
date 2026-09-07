export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_MINUTES = 15;

/** Hesap şu anda kilitli mi (henüz kilit süresi dolmamış mı)? */
export function isLockedOut(
  lockedUntil: Date | null,
  now: Date = new Date(),
): boolean {
  return lockedUntil !== null && lockedUntil.getTime() > now.getTime();
}

/**
 * Başarısız bir giriş denemesinden sonra hesabın yeni durumunu hesaplar.
 * `MAX_FAILED_ATTEMPTS`'e ulaşıldığında hesap `LOCKOUT_MINUTES` dakika
 * kilitlenir ve sayaç sıfırlanır.
 */
export function recordFailedAttempt(
  currentAttempts: number,
  now: Date = new Date(),
): { failedLoginAttempts: number; lockedUntil: Date | null } {
  const attempts = currentAttempts + 1;
  if (attempts >= MAX_FAILED_ATTEMPTS) {
    return {
      failedLoginAttempts: 0,
      lockedUntil: new Date(now.getTime() + LOCKOUT_MINUTES * 60 * 1000),
    };
  }
  return { failedLoginAttempts: attempts, lockedUntil: null };
}

/** Başarılı bir girişten sonra sayaç ve kilit sıfırlanır. */
export function resetLoginAttempts() {
  return { failedLoginAttempts: 0, lockedUntil: null };
}
