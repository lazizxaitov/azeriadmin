"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Card, SectionTitle, PrimaryButton } from "./_components/ui";

type Stats = {
  categories: number;
  products: number;
  banners: number;
  topProducts: number;
  salesToday: number;
  salesWeek: number;
  salesMonth: number;
  averageCheck: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(() => setStats(null));
  }, []);

  return (
    <div className="space-y-8">
      <SectionTitle
        title="Добро пожаловать"
        subtitle="Управляйте каталогом и баннерами в стиле мобильного приложения."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
            Категории
          </p>
          <p className="mt-3 text-3xl font-extrabold text-[var(--ink)]">
            {stats?.categories ?? "—"}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
            Товары
          </p>
          <p className="mt-3 text-3xl font-extrabold text-[var(--ink)]">
            {stats?.products ?? "—"}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
            Баннеры
          </p>
          <p className="mt-3 text-3xl font-extrabold text-[var(--ink)]">
            {stats?.banners ?? "—"}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
            Топ товары
          </p>
          <p className="mt-3 text-3xl font-extrabold text-[var(--ink)]">
            {stats?.topProducts ?? "—"}
          </p>
        </Card>
      </div>

      <div>
        <SectionTitle
          title="Продажи"
          subtitle="Ключевые показатели продаж на сегодня и за период."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
              Продажи сегодня
            </p>
            <p className="mt-3 text-3xl font-extrabold text-[var(--ink)]">
              {stats?.salesToday?.toLocaleString("ru-RU") ?? "—"} сум
            </p>
          </Card>
          <Card>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
              Продажи за неделю
            </p>
            <p className="mt-3 text-3xl font-extrabold text-[var(--ink)]">
              {stats?.salesWeek?.toLocaleString("ru-RU") ?? "—"} сум
            </p>
          </Card>
          <Card>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
              Продажи за месяц
            </p>
            <p className="mt-3 text-3xl font-extrabold text-[var(--ink)]">
              {stats?.salesMonth?.toLocaleString("ru-RU") ?? "—"} сум
            </p>
          </Card>
          <Card>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
              Средний чек
            </p>
            <p className="mt-3 text-3xl font-extrabold text-[var(--ink)]">
              {stats?.averageCheck?.toLocaleString("ru-RU") ?? "—"} сум
            </p>
          </Card>
        </div>
      </div>

    </div>
  );
}
