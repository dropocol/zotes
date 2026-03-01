"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";

type AutoSaveStatus = "idle" | "saving" | "saved";

interface Note {
  id: string;
  title: string;
  content?: string | null;
  pinned: boolean;
  projectId?: string | null;
}

interface UseNoteAutoSaveOptions {
  noteId?: string;
  title: string;
  content: string;
  projectId: string | null;
  hasChanges?: boolean;
  autoSaveDelay?: number;
  onSaveComplete?: (note: Note) => void;
}

export function useNoteAutoSave({
  noteId,
  title,
  content,
  projectId,
  hasChanges = true,
  autoSaveDelay = 1500,
  onSaveComplete,
}: UseNoteAutoSaveOptions) {
  const router = useRouter();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>("idle");
  const [isSaving, setIsSaving] = useState(false);

  const performAutoSave = useCallback(async () => {
    if (!title.trim() || !hasChanges) return;

    setAutoSaveStatus("saving");
    setIsSaving(true);

    try {
      const isUpdate = !!noteId;
      const url = isUpdate ? `/api/notes/${noteId}` : "/api/notes";
      const method = isUpdate ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          content,
          projectId: projectId,
        }),
      });

      if (response.ok) {
        const note = await response.json();
        setAutoSaveStatus("saved");

        if (onSaveComplete) {
          onSaveComplete(note);
        }

        // For new notes, redirect to the edit page
        if (!isUpdate && note.id) {
          router.push(`/notes/${note.id}`);
        }

        // Reset saved status after 2 seconds
        setTimeout(() => {
          setAutoSaveStatus("idle");
        }, 2000);
      }
    } catch (error) {
      console.error("Error saving note:", error);
      setAutoSaveStatus("idle");
    } finally {
      setIsSaving(false);
    }
  }, [noteId, title, content, projectId, hasChanges, router, onSaveComplete]);

  // Debounced auto-save effect
  useEffect(() => {
    if (!title.trim() || !hasChanges) {
      return;
    }

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    autoSaveTimeoutRef.current = setTimeout(() => {
      performAutoSave();
    }, autoSaveDelay);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [title, content, projectId, hasChanges, autoSaveDelay, performAutoSave]);

  const save = useCallback(async () => {
    // Clear auto-save timeout if manual save is triggered
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    await performAutoSave();
  }, [performAutoSave]);

  return {
    autoSaveStatus,
    isSaving,
    save,
  };
}
