"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { NoteHeaderActions } from "@/components/notes/note-header-actions";
import { NoteEditorLayout } from "@/components/notes/note-editor-layout";
import { useNoteAutoSave } from "@/hooks/use-note-auto-save";
import { DashboardLayout } from "@/components/dashboard-layout";
import type { Note } from "@/types";
import type { Editor } from "@tiptap/react";

interface FullNote extends Note {
  userId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export default function NotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [note, setNote] = useState<FullNote | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);

  useEffect(() => {
    fetchNote();
  }, [id]);

  // Track changes
  useEffect(() => {
    if (note) {
      const titleChanged = title !== note.title;
      const contentChanged = content !== (note.content || "");
      const projectChanged = selectedProject !== note.projectId;
      setHasChanges(titleChanged || contentChanged || projectChanged);
    }
  }, [title, content, selectedProject, note]);

  async function fetchNote() {
    try {
      const response = await fetch(`/api/notes/${id}`);
      if (response.ok) {
        const data = await response.json();
        setNote(data);
        setTitle(data.title);
        setContent(data.content || "");
        setSelectedProject(data.projectId);
      }
    } catch (error) {
      console.error("Error fetching note:", error);
    }
  }

  const handleSaveComplete = useCallback((updatedNote: FullNote) => {
    setNote(updatedNote);
    setHasChanges(false);
  }, []);

  const { autoSaveStatus, isSaving, save } = useNoteAutoSave({
    noteId: id,
    title,
    content,
    projectId: selectedProject,
    hasChanges,
    onSaveComplete: handleSaveComplete,
  });

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/notes");
      }
    } catch (error) {
      console.error("Error deleting note:", error);
    } finally {
      setIsDeleting(false);
    }
  }

  const headerActions = (
    <NoteHeaderActions
      autoSaveStatus={autoSaveStatus}
      hasChanges={hasChanges}
      isSaving={isSaving}
      isDeleting={isDeleting}
      selectedProject={selectedProject}
      onProjectChange={setSelectedProject}
      onSave={save}
      onDelete={handleDelete}
      showPinned={note?.pinned}
    />
  );

  if (!note) {
    return (
      <DashboardLayout>
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  return (
    <NoteEditorLayout
      title={title}
      onTitleChange={setTitle}
      content={content}
      onContentChange={setContent}
      headerActions={headerActions}
      onEditorReady={setEditor}
      projectId={note.projectId}
    />
  );
}
