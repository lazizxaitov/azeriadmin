import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs";

import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dataDir = path.join(process.cwd(), "data");
  const filePath = path.join(dataDir, "azeri.db");
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Backup not found" }, { status: 404 });
  }
  const buffer = fs.readFileSync(filePath);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="azeri-backup-${Date.now()}.db"`,
    },
  });
}
