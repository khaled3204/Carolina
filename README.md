# Carolina — premium socks shop

Static storefront with a working payment page and a full admin panel.

## Pages

| Path | Purpose |
|------|---------|
| `/` | Home |
| `/collections.html` | Product grid (live catalog) |
| `/product.html` | Product detail |
| `/cart.html` | Cart |
| `/checkout.html` | Shipping details |
| `/payment.html` | Payment (COD / Card / InstaPay) |
| `/admin` | Admin panel |

## Run locally

```bash
npm install
npm start
```

Open:

- Shop: http://localhost:3000
- Admin: http://localhost:3000/admin

**Default admin login**

- Username: `carolina`
- Password: `carolina123123`
- Recovery email: `shop.carolina.eg@gmail.com`

## Admin features

- Add / edit / delete socks (name, price, colors, sizes, stock, photos, description)
- Upload product pictures from your computer (stored in Vercel Blob when configured)
- Create / enable / disable / delete sales (percentage discounts)
- View and remove customer orders
- Change username, password, and recovery email
- Forgot password → reset link emailed to `shop.carolina.eg@gmail.com`

## Deploy on Vercel

1. Push this repo and import it in Vercel.
2. Set environment variables:

| Variable | Value |
|----------|--------|
| `SESSION_SECRET` | Long random string |
| `SITE_URL` | Your live URL, e.g. `https://carolina.vercel.app` |
| `GMAIL_USER` | `shop.carolina.eg@gmail.com` |
| `GMAIL_APP_PASSWORD` | Gmail [App Password](https://myaccount.google.com/apppasswords) |
| `BLOB_READ_WRITE_TOKEN` | (Recommended) Vercel Blob token so products/sales persist across deploys |

3. Deploy. Visit `/admin` on your domain.

### Gmail app password

1. Sign in to Google as `shop.carolina.eg@gmail.com`
2. Enable 2-Step Verification
3. Create an App Password named “Carolina Admin”
4. Paste it into `GMAIL_APP_PASSWORD` on Vercel

Without `GMAIL_APP_PASSWORD`, forgot-password still works in development and can return a reset link in the API response when `EXPOSE_RESET_LINK=1`.

### Durable storage

Locally, data is saved to `data/db.json`.

On Vercel the filesystem is ephemeral — create a **Blob** store in the Vercel dashboard and add `BLOB_READ_WRITE_TOKEN` so catalog, sales, orders, uploaded photos, and credential changes persist.

## Notes

- Cart data stays in the browser (`localStorage`).
- Checkout details are held in `sessionStorage` until payment completes.
- WhatsApp float: `https://wa.me/902245557842`
