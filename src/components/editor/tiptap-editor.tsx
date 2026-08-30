"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { useCallback } from "react";
import type { JSONContent } from "@tiptap/react";

function ToolbarButton({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`rounded px-2 py-1 text-sm ${
        active ? "bg-ink text-white" : "text-muted hover:bg-bg"
      }`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const addLink = useCallback(() => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    const url = window.prompt("Image URL");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-line px-2 py-1.5">
      <ToolbarButton active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <b>B</b>
      </ToolbarButton>
      <ToolbarButton active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <i>I</i>
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        H3
      </ToolbarButton>
      <ToolbarButton active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        • List
      </ToolbarButton>
      <ToolbarButton active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        1. List
      </ToolbarButton>
      <ToolbarButton active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        &ldquo; Quote
      </ToolbarButton>
      <ToolbarButton active={editor.isActive("link")} onClick={addLink}>
        Link
      </ToolbarButton>
      <ToolbarButton onClick={addImage}>Image</ToolbarButton>
    </div>
  );
}

export function TiptapEditor({
  initialContent,
  onChange,
}: {
  initialContent?: JSONContent;
  onChange: (json: JSONContent) => void;
}) {
  const editor = useEditor({
    immediatelyRender: false, // required for Next SSR
    extensions: [
      // StarterKit v3 bundles its own Link; disable it so our configured one wins.
      StarterKit.configure({ heading: { levels: [2, 3] }, link: false }),
      Link.configure({ openOnClick: false, autolink: true }),
      Image,
      Placeholder.configure({ placeholder: "Write the story…" }),
    ],
    content: initialContent ?? { type: "doc", content: [{ type: "paragraph" }] },
    editorProps: {
      attributes: {
        class:
          "prose-none min-h-[320px] px-4 py-3 text-lg leading-7 focus:outline-none [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:text-xl [&_h3]:font-bold [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-accent [&_blockquote]:pl-4 [&_blockquote]:italic [&_a]:text-accent [&_a]:underline",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
  });

  if (!editor) return <div className="h-[360px] rounded-lg border border-line bg-surface" />;

  return (
    <div className="rounded-lg border border-line bg-surface">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
