import type { ArticleStatus } from "@prisma/client";

const STYLES: Record<ArticleStatus, { label: string; color: string }> = {
  DRAFT: { label: "Draft", color: "var(--color-status-draft)" },
  IN_REVIEW: { label: "In review", color: "var(--color-status-review)" },
  SCHEDULED: { label: "Scheduled", color: "var(--color-status-scheduled)" },
  PUBLISHED: { label: "Published", color: "var(--color-status-published)" },
  ARCHIVED: { label: "Archived", color: "var(--color-status-archived)" },
};

export function StatusBadge({ status }: { status: ArticleStatus }) {
  const s = STYLES[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ color: s.color, backgroundColor: `${s.color}1a` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.color }} />
      {s.label}
    </span>
  );
}
