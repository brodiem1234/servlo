import Stripe from "stripe";

/**
 * Shared Stripe client. Lazily-instantiated so a missing `STRIPE_SECRET_KEY`
 * doesn't crash the entire app at module load time (which previously brought
 * down the invoices page and any other module that statically imported this).
 *
 * Callers should still surround `stripe.*` calls with try/catch — this only
 * prevents the boot-time crash.
 */
let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured. Add it to your environment variables before using Stripe."
    );
  }
  _stripe = new Stripe(key, { apiVersion: "2025-02-24.acacia" });
  return _stripe;
}

// Proxy so existing `stripe.xxx` callsites keep working without changes.
// Each property access goes through the lazy initializer.
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    const real = getStripe();
    const value = Reflect.get(real, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});
