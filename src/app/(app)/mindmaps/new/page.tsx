"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { MindMapHeaderActions } from "@/components/mindmaps/mindmap-header-actions";
import { MindMapEditorLayout } from "@/components/mindmaps/mindmap-editor-layout";
import { createInitialMindMapData } from "@/components/mindmaps/initial-data";
import { useMindMapAutoSave } from "@/hooks/use-mindmap-auto-save";
import type { MindMapData } from "@/types";

export default function NewMindMapPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");

  const [title, setTitle] = useState("");
  const [data, setData] = useState<MindMapData>(createInitialMindMapData);
  const [selectedProject, setSelectedProject] = useState<string | null>(projectId || null);

  const { autoSaveStatus, isSaving, save } = useMindMapAutoSave({
    title,
    data,
    projectId: selectedProject,
    hasChanges: true,
  });

  const headerActions = (
    <MindMapHeaderActions
      autoSaveStatus={autoSaveStatus}
      isSaving={isSaving}
      selectedProject={selectedProject}
      onProjectChange={setSelectedProject}
      onSave={save}
    />
  );

  return (
    <MindMapEditorLayout
      title={title}
      onTitleChange={setTitle}
      data={data}
      onDataChange={setData}
      headerActions={headerActions}
      projectId={selectedProject}
    />
  );
}
