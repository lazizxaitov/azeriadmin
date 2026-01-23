import "server-only";

import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "azeri.db");
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name_ru TEXT NOT NULL,
    name_uz TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    image_url TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    title_ru TEXT NOT NULL,
    title_uz TEXT NOT NULL,
    description_title_ru TEXT,
    description_title_uz TEXT,
    description_text_ru TEXT,
    description_text_uz TEXT,
    price INTEGER NOT NULL,
    price_text_ru TEXT,
    price_text_uz TEXT,
    pricing_mode TEXT NOT NULL,
    stock INTEGER NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS product_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    url TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS portion_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    label_ru TEXT NOT NULL,
    label_uz TEXT NOT NULL,
    price INTEGER NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS banners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title_ru TEXT NOT NULL,
    title_uz TEXT NOT NULL,
    image_url TEXT NOT NULL,
    link_url TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS top_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL UNIQUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    password TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS customer_addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    label TEXT,
    address_line TEXT NOT NULL,
    comment TEXT,
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    customer_address_id INTEGER,
    total_amount INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'paid',
    comment TEXT,
    courier_id INTEGER,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (customer_address_id) REFERENCES customer_addresses(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER,
    title_ru TEXT NOT NULL,
    title_uz TEXT NOT NULL,
    price INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    total INTEGER NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS couriers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    cafe_name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    work_hours TEXT,
    delivery_fee INTEGER NOT NULL DEFAULT 0,
    min_order INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'сум',
    instagram TEXT,
    telegram TEXT,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
  CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
  CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
  CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id ON customer_addresses(customer_id);
  CREATE INDEX IF NOT EXISTS idx_couriers_active ON couriers(is_active);
`);

function ensureColumn(table: string, column: string, type: string) {
  const columns = db
    .prepare(`PRAGMA table_info(${table})`)
    .all() as Array<{ name: string }>;
  const exists = columns.some((col) => col.name === column);
  if (!exists) {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`).run();
  }
}

ensureColumn("customers", "password", "TEXT");
ensureColumn("orders", "customer_address_id", "INTEGER");
ensureColumn("orders", "comment", "TEXT");
ensureColumn("orders", "courier_id", "INTEGER");

function tableHasRows(table: string) {
  const row = db.prepare(`SELECT 1 FROM ${table} LIMIT 1`).get() as
    | { 1: number }
    | undefined;
  return Boolean(row);
}

function tableExists(source: Database, table: string) {
  const row = source
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(table) as { name?: string } | undefined;
  return Boolean(row?.name);
}

function getColumns(source: Database, table: string) {
  return (
    source.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>
  ).map((col) => col.name);
}

function copyTable(source: Database, target: Database, table: string) {
  if (!tableExists(source, table)) return;
  if (tableHasRows(table)) return;
  const rows = source.prepare(`SELECT * FROM ${table}`).all() as Array<
    Record<string, unknown>
  >;
  if (!rows.length) return;
  const srcCols = getColumns(source, table);
  const destCols = getColumns(target, table);
  const common = destCols.filter((col) => srcCols.includes(col));
  if (!common.length) return;
  const placeholders = common.map(() => "?").join(", ");
  const stmt = target.prepare(
    `INSERT INTO ${table} (${common.join(", ")}) VALUES (${placeholders})`
  );
  const insertMany = target.transaction((items: typeof rows) => {
    items.forEach((row) => {
      stmt.run(common.map((col) => row[col]));
    });
  });
  insertMany(rows);
}

const catalogPath = path.join(dataDir, "catalog.db");
const customersPath = path.join(dataDir, "customers.db");
const cashierPath = path.join(dataDir, "cashier.db");

const hasAnyData =
  tableHasRows("categories") ||
  tableHasRows("customers") ||
  tableHasRows("couriers");

if (!hasAnyData) {
  const sources: Array<{ path: string; tables: string[] }> = [
    {
      path: catalogPath,
      tables: [
        "categories",
        "products",
        "product_images",
        "portion_options",
        "banners",
        "top_products",
        "settings",
      ],
    },
    {
      path: customersPath,
      tables: ["customers", "customer_addresses", "orders", "order_items"],
    },
    {
      path: cashierPath,
      tables: ["couriers"],
    },
  ];

  sources.forEach((source) => {
    if (!fs.existsSync(source.path)) return;
    const sourceDb = new Database(source.path);
    source.tables.forEach((table) => copyTable(sourceDb, db, table));
    sourceDb.close();
  });
}

const settingsRow = db
  .prepare("SELECT id FROM settings WHERE id = 1")
  .get() as { id?: number } | undefined;
if (!settingsRow?.id) {
  db.prepare(
    `INSERT INTO settings
     (id, cafe_name, phone, address, work_hours, delivery_fee, min_order, currency, instagram, telegram, updated_at)
     VALUES (1, 'Azeri Cafe', '', '', '', 0, 0, 'сум', '', '', ?)`
  ).run(nowIso());
}

export function getDb() {
  return db;
}

export function nowIso() {
  return new Date().toISOString();
}
