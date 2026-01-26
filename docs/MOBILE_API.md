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

If you need password change or refresh token endpoints, tell me and I’ll add them.