"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TodoItemRow } from "./todo-item-row";
import { TodoItemDetailDrawer } from "./todo-item-detail-drawer";
import { Plus, Loader2, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";

interface TodoItem {
  id: string;
  title: string;
  notes?: string | null;
  status: string;
  priority: string;
  dueDate?: Date | null;
  order?: number;
  parentId?: string | null;
  subItems?: TodoItem[];
}

interface TodoListContainerProps {
  todoListId: string;
}

export function TodoListContainer({ todoListId }: TodoListContainerProps) {
  const [items, setItems] = useState<TodoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [addingToParentId, setAddingToParentId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<TodoItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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

  async function addItem(parentId?: string) {
    const title = newItemTitle;
    if (!title.trim()) return;

    setIsAddingItem(true);
    try {
      const response = await fetch(`/api/todo/lists/${todoListId}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          parentId: parentId || undefined,
        }),
      });

      if (response.ok) {
        setNewItemTitle("");
        setAddingToParentId(null);
        fetchItems();
      }
    } catch (error) {
      console.error("Error adding item:", error);
    } finally {
      setIsAddingItem(false);
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

  function handleAddSubItem(parentId: string) {
    setAddingToParentId(parentId);
    setNewItemTitle("");
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
        <div className="flex items-center justify-center h-5 w-5">
          <Plus className="h-4 w-4 text-muted-foreground" />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addItem();
          }}
          className="flex-1 flex items-center gap-2"
        >
          <Input
            placeholder="Add a task..."
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            disabled={isAddingItem}
            className="border-0 shadow-none focus-visible:ring-0 px-0 h-auto py-1 text-sm"
          />
          {newItemTitle.trim() && (
            <Button
              type="submit"
              size="sm"
              disabled={isAddingItem}
              className="h-7"
            >
              {isAddingItem ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                "Add"
              )}
            </Button>
          )}
        </form>
      </div>

      {/* Add sub-item form */}
      {addingToParentId && (
        <div className="ml-11 p-2 bg-muted/30 border-b flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Sub-task:</span>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addItem(addingToParentId);
            }}
            className="flex-1 flex items-center gap-2"
          >
            <Input
              placeholder="Add a sub-task..."
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              disabled={isAddingItem}
              autoFocus
              className="border-0 shadow-none focus-visible:ring-0 px-0 h-auto py-1 text-sm"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!newItemTitle.trim() || isAddingItem}
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
                setNewItemTitle("");
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
