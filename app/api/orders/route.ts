import { NextResponse } from "next/server";

import { getDb, nowIso } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

type OrderItemInput = {
  productId?: number;
  titleRu: string;
  titleUz: string;
  price: number;
  quantity: number;
};

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const orders = db
    .prepare(
      `SELECT o.*, c.name as customer_name, c.phone as customer_phone
       FROM orders o
       LEFT JOIN customers c ON c.id = o.customer_id
       ORDER BY o.created_at DESC`
    )
    .all();

  return NextResponse.json({ items: orders });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const customerName = body?.customerName?.toString()?.trim();
  const customerPhone = body?.customerPhone?.toString()?.trim() ?? null;
  const addressId = body?.addressId ? Number(body.addressId) : null;
  const addressLine = body?.addressLine?.toString()?.trim();
  const addressLabel = body?.addressLabel?.toString()?.trim() ?? null;
  const addressComment = body?.addressComment?.toString()?.trim() ?? null;
  const status = body?.status?.toString()?.trim() || "paid";
  const comment = body?.comment?.toString()?.trim() ?? null;
  const items: OrderItemInput[] = Array.isArray(body?.items) ? body.items : [];

  if (!items.length) {
    return NextResponse.json({ error: "Missing items" }, { status: 400 });
  }

  const db = getDb();
  const now = nowIso();
  const create = db.transaction(() => {
    let customerId: number | null = null;
    let customerAddressId: number | null = addressId;
    if (customerName) {
      if (customerPhone) {
        const existing = db
          .prepare("SELECT id FROM customers WHERE phone = ?")
          .get(customerPhone) as { id?: number } | undefined;
        if (existing?.id) {
          customerId = existing.id;
          db.prepare("UPDATE customers SET name = ?, updated_at = ? WHERE id = ?").run(
            customerName,
            now,
            customerId
          );
        }
      }

      if (!customerId) {
        const result = db
          .prepare(
            "INSERT INTO customers (name, phone, created_at, updated_at) VALUES (?, ?, ?, ?)"
          )
          .run(customerName, customerPhone, now, now);
        customerId = Number(result.lastInsertRowid);
      }
    }

    if (!customerAddressId && customerId && addressLine) {
      const addressResult = db
        .prepare(
          `INSERT INTO customer_addresses
           (customer_id, label, address_line, comment, is_default, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .run(customerId, addressLabel, addressLine, addressComment, 0, now, now);
      customerAddressId = Number(addressResult.lastInsertRowid);
    }

    const totalAmount = items.reduce((sum, item) => {
      const price = Number(item.price ?? 0);
      const quantity = Number(item.quantity ?? 0);
      return sum + price * quantity;
    }, 0);

    const orderResult = db
      .prepare(
        "INSERT INTO orders (customer_id, customer_address_id, total_amount, status, comment, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
      .run(customerId, customerAddressId, totalAmount, status, comment, now, now);

    const orderId = Number(orderResult.lastInsertRowid);
    const insertItem = db.prepare(
      "INSERT INTO order_items (order_id, product_id, title_ru, title_uz, price, quantity, total) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );

    items.forEach((item) => {
      const price = Number(item.price ?? 0);
      const quantity = Number(item.quantity ?? 0);
      insertItem.run(
        orderId,
        item.productId ?? null,
        item.titleRu,
        item.titleUz,
        price,
        quantity,
        price * quantity
      );
    });

    return orderId;
  });

  const orderId = create();
  return NextResponse.json({ id: orderId });
}
