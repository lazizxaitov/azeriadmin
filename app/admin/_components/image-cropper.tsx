"use client";

import { useCallback, useState } from "react";
import Cropper, { Area } from "react-easy-crop";

import { GhostButton, PrimaryButton } from "./ui";

type Props = {
  open: boolean;
  imageSrc: string;
  aspect: number;
  title: string;
  outputType?: string;
  onCancel: () => void;
  onConfirm: (file: File) => void;
};

function createImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}

function getOutputMeta(outputType?: string) {
  const type = outputType ?? "image/jpeg";
  if (type === "image/png") {
    return { type, ext: "png", quality: undefined as number | undefined };
  }
  if (type === "image/webp") {
    return { type, ext: "webp", quality: 0.92 };
  }
  return { type: "image/jpeg", ext: "jpg", quality: 0.92 };
}

async function getCroppedFile(imageSrc: string, crop: Area, outputType?: string) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No canvas context");

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height
  );

  const meta = getOutputMeta(outputType);

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Canvas is empty"));
        return;
      }
      resolve(
        new File([blob], `crop-${Date.now()}.${meta.ext}`, { type: meta.type })
      );
    }, meta.type, meta.quality);
  });
}

export default function ImageCropper({
  open,
  imageSrc,
  aspect,
  title,
  outputType,
  onCancel,
  onConfirm,
}: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6 py-10">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-3xl rounded-3xl border border-[var(--stroke)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-[var(--ink)]">{title}</h3>
          <GhostButton onClick={onCancel}>Закрыть</GhostButton>
        </div>

        <div className="relative h-[380px] w-full overflow-hidden rounded-3xl bg-black/80">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="mt-4">
          <label className="text-sm font-semibold">
            Масштаб
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="mt-2 w-full"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <PrimaryButton
            disabled={saving}
            onClick={async () => {
              if (!croppedAreaPixels) return;
              setSaving(true);
              const file = await getCroppedFile(
                imageSrc,
                croppedAreaPixels,
                outputType
              );
              onConfirm(file);
              setSaving(false);
            }}
          >
            {saving ? "Сохраняю..." : "Обрезать"}
          </PrimaryButton>
          <GhostButton onClick={onCancel}>Отмена</GhostButton>
        </div>
      </div>
    </div>
  );
}
