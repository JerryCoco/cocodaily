"use client";

import { useCallback, useEffect, useState } from "react";
import { CommentForm } from "./comment-form";

type C = { id: string; body: string; createdAt: string; author: string };

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export function Comments({ articleId, slug }: { articleId: string; slug: string }) {
  const [signedIn, setSignedIn] = useState(false);
  const [comments, setComments] = useState<C[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/reader/context?articleId=${articleId}`)
      .then((r) => r.json())
      .then((d) => {
        setSignedIn(!!d.signedIn);
        setComments(Array.isArray(d.comments) ? d.comments : []);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [articleId]);

  useEffect(load, [load]);

  return (
    <section className="mt-12 border-t border-line pt-8">
      <h2 className="font-display text-2xl font-extrabold">
        Comments {loaded && <span className="text-muted">({comments.length})</span>}
      </h2>

      <div className="mt-4">
        <CommentForm articleId={articleId} slug={slug} signedIn={signedIn} onPosted={load} />
      </div>

      <ul className="mt-6 flex flex-col divide-y divide-line">
        {comments.map((c) => (
          <li key={c.id} className="py-4">
            <p className="text-sm font-semibold">{c.author}</p>
            <p className="text-xs text-muted">{fmt(c.createdAt)}</p>
            <p className="mt-2 whitespace-pre-wrap text-[15px]">{c.body}</p>
          </li>
        ))}
        {loaded && comments.length === 0 && (
          <li className="py-4 text-sm text-muted">Be the first to comment.</li>
        )}
      </ul>
    </section>
  );
}
