"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { Modal, PrimaryButton, GhostButton } from "./ui";

const navItems = [
  { href: "/admin", label: "Обзор", icon: "🏠" },
  { href: "/admin/banners", label: "Баннеры", icon: "🖼️" },
  { href: "/admin/categories", label: "Категории", icon: "🧁" },
  { href: "/admin/products", label: "Товары", icon: "🍰" },
  { href: "/admin/top-products", label: "Топ", icon: "⭐" },
  { href: "/admin/customers", label: "Клиенты", icon: "👥" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [quickOpen, setQuickOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyForm, setNotifyForm] = useState({
    titleRu: "",
    titleUz: "",
    bodyRu: "",
    bodyUz: "",
    imageUrl: "",
  });
  const [notifySending, setNotifySending] = useState(false);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const uploadImage = async (file: File) => {
    const body = new FormData();
    body.append("file", file);
    const response = await fetch("/api/upload", { method: "POST", body });
    if (!response.ok) throw new Error("upload failed");
    const data = await response.json();
    return data.url as string;
  };

  const sendNotification = async () => {
    setNotifySending(true);
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titleRu: notifyForm.titleRu,
        titleUz: notifyForm.titleUz,
        bodyRu: notifyForm.bodyRu,
        bodyUz: notifyForm.bodyUz,
        imageUrl: notifyForm.imageUrl || null,
      }),
    });
    setNotifySending(false);
    setNotifyForm({
      titleRu: "",
      titleUz: "",
      bodyRu: "",
      bodyUz: "",
      imageUrl: "",
    });
    setNotifyOpen(false);
  };

  return (
    <div className="min-h-screen grainy pb-24">
      <header className="sticky top-0 z-10 border-b border-[var(--stroke)] bg-[rgba(249,246,242,0.9)] backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden">
              <Image src="/logo.png" alt="Логотип" width={56} height={56} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                Azeri Cafe
              </p>
              <h1 className="text-lg font-extrabold text-[var(--ink)]">
                Админ-панель
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuickOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--stroke)] bg-white text-xl font-bold text-[var(--ink)] shadow-sm transition hover:-translate-y-[1px] hover:border-[var(--brand)]"
            >
              +
            </button>
            <button
              onClick={() => setNotifyOpen(true)}
              className="rounded-2xl border border-[var(--stroke)] bg-white px-4 py-2 text-sm font-bold text-[var(--ink)] shadow-sm transition hover:-translate-y-[1px] hover:border-[var(--brand)]"
            >
              Отправить уведомления
            </button>
            <Link
              href="/admin/settings"
              className="rounded-2xl border border-[var(--stroke)] bg-white px-4 py-2 text-sm font-bold text-[var(--ink)] shadow-sm transition hover:-translate-y-[1px] hover:border-[var(--brand)]"
            >
              Настройки
            </Link>
            <button
              onClick={logout}
              className="rounded-2xl border border-[var(--stroke)] bg-white px-4 py-2 text-sm font-bold text-[var(--ink)] shadow-sm transition hover:-translate-y-[1px] hover:border-[var(--brand)]"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>

      <nav className="fixed bottom-4 left-1/2 z-20 w-[min(92vw,640px)] -translate-x-1/2 rounded-[28px] border border-[var(--stroke)] bg-[var(--surface)] p-2 shadow-[var(--shadow)]">
        <div className="grid grid-cols-6 gap-2">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-xs font-semibold transition ${
                  active
                    ? "bg-[var(--brand)] text-white"
                    : "text-[var(--muted)] hover:bg-[var(--accent)]"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <Modal
        open={quickOpen}
        onClose={() => setQuickOpen(false)}
        title="Что добавить?"
      >
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Товар",
              subtitle: "Новый продукт и цены",
              icon: "🍰",
              href: "/admin/products",
            },
            {
              title: "Категория",
              subtitle: "Раздел каталога",
              icon: "🧁",
              href: "/admin/categories",
            },
            {
              title: "Баннер",
              subtitle: "Промо для главной",
              icon: "🖼️",
              href: "/admin/banners",
            },
          ].map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={() => {
                setQuickOpen(false);
                router.push(item.href);
              }}
              className="group flex flex-col gap-3 rounded-3xl border border-[var(--stroke)] bg-white p-5 text-left shadow-sm transition hover:-translate-y-[2px] hover:border-[var(--brand)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)] text-2xl">
                {item.icon}
              </div>
              <div>
                <p className="text-base font-bold text-[var(--ink)]">
                  {item.title}
                </p>
                <p className="text-sm text-[var(--muted)]">{item.subtitle}</p>
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)] group-hover:text-[var(--brand)]">
                Добавить
              </span>
            </button>
          ))}
        </div>
      </Modal>

      <Modal
        open={notifyOpen}
        onClose={() => setNotifyOpen(false)}
        title="Отправить уведомление"
        footer={
          <div className="flex flex-wrap gap-3">
            <PrimaryButton onClick={sendNotification} disabled={notifySending}>
              {notifySending ? "Отправляю..." : "Отправить"}
            </PrimaryButton>
            <GhostButton onClick={() => setNotifyOpen(false)}>
              Отмена
            </GhostButton>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold">
            Заголовок (RU)
            <input
              value={notifyForm.titleRu}
              onChange={(event) =>
                setNotifyForm((prev) => ({ ...prev, titleRu: event.target.value }))
              }
              className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm"
            />
          </label>
          <label className="text-sm font-semibold">
            Заголовок (UZ)
            <input
              value={notifyForm.titleUz}
              onChange={(event) =>
                setNotifyForm((prev) => ({ ...prev, titleUz: event.target.value }))
              }
              className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm"
            />
          </label>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold">
            Описание (RU)
            <textarea
              value={notifyForm.bodyRu}
              onChange={(event) =>
                setNotifyForm((prev) => ({ ...prev, bodyRu: event.target.value }))
              }
              rows={4}
              className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm"
            />
          </label>
          <label className="text-sm font-semibold">
            Описание (UZ)
            <textarea
              value={notifyForm.bodyUz}
              onChange={(event) =>
                setNotifyForm((prev) => ({ ...prev, bodyUz: event.target.value }))
              }
              rows={4}
              className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm"
            />
          </label>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold">
            Картинка (опционально)
            <input
              type="file"
              accept="image/*"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (file) {
                  const url = await uploadImage(file);
                  setNotifyForm((prev) => ({ ...prev, imageUrl: url }));
                }
              }}
              className="mt-2 w-full rounded-2xl border border-dashed border-[var(--stroke)] bg-white px-4 py-3 text-sm text-[var(--muted)]"
            />
          </label>
          {notifyForm.imageUrl ? (
            <div className="overflow-hidden rounded-2xl border border-[var(--stroke)]">
              <img
                src={notifyForm.imageUrl}
                alt="preview"
                className="h-32 w-full object-cover"
              />
            </div>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
