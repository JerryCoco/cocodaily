"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CommentStatus } from "@prisma/client";
import { moderateComment } from "@/app/studio/comments/actions";

type Row = {
  id: string;
  body: string;
  createdAt: string;
  status: CommentStatus;
  author: string;
  articleTitle: string;
  articleSlug: string;
};

export function CommentModRow({ row }: { row: Row }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const act = (a: "approve" | "reject" | "spam" | "delete") =>
    start(async () => {
      await moderateComment(row.id, a);
      router.refresh();
    });

  return (
    <li className="flex flex-col gap-2 py-4">
      <div className="flex items-center gap-2 text-xs text-muted">
        <span className="font-semibold text-ink">{row.author}</span>
        <span>on</span>
        <Link href={`/article/${row.articleSlug}`} className="text-accent hover:underline">
          {row.articleTitle}
        </Link>
        <span>· {new Date(row.createdAt).toLocaleString()}</span>
        <span className="uppercase">· {row.status.toLowerCase()}</span>
      </div>
      <p className="whitespace-pre-wrap text-sm">{row.body}</p>
      <div className="flex gap-2">
        {row.status !== "APPROVED" && (
          <button onClick={() => act("approve")} disabled={pending} className="rounded border border-line px-3 py-1 text-xs hover:bg-bg disabled:opacity-50">
            Approve
          </button>
        )}
        {row.status !== "REJECTED" && (
          <button onClick={() => act("reject")} disabled={pending} className="rounded border border-line px-3 py-1 text-xs hover:bg-bg disabled:opacity-50">
            Reject
          </button>
        )}
        {row.status !== "SPAM" && (
          <button onClick={() => act("spam")} disabled={pending} className="rounded border border-line px-3 py-1 text-xs hover:bg-bg disabled:opacity-50">
            Spam
          </button>
        )}
        <button onClick={() => act("delete")} disabled={pending} className="rounded border border-line px-3 py-1 text-xs text-error hover:bg-bg disabled:opacity-50">
          Delete
        </button>
      </div>
    </li>
  );
}
