# Payment Method (Required)

This short note documents only the **payment method** requirement when creating an order.

## Endpoint
**POST** `/api/public/orders`

## Required field
`paymentMethod` is **mandatory** and defines how the customer will pay.

### Example body
```json
{
  "customerId": 1,
  "addressId": 10,
  "comment": "Call 10 min before",
  "paymentMethod": "cash",
  "items": [
    { "productId": 101, "titleRu": "Наполеон", "titleUz": "Napoleon", "price": 120000, "quantity": 1 }
  ]
}
```

### Allowed values (recommended)
- `cash`
- `card`

If the field is missing, the server returns **400**.

# Public Settings Payment Links

## Endpoint
**GET** `/api/public/settings`

## Card payment methods
The response includes `item.card_payment_methods` for the mobile app:

```json
[
  {
    "code": "payme",
    "title": "Payme",
    "link_url": "https://payme.uz/...",
    "image_url": "/uploads/payme.png"
  },
  {
    "code": "click",
    "title": "Click",
    "link_url": "https://my.click.uz/...",
    "image_url": "/uploads/click.png"
  }
]
```

If `link_url` is filled, the mobile app opens the link. `image_url` remains a fallback for QR/image display.
