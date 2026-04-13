"use client";

import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, GripVertical } from "lucide-react";
import Link from "next/link";
import { ProjectForm } from "./project-form";
import { RoleBadge } from "./role-badge";
import { ProjectWithRole } from "@/types";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ProjectsTableProps {
  projects: ProjectWithRole[];
  searchQuery: string;
  onRefresh: () => void;
}

function SortableRow({ project, onEdit, onDelete }: { project: ProjectWithRole; onEdit: (p: ProjectWithRole) => void; onDelete: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id, disabled: !project.isOwner });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  async function handleDelete() {
    onDelete(project.id);
  }

  return (
    <TableRow ref={setNodeRef} style={style} className={`${isDragging ? "opacity-50" : ""} group`}>
      <TableCell>
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: project.color || "#f97316" }}
        />
      </TableCell>
      <TableCell>
        {project.isOwner && (
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
          >
            <GripVertical className="h-4 w-4" />
          </div>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Link
            href={`/projects/${project.id}`}
            className="font-medium hover:text-primary transition-colors"
          >
            {project.name}
          </Link>
          {!project.isOwner && (
            <RoleBadge role={project.userRole as "admin" | "collaborator"} />
          )}
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground max-w-[300px] truncate">
        {project.description || "-"}
      </TableCell>
      <TableCell>
        {project._count?.notes || 0}
      </TableCell>
      <TableCell>
        {project._count?.todoLists || 0}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {new Date(project.updatedAt).toLocaleDateString()}
      </TableCell>
      <TableCell>
        {project.isOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(project)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </TableCell>
    </TableRow>
  );
}

export function ProjectsTable({ projects, searchQuery, onRefresh }: ProjectsTableProps) {
  const [editingProject, setEditingProject] = useState<ProjectWithRole | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // All project IDs for dnd-kit tracking (needed for correct position calculations)
  const allProjectIds = useMemo(() => {
    return projects.map((p) => p.id);
  }, [projects]);

  // Owned project IDs for checking drag eligibility
  const ownedProjectIds = useMemo(() => {
    return new Set(projects.filter((p) => p.isOwner).map((p) => p.id));
  }, [projects]);

  const filteredProjects = useMemo(() => {
    if (!searchQuery) return projects;

    const query = searchQuery.toLowerCase();
    return projects.filter((project) => {
      return (
        project.name.toLowerCase().includes(query) ||
        (project.description?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [projects, searchQuery]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    // Only allow reordering owned projects
    if (!ownedProjectIds.has(active.id as string) || !ownedProjectIds.has(over.id as string)) {
      return;
    }

    // Swap orders on the server
    try {
      const response = await fetch("/api/projects/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: active.id,
          targetProjectId: over.id,
        }),
      });

      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error reordering projects:", error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  }

  function handleEdit(project: ProjectWithRole) {
    setEditingProject(project);
    setIsFormOpen(true);
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[100px]">Notes</TableHead>
                <TableHead className="w-[100px]">Todo Lists</TableHead>
                <TableHead className="w-[150px]">Updated</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    {searchQuery ? "No projects found matching your search" : "No projects yet. Create your first project to get started."}
                  </TableCell>
                </TableRow>
              ) : (
                <SortableContext
                  items={allProjectIds}
                  strategy={verticalListSortingStrategy}
                >
                  {filteredProjects.map((project) => (
                    <SortableRow
                      key={project.id}
                      project={project}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </SortableContext>
              )}
            </TableBody>
          </Table>
        </div>
      </DndContext>

      <ProjectForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingProject(null);
        }}
        project={editingProject}
      />
    </>
  );
}
