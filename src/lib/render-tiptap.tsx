import { Fragment, type ReactNode } from "react";

/**
 * Render a Tiptap/ProseMirror document (stored as JSON) to React.
 * Strict allow-list: unknown node/mark types are skipped, never passed through
 * as raw HTML. See big-01 "Rich text safety".
 */

type Mark = { type: string; attrs?: Record<string, unknown> };
type Node = {
  type: string;
  content?: Node[];
  text?: string;
  marks?: Mark[];
  attrs?: Record<string, unknown>;
};

function applyMarks(text: string, marks: Mark[] | undefined, key: number): ReactNode {
  if (!marks?.length) return text;
  return marks.reduce<ReactNode>((acc, mark) => {
    switch (mark.type) {
      case "bold":
        return <strong>{acc}</strong>;
      case "italic":
        return <em>{acc}</em>;
      case "code":
        return <code className="rounded bg-line px-1 py-0.5 text-sm">{acc}</code>;
      case "link": {
        const href = String(mark.attrs?.href ?? "#");
        return (
          <a
            href={href}
            className="text-accent underline underline-offset-2"
            rel="noopener noreferrer nofollow"
            target={href.startsWith("/") ? undefined : "_blank"}
          >
            {acc}
          </a>
        );
      }
      default:
        return acc;
    }
  }, <Fragment key={key}>{text}</Fragment>);
}

function renderNode(node: Node, key: number): ReactNode {
  const kids = node.content?.map((c, i) => renderNode(c, i));

  switch (node.type) {
    case "doc":
      return <Fragment key={key}>{kids}</Fragment>;
    case "paragraph":
      return <p key={key} className="my-5 text-ink-soft">{kids}</p>;
    case "heading": {
      const level = Number(node.attrs?.level ?? 2);
      const cls =
        level <= 2
          ? "font-display text-2xl mt-10 mb-3 font-bold"
          : "font-display text-xl mt-8 mb-2 font-bold";
      const Tag = (`h${Math.min(Math.max(level, 2), 4)}`) as "h2" | "h3" | "h4";
      return <Tag key={key} className={cls}>{kids}</Tag>;
    }
    case "bulletList":
      return <ul key={key} className="my-5 list-disc space-y-1.5 pl-6 text-ink-soft">{kids}</ul>;
    case "orderedList":
      return <ol key={key} className="my-5 list-decimal space-y-1.5 pl-6 text-ink-soft">{kids}</ol>;
    case "listItem":
      return <li key={key} className="pl-1">{kids}</li>;
    case "blockquote":
      return (
        <blockquote key={key} className="my-6 border-l-4 border-accent pl-4 text-xl italic text-muted">
          {kids}
        </blockquote>
      );
    case "horizontalRule":
      return <hr key={key} className="my-8 border-line" />;
    case "hardBreak":
      return <br key={key} />;
    case "image": {
      const src = String(node.attrs?.src ?? "");
      if (!src) return null;
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={key}
          src={src}
          alt={String(node.attrs?.alt ?? "")}
          className="my-6 w-full rounded-lg"
        />
      );
    }
    case "text":
      // Wrap in a keyed Fragment: applyMarks may return a mark element
      // (<a>, <strong>, …) with no key, which warns when it's a mapped child.
      return <Fragment key={key}>{applyMarks(node.text ?? "", node.marks, key)}</Fragment>;
    default:
      return null; // unknown node — dropped
  }
}

export function RenderTiptap({ doc }: { doc: unknown }) {
  if (!doc || typeof doc !== "object") return null;
  return <>{renderNode(doc as Node, 0)}</>;
}
