"use client";

import { useState } from "react";
import Image from "next/image";
import { PhotoAnnotator } from "./photo-annotator";

export interface GalleryPhoto {
  url: string;
  label: string;
}

export interface PhotoGalleryProps {
  photos: GalleryPhoto[];
  jobId: string;
  onAnnotationSave?: (jobId: string, dataUrl: string, label: string) => void;
}

export function PhotoGallery({ photos, jobId, onAnnotationSave }: PhotoGalleryProps) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [annotatingPhoto, setAnnotatingPhoto] = useState<GalleryPhoto | null>(null);

  function handleAnnotationSave(dataUrl: string) {
    if (!annotatingPhoto) return;
    onAnnotationSave?.(jobId, dataUrl, annotatingPhoto.label);
    setAnnotatingPhoto(null);
  }

  if (photos.length === 0) {
    return (
      <p className="text-sm text-[var(--text-muted)]">No photos uploaded yet.</p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((photo, idx) => (
          <div
            key={`${photo.url}-${idx}`}
            className="group relative overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-primary)]"
          >
            {/* Image */}
            <div className="relative h-28 w-full">
              <Image
                src={photo.url}
                alt={`${photo.label} photo ${idx + 1}`}
                fill
                className="object-cover"
                unoptimized
              />

              {/* Hover overlay with action buttons */}
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
                <button
                  type="button"
                  title="View full size"
                  onClick={() => setLightboxUrl(photo.url)}
                  className="flex h-8 items-center gap-1 rounded bg-white/90 px-2 text-xs font-medium text-gray-800 hover:bg-white"
                >
                  🔍 View
                </button>
                <button
                  type="button"
                  title="Annotate photo"
                  onClick={() => setAnnotatingPhoto(photo)}
                  className="flex h-8 items-center gap-1 rounded bg-[var(--accent-color)] px-2 text-xs font-medium text-white hover:bg-[var(--accent-hover)]"
                >
                  ✏️ Annotate
                </button>
              </div>
            </div>

            {/* Label badge */}
            <div className="px-2 py-1.5">
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                  photo.label === "after"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : photo.label === "annotated"
                    ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                }`}
              >
                {photo.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxUrl(null)}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Close"
          >
            ✕
          </button>
          <div className="relative max-h-full max-w-full" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxUrl}
              alt="Full size photo"
              className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            />
          </div>
        </div>
      ) : null}

      {/* Annotator */}
      {annotatingPhoto ? (
        <PhotoAnnotator
          photoUrl={annotatingPhoto.url}
          onSave={handleAnnotationSave}
          onClose={() => setAnnotatingPhoto(null)}
        />
      ) : null}
    </>
  );
}
