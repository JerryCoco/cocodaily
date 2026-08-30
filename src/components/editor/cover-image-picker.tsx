"use client";

import { useRef, useState } from "react";

export type CoverValue = {
  mediaId?: string;
  url: string;
  publicId?: string;
  alt: string;
};

export function CoverImagePicker({
  value,
  onChange,
}: {
  value: CoverValue;
  onChange: (v: CoverValue) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    setError("");
    if (!value.alt.trim()) {
      setError("Add alt text first, then choose the file.");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("alt", value.alt.trim());
      const res = await fetch("/api/media/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onChange({ mediaId: data.id, url: data.url, publicId: data.publicId, alt: data.alt });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-muted">Cover image</span>

      <input
        value={value.alt}
        onChange={(e) => onChange({ ...value, alt: e.target.value })}
        placeholder="Alt text (describe the image) — required"
        className="rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
      />

      <div className="mt-1 flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="rounded-md border border-line px-3 py-1.5 text-sm hover:bg-bg disabled:opacity-60"
        >
          {busy ? "Uploading…" : value.url ? "Replace image" : "Upload image"}
        </button>
        {value.url && (
          <button
            type="button"
            onClick={() => onChange({ url: "", alt: value.alt })}
            className="text-xs text-muted hover:text-error"
          >
            Remove
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
        }}
      />

      <input
        value={value.publicId ? "" : value.url}
        onChange={(e) => onChange({ ...value, url: e.target.value, publicId: undefined, mediaId: undefined })}
        placeholder="…or paste an image URL"
        className="mt-1 rounded-md border border-line bg-surface px-3 py-2 text-xs outline-none focus:border-accent"
      />

      {error && <p className="text-xs text-error">{error}</p>}

      {value.url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value.url}
          alt={value.alt}
          className="mt-1 aspect-[3/2] w-full rounded-md object-cover"
        />
      )}
    </div>
  );
}
