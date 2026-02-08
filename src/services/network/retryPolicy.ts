// src/services/network/retryPolicy.ts

export function exponentialBackoff(
  attempt: number,
  baseDelay = 1000,
  maxDelay = 30000
) {
  const delay = Math.min(baseDelay * 2 ** attempt, maxDelay);
  const jitter = Math.random() * 300;
  return delay + jitter;
}