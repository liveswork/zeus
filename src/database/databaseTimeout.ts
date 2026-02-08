export function withTimeout<T>(
  promise: Promise<T>,
  ms = 8000
): Promise<T> {

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('DB_BOOT_TIMEOUT')), ms)
  );

  return Promise.race([promise, timeout]);
}
