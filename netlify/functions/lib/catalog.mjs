// +961 prices, used by the payment functions so a visitor can never change what they pay.
// If you change a price or the delivery fee, change it here and in assets/js/site.js.

export const PRODUCTS = {
  hoodie: { name: '+961 Hoodie', colour: 'Black', cents: 1900 },
  tshirt: { name: '+961 T-Shirt', colour: 'White', cents: 1300 }
};
export const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
export const DELIVERY_LEBANON_CENTS = 400; // PLACEHOLDER: keep equal to deliveryLebanon in assets/js/site.js

export function cleanItems(raw) {
  return (Array.isArray(raw) ? raw : [])
    .slice(0, 20)
    .filter((i) => i && PRODUCTS[i.id] && SIZES.includes(i.size))
    .map((i) => ({ id: i.id, size: i.size, qty: Math.min(99, Math.max(1, parseInt(i.qty, 10) || 1)) }));
}

export function itemsCents(items) {
  return items.reduce((sum, i) => sum + PRODUCTS[i.id].cents * i.qty, 0);
}

export const clean = (value, max = 450) => String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
