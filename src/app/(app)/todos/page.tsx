"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { EmptyState } from "@/components/common/empty-state";
import { ProjectSelect } from "@/components/common/project-select";
import { DefaultTodoListSection } from "@/components/todos/default-todo-list-section";
import { TodoItemsView } from "@/components/todos/todo-items-view";
import { TodoListsTable } from "@/components/todos/todo-lists-table";
import {
  Loader2,
  ListTodo,
  CheckSquare,
  Plus,
  User,
  LayoutGrid,
  ArrowUpDown,
} from "lucide-react";
import { TodoList, TodoItem, PaginatedListsResponse } from "@/types";
import { usePagination } from "@/hooks/use-pagination";
import { getLocalDateString } from "@/utils/date";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ViewMode = "personal" | "all-projects";

type SortOption =
  | "default"
  | "dueDate"
  | "dueDateDesc"
  | "priority"
  | "status"
  | "createdAt"
  | "updatedAt";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "default", label: "Default (Project → List)" },
  { value: "dueDate", label: "Due Date (Earliest)" },
  { value: "dueDateDesc", label: "Due Date (Latest)" },
  { value: "priority", label: "Priority" },
  { value: "status", label: "Status" },
  { value: "createdAt", label: "Created (Newest)" },
  { value: "updatedAt", label: "Updated (Recently)" },
];

interface TodoItemWithList extends TodoItem {
  todoList: TodoList;
}

