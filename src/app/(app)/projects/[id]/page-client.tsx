"use client";

import { useState, useEffect } from "react";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Settings } from "lucide-react";
import { TodoListForm } from "@/components/todos/todo-list-form";
import { DefaultTodoListSection } from "@/components/todos/default-todo-list-section";
import { TodoListsTable } from "@/components/todos/todo-lists-table";
import { TodoItemDetailDrawer } from "@/components/todos/todo-item-detail-drawer";
import { NotesTable } from "@/components/notes/notes-table";
import { DashboardLayout } from "@/components/dashboard-layout";
import { RoleBadge } from "@/components/projects/role-badge";
import { TodoItem, TodoList, Note } from "@/types";
import type { Project } from "@/types/project";

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

      {/* Default List Section */}
      {defaultList && (
        <DefaultTodoListSection
          defaultList={defaultList}
          items={defaultListItems}
          viewAllHref={getTodoListUrl(defaultList)}
          canModify={canModify}
          onAddItem={addItem}
          onToggleStatus={toggleStatus}
          onDeleteItem={deleteItem}
          onSelectItem={handleSelectItem}
          className="mb-8"
        />
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
