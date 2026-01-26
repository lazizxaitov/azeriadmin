# Azeri Mobile API (Reference)

This document explains what the mobile app should fetch, which fields matter, and how to send orders. It is written to be pasted into another Codex prompt.

## Base
- **Base URL (prod):** `https://<your-domain>`
- **Base URL (dev):** `http://localhost:3000`
- **Format:** JSON
- **Encoding:** UTF-8

## Security
- All mobile endpoints require **API key** header: `x-api-key: <MOBILE_API_KEY>`
- Rate limit: **120 requests per minute per IP** (server in-memory)
- Configure key in server env: `MOBILE_API_KEY=...`

---

## Data Models

### Category
```json
{
  "id": 1,
  "name_ru": "Торты",
  "name_uz": "Tortlar",
  "slug": "torty",
  "image_url": "/uploads/xxx.jpg"
}
```

### Product
```json
{
  "id": 101,
  "category_id": 1,
  "title_ru": "Наполеон",
  "title_uz": "Napoleon",
  "price": 120000,
  "price_text_ru": null,
  "price_text_uz": null,
  "description_title_ru": "Состав",
  "description_title_uz": "Tarkib",
  "description_text_ru": "Слоёное тесто, крем...",
  "description_text_uz": "...",
  "pricing_mode": "quantity",
  "stock": 12,
  "is_active": 1,
  "images": ["/uploads/p1.jpg", "/uploads/p2.jpg"],
  "portionOptions": [
    { "id": 1, "label_ru": "Кусок", "label_uz": "Bo'lak", "price": 25000 }
  ]
}
```

### Banner
```json
{
  "id": 1,
  "title_ru": "Скидка 10%",
  "title_uz": "10% chegirma",
  "image_url": "/uploads/banner1.jpg",
  "link_url": "https://...",
  "sort_order": 0,
  "is_active": 1
}
```

### TopProduct
```json
{
  "product_id": 101,
  "sort_order": 0
}
```

### Notification (news)
```json
{
  "id": 1,
  "title_ru": "Скидка 10%",
  "title_uz": "10% chegirma",
  "body_ru": "Сегодня до 18:00...",
  "body_uz": "Bugun soat 18:00 gacha...",
  "image_url": "/uploads/notify1.jpg",
  "created_at": "2026-01-25T09:30:00.000Z"
}
```

### PickupPoint
```json
{
  "id": 1,
  "title": "Azeri Cafe - Center",
  "address": "Tashkent, Yunusabad 12",
  "phone": "+998901234567",
  "work_hours": "09:00 - 22:00",
  "lat": 41.3111,
  "lng": 69.2797
}
```

### Customer (mobile registration)
```json
{
  "id": 1,
  "name": "Ali",
  "phone": "+998901234567",
  "password": "..."
}
```

### Address
```json
{
  "id": 1,
  "customer_id": 1,
  "label": "Home",
  "address_line": "Tashkent, Yunusabad 12",
  "comment": "Entrance 3",
  "is_default": 1
}
```

### BonusTransaction
```json
{
  "id": 10,
  "delta": -5000,
  "balance_after": 20000,
  "reason": "Order #5001",
  "order_id": 5001,
  "created_at": "2026-01-25T12:00:00.000Z"
}
```

### Order + Items
```json
{
  "id": 5001,
  "customer_id": 1,
  "customer_address_id": 1,
  "total_amount": 170000,
  "status": "paid",
  "comment": "Call 10 min before",
  "bonus_used": 5000,
  "bonus_earned": 0,
  "created_at": "2026-01-23T10:00:00.000Z",
  "items": [
    { "product_id": 101, "title_ru": "Наполеон", "title_uz": "Napoleon", "price": 120000, "quantity": 1, "total": 120000 },
    { "product_id": 202, "title_ru": "Эклер", "title_uz": "Eclair", "price": 50000, "quantity": 1, "total": 50000 }
  ]
}
```

---

## Mobile Endpoints (public, API-key protected)

### 1) Get banners
**GET** `/api/public/banners`

**Headers:** `x-api-key: <MOBILE_API_KEY>`

**Response:**
```json
{ "items": [Banner, ...] }
```
Rules: only `is_active=1`, sorted by `sort_order`.

### 2) Get categories
**GET** `/api/public/categories`

**Headers:** `x-api-key: <MOBILE_API_KEY>`

**Response:**
```json
{ "items": [Category, ...] }
```

### 3) Get products (all active)
**GET** `/api/public/products`

**Headers:** `x-api-key: <MOBILE_API_KEY>`

**Response:**
```json
{ "items": [Product, ...] }
```

### 4) Get products by category
**GET** `/api/public/categories/:id/products`

**Headers:** `x-api-key: <MOBILE_API_KEY>`

**Response:**
```json
{ "items": [Product, ...] }
```

