# Getting Card + InstaPay payments actually working

## Why "Card" and "InstaPay" didn't work before

Before this update, choosing **Card** or **InstaPay** at checkout just saved whatever
text you typed as part of the order — nothing was ever actually charged. There was
no connection to a real bank or payment network, so no money ever moved, no matter
what the customer entered.

To *really* accept card and InstaPay payments in Egypt you need a merchant account
with a **payment gateway**. This project is now wired up for **Paymob**, the most
widely used gateway for Egyptian e-commerce — it supports Visa/Mastercard, and
mobile wallets including InstaPay, Vodafone Cash, Orange Money, and Etisalat Cash,
all through one account.

The code is ready. It just needs your Paymob credentials plugged in as environment
variables — nothing to charge you until you sign up. Once the keys are set, real
payments will work immediately with no further code changes.

---

## Step 1 — Create a Paymob merchant account

1. Go to **https://paymob.com** and click **Sign Up** (or **Register**).
2. Choose Egypt as your country and complete the merchant application. You'll need:
   - A registered business name (or your own name if operating as a sole trader)
   - A bank account in Egypt to receive payouts
   - A national ID / commercial registration, depending on your business type
3. Paymob will review and activate your account — this can take a few business
   days. You'll get **test/sandbox** access immediately, and **live** access once
   approved.

## Step 2 — Create your integrations

Inside the Paymob dashboard:

1. Go to **Developers → Payment Integrations**.
2. Create an integration for **"Online Card"** (this is your Visa/Mastercard
   integration). Note its **Integration ID**.
3. Create a second integration for **"Mobile Wallet"** — this is what covers
   InstaPay and wallet payments. Note its **Integration ID** as well.
   - If you don't see InstaPay listed as an option, contact Paymob support (via
     the dashboard chat) and ask them to enable **InstaPay** on your account —
     they'll usually attach it to the same wallet integration.
4. Go to **Developers → Payment Integrations → Iframes**, create an iframe linked
   to your **card** integration, and note the **Iframe ID**.

## Step 3 — Get your API key and HMAC secret

1. Go to **Settings → Account Info** and copy your **API Key**.
2. Go to **Settings → Payment Integrations** (or **Developers → HMAC**) and copy
   your **HMAC Secret**. This is used to verify that payment confirmations really
   come from Paymob and haven't been forged.

## Step 4 — Set the environment variables

Add these to your `.env` file for local development, and to your hosting
provider's environment variable settings (e.g. **Vercel → Project → Settings →
Environment Variables**) for production:

```
PAYMOB_API_KEY=your_api_key_here
PAYMOB_CARD_INTEGRATION_ID=your_card_integration_id
PAYMOB_WALLET_INTEGRATION_ID=your_wallet_integration_id
PAYMOB_IFRAME_ID=your_iframe_id
PAYMOB_HMAC_SECRET=your_hmac_secret
```

Restart your dev server (or redeploy) after setting these.

## Step 5 — Point Paymob's webhook at your site

Payments are confirmed **server-to-server** by Paymob calling your site once a
transaction finishes — this is what actually marks an order "paid" (never trust
the browser redirect alone, since it can be closed or tampered with).

1. In the Paymob dashboard, go to **Developers → Payment Callbacks**.
2. Set the **Transaction Processed Callback** (sometimes called the "Webhook" URL) to:
   ```
   https://YOUR-DOMAIN.com/api/payments/webhook
   ```
3. Set the **Transaction Response Callback** (the page the shopper is redirected
   back to after paying) to:
   ```
   https://YOUR-DOMAIN.com/payment.html
   ```

## Step 6 — Test in sandbox before going live

Paymob gives you sandbox test cards (visible in their dashboard docs, typically
something like `4987654321098769` with any future expiry/CVC) so you can place a
full test order without moving real money. Do this before flipping to live keys:

1. Place a test order on your site choosing **Card**.
2. Confirm you're redirected to Paymob's hosted card page.
3. Pay with a sandbox test card.
4. Confirm you're redirected back, and check `/admin` → Orders to see the order
   status flip to **paid**.
5. Repeat for **InstaPay** using a sandbox wallet number.

Once that works, ask Paymob to switch your account to **live mode** and update
the environment variables to your live keys (Paymob usually issues separate
sandbox and live API keys/integration IDs — double-check which set you're using).

## How it works, in short

- Customer picks **Card** or **InstaPay** and places the order — this reserves the
  order in your system with status `pending_payment`.
- Your site asks Paymob for a secure payment link and sends the customer there.
  Card numbers are typed on **Paymob's** page, never on yours — this keeps you out
  of PCI-DSS scope, which you'd otherwise need for handling raw card numbers.
- Once Paymob finishes processing the payment, it calls your `/api/payments/webhook`
  with a signed confirmation. Your site verifies the signature and marks the order
  **paid**.
- **Cash on Delivery** is unaffected — no gateway is involved for COD orders.

## If something's not working

- **"Online payment is temporarily unavailable"** — one or more `PAYMOB_*` env
  vars are missing. Double check Step 4.
- **Payment page loads but rejects the order** — check the integration IDs match
  the right mode (sandbox vs live), and that they're linked to your API key's
  account.
- **Order never flips to "paid" after a successful payment** — check the webhook
  URL in Step 5 is correct and publicly reachable (not `localhost` — Paymob can't
  reach your local machine, so webhook testing needs a deployed or tunnelled URL,
  e.g. via `ngrok`, during development).
