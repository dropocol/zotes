"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardDropdownMenu } from "@/components/common/card-dropdown-menu";
import { Pencil, Trash2, FileText, CheckSquare } from "lucide-react";
import { ProjectWithCounts } from "@/types";

interface ProjectCardProps {
  project: ProjectWithCounts;
  onEdit: (project: ProjectWithCounts) => void;
  onDelete: (id: string) => void;
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this project?")) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Error deleting project:", error);
    } finally {
      setIsDeleting(false);
    }
  }

  const menuItems = [
    {
      icon: Pencil,
      label: "Edit",
      onClick: () => onEdit(project),
    },
    {
      icon: Trash2,
      label: "Delete",
      onClick: handleDelete,
      className: "text-destructive focus:text-destructive",
      disabled: isDeleting,
    },
  ];

  return (
    <Card className="group relative">
      <div
        className="absolute left-0 top-0 h-full w-1 rounded-l-lg"
        style={{ backgroundColor: project.color || "#f97316" }}
      />
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">
          <Link
            href={`/projects/${project.id}`}
            className="hover:text-primary transition-colors"
          >
            {project.name}
          </Link>
        </CardTitle>
        <CardDropdownMenu
          items={menuItems}
          triggerClassName="opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </CardHeader>
      <CardContent>
        {project.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {project.description}
          </p>
        )}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span>{project._count?.notes || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckSquare className="h-4 w-4" />
            <span>{project._count?.todoLists || 0}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
