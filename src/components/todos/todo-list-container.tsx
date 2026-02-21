"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TodoItemRow } from "./todo-item-row";
import { TodoItemDetailDrawer } from "./todo-item-detail-drawer";
import { Plus, Loader2 } from "lucide-react";

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
      const response = await fetch(`/api/todo-lists/${todoListId}/items`);
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function addItem(parentId?: string) {
    const title = parentId ? newItemTitle : newItemTitle;
    if (!title.trim()) return;

    setIsAddingItem(true);
    try {
      const response = await fetch(`/api/todo-lists/${todoListId}/items`, {
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
      await fetch(`/api/todo-items/${id}`, {
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
      await fetch(`/api/todo-items/${id}`, {
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

  function handleUpdateItem(updatedItem: TodoItem) {
    fetchItems();
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add new top-level item */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          addItem();
        }}
        className="flex gap-2"
      >
        <Input
          placeholder="Add a new item..."
          value={newItemTitle}
          onChange={(e) => setNewItemTitle(e.target.value)}
          disabled={isAddingItem}
        />
        <Button type="submit" disabled={!newItemTitle.trim() || isAddingItem}>
          <Plus className="h-4 w-4" />
        </Button>
      </form>

      {/* Add sub-item form when adding to a parent */}
      {addingToParentId && (
        <div className="ml-6 border-l pl-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addItem(addingToParentId);
            }}
            className="flex gap-2"
          >
            <Input
              placeholder="Add a sub-item..."
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              disabled={isAddingItem}
              autoFocus
            />
            <Button type="submit" size="sm" disabled={!newItemTitle.trim() || isAddingItem}>
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
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
        <div className="text-center py-8 text-muted-foreground">
          No items yet. Add your first item above.
        </div>
      ) : (
        <div className="space-y-1">
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
