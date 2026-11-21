// +961: starts a card payment (Visa, Mastercard) with Stripe for the customer's bag.
// This runs on Netlify as a serverless function at /api/create-checkout.
//
// Your Stripe SECRET key is never in the website files. Add it in Netlify:
//   Site configuration > Environment variables > STRIPE_SECRET_KEY = sk_live_...
//
// Prices come from lib/catalog.mjs, on the server, so a visitor cannot change what they pay.

import { cleanItems, PRODUCTS, DELIVERY_LEBANON_CENTS, clean, json } from './lib/catalog.mjs';

const STRIPE_API_VERSION = '2026-11-18.endive';

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return json({ error: 'Card payments are not set up yet.' }, 503);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }

  const items = cleanItems(body.items);
  if (!items.length) return json({ error: 'Your bag is empty.' }, 400);

  const order = body.order || {};
  const ref = clean(order.ref, 40) || 'web';
  const params = new URLSearchParams();
  params.append('mode', 'payment');
  params.append('ui_mode', 'embedded_page');
  params.append('redirect_on_completion', 'never');
  params.append('allowed_payment_method_types[]', 'card');
  params.append('client_reference_id', ref);

  items.forEach((item, n) => {
    const p = PRODUCTS[item.id];
    params.append(`line_items[${n}][quantity]`, String(item.qty));
    params.append(`line_items[${n}][price_data][currency]`, 'usd');
    params.append(`line_items[${n}][price_data][unit_amount]`, String(p.cents));
    params.append(`line_items[${n}][price_data][product_data][name]`, `${p.name} (${p.colour}, ${item.size})`);
  });
  const d = items.length;
  params.append(`line_items[${d}][quantity]`, '1');
  params.append(`line_items[${d}][price_data][currency]`, 'usd');
  params.append(`line_items[${d}][price_data][unit_amount]`, String(DELIVERY_LEBANON_CENTS));
  params.append(`line_items[${d}][price_data][product_data][name]`, 'Delivery in Lebanon');

  const email = clean(order.email, 200);
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) params.append('customer_email', email);

  // Order details appear on the payment in your Stripe dashboard.
  const meta = {
    order: ref,
    name: clean(order.name, 200),
    phone: clean(order.phone, 60),
    city: clean(order.city, 200),
    address: clean(order.address),
    notes: clean(order.notes)
  };
  for (const [key, value] of Object.entries(meta)) {
    if (!value) continue;
    params.append(`metadata[${key}]`, value);
    params.append(`payment_intent_data[metadata][${key}]`, value);
  }
  params.append('payment_intent_data[description]', `+961 order ${ref}`);

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Stripe-Version': STRIPE_API_VERSION
    },
    body: params
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.client_secret) {
    console.error('Stripe error', res.status, data.error && data.error.message);
    return json({ error: 'Card payment could not start.' }, 502);
  }
  return json({ id: data.id, clientSecret: data.client_secret });
};

export const config = { path: '/api/create-checkout' };
