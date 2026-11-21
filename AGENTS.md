# ShopLedger

## Stack

- Node.js with CommonJS, Express `^4.17.1`, and `body-parser` `^1.19.0`.
- `server.js` serves plain HTML, CSS, and JavaScript from `public/`, mounts the API at `/api`, and serves printable GST invoices.
- `data/db.json` stores products, orders, customers, Khata settlements, audit entries, and ID counters.

## Module map

- `routes/customers.js` — Lists Khata accounts and recent settlements, and records settlement payments.
- `routes/orders.js` — Lists and retrieves orders, handles checkout, and processes cancellation.
- `routes/products.js` — Lists and filters products with sellable stock and GST rates, and lists active coupons.
- `routes/reports.js` — Serves dashboard and GST reconciliation reports, cart pricing previews, and admin data export.
- `lib/coupons.js` — Normalizes codes, validates coupons, and calculates discounts.
- `lib/dates.js` — Produces day-first dates, normalizes date filter inputs, and derives fiscal-year labels.
- `lib/inventory.js` — Looks up products, checks sellable stock, deducts physical stock, releases reservations, and summarizes inventory.
- `lib/invoice.js` — Calculates invoice figures and renders printable HTML invoices.
- `lib/ledger.js` — Looks up customers, charges and reverses Khata debits, and records settlements.
- `lib/orders.js` — Creates, retrieves, filters, and cancels orders.
- `lib/pricing.js` — Calculates checkout subtotals, discounts, per-line GST, and totals.
- `lib/reports.js` — Summarizes dashboard metrics and compares invoice figures with stored order totals.
- `lib/store.js` — Reads and writes `data/db.json` and appends audit entries.
- `lib/tax.js` — Resolves GST rates and splits GST into CGST and SGST.

## Commands

- Start the app with `npm start`, which runs `node server.js`. The port defaults to `3000` and can be set with `PORT`.
- Run tests with `node --test`. The `npm test` script is a placeholder.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the modules the ticket is about.
3. Use in-memory test data. Tests must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The last sellable unit cannot be sold, and cancelling an order never restores stock.
`inventory.check()` rejects `qty >= sellable`. Saved order lines use `id`. `inventory.release()` looks up `productId` and only reduces `reserved`.

Allowed files for the fix: `lib/inventory.js` and `lib/orders.js` (the `cancel()` function only).