### 5) Get top products
**GET** `/api/public/top-products`

**Headers:** `x-api-key: <MOBILE_API_KEY>`

**Response:**
```json
{ "items": [ {"product_id":101, "sort_order":0}, ... ] }
```

### 6) Get venue settings (address, delivery, hours, bonus rules)
**GET** `/api/public/settings`

**Headers:** `x-api-key: <MOBILE_API_KEY>`

**Response:**
```json
{ "item": { "cafe_name": "Azeri Cafe", "phone": "...", "address": "...", "work_hours": "...", "delivery_fee": 15000, "min_order": 50000, "currency": "сум", "bonus_redeem_amount": 25000, "instagram": "...", "telegram": "..." } }
```

### 7) Get notifications (news)
**GET** `/api/public/notifications`

**Headers:** `x-api-key: <MOBILE_API_KEY>`

**Response:**
```json
{ "items": [Notification, ...] }
```
Notes:
- Mobile should show a “news” detail screen when the user taps a notification.
- Use `image_url` as an optional hero image.

### 8) Get pickup points (self-pickup)
**GET** `/api/public/pickup-points`

**Headers:** `x-api-key: <MOBILE_API_KEY>`

**Response:**
```json
{ "items": [PickupPoint, ...] }
```

---

## Customer registration + profile

### 9) Register customer
**POST** `/api/public/customers`

**Headers:** `x-api-key: <MOBILE_API_KEY>`

**Body:**
```json
{ "name": "Ali", "phone": "+998901234567", "password": "1234" }
```

**Response:**
```json
{ "id": 1 }
```

### 10) Get customer profile
**GET** `/api/public/customers/:id/profile`

**Headers:** `x-api-key: <MOBILE_API_KEY>`

**Response:**
```json
{ "item": { "id": 1, "name": "Ali", "phone": "+998901234567" } }
```

### 11) Update customer profile
**PATCH** `/api/public/customers/:id/profile`

**Headers:** `x-api-key: <MOBILE_API_KEY>`

**Body:**
```json
{ "name": "Ali", "phone": "+998901234567" }
```

**Response:**
```json
{ "item": { "id": 1, "name": "Ali", "phone": "+998901234567" } }
```

### 12) Add address
**POST** `/api/public/customers/:id/addresses`

**Headers:** `x-api-key: <MOBILE_API_KEY>`

**Body:**
```json
{ "label": "Home", "addressLine": "Tashkent, ...", "comment": "Entrance 3", "isDefault": true }
```

**Response:**
```json
{ "id": 10 }
```

---

## Orders (from mobile)

### 13) Create order
**POST** `/api/public/orders`

**Headers:** `x-api-key: <MOBILE_API_KEY>`

**Body:**
```json
{
  "customerName": "Ali",
  "customerPhone": "+998901234567",
  "addressId": 10,
  "addressLine": "Tashkent, ...",
  "addressLabel": "Home",
  "addressComment": "Entrance 3",
  "comment": "Call 10 min before",
  "bonusUsed": 25000,
  "items": [
    { "productId": 101, "titleRu": "Наполеон", "titleUz": "Napoleon", "price": 120000, "quantity": 1 }
  ]
}
```

**Response:**
```json
{ "id": 5001 }
```

### 14) Order history for customer
**GET** `/api/public/customers/:id/orders`

**Headers:** `x-api-key: <MOBILE_API_KEY>`

**Response:**
```json
{ "items": [Order, ...] }
```

---

## Bonuses

### 15) Bonus balance + history
**GET** `/api/public/customers/:id/bonuses`

**Headers:** `x-api-key: <MOBILE_API_KEY>`

**Response:**
```json
{ "balance": 25000, "transactions": [BonusTransaction, ...] }
```

---

## Internal endpoints (admin only)
These endpoints require admin session and are **NOT** for mobile:
- `/api/banners`, `/api/categories`, `/api/products`, `/api/top-products`, `/api/settings`, `/api/orders`, `/api/customers`, `/api/notifications`

---

## Important notes for mobile
1) Show only `is_active = 1` items.
2) For product image, use `images[0]` as the main image.
3) Price is always in `price` (integer). Currency from `/settings`.
4) When creating order, send `items` with **title + price** (server stores it as history).
5) If `pricing_mode = portion`, show `portionOptions` as selectable variants.
6) Notifications are delivered via polling `/api/public/notifications` (or using your own push layer).
7) Checkout bonus amount uses `settings.bonus_redeem_amount` and customer bonus balance from `/customers/:id/bonuses`.
8) Password change is not implemented server-side yet (still local in app).
9) When creating an order, you can pass `bonusUsed` to apply customer bonuses. Server will clamp it to available balance.

---

If needed: I can provide OpenAPI/Swagger schema or example responses per endpoint.
