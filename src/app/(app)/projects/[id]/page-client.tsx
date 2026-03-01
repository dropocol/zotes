"use client";

import { useState, useEffect } from "react";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Plus,
  Trash2,
  CheckSquare,
  MoreHorizontal,
  Settings,
  Star,
  ExternalLink,
  ListTodo,
} from "lucide-react";
import { TodoListForm } from "@/components/todos/todo-list-form";
import { TodoItemInput } from "@/components/todos/todo-item-input";
import { TodoItemRow } from "@/components/todos/todo-item-row";
import { TodoItemDetailDrawer } from "@/components/todos/todo-item-detail-drawer";
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
import { RoleBadge } from "@/components/projects/role-badge";
import { TodoItem } from "@/types/todo";

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
  isDefault?: boolean;
  updatedAt: string;
  _count: {
    items: number;
  };
}

interface ProjectPageClientProps {
  project: Project | null;
  notes: Note[];
  todoLists: TodoList[];
  onRefresh: () => void;
}

const DEFAULT_LIST_ITEMS_LIMIT = 10;

export function ProjectPageClient({
  project,
  notes,
  todoLists,
  onRefresh,
}: ProjectPageClientProps) {
  const [isTodoListFormOpen, setIsTodoListFormOpen] = useState(false);
  const [defaultListItems, setDefaultListItems] = useState<TodoItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<TodoItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Separate default list from other lists
  const defaultList = todoLists.find((list) => list.isDefault);
  const otherLists = todoLists.filter((list) => !list.isDefault);

  // Fetch items for the default list
  useEffect(() => {
    if (defaultList) {
      fetchDefaultListItems(defaultList.id);
    } else {
      setDefaultListItems([]);
    }
  }, [defaultList?.id]);

  async function fetchDefaultListItems(listId: string) {
    try {
      const response = await fetch(`/api/todo/lists/${listId}/items`);
      if (response.ok) {
        const data = await response.json();
        setDefaultListItems(data.slice(0, DEFAULT_LIST_ITEMS_LIMIT));
      }
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  }

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

  async function handleSetDefault(id: string) {
    try {
      const response = await fetch(`/api/todo/lists/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });

      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error setting default todo list:", error);
    }
  }

  async function toggleStatus(id: string, status: string) {
    await fetch(`/api/todo/items/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });
    if (defaultList) {
      fetchDefaultListItems(defaultList.id);
    }
  }

  async function deleteItem(id: string) {
    await fetch(`/api/todo/items/${id}`, {
      method: "DELETE",
    });
    if (defaultList) {
      fetchDefaultListItems(defaultList.id);
    }
  }

  async function addItem(title: string) {
    if (!defaultList) return;

    await fetch(`/api/todo/lists/${defaultList.id}/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    });
    fetchDefaultListItems(defaultList.id);
  }

  function handleSelectItem(item: TodoItem) {
    setSelectedItem(item);
    setIsDrawerOpen(true);
  }

  function handleUpdateItem() {
    if (defaultList) {
      fetchDefaultListItems(defaultList.id);
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
            <h1 className="text-3xl font-bold tracking-tight">
              {project.name}
            </h1>
            <RoleBadge role={project.userRole as "admin" | "collaborator"} />
          </div>
          {project.description && (
            <p className="text-muted-foreground mt-1 ml-4">
              {project.description}
            </p>
          )}
        </div>
        {project.isOwner && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/projects/${project.id}/settings`}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
        )}
      </div>

      {/* Default List Section */}
      {defaultList && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold">{defaultList.name}</h2>
              {defaultList.description && (
                <p className="text-sm text-muted-foreground">
                  {defaultList.description}
                </p>
              )}
            </div>
            <Button variant="ghost" size="sm" asChild className="gap-1">
              <Link href={`/projects/${project.id}/todos/${defaultList.id}`}>
                View all
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          <div className="rounded-lg border bg-card">
            {/* Add item input */}
            {canModify && (
              <div className="flex items-center gap-2 p-3 border-b">
                <TodoItemInput onAdd={addItem} />
              </div>
            )}

            <div className="divide-y divide-border/50">
              {defaultListItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted mb-3">
                    <ListTodo className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No tasks yet
                  </p>
                </div>
              ) : (
                defaultListItems.map((item) => (
                  <TodoItemRow
                    key={item.id}
                    item={item}
                    onToggleStatus={toggleStatus}
                    onAddSubItem={() => {}}
                    onDelete={deleteItem}
                    onSelect={handleSelectItem}
                  />
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* Other Todo Lists Table */}
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
              {otherLists.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={canModify ? 5 : 4}
                    className="text-center text-muted-foreground py-8"
                  >
                    {defaultList
                      ? "No additional lists."
                      : "No todo lists yet. " +
                        (canModify ? "Create your first list to get started." : "")}
                  </TableCell>
                </TableRow>
              ) : (
                otherLists.map((todoList) => (
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
                            <DropdownMenuItem onClick={() => handleSetDefault(todoList.id)}>
                              <Star className="mr-2 h-4 w-4" />
                              Set as Default
                            </DropdownMenuItem>
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
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground py-8"
                  >
                    No notes yet.{" "}
                    {canModify ? "Create your first note to get started." : ""}
                  </TableCell>
                </TableRow>
              ) : (
                notes.map((note) => (
                  <TableRow key={note.id}>
                    <TableCell>
                      {note.pinned && (
                        <Badge variant="secondary" className="p-1">
                          <svg
                            className="h-3 w-3"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
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

      {/* Detail drawer */}
      <TodoItemDetailDrawer
        item={selectedItem}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        onUpdate={handleUpdateItem}
      />
    </DashboardLayout>
  );
}
