/**
 * Toast deduplication — same error/notification একবারই দেখাবে, বারবার নয়।
 * Key-based cooldown: same key এর toast cooldown period এর মধ্যে আবার দেখাবে না।
 */

const shownToasts = new Map<string, number>();
const DEFAULT_COOLDOWN_MS = 30_000; // 30 seconds

/**
 * Check if a toast with this key should be shown.
 * Returns true if it should show (not shown recently), false if duplicate.
 */
export function shouldShowToast(key: string, cooldownMs = DEFAULT_COOLDOWN_MS): boolean {
  const now = Date.now();
  const lastShown = shownToasts.get(key);
  
  if (lastShown && now - lastShown < cooldownMs) {
    return false; // Still in cooldown — skip
  }
  
  shownToasts.set(key, now);
  return true;
}

/**
 * Clear a specific toast key (e.g., when user manually retries)
 */
export function clearToastKey(key: string) {
  shownToasts.delete(key);
}

/**
 * Clear all toast dedup state
 */
export function clearAllToastKeys() {
  shownToasts.clear();
}
