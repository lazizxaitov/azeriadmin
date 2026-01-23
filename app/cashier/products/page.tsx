"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Category = {
  id: number;
  name_ru: string;
  name_uz: string;
  image_url?: string | null;
};

export default function CashierCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/cashier/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    await fetch("/api/auth/cashier-logout", { method: "POST" });
    router.push("/login");
  };

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
                Категории
              </h1>
              <p className="text-sm text-[var(--muted)]">
                Выберите категорию, чтобы увидеть товары.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/cashier"
              className="rounded-2xl border border-[var(--stroke)] bg-white px-4 py-2 text-sm font-bold text-[var(--ink)] shadow-sm transition hover:-translate-y-[1px] hover:border-[var(--brand)]"
            >
              К заказам
            </Link>
            <button
              onClick={logout}
              className="rounded-2xl border border-[var(--stroke)] bg-white px-4 py-2 text-sm font-bold text-[var(--ink)] shadow-sm transition hover:-translate-y-[1px] hover:border-[var(--brand)]"
            >
              Выйти
            </button>
          </div>
        </header>

        {loading ? (
          <div className="rounded-3xl border border-[var(--stroke)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
            Загрузка...
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-3xl border border-[var(--stroke)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
            Нет категорий.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/cashier/products/${category.id}`}
                className="rounded-3xl border border-[var(--stroke)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] transition hover:-translate-y-[1px]"
              >
                {category.image_url ? (
                  <img
                    src={category.image_url}
                    alt={category.name_ru}
                    className="h-36 w-full rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-36 w-full items-center justify-center rounded-2xl bg-[var(--accent)] text-3xl">
                    🧁
                  </div>
                )}
                <div className="mt-3">
                  <p className="text-lg font-bold text-[var(--ink)]">
                    {category.name_ru}
                  </p>
                  <p className="text-sm text-[var(--muted)]">
                    {category.name_uz}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
