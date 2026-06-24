"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { MindMapHeaderActions } from "@/components/mindmaps/mindmap-header-actions";
import { MindMapEditorLayout } from "@/components/mindmaps/mindmap-editor-layout";
import { useMindMapAutoSave } from "@/hooks/use-mindmap-auto-save";
import { DashboardLayout } from "@/components/dashboard-layout";
import { createInitialMindMapData } from "@/components/mindmaps/initial-data";
import type { MindMap, MindMapData } from "@/types";

export default function MindMapPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [mindMap, setMindMap] = useState<MindMap | null>(null);
  const [title, setTitle] = useState("");
  const [data, setData] = useState<MindMapData>(createInitialMindMapData);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMindMap = useCallback(async () => {
    try {
      const response = await fetch(`/api/mindmaps/${id}`);
      if (response.ok) {
        const result = await response.json();
        setMindMap(result);
        setTitle(result.title);
        setData(result.data || createInitialMindMapData());
        setSelectedProject(result.projectId);
      }
    } catch (error) {
      console.error("Error fetching mindmap:", error);
    }
  }, [id]);

  useEffect(() => {
    fetchMindMap();
  }, [fetchMindMap]);

  // Track changes
  useEffect(() => {
    if (mindMap) {
      const titleChanged = title !== mindMap.title;
      const projectChanged = selectedProject !== mindMap.projectId;
      const dataChanged =
        JSON.stringify(data) !== JSON.stringify(mindMap.data || { nodes: [], edges: [] });
      setHasChanges(titleChanged || projectChanged || dataChanged);
    }
  }, [title, data, selectedProject, mindMap]);

  const handleSaveComplete = useCallback((updated: MindMap) => {
    setMindMap(updated);
    setHasChanges(false);
  }, []);

  const { autoSaveStatus, isSaving, save } = useMindMapAutoSave({
    mindMapId: id,
    title,
    data,
    projectId: selectedProject,
    hasChanges,
    onSaveComplete: handleSaveComplete,
  });

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/mindmaps/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/mindmaps");
      }
    } catch (error) {
      console.error("Error deleting mindmap:", error);
    } finally {
      setIsDeleting(false);
    }
  }

  const headerActions = (
    <MindMapHeaderActions
      autoSaveStatus={autoSaveStatus}
      hasChanges={hasChanges}
      isSaving={isSaving}
      isDeleting={isDeleting}
      selectedProject={selectedProject}
      onProjectChange={setSelectedProject}
      onSave={save}
      onDelete={handleDelete}
      showPinned={mindMap?.pinned}
    />
  );

  if (!mindMap) {
    return (
      <DashboardLayout>
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  return (
    <MindMapEditorLayout
      title={title}
      onTitleChange={setTitle}
      data={data}
      onDataChange={setData}
      headerActions={headerActions}
      projectId={mindMap.projectId}
    />
  );
}
