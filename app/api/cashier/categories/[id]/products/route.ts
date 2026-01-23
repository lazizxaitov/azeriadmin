import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { getCashierSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getCashierSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = Number(params.id);
  if (!id) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const db = getDb();
  const products = db
    .prepare(
      `SELECT id, title_ru, title_uz, price, stock, is_active, description_text_ru, description_text_uz
       FROM products
       WHERE category_id = ?
       ORDER BY title_ru ASC`
    )
    .all(id);

  const imageRows = db
    .prepare(
      "SELECT product_id, url FROM product_images WHERE product_id IN (SELECT id FROM products WHERE category_id = ?) ORDER BY sort_order ASC"
    )
    .all(id) as Array<{ product_id: number; url: string }>;

  const imageByProduct = new Map<number, string>();
  imageRows.forEach((row) => {
    if (!imageByProduct.has(row.product_id)) {
      imageByProduct.set(row.product_id, row.url);
    }
  });

  const enriched = (products as Array<Record<string, unknown>>).map((item) => {
    const productId = Number(item.id);
    return { ...item, image_url: imageByProduct.get(productId) ?? null };
  });

  return NextResponse.json({ items: enriched });
}
