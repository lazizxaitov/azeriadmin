import { NextResponse } from "next/server";

import { getDb, nowIso } from "@/lib/db";
import { rateLimit, requirePublicApiKey } from "@/lib/public-auth";

export const runtime = "nodejs";

type OrderItemInput = {
  productId?: number;
  titleRu: string;
  titleUz: string;
  price: number;
  quantity: number;
};

export async function POST(request: Request) {
  const authError = requirePublicApiKey();
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: authError.status });
  }
  const rateError = rateLimit();
  if (rateError) {
    return NextResponse.json({ error: rateError.message }, { status: rateError.status });
  }

  const body = await request.json().catch(() => null);
  const customerName = body?.customerName?.toString()?.trim();
  const customerPhone = body?.customerPhone?.toString()?.trim() ?? null;
  const addressId = body?.addressId ? Number(body.addressId) : null;
  const addressLine = body?.addressLine?.toString()?.trim();
  const addressLabel = body?.addressLabel?.toString()?.trim() ?? null;
  const addressComment = body?.addressComment?.toString()?.trim() ?? null;
  const comment = body?.comment?.toString()?.trim() ?? null;
  const bonusUsedRequested = Number(body?.bonusUsed ?? 0);
  const items: OrderItemInput[] = Array.isArray(body?.items) ? body.items : [];

  if (!items.length) {
    return NextResponse.json({ error: "Missing items" }, { status: 400 });
  }

  if (bonusUsedRequested > 0 && !customerName && !customerPhone) {
    return NextResponse.json({ error: "Bonus requires customer" }, { status: 400 });
  }

  const db = getDb();
  const now = nowIso();
  const create = db.transaction(() => {
    let customerId: number | null = null;
    let customerAddressId: number | null = addressId;
    let bonusUsed = 0;
    if (customerName) {
      if (customerPhone) {
        const existing = db
          .prepare("SELECT id, bonus_balance FROM customers WHERE phone = ?")
          .get(customerPhone) as { id?: number; bonus_balance?: number } | undefined;
        if (existing?.id) {
          customerId = existing.id;
          db.prepare("UPDATE customers SET name = ?, updated_at = ? WHERE id = ?").run(
            customerName,
            now,
            customerId
          );
          if (bonusUsedRequested > 0) {
            const current = Number(existing.bonus_balance ?? 0);
            bonusUsed = Math.max(0, Math.min(current, bonusUsedRequested));
            const nextBalance = current - bonusUsed;
            db.prepare("UPDATE customers SET bonus_balance = ?, updated_at = ? WHERE id = ?").run(
              nextBalance,
              now,
              customerId
            );
            if (bonusUsed > 0) {
              db.prepare(
                `INSERT INTO bonus_transactions
                 (customer_id, delta, balance_after, reason, order_id, created_at)
                 VALUES (?, ?, ?, ?, ?, ?)`
              ).run(customerId, -bonusUsed, nextBalance, "Order payment", null, now);
            }
          }
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
        "INSERT INTO orders (customer_id, customer_address_id, total_amount, status, comment, bonus_used, bonus_earned, created_at, updated_at) VALUES (?, ?, ?, 'paid', ?, ?, 0, ?, ?)"
      )
      .run(customerId, customerAddressId, totalAmount, comment, bonusUsed, now, now);

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

    if (bonusUsed > 0) {
      db.prepare(
        "UPDATE bonus_transactions SET order_id = ? WHERE customer_id = ? AND order_id IS NULL AND reason = ? AND created_at = ?"
      ).run(orderId, customerId, "Order payment", now);
    }

    return orderId;
  });

  const orderId = create();
  return NextResponse.json({ id: orderId });
}
