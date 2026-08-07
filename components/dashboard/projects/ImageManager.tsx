"use client";

import { useRef, useState } from "react";
import type { DragEvent } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProjectImage = {
  url: string;
  isCover: boolean;
};

type ImageManagerProps = {
  images: ProjectImage[];
  onChange: (images: ProjectImage[]) => void;
};

export function ImageManager({ images, onChange }: ImageManagerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFiles(files: FileList | File[]) {
    const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length === 0) return;

    setError(null);
    setUploadingCount((count) => count + imageFiles.length);

    const results = await Promise.allSettled(
      imageFiles.map(async (file) => {
        const formData = new FormData();
        formData.set("file", file);

        const response = await fetch("/api/projects/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("upload_failed");
        }

        const data = (await response.json()) as { url: string };
        return data.url;
      })
    );

    const uploadedUrls = results
      .filter((result): result is PromiseFulfilledResult<string> => result.status === "fulfilled")
      .map((result) => result.value);

    if (results.some((result) => result.status === "rejected")) {
      setError("Alguna imagen no se pudo subir. Intenta de nuevo.");
    }

    if (uploadedUrls.length > 0) {
      const hasCover = images.some((image) => image.isCover);
      const nextImages = [
        ...images,
        ...uploadedUrls.map((url, index) => ({
          url,
          isCover: !hasCover && index === 0,
        })),
      ];
      onChange(nextImages);
    }

    setUploadingCount((count) => Math.max(0, count - imageFiles.length));
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files?.length) {
      void uploadFiles(event.dataTransfer.files);
    }
  }

  function setCover(url: string) {
    onChange(images.map((image) => ({ ...image, isCover: image.url === url })));
  }

  function removeImage(url: string) {
    const remaining = images.filter((image) => image.url !== url);
    const removedWasCover = images.find((image) => image.url === url)?.isCover;

    if (removedWasCover && remaining.length > 0) {
      remaining[0] = { ...remaining[0], isCover: true };
    }

    onChange(remaining);
  }

  return (
    <div className="grid gap-3">
      <label
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-8 text-center transition-colors",
          isDragging ? "border-orange bg-orange/10" : "border-white/15 bg-background hover:border-orange/80"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(event) => {
            if (event.target.files?.length) void uploadFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <ImagePlus className="h-6 w-6 text-orange" />
        <p className="text-sm font-medium text-foreground">
          Arrastrar imagenes o hacer click para seleccionar
        </p>
        <p className="text-xs text-paragraph">Podes subir varias a la vez. PNG, JPG, WEBP o AVIF.</p>
      </label>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {(images.length > 0 || uploadingCount > 0) && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((image) => (
            <button
              key={image.url}
              type="button"
              onClick={() => setCover(image.url)}
              className={cn(
                "group relative aspect-video overflow-hidden rounded-lg border-2 transition-colors",
                image.isCover ? "border-orange" : "border-white/10 hover:border-white/30"
              )}
            >
              <Image src={image.url} alt="" fill unoptimized className="object-cover" />

              {image.isCover && (
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-orange px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
                  <Star className="h-3 w-3" />
                  Portada
                </span>
              )}

              <span
                role="button"
                tabIndex={0}
                onClick={(event) => {
                  event.stopPropagation();
                  removeImage(image.url);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.stopPropagation();
                    removeImage(image.url);
                  }
                }}
                className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            </button>
          ))}

          {Array.from({ length: uploadingCount }).map((_, index) => (
            <div
              key={`uploading-${index}`}
              className="flex aspect-video items-center justify-center rounded-lg border border-white/10 bg-background"
            >
              <Loader2 className="h-5 w-5 animate-spin text-paragraph" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
