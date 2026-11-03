# RK FASHIONS

Premium Indian designer clothing e-commerce website for **RK FASHIONS**, founded by designer **Rohit Kumar**.
*Elegance, Designed Around You.*

- **Ready-to-wear** shop: women's and men's catalogue, collections, search, filters, product pages, wishlist, bag
- **The Bespoke Studio**: 6-step custom design enquiry with inspiration uploads and measurements → reference number, designer quotes later
- **Appointments**: live slot availability, double-booking protection, reference IDs
- **Customer accounts**: register / sign in (httpOnly cookie sessions, bcrypt passwords), profile & saved address, password change and email reset, wishlist and bag synced to the account
- **Checkout & orders**: server-side price and stock checks, Razorpay online payment (signature-verified) and optional cash on delivery, order history, order progress timeline, public order tracking by order number + email
- **Admin dashboard** (`/admin`): sales reports and CSV export, orders and courier tracking, products, images and inventory, categories and collections, bespoke enquiries and quotations, appointments and studio hours, customers and newsletter subscribers, homepage banners, testimonials, contact details, policy pages and the designer page
- **SEO**: per-page titles, descriptions, canonical URLs and share previews; Google product rich results (JSON-LD); product links show the garment's own title and photo on WhatsApp/Facebook; `sitemap.xml` and `robots.txt`

## Stack

| Part | Tech |
|---|---|
| Frontend | React 19 + Vite, Tailwind CSS v4, Motion (Framer Motion), React Router |
| Backend | Node.js, Express 5 |
| Database | MongoDB (Mongoose) |
| Images | Cloudinary (optional — falls back to `server/uploads/`) |
| Email | Nodemailer over any SMTP provider (optional) |
| Auth | JWT in httpOnly cookie, bcryptjs, `customer` / `admin` roles |
| Payments | Razorpay Checkout (+ optional cash on delivery) |

```
client/   React storefront + admin dashboard (src/admin)
          src/data/site.js = default content; admin edits are saved as overrides in MongoDB
server/   Express API (src/routes, src/models, src/data/products.js = seed catalogue, test/)
```

## Run locally

Requires Node 20+ and MongoDB running locally (`brew services start mongodb-community`).

```bash
npm run install:all
cp server/.env.example server/.env   # then set JWT_SECRET and ADMIN_TOKEN
npm run dev                          # API on :5050, site on http://localhost:5173
```

The catalogue is seeded automatically on first start; re-run with `npm run seed`.

### Admin dashboard

Create the first admin account (or promote an existing customer):

```bash
npm run create-admin -- owner@rkfashions.in "Rohit Kumar"
```

You'll be asked for a password (at least 10 characters). Sign in at `/account/login`, then open `/admin`.

| Section | What the studio can do |
|---|---|
| Dashboard | Revenue, orders, average order value, revenue chart (7/30/90/365 days), best sellers, orders by status, women/men revenue split, low stock, to-do counts, **Orders CSV** export |
| Orders | Search/filter, view address and items, move through Placed → In atelier → Shipped → Delivered (or cancel), add a note and courier tracking number — customers see it on their order page and Track Your Order |
| Products & Inventory | Search and filter, inline price and stock edits, publish/hide, full editor (images with upload/reorder, sizes, colours, collections, occasions, labels), delete (products that were ordered are hidden instead, so order history stays intact) |
| Categories & Collections | Rename, reorder, add and remove menu categories (garment or occasion type) and collections (title, subtitle, banner image) |
| Bespoke Enquiries | Full brief, measurements and inspiration images, status, quotation amount and notes |
| Appointments | Accept, decline, reschedule, complete or cancel; edit appointment times, weekly closed days, holidays and the booking window |
| Customers & Newsletter | Accounts with order count, total spent and last order; newsletter subscribers with CSV export |
| Homepage & Content | Announcement bar, hero text and images, shop-by-gender images, signature collections, bespoke and appointment banners, testimonials, Instagram gallery, contact details and social links, policy pages (shipping, returns, privacy, terms…), designer portrait, introduction and brand journey |

Admin APIs also accept `Authorization: Bearer <ADMIN_TOKEN>` for scripts and integrations.

## Tests

```bash
npm test
```

Runs 14 API integration tests against a throwaway `rk-fashions-test` database (needs MongoDB running): accounts, double-booking protection, server-side pricing, stock checks, order tracking privacy, admin access control, product CRUD, studio hours and content, signed Razorpay webhooks (including forged and repeated deliveries), unpaid-order cleanup and the newsletter. GitHub Actions runs the same tests and a client build on every push (`.github/workflows/ci.yml`).

