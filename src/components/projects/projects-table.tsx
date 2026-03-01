"use client";

import { useMemo } from "react";
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
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { ProjectForm } from "./project-form";
import { RoleBadge } from "./role-badge";
import { ProjectWithRole } from "@/types";

interface ProjectsTableProps {
  projects: ProjectWithRole[];
  searchQuery: string;
  onRefresh: () => void;
}

export function ProjectsTable({ projects, searchQuery, onRefresh }: ProjectsTableProps) {
  const [editingProject, setEditingProject] = useState<ProjectWithRole | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

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
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
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
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  {searchQuery ? "No projects found matching your search" : "No projects yet. Create your first project to get started."}
                </TableCell>
              </TableRow>
            ) : (
              filteredProjects.map((project) => (
                <TableRow key={project.id} className="group">
                  <TableCell>
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: project.color || "#f97316" }}
                    />
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
                          <DropdownMenuItem onClick={() => handleEdit(project)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDelete(project.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
