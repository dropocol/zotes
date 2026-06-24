"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { MindMap, MindMapData } from "@/types";

type AutoSaveStatus = "idle" | "saving" | "saved";

interface MindMapSummary {
  id: string;
  title: string;
  data?: MindMapData | null;
  pinned: boolean;
  projectId?: string | null;
  userId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface UseMindMapAutoSaveOptions {
  mindMapId?: string;
  title: string;
  data: MindMapData;
  projectId: string | null;
  hasChanges?: boolean;
  autoSaveDelay?: number;
  onSaveComplete?: (mindMap: MindMapSummary) => void;
}

export function useMindMapAutoSave({
  mindMapId,
  title,
  data,
  projectId,
  hasChanges = true,
  autoSaveDelay = 1500,
  onSaveComplete,
}: UseMindMapAutoSaveOptions) {
  const router = useRouter();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>("idle");
  const [isSaving, setIsSaving] = useState(false);

  const performAutoSave = useCallback(async () => {
    if (!title.trim() || !hasChanges) return;

    setAutoSaveStatus("saving");
    setIsSaving(true);

    try {
      const isUpdate = !!mindMapId;
      const url = isUpdate ? `/api/mindmaps/${mindMapId}` : "/api/mindmaps";
      const method = isUpdate ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          data,
          projectId: projectId,
        }),
      });

      if (response.ok) {
        const mindMap = await response.json();
        setAutoSaveStatus("saved");

        if (onSaveComplete) {
          onSaveComplete(mindMap);
        }

        // For new mindmaps, redirect to the edit page
        if (!isUpdate && mindMap.id) {
          router.push(`/mindmaps/${mindMap.id}`);
        }

        // Reset saved status after 2 seconds
        setTimeout(() => {
          setAutoSaveStatus("idle");
        }, 2000);
      }
    } catch (error) {
      console.error("Error saving mindmap:", error);
      setAutoSaveStatus("idle");
    } finally {
      setIsSaving(false);
    }
  }, [mindMapId, title, data, projectId, hasChanges, router, onSaveComplete]);

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
  }, [title, data, projectId, hasChanges, autoSaveDelay, performAutoSave]);

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

export type { MindMap, MindMapData };
