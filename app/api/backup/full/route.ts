import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import archiver from "archiver";

import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dataDir = path.join(process.cwd(), "data");
  const dbPath = path.join(dataDir, "azeri.db");
  if (!fs.existsSync(dbPath)) {
    return NextResponse.json({ error: "Backup not found" }, { status: 404 });
  }

  try {
    getDb().pragma("wal_checkpoint(TRUNCATE)");
  } catch {}

  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.file(dbPath, { name: "azeri.db" });
  const walPath = `${dbPath}-wal`;
  const shmPath = `${dbPath}-shm`;
  if (fs.existsSync(walPath)) {
    archive.file(walPath, { name: "azeri.db-wal" });
  }
  if (fs.existsSync(shmPath)) {
    archive.file(shmPath, { name: "azeri.db-shm" });
  }

  const uploadsDir = path.join(dataDir, "uploads");
  if (fs.existsSync(uploadsDir)) {
    archive.directory(uploadsDir, "uploads");
  }

  const stream = Readable.toWeb(archive) as ReadableStream;
  archive.finalize();

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="azeri-full-backup-${Date.now()}.zip"`,
    },
  });
}
