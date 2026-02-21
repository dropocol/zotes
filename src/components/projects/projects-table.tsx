"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SortableTableHead, sortItems, type SortConfig } from "@/components/ui/sortable-table-head";
import { Plus, MoreHorizontal, Pencil, Trash2, FileText, CheckSquare } from "lucide-react";
import Link from "next/link";
import { ProjectForm } from "./project-form";

interface Project {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  _count?: {
    notes: number;
    todoLists: number;
  };
}

interface ProjectsTableProps {
  projects: Project[];
  onRefresh: () => void;
}

export function ProjectsTable({ projects, onRefresh }: ProjectsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "updatedAt", direction: "desc" });
  const [editingProject, setEditingProject] = useState<Project | null>(null);
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

  const sortedProjects = useMemo(() => {
    return sortItems(filteredProjects, sortConfig);
  }, [filteredProjects, sortConfig]);

  const handleSort = (column: string) => {
    setSortConfig((prev) => ({
      key: column,
      direction:
        prev.key === column
          ? prev.direction === "asc"
            ? "desc"
            : prev.direction === "desc"
            ? null
            : "asc"
          : "asc",
    }));
  };

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

  function handleEdit(project: Project) {
    setEditingProject(project);
    setIsFormOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {sortedProjects.length} project{sortedProjects.length !== 1 ? "s" : ""}
          </span>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <SortableTableHead
                column="name"
                label="Name"
                sortConfig={sortConfig}
                onSort={handleSort}
              />
              <TableHead>Description</TableHead>
              <SortableTableHead
                column="_count.notes"
                label="Notes"
                sortConfig={sortConfig}
                onSort={handleSort}
                className="text-right w-[100px]"
              />
              <SortableTableHead
                column="_count.todoLists"
                label="Todo Lists"
                sortConfig={sortConfig}
                onSort={handleSort}
                className="text-right w-[100px]"
              />
              <SortableTableHead
                column="updatedAt"
                label="Updated"
                sortConfig={sortConfig}
                onSort={handleSort}
                className="w-[150px]"
              />
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  {searchQuery ? "No projects found matching your search" : "No projects yet. Create your first project to get started."}
                </TableCell>
              </TableRow>
            ) : (
              sortedProjects.map((project) => (
                <TableRow key={project.id} className="group">
                  <TableCell>
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: project.color || "#f97316" }}
                    />
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/projects/${project.id}`}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {project.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[300px] truncate">
                    {project.description || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="flex items-center justify-end gap-1">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      {project._count?.notes || 0}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="flex items-center justify-end gap-1">
                      <CheckSquare className="h-3 w-3 text-muted-foreground" />
                      {project._count?.todoLists || 0}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
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
    </div>
  );
}
