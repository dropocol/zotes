"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { NoteHeaderActions } from "@/components/notes/note-header-actions";
import { NoteEditorLayout } from "@/components/notes/note-editor-layout";
import { useNoteAutoSave } from "@/hooks/use-note-auto-save";
import type { Editor } from "@tiptap/react";

// Default content with empty paragraphs for easier editing
const DEFAULT_CONTENT = "<p></p><p></p><p></p>";

export default function NewNotePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [selectedProject, setSelectedProject] = useState<string | null>(projectId || null);
  const [editor, setEditor] = useState<Editor | null>(null);

  const { autoSaveStatus, isSaving, save } = useNoteAutoSave({
    title,
    content,
    projectId: selectedProject,
    hasChanges: true,
  });

  const headerActions = (
    <NoteHeaderActions
      autoSaveStatus={autoSaveStatus}
      isSaving={isSaving}
      selectedProject={selectedProject}
      onProjectChange={setSelectedProject}
      onSave={save}
    />
  );

  return (
    <NoteEditorLayout
      title={title}
      onTitleChange={setTitle}
      content={content}
      onContentChange={setContent}
      headerActions={headerActions}
      onEditorReady={setEditor}
      projectId={selectedProject}
    />
  );
}
