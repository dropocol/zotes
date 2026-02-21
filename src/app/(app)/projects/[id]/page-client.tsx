"use client";

import { useState } from "react";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Pencil, Trash2, FileText, CheckSquare, MoreHorizontal, Users } from "lucide-react";
import { TodoListForm } from "@/components/todos/todo-list-form";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ProjectForm } from "@/components/projects/project-form";
import { RoleBadge } from "@/components/projects/role-badge";
import { CollaboratorsList } from "@/components/projects/collaborators-list";

interface Project {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  userRole: string;
  isOwner: boolean;
}

interface Note {
  id: string;
  title: string;
  content?: string | null;
  pinned: boolean;
  updatedAt: string;
}

interface TodoList {
  id: string;
  name: string;
  description?: string | null;
  updatedAt: string;
  _count: {
    items: number;
  };
}

interface Collaborator {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
  role: string;
  isOwner: boolean;
  collaborationId?: string;
}

interface CollaboratorsData {
  owner: Collaborator;
  collaborators: Collaborator[];
}

interface ProjectPageClientProps {
  project: Project | null;
  notes: Note[];
  todoLists: TodoList[];
  collaboratorsData: CollaboratorsData | null;
  onRefresh: () => void;
}

export function ProjectPageClient({
  project,
  notes,
  todoLists,
  collaboratorsData,
  onRefresh,
}: ProjectPageClientProps) {
  const [isTodoListFormOpen, setIsTodoListFormOpen] = useState(false);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);

  if (!project) {
    notFound();
  }

  const canModify = project.userRole === "admin";

  // Strip HTML for preview
  const getPreview = (content: string | null | undefined) => {
    if (!content) return "";
    return content.replace(/<[^>]*>/g, "").slice(0, 80);
  };

  async function handleDeleteTodoList(id: string) {
    if (!confirm("Are you sure you want to delete this todo list?")) return;

    try {
      const response = await fetch(`/api/todo/lists/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error deleting todo list:", error);
    }
  }

  return (
    <DashboardLayout
      breadcrumbs={[
        { title: "Projects", href: "/projects" },
        { title: project.name },
      ]}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div
              className="h-4 w-1 rounded-full"
              style={{ backgroundColor: project.color || "#f97316" }}
            />
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <RoleBadge role={project.userRole as "admin" | "collaborator"} />
          </div>
          {project.description && (
            <p className="text-muted-foreground mt-1 ml-4">
              {project.description}
            </p>
          )}
        </div>
        {canModify && (
          <Button variant="outline" size="sm" onClick={() => setIsProjectFormOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Project
          </Button>
        )}
      </div>

      {/* Collaborators Section */}
      {collaboratorsData && (
        <div className="mb-8 p-4 rounded-lg border">
          <CollaboratorsList
            projectId={project.id}
            owner={collaboratorsData.owner}
            collaborators={collaboratorsData.collaborators}
            isOwner={project.isOwner}
            onRefresh={onRefresh}
          />
        </div>
      )}

      {/* Todo Lists Table */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Todo Lists</h2>
          {canModify && (
            <Button size="sm" onClick={() => setIsTodoListFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add List
            </Button>
          )}
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Updated</TableHead>
                {canModify && <TableHead className="w-[60px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {todoLists.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canModify ? 5 : 4} className="text-center text-muted-foreground py-8">
                    No todo lists yet. {canModify ? "Create your first list to get started." : ""}
                  </TableCell>
                </TableRow>
              ) : (
                todoLists.map((todoList) => (
                  <TableRow key={todoList.id} className="group">
                    <TableCell>
                      <CheckSquare className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/projects/${project.id}/todos/${todoList.id}`}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {todoList.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{todoList._count.items}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(todoList.updatedAt).toLocaleDateString()}
                    </TableCell>
                    {canModify && (
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
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDeleteTodoList(todoList.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Notes Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Notes</h2>
          {canModify && (
            <Button size="sm" asChild>
              <Link href={`/notes/new?projectId=${project.id}`}>
                <Plus className="mr-2 h-4 w-4" />
                Add Note
              </Link>
            </Button>
          )}
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Preview</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No notes yet. {canModify ? "Create your first note to get started." : ""}
                  </TableCell>
                </TableRow>
              ) : (
                notes.map((note) => (
                  <TableRow key={note.id}>
                    <TableCell>
                      {note.pinned && (
                        <Badge variant="secondary" className="p-1">
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16 3H8c-1.1 0-2 .9-2 2v3c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 10H8c-1.1 0-2 .9-2 2v3c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2v-3c0-1.1-.9-2-2-2z" />
                          </svg>
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/notes/${note.id}`}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {note.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[300px] truncate">
                      {getPreview(note.content) || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <TodoListForm
        open={isTodoListFormOpen}
        onOpenChange={setIsTodoListFormOpen}
        projectId={project.id}
      />

      <ProjectForm
        open={isProjectFormOpen}
        onOpenChange={setIsProjectFormOpen}
        project={project}
      />
    </DashboardLayout>
  );
}
