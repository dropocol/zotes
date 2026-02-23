"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Toolbar } from "./toolbar";
import { forwardRef, useImperativeHandle, useEffect } from "react";
import type { Editor } from "@tiptap/react";

interface TiptapEditorProps {
  content?: string;
  onChange: (content: string) => void;
  editable?: boolean;
  className?: string;
  hideToolbar?: boolean;
  onEditorReady?: (editor: Editor | null) => void;
}

export interface TiptapEditorRef {
  getEditor: () => Editor | null;
}

export const TiptapEditor = forwardRef<TiptapEditorRef, TiptapEditorProps>(
  function TiptapEditor(
    {
      content = "",
      onChange,
      editable = true,
      className = "",
      hideToolbar = false,
      onEditorReady,
    },
    ref
  ) {
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
          class: "prose prose-sm max-w-none focus:outline-none p-6",
        },
      },
    });

    useEffect(() => {
      if (editor && onEditorReady) {
        onEditorReady(editor);
      }
    }, [editor, onEditorReady]);

    useImperativeHandle(ref, () => ({
      getEditor: () => editor,
    }));

    return (
      <div className={`flex flex-col h-full overflow-y-auto ${className}`}>
        {editable && !hideToolbar && <Toolbar editor={editor} />}
        <div className="flex-1">
          <div className="max-w-[720px] mx-auto">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    );
  }
);
