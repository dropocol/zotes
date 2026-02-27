"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { TodoItemRow } from "@/components/todos/todo-item-row";
import { TodoItemDetailDrawer } from "@/components/todos/todo-item-detail-drawer";
import { TodoItemInput } from "@/components/todos/todo-item-input";
import {
  Loader2,
  ListTodo,
  ExternalLink,
  Trash2,
  CalendarDays,
  CheckSquare,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { TodoList, TodoItem, PaginatedListsResponse } from "@/types";
import { ProjectForDropdown } from "@/types/project";
import { usePagination } from "@/hooks/use-pagination";

const DEFAULT_LIST_ITEMS_LIMIT = 10;

export default function TodosPage() {
  const [todoLists, setTodoLists] = useState<TodoList[]>([]);
  const [projects, setProjects] = useState<ProjectForDropdown[]>([]);
  const [defaultListItems, setDefaultListItems] = useState<TodoItem[]>([]);
  const [defaultList, setDefaultList] = useState<TodoList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newProjectId, setNewProjectId] = useState<string>("none");
  const [selectedItem, setSelectedItem] = useState<TodoItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [otherListsTotal, setOtherListsTotal] = useState(0);

  const otherListsPagination = usePagination({
    totalItems: otherListsTotal,
    initialLimit: 5,
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch projects for dropdown (lean data: id, name, color only)
      const projectsRes = await fetch("/api/projects?forDropdown=true");
      if (projectsRes.ok) {
        const data: ProjectForDropdown[] = await projectsRes.json();
        setProjects(data);
      }

      // Fetch default list - use a high limit to find it
      const allListsRes = await fetch("/api/todo/lists?limit=100");
      if (allListsRes.ok) {
        const allData: PaginatedListsResponse = await allListsRes.json();
        const defaultL = allData.data.find((list: TodoList) => list.isDefault);
        if (defaultL) {
          setDefaultList(defaultL);
          await fetchDefaultListItems(defaultL.id);
        }
      }

      // Fetch other lists with pagination
      const params = new URLSearchParams({
        excludeDefault: "true",
        page: otherListsPagination.currentPage.toString(),
        limit: otherListsPagination.limit.toString(),
      });
      const todoListsRes = await fetch(`/api/todo/lists?${params.toString()}`);
      if (todoListsRes.ok) {
        const data: PaginatedListsResponse = await todoListsRes.json();
        setTodoLists(data.data);
        setOtherListsTotal(data.pagination.total);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [otherListsPagination.currentPage, otherListsPagination.limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function fetchDefaultListItems(listId: string) {
    try {
      const response = await fetch(`/api/todo/lists/${listId}/items`);
      if (response.ok) {
        const data = await response.json();
        // Limit to DEFAULT_LIST_ITEMS_LIMIT items
        setDefaultListItems(data.slice(0, DEFAULT_LIST_ITEMS_LIMIT));
      }
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  }

  async function handleCreate() {
    if (!newName.trim()) return;

    setIsCreating(true);
    try {
      const response = await fetch("/api/todo/lists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDescription.trim() || null,
          projectId: newProjectId === "none" ? null : newProjectId,
        }),
      });

      if (response.ok) {
        setNewName("");
        setNewDescription("");
        setNewProjectId("none");
        setIsDialogOpen(false);
        fetchData();
      }
    } catch (error) {
      console.error("Error creating todo list:", error);
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this todo list?")) return;

    try {
      const response = await fetch(`/api/todo/lists/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error deleting todo list:", error);
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

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function getTodoListUrl(todoList: TodoList) {
    if (todoList.projectId && todoList.project) {
      return `/projects/${todoList.projectId}/todos/${todoList.id}`;
    }
    return `/todos/${todoList.id}`;
  }

  const handlePageChange = (page: number) => {
    otherListsPagination.setPage(page);
  };

  const handleLimitChange = (limit: number) => {
    otherListsPagination.setLimit(limit);
  };

  // Other lists are already filtered by the API (excludeDefault=true)
  const otherLists = todoLists;

  return (
    <DashboardLayout breadcrumbs={[{ title: "Todos", href: "/todos" }]}>
      <PageHeader
        title="Todos"
        description="Manage your tasks and to-do lists"
        icon={CheckSquare}
        className="mb-6"
      >
        <Button variant="outline" asChild>
          <Link href="/todos/upcoming">
            <CalendarDays className="mr-1.5 h-4 w-4" />
            Upcoming
          </Link>
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-1.5 h-4 w-4" />
              Add New List
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Todo List</DialogTitle>
              <DialogDescription>
                Create a new todo list to organize your tasks
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter todo list name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Enter description"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project">Project (optional)</Label>
                <Select value={newProjectId} onValueChange={setNewProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No project</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: project.color || "#6b7280",
                            }}
                          />
                          {project.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!newName.trim() || isCreating}
              >
                {isCreating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Default List Section */}
          {defaultList && (
            <section>
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
                  <Link href={getTodoListUrl(defaultList)}>
                    View all
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>

              <div className="rounded-lg border bg-card">
                {/* Add item input */}
                <div className="flex items-center gap-2 p-3 border-b">
                  <TodoItemInput onAdd={addItem} />
                </div>

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

          {/* Other Lists */}
          {otherLists.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3">
                Other Lists
              </h2>
              <div className="rounded-lg border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead className="text-center">Tasks</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="w-[70px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {otherLists.map((todoList) => (
                      <TableRow key={todoList.id} className="group">
                        <TableCell>
                          <Link
                            href={getTodoListUrl(todoList)}
                            className="font-medium hover:text-primary transition-colors"
                          >
                            {todoList.name}
                          </Link>
                          {todoList.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                              {todoList.description}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          {todoList.project ? (
                            <Link
                              href={`/projects/${todoList.project.id}`}
                              className="inline-flex items-center gap-1.5 text-sm hover:text-primary transition-colors"
                            >
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor:
                                    todoList.project.color || "#6b7280",
                                }}
                              />
                              {todoList.project.name}
                            </Link>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              No project
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center h-6 min-w-[24px] px-1.5 rounded-full bg-muted text-xs font-medium">
                            {todoList._count?.items ?? 0}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(todoList.updatedAt as string)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              asChild
                            >
                              <Link href={getTodoListUrl(todoList)}>
                                <ExternalLink className="h-4 w-4" />
                              </Link>
                            </Button>
                            {!todoList.isDefault && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDelete(todoList.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Pagination
                currentPage={otherListsPagination.currentPage}
                totalPages={otherListsPagination.totalPages}
                totalItems={otherListsTotal}
                limit={otherListsPagination.limit}
                onPageChange={handlePageChange}
                onLimitChange={handleLimitChange}
              />
            </section>
          )}

          {/* Empty state */}
          {!defaultList && otherLists.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-muted mb-4">
                <ListTodo className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                No todo lists yet
              </p>
              <p className="text-xs text-muted-foreground">
                Create your first todo list to get started
              </p>
            </div>
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
