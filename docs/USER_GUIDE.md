# Perfume Store — User Guide

Short manual for shop use and admin work. Keep this to hand when uploading images or managing the catalogue.

---

## 1. Where to go

| Area | Path | Who |
| --- | --- | --- |
| Public shop | `/` | Customers |
| Admin panel | `/admin` | Staff |
| Customer account | Shop → Sign in | Customers |

**Admin** manages catalogue, stock, orders, banners, coupons, and settings.  
**Customers** browse, cart, checkout, and track their own orders.

---

## 2. Image upload sizes

All images: **JPG / PNG / WebP**, max **4 MB**. Keep the main subject in the centre.

| Use | Size (px) | Ratio | Notes |
| --- | ---: | --- | --- |
| **Product photo** | **1200 × 1500** | 4:5 portrait | Best for cards; also fine on product page. 1600 × 2000 OK if sharper. |
| **Homepage banner** | **1920 × 400** | Wide landscape | Under the menu. Edges may crop — keep bottle/text centred. |
| **Promo banner** | **800 × 1000** (or square) | Portrait / square | Slider cards above Trending. Clear product or brand photo. |
| **Collection image** | ~**600 × 600** | Square | Round collection circles on the homepage. |

---

## 3. Admin — what each section does

| Menu | Purpose |
| --- | --- |
| Overview | Dashboard snapshot |
| Orders / Pre-orders / Returns | Fulfil and update status |
| Customers | Customer list |
| Reviews | Approve, reject, feature |
| Perfumes | Add/edit bottles, photos, prices, **Featured** (Best sellers) |
| Inventory | Stock by size |
| Brands / Collections | Houses and shop groups |
| Coupons | Discount codes |
| Banner | Homepage hero + promo cards (link to **brand**, product, or collection) |
| Settings | Currency, delivery, store text |

**Homepage shelves (quick)**

| Shelf | How it is filled |
| --- | --- |
| Best sellers | Perfumes with **Featured** on (max 8) |
| New arrivals | Newest active perfumes |
| Trending | Active perfumes by sort order (max 8) |
| Promo slider | Active promo banners from **Banner** |

---

## 4. Everyday tips

- Turn **Visible in the shop** on before a perfume can appear or sell.
- First product photo = card + large gallery image; extra photos = thumbnails.
- Promo cards need: **title**, **short description**, **photo**, and a **link** (brand / product / collection).
- Inactive banners and promos stay hidden on the shop.
- Prices and stock are managed in admin; the shop calculates totals on the server.

---

## 5. System at a glance

| Item | Detail |
| --- | --- |
| Stack | Laravel, React (Inertia), TypeScript, Tailwind, MySQL |
| Payments | Cash on delivery by default; optional SSLCOMMERZ |
| Languages | English and Bangla |
| Currency | Set in Admin → Settings (default BDT) |
