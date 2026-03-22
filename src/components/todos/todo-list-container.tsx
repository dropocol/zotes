"use client";

import { useState, useEffect } from "react";
import { TodoItemsView } from "./todo-items-view";
import { Loader2 } from "lucide-react";
import { TodoItem } from "@/types";
import { getLocalDateString } from "@/utils/date";

interface TodoListContainerProps {
  todoListId: string;
  hasProject?: boolean;
}

export function TodoListContainer({ todoListId, hasProject = false }: TodoListContainerProps) {
  const [items, setItems] = useState<TodoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, [todoListId]);

  async function fetchItems() {
    try {
      const response = await fetch(`/api/todo/lists/${todoListId}/items?date=${getLocalDateString()}`);
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">Loading items...</p>
      </div>
    );
  }

  return (
    <div className="p-2">
      <TodoItemsView
        items={items}
        onRefresh={fetchItems}
        todoListId={todoListId}
        showAddInput={true}
        showProject={hasProject}
      />
    </div>
  );
}
