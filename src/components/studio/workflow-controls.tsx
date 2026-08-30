"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ArticleStatus } from "@prisma/client";
import { transitionArticle } from "@/app/studio/articles/actions";

const LABELS: Record<ArticleStatus, string> = {
  DRAFT: "Move to draft",
  IN_REVIEW: "Submit for review",
  SCHEDULED: "Schedule",
  PUBLISHED: "Publish now",
  ARCHIVED: "Archive",
};

export function WorkflowControls({
  articleId,
  status,
  canPublish,
  isAuthor,
}: {
  articleId: string;
  status: ArticleStatus;
  canPublish: boolean;
  isAuthor: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");

  // Which targets this user may choose from the current state.
  const EDITOR_TARGETS: Record<ArticleStatus, ArticleStatus[]> = {
    DRAFT: ["IN_REVIEW", "SCHEDULED", "PUBLISHED"],
    IN_REVIEW: ["DRAFT", "SCHEDULED", "PUBLISHED"],
    SCHEDULED: ["DRAFT", "PUBLISHED"],
    PUBLISHED: ["DRAFT", "ARCHIVED"],
    ARCHIVED: ["DRAFT", "PUBLISHED"],
  };

  let targets: ArticleStatus[] = [];
  if (canPublish) {
    targets = EDITOR_TARGETS[status];
  } else if (isAuthor) {
    if (status === "DRAFT") targets = ["IN_REVIEW"];
    else if (status === "IN_REVIEW") targets = ["DRAFT"];
  }

  function go(to: ArticleStatus) {
    setError("");
    start(async () => {
      const res = await transitionArticle(
        articleId,
        to,
        to === "SCHEDULED" ? scheduledFor : undefined,
      );
      if (!res.ok) setError(res.error ?? "Failed");
      else router.refresh();
    });
  }

  if (targets.length === 0) {
    return <p className="text-xs text-muted">No actions available in your role.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {targets.includes("SCHEDULED") && (
        <input
          type="datetime-local"
          value={scheduledFor}
          onChange={(e) => setScheduledFor(e.target.value)}
          className="rounded-md border border-line bg-surface px-2 py-1 text-xs"
        />
      )}
      {targets.map((t) => (
        <button
          key={t}
          onClick={() => go(t)}
          disabled={pending}
          className={`rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-60 ${
            t === "PUBLISHED"
              ? "bg-accent text-white hover:bg-accent-hover"
              : "border border-line hover:bg-bg"
          }`}
        >
          {LABELS[t]}
        </button>
      ))}
      {error && <p className="text-xs text-accent">{error}</p>}
    </div>
  );
}
