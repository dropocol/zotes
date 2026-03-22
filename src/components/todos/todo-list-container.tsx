"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TodoItemsTable } from "./todo-items-table";
import { TodoItemDetailDrawer } from "./todo-item-detail-drawer";
import { Loader2 } from "lucide-react";
import { TodoItem } from "@/types";

interface TodoListContainerProps {
  todoListId: string;
  hasProject?: boolean;
}

export function TodoListContainer({ todoListId, hasProject = false }: TodoListContainerProps) {
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

  return (
    <div className="p-2">
      {/* Items table */}
      <TodoItemsTable
        items={items}
        showProject={hasProject}
        showList={false}
        showAddInput={true}
        onAddItem={addItem}
        onToggleStatus={toggleStatus}
        onAddSubItem={handleAddSubItem}
        onDelete={deleteItem}
        onSelect={handleSelectItem}
        subItemForm={{
          addingToParentId,
          title: subItemTitle,
          onTitleChange: setSubItemTitle,
          onSubmit: addSubItem,
          onCancel: () => {
            setAddingToParentId(null);
            setSubItemTitle("");
          },
        }}
      />

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