interface PaginatedItemsResponse {
  data: TodoItemWithList[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const DEFAULT_LIST_ITEMS_LIMIT = 10;
const STORAGE_KEY = "todos-view-mode";

function TodosPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [todoLists, setTodoLists] = useState<TodoList[]>([]);
  const [defaultListItems, setDefaultListItems] = useState<TodoItem[]>([]);
  const [defaultList, setDefaultList] = useState<TodoList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newProjectId, setNewProjectId] = useState<string | null>(null);
  const [otherListsTotal, setOtherListsTotal] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);

  const viewParam = searchParams.get("view") as ViewMode | null;
  const sortParam = searchParams.get("sort") as SortOption | null;

  const [viewMode, setViewMode] = useState<ViewMode>("personal");
  const [sortBy, setSortBy] = useState<SortOption>("default");

  useEffect(() => {
    const savedView = localStorage.getItem(STORAGE_KEY) as ViewMode | null;
    const savedSort = localStorage.getItem("todos-sort") as SortOption | null;

    const params = new URLSearchParams(searchParams.toString());

    const view = viewParam || savedView || "personal";
    if (!viewParam) {
      params.set("view", view);
    }
    setViewMode(view);
    localStorage.setItem(STORAGE_KEY, view);

    const sort = sortParam || savedSort || "default";
    if (!sortParam) {
      params.set("sort", sort);
    }
    setSortBy(sort);
    localStorage.setItem("todos-sort", sort);

    const qs = params.toString();
    if (qs !== searchParams.toString()) {
      router.replace(`${pathname}?${qs}`, { scroll: false });
    }

    setIsHydrated(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleViewModeChange(mode: ViewMode) {
    setViewMode(mode);
    localStorage.setItem(STORAGE_KEY, mode);
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", mode);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function handleSortChange(sort: SortOption) {
    setSortBy(sort);
    localStorage.setItem("todos-sort", sort);
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", sort);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  // All projects state
  const [allItems, setAllItems] = useState<TodoItemWithList[]>([]);
  const [allItemsTotal, setAllItemsTotal] = useState(0);
  const [isLoadingAll, setIsLoadingAll] = useState(false);

  const allItemsPagination = usePagination({
    totalItems: allItemsTotal,
    initialLimit: 25,
  });

  const otherListsPagination = usePagination({
    totalItems: otherListsTotal,
    initialLimit: 5,
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const personalListsRes = await fetch(
        "/api/todo/lists?personalOnly=true&limit=100",
      );
      if (personalListsRes.ok) {
        const personalData: PaginatedListsResponse =
          await personalListsRes.json();
        const defaultL = personalData.data.find(
          (list: TodoList) => list.isDefault,
        );
        if (defaultL) {
          setDefaultList(defaultL);
          await fetchDefaultListItems(defaultL.id);
        } else {
          setDefaultList(null);
          setDefaultListItems([]);
        }
      }

      const params = new URLSearchParams({
        personalOnly: "true",
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

  const fetchAllItems = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoadingAll(true);
    try {
      const params = new URLSearchParams({
        page: allItemsPagination.currentPage.toString(),
        limit: allItemsPagination.limit.toString(),
        projectOnly: "true",
        date: getLocalDateString(),
      });
      if (sortBy !== "default") {
        params.set("sort", sortBy);
      }
      const response = await fetch(`/api/todo/items?${params.toString()}`);
      if (response.ok) {
        const data: PaginatedItemsResponse = await response.json();
        setAllItems(data.data);
        setAllItemsTotal(data.pagination.total);
      }
    } catch (error) {
      console.error("Error fetching all items:", error);
    } finally {
      if (showLoading) setIsLoadingAll(false);
    }
  }, [allItemsPagination.currentPage, allItemsPagination.limit, sortBy]);

  useEffect(() => {
    if (isHydrated && viewMode === "all-projects") {
      fetchAllItems();
    }
  }, [viewMode, fetchAllItems, isHydrated]);

  useEffect(() => {
    function handleRecurringUpdate() {
      if (viewMode === "all-projects") {
        fetchAllItems(false);
      } else if (defaultList) {
        fetchDefaultListItems(defaultList.id);
      }
    }
    window.addEventListener("recurring-completion-updated", handleRecurringUpdate);
    return () => window.removeEventListener("recurring-completion-updated", handleRecurringUpdate);
  }, [viewMode, defaultList, fetchAllItems]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchDefaultListItems(listId: string) {
    try {
      const response = await fetch(
        `/api/todo/lists/${listId}/items?date=${getLocalDateString()}`,
      );
      if (response.ok) {
        const data = await response.json();
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
          projectId: newProjectId,
        }),
      });

      if (response.ok) {
        setNewName("");
        setNewDescription("");
        setNewProjectId(null);
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

  async function handleSetDefault(id: string) {
    try {
      const response = await fetch(`/api/todo/lists/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error setting default todo list:", error);
    }
  }

  function getTodoListUrl(todoList: TodoList) {
    return `/todos/${todoList.id}`;
  }

  const handlePageChange = (page: number) => {
    otherListsPagination.setPage(page);
  };

  const handleLimitChange = (limit: number) => {
    otherListsPagination.setLimit(limit);
  };

  const handleAllItemsPageChange = (page: number) => {
    allItemsPagination.setPage(page);
  };

  const handleAllItemsLimitChange = (limit: number) => {
    allItemsPagination.setLimit(limit);
  };

  const otherLists = todoLists;

  return (
    <DashboardLayout breadcrumbs={[{ title: "Todos", href: "/todos" }]}>
      <PageHeader
        title="Todos"
        description="Manage your tasks and to-do lists"
        icon={CheckSquare}
        className="mb-6"
      >
        {viewMode === "all-projects" && (
          <Select value={sortBy} onValueChange={(v) => handleSortChange(v as SortOption)}>
            <SelectTrigger className="h-8 w-[180px] gap-1.5 text-xs">
              <ArrowUpDown className="h-3.5 w-3.5" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="flex items-center rounded-lg border bg-muted p-1">
          <Button
            variant={viewMode === "personal" ? "default" : "ghost"}
            size="sm"
            onClick={() => handleViewModeChange("personal")}
            className="h-7 gap-1.5 rounded-md px-3 text-xs"
          >
            <User className="h-3.5 w-3.5" />
            Personal
          </Button>
          <Button
            variant={viewMode === "all-projects" ? "default" : "ghost"}
            size="sm"
            onClick={() => handleViewModeChange("all-projects")}
            className="h-7 gap-1.5 rounded-md px-3 text-xs"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            All Projects
          </Button>
        </div>

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
                <Label>Project (optional)</Label>
                <ProjectSelect
                  value={newProjectId}
                  onChange={setNewProjectId}
                  placeholder="Select a project"
                />
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

      {!isHydrated ? (
        <LoadingSpinner />
      ) : viewMode === "personal" ? (
        isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-6">
            {defaultList && (
              <DefaultTodoListSection
                defaultList={defaultList}
                items={defaultListItems}
                viewAllHref={getTodoListUrl(defaultList)}
                onRefresh={() => fetchDefaultListItems(defaultList.id)}
              />
            )}

            {otherLists.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Todo Lists</h2>
                </div>
                <TodoListsTable
                  todoLists={otherLists}
                  getHref={getTodoListUrl}
                  onSetDefault={handleSetDefault}
                  onDelete={handleDelete}
                />
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

            {!defaultList && otherLists.length === 0 && (
              <EmptyState
                icon={ListTodo}
                title="No todo lists yet"
                description="Create your first todo list to get started"
              />
            )}
          </div>
        )
      ) : isLoadingAll ? (
        <LoadingSpinner />
      ) : allItems.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="No todo items yet"
          description="Todo items from all your project lists will appear here"
        />
      ) : (
        <>
          <TodoItemsView
            items={allItems}
            onRefresh={() => fetchAllItems(false)}
            showProject={true}
            showList={true}
          />
          <Pagination
            currentPage={allItemsPagination.currentPage}
            totalPages={allItemsPagination.totalPages}
            totalItems={allItemsTotal}
            limit={allItemsPagination.limit}
            onPageChange={handleAllItemsPageChange}
            onLimitChange={handleAllItemsLimitChange}
          />
        </>
      )}
    </DashboardLayout>
  );
}

export default function TodosPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <TodosPageContent />
    </Suspense>
  );
}
