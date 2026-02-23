"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TodoItemRow } from "./todo-item-row";
import { TodoItemDetailDrawer } from "./todo-item-detail-drawer";
import { TodoItemInput } from "./todo-item-input";
import { Loader2, ListTodo } from "lucide-react";
import { TodoItem } from "@/types";

interface TodoListContainerProps {
  todoListId: string;
}

export function TodoListContainer({ todoListId }: TodoListContainerProps) {
  const [items, setItems] = useState<TodoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addingToParentId, setAddingToParentId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<TodoItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [subItemTitle, setSubItemTitle] = useState("");

  useEffect(() => {
    fetchItems();
  }, [todoListId]);

  async function fetchItems() {
    try {
      const response = await fetch(`/api/todo/lists/${todoListId}/items`);
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function addItem(title: string) {
    const response = await fetch(`/api/todo/lists/${todoListId}/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    });

    if (response.ok) {
      fetchItems();
    }
  }

  async function addSubItem(title: string) {
    if (!addingToParentId) return;

    const response = await fetch(`/api/todo/lists/${todoListId}/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        parentId: addingToParentId,
      }),
    });

    if (response.ok) {
      setAddingToParentId(null);
      setSubItemTitle("");
      fetchItems();
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
    fetchItems();
  }

  async function deleteItem(id: string) {
    await fetch(`/api/todo/items/${id}`, {
      method: "DELETE",
    });
    fetchItems();
  }

  function handleAddSubItem(parentId: string) {
    setAddingToParentId(parentId);
    setSubItemTitle("");
  }

  function handleSelectItem(item: TodoItem) {
    setSelectedItem(item);
    setIsDrawerOpen(true);
  }

  function handleUpdateItem() {
    fetchItems();
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">Loading items...</p>
      </div>
    );
  }

  const completedCount = items.filter(
    (item) => item.status === "done" && !item.parentId
  ).length;

  return (
    <div className="p-2">
      {/* Add item input */}
      <div className="flex items-center gap-2 p-3 border-b">
        <TodoItemInput onAdd={addItem} />
      </div>

      {/* Add sub-item form */}
      {addingToParentId && (
        <div className="ml-11 p-2 bg-muted/30 border-b flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Sub-task:</span>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addSubItem(subItemTitle);
            }}
            className="flex-1 flex items-center gap-2"
          >
            <Input
              placeholder="Add a sub-task..."
              value={subItemTitle}
              onChange={(e) => setSubItemTitle(e.target.value)}
              autoFocus
              className="border-0 shadow-none focus-visible:ring-0 px-0 h-auto py-1 text-sm"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!subItemTitle.trim()}
              className="h-7"
            >
              Add
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7"
              onClick={() => {
                setAddingToParentId(null);
                setSubItemTitle("");
              }}
            >
              Cancel
            </Button>
          </form>
        </div>
      )}

      {/* Items list */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex items-center justify-center h-12 w-12 rounded-full bg-muted mb-4">
            <ListTodo className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground mb-1">
            No tasks yet
          </p>
          <p className="text-xs text-muted-foreground">
            Add your first task above to get started
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {items.map((item) => (
            <TodoItemRow
              key={item.id}
              item={item}
              onToggleStatus={toggleStatus}
              onAddSubItem={handleAddSubItem}
              onDelete={deleteItem}
              onSelect={handleSelectItem}
            />
          ))}
        </div>
      )}

      {/* Detail drawer */}
      <TodoItemDetailDrawer
        item={selectedItem}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        onUpdate={handleUpdateItem}
      />
    </div>
  );
}
