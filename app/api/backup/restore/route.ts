import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import AdmZip from "adm-zip";

import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

async function replaceFile(targetPath: string, data: Buffer) {
  const tempPath = `${targetPath}.tmp`;
  await fs.writeFile(tempPath, data);
  try {
    await fs.unlink(targetPath);
  } catch {}
  await fs.rename(tempPath, targetPath);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await (file as File).arrayBuffer());
  const name = ((file as File).name ?? "backup").toLowerCase();

  const dataDir = path.join(process.cwd(), "data");
  await fs.mkdir(dataDir, { recursive: true });

  if (name.endsWith(".db")) {
    const dbPath = path.join(dataDir, "azeri.db");
    await replaceFile(dbPath, buffer);
    return NextResponse.json({ ok: true, type: "db" });
  }

  if (name.endsWith(".zip")) {
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();

    const dbEntry = entries.find((entry) =>
      entry.entryName.replace(/\\/g, "/").endsWith("azeri.db")
    );
    if (!dbEntry) {
      return NextResponse.json({ error: "azeri.db not found in zip" }, { status: 400 });
    }

    const dbPath = path.join(dataDir, "azeri.db");
    await replaceFile(dbPath, dbEntry.getData());

    const uploadsDir = path.join(dataDir, "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });
    const writes = entries.map((entry) => {
      const entryPath = entry.entryName.replace(/\\/g, "/");
      if (entry.isDirectory) return null;
      if (!entryPath.startsWith("uploads/")) return null;
      const relative = entryPath.replace("uploads/", "");
      if (!relative) return null;
      const target = path.join(uploadsDir, relative);
      return fs
        .mkdir(path.dirname(target), { recursive: true })
        .then(() => fs.writeFile(target, entry.getData()));
    });
    await Promise.all(writes.filter(Boolean));

    return NextResponse.json({ ok: true, type: "full" });
  }

  return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
}
