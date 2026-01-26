# Mobile Auth + Customer Linking (Only)

This short doc covers **registration, login, and order linking** so the mobile team can integrate without confusion.

## Base
- **Base URL (prod):** `https://<your-domain>`
- **Base URL (dev):** `http://localhost:3000`
- **Format:** JSON
- **Encoding:** UTF-8

## Security
- All endpoints require **API key** header: `x-api-key: <MOBILE_API_KEY>`

---

## 1) Register customer
**POST** `/api/public/customers`

**Body:**
```json
{ "name": "Ali", "phone": "+998901234567", "password": "1234" }
```

**Response:**
```json
{ "id": 1 }
```

Notes:
- Phone is normalized to `+998` format.
- This saves **name + phone + password** in admin database.

---

## 2) Login customer
**POST** `/api/public/auth/login`

**Body:**
```json
{ "phone": "+998901234567", "password": "1234" }
```

**Response:**
```json
{ "item": { "id": 1, "name": "Ali", "phone": "+998901234567" } }
```

Use `item.id` as `customerId` in all orders and address requests.

---

## 3) Create order (linked to customer)
**POST** `/api/public/orders`

**Body:**
```json
{
  "customerId": 1,
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

Notes:
- If `customerId` is provided, the order is always linked to that customer in admin.
- `bonusUsed` is optional; server clamps it to available balance.
- `customerName/Phone` are optional when `customerId` is set (kept for history).

---

## 4) Add address (linked to customer)
**POST** `/api/public/customers/:id/addresses`

**Body:**
```json
{ "label": "Home", "addressLine": "Tashkent, ...", "comment": "Entrance 3", "isDefault": true }
```

**Response:**
```json
{ "id": 10 }
```

---

## 5) Get customer addresses
**GET** `/api/public/customers/:id/addresses`

**Response:**
```json
{
  "items": [
    {
      "id": 10,
      "customer_id": 1,
      "label": "Home",
      "address_line": "Tashkent, ...",
      "comment": "Entrance 3",
      "is_default": 1,
      "created_at": "2026-01-25T12:00:00.000Z"
    }
  ]
}
```

Use this endpoint after login to restore saved addresses.

---

## 6) Order history
**GET** `/api/public/customers/:id/orders`

**Response:**
```json
{
  "items": [
    {
      "id": 5001,
      "total_amount": 170000,
      "status": "paid",
      "created_at": "2026-01-23T10:00:00.000Z",
      "courier": {
        "id": 3,
        "name": "Ali Qosimov",
        "phone": "+998901112233",
        "car_number": "01 A123BC"
      },
      "items": [ ... ]
    }
  ]
}
```

Use this endpoint after login to restore order history.

---

## 7) Bonus balance + history
**GET** `/api/public/customers/:id/bonuses`

**Response:**
```json
{ "balance": 25000, "transactions": [ { "id": 10, "delta": -5000, "balance_after": 20000, "reason": "Order payment", "order_id": 5001, "created_at": "2026-01-25T12:00:00.000Z" } ] }
```

Use this endpoint after login to restore bonus balance/history.

---

If you need password change or refresh token endpoints, tell me and I’ll add them.
