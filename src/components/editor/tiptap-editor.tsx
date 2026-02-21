"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Toolbar } from "./toolbar";

interface TiptapEditorProps {
  content?: string;
  onChange: (content: string) => void;
  editable?: boolean;
  className?: string;
}

export function TiptapEditor({
  content = "",
  onChange,
  editable = true,
  className = "",
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none p-4",
      },
    },
  });

  return (
    <div className={`overflow-hidden flex flex-col ${className}`}>
      {editable && <Toolbar editor={editor} />}
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
}
