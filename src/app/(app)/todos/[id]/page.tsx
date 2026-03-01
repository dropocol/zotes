"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Trash2, CheckCircle2, Circle, ListTodo } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TodoListContainer } from "@/components/todos/todo-list-container";
import { useRouter } from "next/navigation";
import type { TodoListWithItems } from "@/types";

export default function TodoListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [todoList, setTodoList] = useState<TodoListWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    try {
      const response = await fetch(`/api/todo/lists/${id}`);

      if (!response.ok) {
        router.push("/todos");
        return;
      }

      const data = await response.json();
      setTodoList(data);
    } catch (error) {
      console.error("Error fetching todo list:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    try {
      const response = await fetch(`/api/todo/lists/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/todos");
      }
    } catch (error) {
      console.error("Error deleting todo list:", error);
    }
  }

  if (isLoading || !todoList) {
    return (
      <DashboardLayout breadcrumbs={[{ title: "Todos", href: "/todos" }]}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse space-y-4 w-full max-w-2xl">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Calculate stats
  const topLevelItems = todoList.items.filter((item) => !item.parentId);
  const completedItems = todoList.items.filter(
    (item) => item.status === "done",
  );
  const progress =
    topLevelItems.length > 0
      ? Math.round((completedItems.length / todoList.items.length) * 100)
      : 0;

  const breadcrumbs = [
    { title: "Todos", href: "/todos" },
    ...(todoList.project
      ? [
          {
            title: todoList.project.name,
            href: `/projects/${todoList.project.id}`,
          },
        ]
      : []),
    { title: todoList.name },
  ];

  return (
    <DashboardLayout breadcrumbs={breadcrumbs}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
              <ListTodo className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {todoList.name}
              </h1>
              {todoList.project && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: todoList.project.color || "#6b7280",
                    }}
                  />
                  <span>{todoList.project.name}</span>
                </div>
              )}
            </div>
          </div>
          {todoList.description && (
            <p className="text-muted-foreground mt-2 ml-[52px]">
              {todoList.description}
            </p>
          )}
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Todo List</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &quot;{todoList.name}&quot;?
                This will also delete all items. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-6 mb-6 p-4 rounded-xl bg-muted/30 border">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-background">
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">{todoList.items.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </div>

        <div className="w-px h-10 bg-border" />

        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm font-medium">{completedItems.length}</p>
            <p className="text-xs text-muted-foreground">Done</p>
          </div>
        </div>

        <div className="w-px h-10 bg-border" />

        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30">
            <Circle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium">
              {todoList.items.length - completedItems.length}
            </p>
            <p className="text-xs text-muted-foreground">Remaining</p>
          </div>
        </div>

        <div className="flex-1" />

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {progress}%
          </span>
        </div>
      </div>

      {/* Todo List */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <TodoListContainer todoListId={id} />
      </div>
    </DashboardLayout>
  );
}
