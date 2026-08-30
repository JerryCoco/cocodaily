"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { restoreRevision } from "@/app/studio/articles/actions";

type Revision = {
  id: string;
  title: string;
  createdAt: string;
  editorName: string | null;
};

export function RevisionList({
  articleId,
  revisions,
}: {
  articleId: string;
  revisions: Revision[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  if (revisions.length === 0) {
    return <p className="text-xs text-muted">No revisions yet — they&apos;re saved on each edit.</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-line text-sm">
      {revisions.map((r) => (
        <li key={r.id} className="flex items-center justify-between py-2">
          <div>
            <p className="font-medium">{r.title}</p>
            <p className="text-xs text-muted">
              {new Date(r.createdAt).toLocaleString()} · {r.editorName ?? "unknown"}
            </p>
          </div>
          <button
            disabled={pending}
            onClick={() => {
              setBusyId(r.id);
              start(async () => {
                await restoreRevision(articleId, r.id);
                setBusyId(null);
                router.refresh();
              });
            }}
            className="rounded-md border border-line px-3 py-1 text-xs hover:bg-bg disabled:opacity-60"
          >
            {busyId === r.id ? "Restoring…" : "Restore"}
          </button>
        </li>
      ))}
    </ul>
  );
}
