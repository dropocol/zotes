"use client";

import { useState, useEffect } from "react";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Settings } from "lucide-react";
import { TodoListForm } from "@/components/todos/todo-list-form";
import { DefaultTodoListSection } from "@/components/todos/default-todo-list-section";
import { TodoListsTable } from "@/components/todos/todo-lists-table";
import { NotesTable } from "@/components/notes/notes-table";
import { DashboardLayout } from "@/components/dashboard-layout";
import { RoleBadge } from "@/components/projects/role-badge";
import { TodoItem, TodoList, Note } from "@/types";
import type { Project } from "@/types/project";
import { getLocalDateString } from "@/utils/date";

interface ProjectWithRole extends Project {
  userRole: string;
  isOwner: boolean;
}

interface ProjectPageClientProps {
  project: ProjectWithRole | null;
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

  const defaultList = todoLists.find((list) => list.isDefault);
  const otherLists = todoLists.filter((list) => !list.isDefault);

  async function fetchDefaultListItems(listId: string) {
    try {
      const response = await fetch(`/api/todo/lists/${listId}/items?date=${getLocalDateString()}`);
      if (response.ok) {
        const data = await response.json();
        setDefaultListItems(data.slice(0, DEFAULT_LIST_ITEMS_LIMIT));
      }
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  }

  useEffect(() => {
    if (!defaultList) return;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/todo/lists/${defaultList.id}/items?date=${getLocalDateString()}`, { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          setDefaultListItems(data.slice(0, DEFAULT_LIST_ITEMS_LIMIT));
        }
      } catch (err) {
        if (!controller.signal.aborted) console.error("Error fetching items:", err);
      }
    })();
    return () => controller.abort();
  }, [defaultList]);

  if (!project) {
    notFound();
  }

  const canModify = project.userRole === "admin";

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

  function getTodoListUrl(todoList: TodoList) {
    return `/projects/${project?.id}/todos/${todoList.id}`;
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

      {defaultList && (
        <DefaultTodoListSection
          defaultList={defaultList}
          items={defaultListItems}
          viewAllHref={getTodoListUrl(defaultList)}
          canModify={canModify}
          onRefresh={() => fetchDefaultListItems(defaultList.id)}
          className="mb-8"
        />
      )}

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

        <TodoListsTable
          todoLists={otherLists}
          getHref={getTodoListUrl}
          canModify={canModify}
          onSetDefault={canModify ? handleSetDefault : undefined}
          onDelete={canModify ? handleDeleteTodoList : undefined}
          emptyMessage={
            defaultList
              ? "No additional lists."
              : "No todo lists yet. Create your first list to get started."
          }
        />
      </div>

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

        <NotesTable
          notes={notes}
          onRefresh={onRefresh}
          showProjectColumn={false}
          canModify={canModify}
          emptyMessage="No notes yet."
        />
      </div>

      <TodoListForm
        open={isTodoListFormOpen}
        onOpenChange={setIsTodoListFormOpen}
        projectId={project.id}
      />
    </DashboardLayout>
  );
}
