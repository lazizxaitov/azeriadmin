"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";

type Category = {
  id: number;
  name_ru: string;
  name_uz: string;
};

type Product = {
  id: number;
  title_ru: string;
  title_uz: string;
  price: number;
  stock: number;
  is_active: number;
  description_text_ru?: string | null;
  description_text_uz?: string | null;
  image_url?: string | null;
};

export default function CashierCategoryProductsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const categoryId = params?.id;
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"name" | "stockAsc" | "stockDesc">("name");

  useEffect(() => {
    if (!categoryId) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/cashier/categories/${categoryId}`),
      fetch(`/api/cashier/categories/${categoryId}/products`),
    ])
      .then(async ([catRes, prodRes]) => {
        const catData = await catRes.json();
        const prodData = await prodRes.json();
        setCategory(catData.item ?? null);
        setProducts(prodData.items ?? []);
      })
      .finally(() => setLoading(false));
  }, [categoryId]);

  const logout = async () => {
    await fetch("/api/auth/cashier-logout", { method: "POST" });
    router.push("/login");
  };

  const filtered = products
    .filter((product) => {
      const query = search.trim().toLowerCase();
      if (!query) return true;
      return (
        product.title_ru.toLowerCase().includes(query) ||
        product.title_uz.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      if (sort === "stockAsc") return a.stock - b.stock;
      if (sort === "stockDesc") return b.stock - a.stock;
      return a.title_ru.localeCompare(b.title_ru, "ru");
    });

  return (
    <div className="min-h-screen grainy px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[var(--stroke)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden">
              <Image src="/logo.png" alt="Логотип" width={64} height={64} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Azeri Cafe
              </p>
              <h1 className="text-2xl font-extrabold text-[var(--ink)]">
                {category?.name_ru ?? "Товары"}
              </h1>
              <p className="text-sm text-[var(--muted)]">
                {category?.name_uz ?? ""}
              </p>
            </div>
          </div>
          <Link
            href="/cashier/products"
            className="rounded-2xl border border-[var(--stroke)] bg-white px-4 py-2 text-sm font-bold text-[var(--ink)] shadow-sm transition hover:-translate-y-[1px] hover:border-[var(--brand)]"
          >
            К категориям
          </Link>
          <button
            onClick={logout}
            className="rounded-2xl border border-[var(--stroke)] bg-white px-4 py-2 text-sm font-bold text-[var(--ink)] shadow-sm transition hover:-translate-y-[1px] hover:border-[var(--brand)]"
          >
            Выйти
          </button>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold">
            Поиск по товарам
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Введите название..."
              className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm"
            />
          </label>
          <label className="text-sm font-semibold">
            Сортировка
            <select
              value={sort}
              onChange={(event) =>
                setSort(event.target.value as "name" | "stockAsc" | "stockDesc")
              }
              className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm"
            >
              <option value="name">По названию</option>
              <option value="stockAsc">Остаток: меньше → больше</option>
              <option value="stockDesc">Остаток: больше → меньше</option>
            </select>
          </label>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-[var(--stroke)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
            Загрузка...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-[var(--stroke)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
            Нет товаров в этой категории.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((product) => {
              const lowStock = product.stock <= 5;
              return (
                <div
                  key={product.id}
                  className={`overflow-hidden rounded-3xl border bg-[var(--surface)] shadow-[var(--shadow)] transition hover:-translate-y-[2px] ${
                    lowStock
                      ? "border-red-200 bg-red-50/40"
                      : "border-[var(--stroke)]"
                  }`}
                >
                  <div className="aspect-square w-full bg-[var(--accent)]">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.title_ru}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-4xl">
                        🍰
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-base font-bold text-[var(--ink)]">
                          {product.title_ru}
                        </p>
                        <p className="text-xs text-[var(--muted)]">
                          {product.title_uz}
                        </p>
                      </div>
                      <span
                        className={`rounded-2xl px-2 py-1 text-[10px] font-semibold ${
                          product.is_active
                            ? "bg-[var(--accent)] text-[var(--ink)]"
                            : "bg-red-50 text-red-600"
                        }`}
                      >
                        {product.is_active ? "Активен" : "Скрыт"}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-[var(--muted)]">Остаток</p>
                        <p className="text-lg font-extrabold text-[var(--ink)]">
                          {product.stock}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--muted)]">Цена</p>
                        <p className="text-sm font-semibold text-[var(--ink)]">
                          {product.price.toLocaleString("ru-RU")} сум
                        </p>
                      </div>
                    </div>
                    {lowStock ? (
                      <p className="mt-2 text-xs font-semibold text-red-600">
                        Мало на складе
                      </p>
                    ) : null}
                    {product.description_text_ru ? (
                      <p className="mt-2 line-clamp-2 text-xs text-[var(--muted)]">
                        {product.description_text_ru}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
