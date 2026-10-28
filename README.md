# Perfume Store

Online perfume shop: customers browse and order; staff manage the catalogue, stock, orders, and promotions from an admin panel.

---

## Features

**Shop** — brands, collections, product pages, cart, wishlist, checkout, reviews, customer account, EN/BN, homepage + promo banners  

**Admin** — perfumes, inventory, brands, collections, orders, returns, reviews, coupons, banners, settings

---

## Requirements

- PHP **8.3+**
- MySQL **8**
- Composer
- Node.js + npm

---

## Local setup

### 1. Database

```sql
CREATE DATABASE perfume_store CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Environment

Copy `.env.example` to `.env`, then set MySQL and `APP_URL`:

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=perfume_store
DB_USERNAME=root
DB_PASSWORD=
```

### 3. Install

```bash
composer install
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
npm install
npm run build
```

### 4. Run

```bash
composer run dev
```

Or open the project in Laragon.

| Area | URL |
| --- | --- |
| Shop | `/` |
| Admin | `/admin` |

Demo seed data (brands, products, sample coupon, banners) loads with `migrate --seed`. Create staff accounts with your own process — do not commit real passwords.

---

## Technology & tools

| Layer | Tools |
| --- | --- |
| Backend | PHP 8.3, Laravel, Laravel Fortify |
| Front-end | React, Inertia.js, TypeScript, Tailwind CSS |
| Database | MySQL 8 |
| Build | Vite / Vite+, npm |
| Auth | Fortify (customer + admin roles) |
| Payments | Cash on delivery; optional SSLCOMMERZ |
| Local / hosting | Laragon or any PHP + MySQL stack |

Server-side logic handles prices, delivery, coupons, and stock.

---

## Docs

- **[User Guide (DOCX)](docs/Perfume_Store_User_Guide.docx)** — image upload sizes, admin overview, everyday tips (open in Word / Google Docs)
