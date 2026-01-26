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
};

export default function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropType, setCropType] = useState<string>("image/jpeg");
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
    if (!response.ok) throw new Error("upload failed");
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

  return (
    <div className="space-y-8">
      <SectionTitle
        title="Категории"
        subtitle="Добавляйте и обновляйте категории каталога на двух языках."
      />

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
        ) : items.length === 0 ? (
          <Card>Пока нет категорий.</Card>
        ) : (
          items.map((item) => (
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
                  <GhostButton onClick={() => startEdit(item)}>Ред.</GhostButton>
                  <GhostButton onClick={() => remove(item.id)}>Удал.</GhostButton>
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
        aspect={176 / 81.4}
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