## Deploy (Render + MongoDB Atlas)

In production the API also serves the built storefront, so the whole site is one web service.

1. **Database** — create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas), add a database user, allow access from anywhere (`0.0.0.0/0`) or Render's IPs, and copy the connection string.
2. **Web service** — on [Render](https://render.com) choose *New → Blueprint* and select this repository; `render.yaml` sets up the build, start command and health check, and generates `JWT_SECRET` and `ADMIN_TOKEN`.
3. **Environment** — fill in `MONGODB_URI`, `CLIENT_URL` (your site address, e.g. `https://rkfashions.in`) and, when ready, the SMTP, Cloudinary and Razorpay keys.
4. **First admin** — open the service's *Shell* tab and run `npm run create-admin -- you@example.com "Your Name"`.
5. **Domain** — add your custom domain in Render's *Settings → Custom Domains* and update DNS; HTTPS is automatic.

Use Cloudinary in production — Render's disk is reset on each deploy, so local `uploads/` files would be lost.

**Frontend on Vercel/Netlify instead?** Deploy `client/` there with `VITE_API_URL` pointing at the backend, and set `CLIENT_URL` (the frontend address) and `COOKIE_SAMESITE=none` on the backend. Every variable is explained in `docs/FRONTEND_ENV.txt` and `docs/BACKEND_ENV.txt`.

Any Node host works the same way: `npm install --prefix server --omit=dev && npm install --prefix client --include=dev && npm run build`, then `NODE_ENV=production npm start`.

## Configuring external services

All are optional in development; the site stays honest when they're missing (e.g. it never says an email was sent unless it was).

- **Sessions** — set `JWT_SECRET` to a long random string (required in production; in development a temporary one is generated, so sign-ins reset when the API restarts).
- **Email notifications** — set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` and `STUDIO_EMAIL` in `server/.env`. Gmail: create an App Password (Google Account → Security → App passwords) and use `smtp.gmail.com`, port 465. Enables order, appointment and enquiry confirmations, bespoke quotations, shipping emails, new-order alerts to the studio and password reset.
- **Cloudinary** — create a free account, copy *Cloud name / API key / API secret* from the dashboard into `CLOUDINARY_*`. Admin and inspiration uploads then go to the `rk-fashions/` folder.
- **Razorpay** — sign up at razorpay.com, open *Dashboard → Account & Settings → API Keys*, generate **Test Mode** keys and set `RAZORPAY_KEY_ID` (starts `rzp_test_`) and `RAZORPAY_KEY_SECRET`. The checkout then shows "Pay online"; payments are confirmed only after the server verifies Razorpay's signature. Switch to live keys after Razorpay activates your account.
- **Razorpay webhook** (backup confirmation if a customer closes the page right after paying) — in *Dashboard → Webhooks* add `https://<your-site>/api/payments/razorpay/webhook` with the events `payment.captured` and `order.paid`, choose a secret, and set the same value as `RAZORPAY_WEBHOOK_SECRET`. Orders are confirmed only once, whichever arrives first. Unpaid online orders are cancelled automatically after 24 hours.
- **Cash on delivery** — set `COD_ENABLED=true` to offer it. If neither Razorpay nor COD is enabled, checkout shows a "coming soon" message and takes no order.
- **Shipping fee** — `SHIPPING_FEE` in rupees (default 0 = complimentary).

## Before launch — content to replace

Most of this can now be done in **Admin → Homepage & Content** and **Products**:

- Contact details, social links, designer portrait and brand-journey placeholders `[...]`.
- Testimonials are **samples shown only in development** — add real, consented reviews and switch off "Sample only".
- Photography is Unsplash-licensed placeholder imagery. Replace with RK FASHIONS campaign photos. Nehru Jacket and Bandhgala products especially need dedicated photos.
- Policy pages contain `[...]` placeholders for the brand's legal advisor to complete (Admin → Homepage & Content → Policy & information pages).

## Project phases

- **Phase 1** — brand, storefront, collections, product pages, Bespoke Studio, appointments. ✓
- **Phase 2** — accounts, synced wishlist & bag, checkout, order history & tracking. ✓
- **Phase 3** — admin dashboard, sales reports, editable content, tests, CI and deployment setup. ✓
