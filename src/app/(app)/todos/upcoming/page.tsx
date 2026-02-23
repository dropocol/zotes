"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { TodoItemRow } from "@/components/todos/todo-item-row";
import { TodoItemDetailDrawer } from "@/components/todos/todo-item-detail-drawer";
import { CalendarDays, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { TodoItem, TodoList } from "@/types";

interface TodoItemWithList extends TodoItem {
  todoList: TodoList;
}

function isOverdue(dueDate: Date | string): boolean {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return due < now;
}

function isDueToday(dueDate: Date | string): boolean {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return due.getTime() === now.getTime();
}

function isDueTomorrow(dueDate: Date | string): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return due.getTime() === tomorrow.getTime();
}

function getDueDateLabel(dueDate: Date | string): string {
  if (isDueToday(dueDate)) return "Today";
  if (isDueTomorrow(dueDate)) return "Tomorrow";
  return new Date(dueDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getTodoListUrl(item: TodoItemWithList): string {
  if (item.todoList.projectId) {
    return `/projects/${item.todoList.projectId}/todos/${item.todoList.id}`;
  }
  return `/todos/${item.todoList.id}`;
}

export default function UpcomingTodosPage() {
  const [items, setItems] = useState<TodoItemWithList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<TodoItemWithList | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    try {
      const response = await fetch("/api/todo/items?filter=upcoming");
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function toggleStatus(id: string, status: string) {
    try {
      await fetch(`/api/todo/items/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      fetchItems();
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  }

  async function deleteItem(id: string) {
    try {
      await fetch(`/api/todo/items/${id}`, {
        method: "DELETE",
      });
      fetchItems();
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  }

  function handleSelectItem(item: TodoItemWithList) {
    setSelectedItem(item);
    setIsDrawerOpen(true);
  }

  function handleUpdateItem() {
    fetchItems();
  }

  // Group items by due date category
  const overdueItems = items.filter((item) => isOverdue(item.dueDate));
  const todayItems = items.filter((item) => isDueToday(item.dueDate));
  const tomorrowItems = items.filter((item) => isDueTomorrow(item.dueDate));
  const laterItems = items.filter(
    (item) =>
      !isOverdue(item.dueDate) &&
      !isDueToday(item.dueDate) &&
      !isDueTomorrow(item.dueDate)
  );

  return (
    <DashboardLayout
      breadcrumbs={[
        { title: "Todos", href: "/todos" },
        { title: "Upcoming", href: "/todos/upcoming" },
      ]}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Upcoming Todos</h1>
        <p className="text-muted-foreground mt-1">
          Tasks with due dates that need your attention
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-muted mb-4">
            <CalendarDays className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground mb-1">
            No upcoming tasks
          </p>
          <p className="text-xs text-muted-foreground">
            Tasks with due dates will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overdue Section */}
          {overdueItems.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <h2 className="text-sm font-semibold text-destructive">
                  Overdue ({overdueItems.length})
                </h2>
              </div>
              <div className="rounded-lg border bg-card divide-y divide-border/50">
                {overdueItems.map((item) => (
                  <TodoItemRow
                    key={item.id}
                    item={item}
                    onToggleStatus={toggleStatus}
                    onAddSubItem={() => {}}
                    onDelete={deleteItem}
                    onSelect={handleSelectItem}
                    hideSubTasks
                    listLink={
                      <Link
                        href={getTodoListUrl(item)}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                      >
                        {item.todoList.project && (
                          <>
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{
                                backgroundColor:
                                  item.todoList.project.color || "#6b7280",
                              }}
                            />
                            {item.todoList.project.name}
                            {" · "}
                          </>
                        )}
                        {item.todoList.name}
                      </Link>
                    }
                    dueDateBadge={
                      <span className="text-xs text-destructive font-medium">
                        {getDueDateLabel(item.dueDate)}
                      </span>
                    }
                  />
                ))}
              </div>
            </section>
          )}

          {/* Today Section */}
          {todayItems.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3">
                Due Today ({todayItems.length})
              </h2>
              <div className="rounded-lg border bg-card divide-y divide-border/50">
                {todayItems.map((item) => (
                  <TodoItemRow
                    key={item.id}
                    item={item}
                    onToggleStatus={toggleStatus}
                    onAddSubItem={() => {}}
                    onDelete={deleteItem}
                    onSelect={handleSelectItem}
                    hideSubTasks
                    listLink={
                      <Link
                        href={getTodoListUrl(item)}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                      >
                        {item.todoList.project && (
                          <>
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{
                                backgroundColor:
                                  item.todoList.project.color || "#6b7280",
                              }}
                            />
                            {item.todoList.project.name}
                            {" · "}
                          </>
                        )}
                        {item.todoList.name}
                      </Link>
                    }
                    dueDateBadge={
                      <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                        {getDueDateLabel(item.dueDate)}
                      </span>
                    }
                  />
                ))}
              </div>
            </section>
          )}

          {/* Tomorrow Section */}
          {tomorrowItems.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3">
                Due Tomorrow ({tomorrowItems.length})
              </h2>
              <div className="rounded-lg border bg-card divide-y divide-border/50">
                {tomorrowItems.map((item) => (
                  <TodoItemRow
                    key={item.id}
                    item={item}
                    onToggleStatus={toggleStatus}
                    onAddSubItem={() => {}}
                    onDelete={deleteItem}
                    onSelect={handleSelectItem}
                    hideSubTasks
                    listLink={
                      <Link
                        href={getTodoListUrl(item)}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                      >
                        {item.todoList.project && (
                          <>
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{
                                backgroundColor:
                                  item.todoList.project.color || "#6b7280",
                              }}
                            />
                            {item.todoList.project.name}
                            {" · "}
                          </>
                        )}
                        {item.todoList.name}
                      </Link>
                    }
                    dueDateBadge={
                      <span className="text-xs text-muted-foreground">
                        {getDueDateLabel(item.dueDate)}
                      </span>
                    }
                  />
                ))}
              </div>
            </section>
          )}

          {/* Later Section */}
          {laterItems.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3">
                Coming Up ({laterItems.length})
              </h2>
              <div className="rounded-lg border bg-card divide-y divide-border/50">
                {laterItems.map((item) => (
                  <TodoItemRow
                    key={item.id}
                    item={item}
                    onToggleStatus={toggleStatus}
                    onAddSubItem={() => {}}
                    onDelete={deleteItem}
                    onSelect={handleSelectItem}
                    hideSubTasks
                    listLink={
                      <Link
                        href={getTodoListUrl(item)}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                      >
                        {item.todoList.project && (
                          <>
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{
                                backgroundColor:
                                  item.todoList.project.color || "#6b7280",
                              }}
                            />
                            {item.todoList.project.name}
                            {" · "}
                          </>
                        )}
                        {item.todoList.name}
                      </Link>
                    }
                    dueDateBadge={
                      <span className="text-xs text-muted-foreground">
                        {getDueDateLabel(item.dueDate)}
                      </span>
                    }
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

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
