"use client";

import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { TiptapEditor } from "@/components/editor/tiptap-editor";
import { Toolbar } from "@/components/editor/toolbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { Editor } from "@tiptap/react";
import type { ReactNode } from "react";
import { useState } from "react";

interface NoteEditorLayoutProps {
  title: string;
  onTitleChange: (value: string) => void;
  content: string;
  onContentChange: (value: string) => void;
  headerActions: ReactNode;
  onEditorReady?: (editor: Editor | null) => void;
  fullHeight?: boolean;
  projectId?: string | null;
}

export function NoteEditorLayout({
  title,
  onTitleChange,
  content,
  onContentChange,
  headerActions,
  onEditorReady,
  fullHeight = true,
  projectId,
}: NoteEditorLayoutProps) {
  const router = useRouter();
  const [editor, setEditor] = useState<Editor | null>(null);

  function handleBack() {
    if (projectId) {
      router.push(`/projects/${projectId}`);
    } else {
      router.back();
    }
  }

  const handleEditorReady = (editorInstance: Editor | null) => {
    setEditor(editorInstance);
    if (onEditorReady) {
      onEditorReady(editorInstance);
    }
  };

  return (
    <DashboardLayout
      headerContent={
        <div className="flex items-center gap-2 flex-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Untitled"
            className="text-sm font-medium border-0 shadow-none focus-visible:ring-0 p-2 h-9 flex-1 min-w-0 bg-muted/30 hover:bg-muted/50 transition-colors rounded-md"
          />
        </div>
      }
      headerActions={headerActions}
      fullHeight={fullHeight}
    >
      <Toolbar editor={editor} />
      <TiptapEditor
        content={content}
        onChange={onContentChange}
        className="flex-1"
        hideToolbar
        onEditorReady={handleEditorReady}
      />
    </DashboardLayout>
  );
}
