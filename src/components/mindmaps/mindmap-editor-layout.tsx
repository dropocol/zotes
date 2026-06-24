"use client";

import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { MindMapCanvas } from "./mindmap-canvas";
import type { MindMapData } from "@/types";

interface MindMapEditorLayoutProps {
  title: string;
  onTitleChange: (value: string) => void;
  data: MindMapData;
  onDataChange: (data: MindMapData) => void;
  headerActions: ReactNode;
  projectId?: string | null;
  readOnly?: boolean;
}

export function MindMapEditorLayout({
  title,
  onTitleChange,
  data,
  onDataChange,
  headerActions,
  projectId,
  readOnly = false,
}: MindMapEditorLayoutProps) {
  const router = useRouter();

  function handleBack() {
    if (projectId) {
      router.push(`/projects/${projectId}`);
    } else {
      router.back();
    }
  }

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
      fullHeight
    >
      <MindMapCanvas
        data={data}
        onChange={onDataChange}
        readOnly={readOnly}
      />
    </DashboardLayout>
  );
}
