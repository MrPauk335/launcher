// Purchase funnel reporting is REMOVED in this build.
//
// Upstream sent `purchase_start` / `purchase_result` (product, price, outcome)
// to api.millida.net. Nothing is recorded now. The helper is kept because the
// shop, the premium screen and the paid catalog thread its result through the
// payment dialogs: deleting it would mean rewriting those flows for no gain.
// The returned function does nothing.
export type PurchaseReason = 'cancel' | 'insufficient' | 'error' | 'checkout' | 'signin'

export function purchaseFlow(
  _product: string,
  _id: string,
  _price?: number,
  _cur?: 'rubies' | 'shards' | 'kopecks',
): (ok: boolean, reason?: PurchaseReason, err?: unknown) => void {
  return () => {}
}
