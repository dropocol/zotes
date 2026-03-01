"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Toolbar } from "./toolbar";
import { forwardRef, useImperativeHandle, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { cn } from "@/lib/utils";

interface TiptapEditorProps {
  content?: string;
  onChange: (content: string) => void;
  editable?: boolean;
  className?: string;
  hideToolbar?: boolean;
  onEditorReady?: (editor: Editor | null) => void;
  placeholder?: string;
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
      placeholder = "Write something amazing...",
    },
    ref
  ) {
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3, 4, 5, 6],
          },
          bulletList: {
            HTMLAttributes: {
              class: "list-disc pl-6",
            },
          },
          orderedList: {
            HTMLAttributes: {
              class: "list-decimal pl-6",
            },
          },
          blockquote: {
            HTMLAttributes: {
              class: "border-l-4 border-primary pl-4 italic text-muted-foreground",
            },
          },
          codeBlock: {
            HTMLAttributes: {
              class: "bg-muted rounded-md p-4 font-mono text-sm overflow-x-auto",
            },
          },
          code: {
            HTMLAttributes: {
              class: "bg-muted px-1.5 py-0.5 rounded text-sm font-mono",
            },
          },
        }),
        Placeholder.configure({
          placeholder,
          emptyEditorClass: "is-editor-empty",
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: "text-primary underline underline-offset-2 hover:opacity-80 transition-opacity",
          },
        }),
        Image.configure({
          inline: true,
          HTMLAttributes: {
            class: "rounded-lg max-w-full h-auto",
          },
        }),
        TextAlign.configure({
          types: ["heading", "paragraph"],
          alignments: ["left", "center", "right"],
          defaultAlignment: "left",
        }),
        Underline,
        TaskList.configure({
          HTMLAttributes: {
            class: "not-prose pl-2",
          },
        }),
        TaskItem.configure({
          nested: true,
          HTMLAttributes: {
            class: "flex items-start my-1",
          },
        }),
      ],
      content,
      editable,
      immediatelyRender: false,
      onUpdate: ({ editor }) => {
        onChange(editor.getHTML());
      },
      editorProps: {
        attributes: {
          class: cn(
            // Base prose classes
            "prose prose-lg max-w-none focus:outline-none",
            // Color customization
            "prose-headings:font-semibold prose-headings:tracking-tight",
            "prose-h1:text-3xl prose-h1:mt-8 prose-h1:mb-4",
            "prose-h2:text-2xl prose-h2:mt-6 prose-h2:mb-3",
            "prose-h3:text-xl prose-h3:mt-4 prose-h3:mb-2",
            // Links
            "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
            // Strong/bold
            "prose-strong:font-semibold prose-strong:text-foreground",
            // Code blocks
            "prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:text-primary",
            "prose-pre:bg-muted prose-pre:border prose-pre:border-border",
            // Blockquotes
            "prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground",
            // Lists
            "prose-ul:list-disc prose-ul:pl-6",
            "prose-ol:list-decimal prose-ol:pl-6",
            "prose-li:my-1",
            // Horizontal rule
            "prose-hr:border-border prose-hr:my-6",
            // Images
            "prose-img:rounded-lg prose-img:my-4",
            // Tables
            "prose-table:border-collapse prose-table:w-full prose-table:my-4",
            "prose-thead:border-b prose-thead:border-border prose-thead:bg-muted/50",
            "prose-th:border prose-th:border-border prose-th:px-4 prose-th:py-2 prose-th:text-left",
            "prose-td:border prose-td:border-border prose-td:px-4 prose-td:py-2",
            // Spacing
            "prose-p:my-3 prose-p:leading-7",
            "prose-figure:my-4",
            "prose-figcaption:mt-2 prose-figcaption:text-center prose-figcaption:text-sm prose-figcaption:text-muted-foreground",
            // Padding
            "p-6 min-h-[300px]",
            // Dark mode
            "dark:prose-invert dark:prose-headings:text-foreground dark:prose-strong:text-foreground",
            "dark:prose-code:bg-muted dark:prose-pre:bg-muted"
          ),
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
      <div className={cn("flex flex-col h-full overflow-y-auto bg-card", className)}>
        {editable && !hideToolbar && <Toolbar editor={editor} />}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-2">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    );
  }
);
