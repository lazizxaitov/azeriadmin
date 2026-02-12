"use client";

import { useEffect, useState } from "react";

import {
  Card,
  SectionTitle,
  PrimaryButton,
  GhostButton,
  Modal,
} from "../_components/ui";
import ImageCropper from "../_components/image-cropper";

type Category = {
  id: number;
  name_ru: string;
  name_uz: string;
  slug: string;
  image_url?: string | null;
  sort_order?: number | null;
};

export default function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropType, setCropType] = useState<string>("image/jpeg");
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState({
    nameRu: "",
    nameUz: "",
    slug: "",
    imageUrl: "",
  });

  const load = () => {
    setLoading(true);
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setItems(data.items ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm({ nameRu: "", nameUz: "", slug: "", imageUrl: "" });
  };

  const startEdit = (item: Category) => {
    setEditingId(item.id);
    setModalOpen(true);
    setForm({
      nameRu: item.name_ru,
      nameUz: item.name_uz,
      slug: item.slug,
      imageUrl: item.image_url ?? "",
    });
  };

  const uploadImage = async (file: File) => {
    const body = new FormData();
    body.append("file", file);
    const response = await fetch("/api/upload", { method: "POST", body });
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      const message = error?.error ?? `Upload failed (${response.status})`;
      throw new Error(message);
    }
    const data = await response.json();
    return data.url as string;
  };

  const submit = async () => {
    const payload = {
      nameRu: form.nameRu,
      nameUz: form.nameUz,
      slug: form.slug,
      imageUrl: form.imageUrl || null,
    };

    if (editingId) {
      await fetch(`/api/categories/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    resetForm();
    setModalOpen(false);
    load();
  };

  const remove = async (id: number) => {
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    load();
  };

  const moveCategory = async (id: number, direction: "up" | "down") => {
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const current = items[index];
    const target = items[targetIndex];
    const currentOrder = Number(current.sort_order ?? 0);
    const targetOrder = Number(target.sort_order ?? 0);

    await Promise.all([
      fetch(`/api/categories/${current.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameRu: current.name_ru,
          nameUz: current.name_uz,
          slug: current.slug,
          imageUrl: current.image_url ?? null,
          sortOrder: targetOrder,
        }),
      }),
      fetch(`/api/categories/${target.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameRu: target.name_ru,
          nameUz: target.name_uz,
          slug: target.slug,
          imageUrl: target.image_url ?? null,
          sortOrder: currentOrder,
        }),
      }),
    ]);

    load();
  };


  const filteredItems = items.filter((item) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
  
  const updateSortOrder = async (id: number, value: number) => {
    const item = items.find((cat) => cat.id === id);
    if (!item) return;
    await fetch(`/api/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nameRu: item.name_ru,
        nameUz: item.name_uz,
        slug: item.slug,
        imageUrl: item.image_url ?? null,
        sortOrder: value,
      }),
    });
    load();
  };
  return (
      item.name_ru.toLowerCase().includes(query) ||
      item.name_uz.toLowerCase().includes(query) ||
      item.slug.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[var(--ink)]">
            {"Категории"}
          </h2>
          <p className="mt-1 text-sm font-medium text-[var(--muted)]">
            {"Добавляйте и обновляйте категории каталога на двух языках."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={"Поиск по категориям"}
            className="h-9 w-52 rounded-2xl border border-[var(--stroke)] bg-white px-3 text-xs"
          />
          <GhostButton onClick={() => setSearchQuery("")}>
            {"Поиск"}
          </GhostButton>
        </div>
      </div>


      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-[var(--ink)]">
            Список категорий
          </h3>
          <p className="text-sm text-[var(--muted)]">
            Добавляйте и редактируйте категории через модальное окно.
          </p>
        </div>
        <PrimaryButton
          onClick={() => {
            resetForm();
            setModalOpen(true);
          }}
        >
          Добавить
        </PrimaryButton>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {loading ? (
          <Card>Загрузка...</Card>
        ) : filteredItems.length === 0 ? (
          <Card>Пока нет категорий.</Card>
        ) : (
          filteredItems.map((item) => (
            <Card key={item.id} className="flex flex-col gap-4">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name_ru}
                  className="h-36 w-full rounded-2xl object-cover"
                />
              ) : null}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-bold text-[var(--ink)]">
                    {item.name_ru}
                  </p>
                  <p className="text-sm text-[var(--muted)]">
                    {item.name_uz}
                  </p>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    slug: {item.slug}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <GhostButton onClick={() => moveCategory(item.id, "up")}>
                      {"\u2191"}
                    </GhostButton>
                    <GhostButton onClick={() => moveCategory(item.id, "down")}>
                      {"\u2193"}
                    </GhostButton>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--muted)]">{"\u041f\u043e\u0440\u044f\u0434\u043e\u043a"}</span>
                    <input
                      type="number"
                      value={item.sort_order ?? 0}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        setItems((prev) =>
                          prev.map((cat) =>
                            cat.id === item.id
                              ? { ...cat, sort_order: value }
                              : cat
                          )
                        );
                      }}
                      onBlur={(event) => {
                        const value = Number(event.target.value);
                        if (Number.isFinite(value)) {
                          updateSortOrder(item.id, value);
                        }
                      }}
                      className="w-20 rounded-2xl border border-[var(--stroke)] bg-white px-2 py-1 text-xs"
                    />
                  </div>
                  <GhostButton onClick={() => startEdit(item)}>{"\u0420\u0435\u0434."}</GhostButton>
                  <GhostButton onClick={() => remove(item.id)}>{"\u0423\u0434\u0430\u043b."}</GhostButton>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
        title={editingId ? "Редактировать категорию" : "Новая категория"}
        footer={
          <div className="flex flex-wrap gap-3">
            <PrimaryButton onClick={submit}>
              {editingId ? "Сохранить" : "Создать"}
            </PrimaryButton>
            <GhostButton onClick={resetForm}>Очистить</GhostButton>
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold">
            Название (RU)
            <input
              value={form.nameRu}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, nameRu: event.target.value }))
              }
              className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm font-medium text-[var(--ink)]"
            />
          </label>
          <label className="text-sm font-semibold">
            Название (UZ)
            <input
              value={form.nameUz}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, nameUz: event.target.value }))
              }
              className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm font-medium text-[var(--ink)]"
            />
          </label>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold">
            Slug (optional)
            <input
              value={form.slug}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, slug: event.target.value }))
              }
              className="mt-2 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm font-medium text-[var(--ink)]"
            />
          </label>
          <label className="text-sm font-semibold">
            Фото категории
            <input
              type="file"
              accept="image/*"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => {
                    setCropSrc(reader.result as string);
                    setCropType(file.type || "image/jpeg");
                    setCropOpen(true);
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="mt-2 w-full rounded-2xl border border-dashed border-[var(--stroke)] bg-white px-4 py-3 text-sm text-[var(--muted)]"
            />
          </label>
        </div>

        {form.imageUrl ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--stroke)]">
            <img
              src={form.imageUrl}
              alt="preview"
              className="h-40 w-full object-cover"
            />
          </div>
        ) : null}
      </Modal>


      <ImageCropper
        open={cropOpen && Boolean(cropSrc)}
        imageSrc={cropSrc ?? ""}
        aspect={3 / 2}
        maxWidth={900}
        maxHeight={600}
        title="Обрезка категории"
        onCancel={() => {
          setCropOpen(false);
          setCropSrc(null);
        }}
        outputType={cropType}
        onConfirm={async (file) => {
          const url = await uploadImage(file);
          setForm((prev) => ({ ...prev, imageUrl: url }));
          setCropOpen(false);
          setCropSrc(null);
        }}
      />
    </div>
  );
}