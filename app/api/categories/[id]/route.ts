import { NextResponse } from "next/server";

import { getDb, nowIso } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { slugify } from "@/lib/slug";

export const runtime = "nodejs";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = Number(params.id);
  if (!id) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const nameRu = body?.nameRu?.toString()?.trim();
  const nameUz = body?.nameUz?.toString()?.trim();
  const imageUrl = body?.imageUrl?.toString()?.trim() ?? null;
  const slugInput = body?.slug?.toString()?.trim();

  if (!nameRu || !nameUz) {
    return NextResponse.json({ error: "Missing name" }, { status: 400 });
  }

  const db = getDb();
  const slug = slugInput ? slugify(slugInput) : slugify(nameRu);

  const now = nowIso();
  db.prepare(
    `UPDATE categories
     SET name_ru = ?, name_uz = ?, slug = ?, image_url = ?, updated_at = ?
     WHERE id = ?`
  ).run(nameRu, nameUz, slug, imageUrl, now, id);

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = Number(params.id);
  if (!id) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const db = getDb();
  db.prepare("DELETE FROM categories WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
