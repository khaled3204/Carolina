# Payment Setup Guide — Kashier

Cash on Delivery works out of the box, no setup needed. Card payment needs
a **payment gateway**. This project is wired up for **Kashier**, a widely
used Egyptian payment gateway that accepts Visa/Mastercard.

The code is ready. It just needs your Kashier credentials plugged in as
environment variables — no coding needed on your end.

---

## Step 1 — Create a Kashier merchant account

1. Go to **https://merchant.kashier.io/signup** and sign up.
2. Fill in your business details (Carolina Socks Factory, Egypt).
3. Kashier will review and activate your account — this can take a few
   business days. You can start testing immediately in **test mode** while
   you wait.

## Step 2 — Get your API credentials

Inside the Kashier dashboard:

1. Go to **Integrations** (sometimes labelled "Integrate now").
2. Click **Generate** for the **Hosted Payment Page** service (this is the
   integration method this project uses — the shopper is redirected to a
   Kashier-hosted page to enter card details, so raw card numbers never
   touch your own server).
3. Copy your **Merchant ID** (looks like `MID-XXXX-XXXX`).
4. Copy your **Payment API Key** — this is used both to sign payment
   requests and to verify webhook notifications. Keep it secret.
5. You'll have separate **Test** and **Live** credentials — use Test while
   you're trying things out, then switch to Live when you're ready to
   accept real payments.

## Step 3 — Add the environment variables

Add these to your `.env` file locally, and to your **Vercel project
settings → Environment Variables** for production:

```
KASHIER_MERCHANT_ID=MID-XXXX-XXXX
KASHIER_API_KEY=your_payment_api_key
KASHIER_MODE=test
```

Set `KASHIER_MODE=live` only once you've tested everything and switched to
your live credentials.

## Step 4 — Point Kashier's webhook at your site

Payments are confirmed **server-to-server** by Kashier calling your site
once a payment finishes — this is what actually marks an order "paid" in
your admin panel, so don't skip this step.

1. In the Kashier dashboard, go to your API key's settings and find the
   **Webhook URL** field.
2. Set it to:
   ```
   https://YOUR-DOMAIN/api/payments/webhook
   ```
   (replace `YOUR-DOMAIN` with your real site domain, e.g.
   `carolinasocks.com` or your `.vercel.app` domain)
3. Save.

## Step 5 — Test it

1. Place a test order on your site using **Card** as the payment method.
2. Confirm you're redirected to Kashier's hosted payment page.
3. Use one of Kashier's test cards to complete a payment
   (e.g. Visa `4508750015741019`, any future expiry, CVV `100`).
4. Confirm you're redirected back to your site and the order shows as
   **paid** in the admin panel (this confirms the webhook is working).

Once that works, switch `KASHIER_MODE` to `live` and swap in your live
Merchant ID / API Key.

---

## How it works (for your reference)

- Your site builds a signed link to Kashier's hosted payment page and sends
  the customer there. Card numbers are typed on **Kashier's** page, never on
  yours — this keeps you out of PCI-compliance scope.
- Once Kashier finishes processing the payment, it calls your
  `/api/payments/webhook` endpoint to tell you whether it succeeded. Your
  site verifies this call is genuinely from Kashier (using a cryptographic
  signature) before marking the order paid.
- The customer is also redirected back to `payment.html` on your site after
  paying, where they see a thank-you or failure message.

## Troubleshooting

- **"Card payment is not set up yet"** — one or more `KASHIER_*` env
  variables are missing. Double check Step 3.
- **Order stays "pending_payment" after a successful card payment** — the
  webhook isn't reaching your site. Check that the webhook URL in Step 4 is
  correct and publicly reachable (not `localhost` — Kashier can't call
  your laptop).
- **"Invalid signature" in your server logs** — your `KASHIER_API_KEY` env
  variable doesn't match the Payment API Key shown in the Kashier
  dashboard, or you're mixing test and live keys.
