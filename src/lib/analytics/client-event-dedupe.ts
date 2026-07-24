export const BEGIN_CHECKOUT_EVENT_KEY = "tc_analytics_begin_checkout";
const PURCHASE_EVENT_PREFIX = "tc_analytics_purchase:";

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function claimClientEvent(
  storage: StorageLike,
  key: string,
  fingerprint: string,
): boolean {
  try {
    if (storage.getItem(key) === fingerprint) return false;
    storage.setItem(key, fingerprint);
    return true;
  } catch {
    // Analytics must never break the revenue path when browser storage is
    // blocked. The server-side revenue outbox remains authoritative.
    return true;
  }
}

export function checkoutEventFingerprint(
  items: Array<{
    id: string;
    product_slug: string;
    qty: number;
    sell_price: number;
  }>,
): string {
  return JSON.stringify(
    items.map(({ id, product_slug, qty, sell_price }) => ({
      id,
      product_slug,
      qty,
      sell_price,
    })),
  );
}

export function purchaseEventStorageKey(orderNumber: string): string {
  return `${PURCHASE_EVENT_PREFIX}${orderNumber}`;
}
