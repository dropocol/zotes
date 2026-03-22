"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/ui/pagination";
import { TodoItemsView } from "@/components/todos/todo-items-view";
import { TodoItemDetailDrawer } from "@/components/todos/todo-item-detail-drawer";
import {
  isDateBeforeToday,
  isDateToday,
  isDateTomorrow,
} from "@/utils/date";
import { getLocalDateString } from "@/utils/date";
import { CalendarDays, Loader2, AlertCircle } from "lucide-react";
import { TodoItem, TodoList } from "@/types";
import { usePagination } from "@/hooks/use-pagination";

interface TodoItemWithList extends TodoItem {
  todoList: TodoList;
}

interface PaginatedResponse {
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

export default function UpcomingTodosPage() {
  const [items, setItems] = useState<TodoItemWithList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<TodoItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

  const pagination = usePagination({
    totalItems,
    initialLimit: 25,
  });

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        filter: "upcoming",
        page: pagination.currentPage.toString(),
        limit: pagination.limit.toString(),
        date: getLocalDateString(),
      });
      const response = await fetch(`/api/todo/items?${params.toString()}`);
      const data: PaginatedResponse = await response.json();
      setItems(data.data);
      setTotalItems(data.pagination.total);
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.currentPage, pagination.limit]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  function handleSelectItem(item: TodoItem) {
    setSelectedItem(item);
    setIsDrawerOpen(true);
  }

  const handlePageChange = (page: number) => {
    pagination.setPage(page);
  };

  const handleLimitChange = (limit: number) => {
    pagination.setLimit(limit);
  };

  const hasDate = (d: Date | string | null | undefined): d is Date | string => !!d;
  const overdueItems = items.filter((item) => hasDate(item.dueDate) && isDateBeforeToday(item.dueDate));
  const todayItems = items.filter((item) => hasDate(item.dueDate) && isDateToday(item.dueDate));
  const tomorrowItems = items.filter((item) => hasDate(item.dueDate) && isDateTomorrow(item.dueDate));
  const laterItems = items.filter(
    (item) =>
      hasDate(item.dueDate) &&
      !isDateBeforeToday(item.dueDate) &&
      !isDateToday(item.dueDate) &&
      !isDateTomorrow(item.dueDate)
  );

  return (
    <DashboardLayout
      breadcrumbs={[
        { title: "Todos", href: "/todos" },
        { title: "Upcoming", href: "/todos/upcoming" },
      ]}
    >
      <PageHeader
        title="Upcoming"
        description="Tasks with due dates that need your attention"
        icon={CalendarDays}
        className="mb-6"
      />

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
        <>
          <div className="space-y-6">
            {overdueItems.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <h2 className="text-sm font-semibold text-destructive">
                    Overdue ({overdueItems.length})
                  </h2>
                </div>
                <TodoItemsView
                  items={overdueItems}
                  onRefresh={() => fetchItems()}
                  showProject={true}
                  showList={true}
                  onSelectItem={handleSelectItem}
                />
              </section>
            )}

            {todayItems.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground mb-3">
                  Due Today ({todayItems.length})
                </h2>
                <TodoItemsView
                  items={todayItems}
                  onRefresh={() => fetchItems()}
                  showProject={true}
                  showList={true}
                  onSelectItem={handleSelectItem}
                />
              </section>
            )}

            {tomorrowItems.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground mb-3">
                  Due Tomorrow ({tomorrowItems.length})
                </h2>
                <TodoItemsView
                  items={tomorrowItems}
                  onRefresh={() => fetchItems()}
                  showProject={true}
                  showList={true}
                  onSelectItem={handleSelectItem}
                />
              </section>
            )}

            {laterItems.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground mb-3">
                  Coming Up ({laterItems.length})
                </h2>
                <TodoItemsView
                  items={laterItems}
                  onRefresh={() => fetchItems()}
                  showProject={true}
                  showList={true}
                  onSelectItem={handleSelectItem}
                />
              </section>
            )}
          </div>

          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={totalItems}
            limit={pagination.limit}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
          />
        </>
      )}

      <TodoItemDetailDrawer
        item={selectedItem}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        onUpdate={() => fetchItems()}
      />
    </DashboardLayout>
  );
}
