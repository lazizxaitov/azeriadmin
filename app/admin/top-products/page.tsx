"use client";

import { useEffect, useMemo, useState } from "react";

import { Card, SectionTitle, PrimaryButton, GhostButton } from "../_components/ui";

type Product = {
  id: number;
  title_ru: string;
  title_uz: string;
  price: number;
  is_active: number;
};

type TopItem = {
  product_id: number;
  sort_order: number;
};

export default function TopProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([fetch("/api/products"), fetch("/api/top-products")])
      .then(async ([productsRes, topRes]) => {
        const productsData = await productsRes.json();
        const topData = await topRes.json();
        setProducts(productsData.items ?? []);
        setTopItems(topData.items ?? []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const selectionMap = useMemo(() => {
    const map = new Map<number, number>();
    topItems.forEach((item) => map.set(item.product_id, item.sort_order));
    return map;
  }, [topItems]);

  const toggleProduct = (productId: number) => {
    setTopItems((prev) => {
      if (prev.some((item) => item.product_id === productId)) {
        return prev.filter((item) => item.product_id !== productId);
      }
      return [...prev, { product_id: productId, sort_order: prev.length }];
    });
  };

  const updateOrder = (productId: number, value: number) => {
    setTopItems((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? { ...item, sort_order: value }
          : item
      )
    );
  };

  const save = async () => {
    const payload = {
      items: topItems.map((item) => ({
        productId: item.product_id,
        sortOrder: Number(item.sort_order),
      })),
    };
    await fetch("/api/top-products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    load();
  };

  return (
    <div className="space-y-8">
      <SectionTitle
        title="Топ товары"
        subtitle="Выберите товары, которые будут отображаться в топе."
      />

      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[var(--ink)]">
            Сейчас выбрано: {topItems.length}
          </p>
          <p className="text-xs text-[var(--muted)]">
            Порядок влияет на отображение в приложении.
          </p>
        </div>
        <div className="flex gap-3">
          <PrimaryButton onClick={save}>Сохранить</PrimaryButton>
          <GhostButton onClick={load}>Обновить</GhostButton>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {loading ? (
          <Card>Загрузка...</Card>
        ) : (
          products.map((product) => {
            const active = selectionMap.has(product.id);
            return (
              <Card key={product.id} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-bold text-[var(--ink)]">
                    {product.title_ru}
                  </p>
                  <p className="text-sm text-[var(--muted)]">
                    {product.title_uz}
                  </p>
                  <p className="text-sm font-semibold text-[var(--ink)]">
                    {product.price.toLocaleString("ru-RU")} сум
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <GhostButton onClick={() => toggleProduct(product.id)}>
                    {active ? "Убрать" : "В топ"}
                  </GhostButton>
                  {active ? (
                    <input
                      type="number"
                      value={selectionMap.get(product.id) ?? 0}
                      onChange={(event) =>
                        updateOrder(product.id, Number(event.target.value))
                      }
                      className="w-20 rounded-2xl border border-[var(--stroke)] bg-white px-3 py-2 text-sm"
                    />
                  ) : null}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
