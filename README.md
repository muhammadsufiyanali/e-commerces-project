# eTrade — E-commerce Demo Store

A complete, responsive e-commerce website built with plain **HTML, CSS and JavaScript** (no backend needed — all data is saved in the browser's `localStorage`).

## Pages
| Page | What it does |
|------|--------------|
| `index.html` | Home: hero slider, categories, bestsellers / new / sale tabs, deal of the day with countdown, testimonials, newsletter |
| `shop.html` | All products with search, category / brand / price / rating / stock filters, sorting and pagination |
| `product.html?id=p1` | Product details: zoom, quantity, add to cart, buy now, wishlist, share, specs, reviews |
| `checkout.html` | Shipping form with validation, Standard / Express delivery, coupons, payment by Card (live card preview + Luhn check), JazzCash, Easypaisa, Bank transfer, Cash on Delivery |
| `account.html` | Login / register, order history with tracking timeline, cancel orders, wishlist, profile; guest order tracking |
| `admin.html` | Admin dashboard: sales KPIs and charts, product add / edit / delete (image upload or URL), order status management, CSV export, customers, coupons, store settings, backup / reset |

## Features
- Cart drawer with quantity controls and a free-shipping progress bar
- Wishlist, quick view, search suggestions, toast notifications
- Dark mode, scroll animations, mobile-first responsive layout
- Stock tracking (orders reduce stock; cancelled orders restock)

## Demo logins
- **Admin:** `admin` / `admin123`
- **Customer:** `ayesha@example.com` / `123456`
- **Coupons:** `WELCOME10`, `SAVE5000` (min Rs. 50,000), `FREESHIP`
- **Test card:** `4242 4242 4242 4242`, any future expiry, any CVV

> This is a demo store: no real payments are processed.

## Run locally
Open `index.html` in a browser, or use VS Code Live Server.
