"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { postComment } from "@/app/(site)/article/[slug]/actions";

export function CommentForm({
  articleId,
  slug,
  signedIn,
  onPosted,
}: {
  articleId: string;
  slug: string;
  signedIn: boolean;
  onPosted?: () => void;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  if (!signedIn) {
    return (
      <p className="rounded-lg border border-line bg-surface p-4 text-sm text-muted">
        <Link href="/login" className="text-accent hover:underline">Sign in</Link> or{" "}
        <Link href="/register" className="text-accent hover:underline">create an account</Link> to comment.
      </p>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setNote(null);
    start(async () => {
      const res = await postComment(articleId, slug, body);
      if (!res.ok) {
        setNote({ ok: false, text: res.error ?? "Could not post." });
        return;
      }
      setBody("");
      setNote({
        ok: true,
        text:
          res.status === "APPROVED"
            ? "Posted."
            : "Thanks — your comment is awaiting moderation.",
      });
      onPosted?.();
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        required
        aria-label="Add a comment"
        placeholder="Add a comment"
        className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending || body.trim().length < 2}
          className="rounded-md bg-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {pending ? "Posting…" : "Post comment"}
        </button>
        {note && (
          <span className={`text-xs ${note.ok ? "text-success" : "text-error"}`}>{note.text}</span>
        )}
      </div>
    </form>
  );
}
