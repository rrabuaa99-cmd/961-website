# +961 website

A complete static website for +961. It needs no server code or database: upload the folder to any static host and it works.

## What's inside

| File | Page |
| --- | --- |
| `index.html` | Home |
| `shop.html` | Shop |
| `hoodie.html` | +961 Hoodie (Black) |
| `t-shirt.html` | +961 T-Shirt (White) |
| `checkout.html` | Checkout |
| `about.html` | About |
| `size-guide.html` | Size Guide |
| `faq.html` | FAQ |
| `404.html` | Page not found |

- `assets/css/site.css` holds all styles.
- `assets/js/site.js` runs the cart, WhatsApp ordering, checkout and animations.
- `assets/js/content.js` holds your reviews and customer photos.
- `assets/img/` holds the product photos, link-preview images and icons.

## How orders reach you

Checkout happens on the site. Each order is emailed to rrabuaa99@gmail.com with its order number, items, total, payment method and the customer's name, phone, email and address. If the customer gave an email, pressing Reply in your inbox answers them directly.

| Payment | What the customer sees |
| --- | --- |
| Cash on delivery | Place order, then a thank-you screen telling them you will call to arrange delivery. |
| Debit or credit card | Continue to payment opens Stripe's secure card form inside the checkout. They pay with Visa or Mastercard, and your email says PAID with the Stripe session number. |
| Outside Lebanon | Place order with nothing charged. You contact them with the shipping cost and how to pay. |

WhatsApp is a second option: a "Prefer WhatsApp?" link under the main button sends the same order as a WhatsApp message. The product pages and the bag also keep their "Order on WhatsApp" buttons.

## Switching on email orders and card payments

Both settings are at the top of `assets/js/site.js`, inside `CONFIG`.

**1. Orders by email (already set up)**

Every order is emailed to **rrabuaa99@gmail.com** through FormSubmit (formsubmit.co, free). Each email lists the order number, order summary, subtotal, delivery fee, total, full name, phone number, email, delivery (Lebanon or the country abroad), city or area, full address, order notes and payment.

One-time step: the very first order sends rrabuaa99@gmail.com an email from FormSubmit with an "Activate Form" button. Click it once, then place a second test order. Every order after that arrives in your inbox. Check your spam folder if you don't see it.

To hide the address from the website code: the activation email from FormSubmit also gives you a random string. Replace `orderEmail: 'rrabuaa99@gmail.com'` in `assets/js/site.js` with that string. Orders still arrive at the same inbox.

To use another inbox, change `orderEmail` and activate it the same way.

**2. Card payments (Stripe: Visa and Mastercard)**

Card payments need a small piece of server code, `netlify/functions/create-checkout.mjs`, because the Stripe secret key must never be in the website files. It runs on Netlify for free.

You need:
- A Stripe account. Stripe only accepts businesses registered in its supported countries, and I couldn't find Lebanon on that list. Check stripe.com/global. If Lebanon isn't there, the account has to belong to a business registered in a supported country, such as the UAE.
- The site hosted on Netlify, deployed from GitHub or with the Netlify command line. Netlify's drag-and-drop upload does not run server code, so card payments would not work with it.

Steps:
1. In Stripe, open Developers > API keys.
2. Copy the **Publishable key** (`pk_live_...`) and paste it into `assets/js/site.js`: `stripePublishableKey: 'pk_live_...',`. This key is public by design.
3. Copy the **Secret key** (`sk_live_...`). In Netlify, open Site configuration > Environment variables, add `STRIPE_SECRET_KEY` and paste it there. Never put this key in the website files and never send it to anyone.
4. Deploy. From this folder, the command line is: `npx netlify-cli deploy --prod`.
5. Test first with Stripe's test keys (`pk_test_...` and `sk_test_...`) and the test card 4242 4242 4242 4242, any future date and any 3 digits. Then switch to the live keys.
6. Optional: in Stripe, Settings > Branding, set black and white with square corners so the card form matches the site. Also turn on email notifications for successful payments, so Stripe tells you about each one too.

Until the publishable key is set, the card option is hidden at checkout.

Prices for card payments are set in `netlify/functions/lib/catalog.mjs`, so a visitor can't change what they pay. If you change a price or the delivery fee, change it there and in `assets/js/site.js`.

## Placeholder text to review

You didn't give me some business details, so the site uses realistic placeholder text for them. Open any page with `?placeholders` at the end of the address (for example `shop.html?placeholders`) to see each one outlined. In the code they carry a `data-placeholder` attribute.

| What | Where |
| --- | --- |
| Delivery fee: $4 in Lebanon | `assets/js/site.js` (`deliveryLebanon`) and `netlify/functions/lib/catalog.mjs` (`DELIVERY_LEBANON_CENTS`), plus the text on Shop, product pages, FAQ and Checkout |
| Delivery time: 2 to 4 working days | Shop, product pages (Delivery), FAQ |
| Exchange policy: 7 days, unworn, $4 exchange fee, 48 hours for damaged items | Product pages (Exchanges), Shop, FAQ |
| Size measurements | Size Guide page and the size guide pop-up (the `MEASURE` table) |
| Fabric and care lines | Product pages (Details) |
| "Relaxed fit. Take your usual size." | Product pages, Size Guide |
| Order changes, paying in Lebanese pounds, international shipping, gift orders | FAQ |

## Adding real reviews and customer photos

The home page has a reviews section and a customer photo section. Both stay hidden until you add real content to `assets/js/content.js`. Instructions are inside that file. Nothing invented is ever shown.

## Publishing

1. Host the folder on Netlify, deployed from GitHub or with `npx netlify-cli deploy --prod`. Card payments need Netlify. Every other part of the site works on any static host.
2. Connect your domain.
3. Once the site is live, make the link previews work everywhere: in each HTML file, change the `og:image` path from `assets/img/og-home.jpg` to the full address, for example `https://yourdomain.com/assets/img/og-home.jpg`. WhatsApp and Instagram need the full address to show the preview image.

Page changes animate smoothly when the site runs on a real host. If you open the files straight from your computer, links still work but load as normal pages.

## Libraries

- GSAP 3.12.5 with ScrollTrigger (animations) and Lenis 1.1.13 (smooth scrolling), loaded from public CDNs.
- Fonts: EB Garamond and Inter from Google Fonts.

If a library fails to load, the site still works with all content visible. Visitors who turn on "reduce motion" on their device get the site without animations.
