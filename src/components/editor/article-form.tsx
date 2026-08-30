"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import { TiptapEditor } from "./tiptap-editor";
import { CoverImagePicker, type CoverValue } from "./cover-image-picker";
import { saveArticle, type SaveResult } from "@/app/studio/articles/actions";

type Section = { id: string; name: string };

type Existing = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  sectionId: string;
  body: unknown;
  tags: string[];
  cover: CoverValue;
};

export function ArticleForm({
  sections,
  article,
}: {
  sections: Section[];
  article?: Existing;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? "");
  const [sectionId, setSectionId] = useState(article?.sectionId ?? sections[0]?.id ?? "");
  const [tags, setTags] = useState((article?.tags ?? []).join(", "));
  const [cover, setCover] = useState<CoverValue>(article?.cover ?? { url: "", alt: "" });
  const [body, setBody] = useState<JSONContent>(
    (article?.body as JSONContent) ?? { type: "doc", content: [{ type: "paragraph" }] },
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const res: SaveResult = await saveArticle({
        id: article?.id,
        title,
        slug: slug || undefined,
        excerpt,
        sectionId,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        coverMediaId: cover.mediaId,
        coverImageUrl: cover.mediaId ? undefined : cover.url,
        coverAlt: cover.alt,
        body,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push(`/studio/articles/${res.id}/edit`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_260px]">
      <div className="flex flex-col gap-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Headline"
          className="w-full rounded-lg border border-line bg-surface px-4 py-3 text-2xl font-bold outline-none focus:border-accent"
        />
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Standfirst / excerpt (shown on cards and in search)"
          rows={2}
          className="w-full rounded-lg border border-line bg-surface px-4 py-2 text-base outline-none focus:border-accent"
        />
        <TiptapEditor initialContent={body} onChange={setBody} />
      </div>

      <aside className="flex flex-col gap-4 text-sm">
        {error && (
          <p className="rounded-md bg-accent/10 px-3 py-2 text-accent">{error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent px-4 py-2 font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {pending ? "Saving…" : article ? "Save changes" : "Create draft"}
        </button>

        <label className="flex flex-col gap-1">
          <span className="text-muted">Section</span>
          <select
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            className="rounded-md border border-line bg-surface px-3 py-2 outline-none focus:border-accent"
          >
            {sections.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-muted">URL slug</span>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="auto from headline"
            className="rounded-md border border-line bg-surface px-3 py-2 outline-none focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-muted">Tags (comma-separated)</span>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="interview, box-office"
            className="rounded-md border border-line bg-surface px-3 py-2 outline-none focus:border-accent"
          />
        </label>

        <CoverImagePicker value={cover} onChange={setCover} />
      </aside>
    </form>
  );
}
