"use client";

import { useState } from "react";
import { TodoItemsTable } from "./todo-items-table";
import { TodoItemDetailDrawer } from "./todo-item-detail-drawer";
import type { SubItemFormState } from "./todo-item-row";
import { TodoItem } from "@/types";

interface TodoItemsViewProps {
  items: TodoItem[];
  onRefresh: () => void;
  todoListId?: string;
  onAddItem?: (title: string) => void;
  showProject?: boolean;
  showList?: boolean;
  showAddInput?: boolean;
  emptyMessage?: string;
  onSelectItem?: (item: TodoItem) => void;
}

export function TodoItemsView({
  items,
  onRefresh,
  todoListId,
  onAddItem,
  showProject = false,
  showList = false,
  showAddInput = false,
  emptyMessage,
  onSelectItem,
}: TodoItemsViewProps) {
  const [selectedItem, setSelectedItem] = useState<TodoItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [addingToParentId, setAddingToParentId] = useState<string | null>(null);
  const [subItemTitle, setSubItemTitle] = useState("");

  const parentManagesDrawer = onSelectItem !== undefined;

  async function toggleStatus(id: string, status: string) {
    await fetch(`/api/todo/items/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    onRefresh();
  }

  async function deleteItem(id: string) {
    await fetch(`/api/todo/items/${id}`, { method: "DELETE" });
    onRefresh();
  }

  async function addSubItem(title: string) {
    if (!addingToParentId) return;

    // Find the parent item's todoListId, or use the prop
    const parentItem = items.find((item) => item.id === addingToParentId);
    const listId = todoListId || parentItem?.todoListId;
    if (!listId) return;

    const response = await fetch(`/api/todo/lists/${listId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, parentId: addingToParentId }),
    });

    if (response.ok) {
      setAddingToParentId(null);
      setSubItemTitle("");
      onRefresh();
    }
  }

  function handleSelectItem(item: TodoItem) {
    if (parentManagesDrawer) {
      onSelectItem(item);
    } else {
      setSelectedItem(item);
      setIsDrawerOpen(true);
    }
  }

  function handleUpdateItem() {
    onRefresh();
  }

  const subItemForm: SubItemFormState = {
    addingToParentId,
    title: subItemTitle,
    onTitleChange: setSubItemTitle,
    onSubmit: addSubItem,
    onCancel: () => {
      setAddingToParentId(null);
      setSubItemTitle("");
    },
  };

  // Determine the add handler: custom onAddItem takes priority, then todoListId-based add
  const effectiveAddItem = onAddItem
    ? onAddItem
    : todoListId
      ? (title: string) => {
          fetch(`/api/todo/lists/${todoListId}/items`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title }),
          }).then((res) => {
            if (res.ok) onRefresh();
          });
        }
      : undefined;

  return (
    <>
      <TodoItemsTable
        items={items}
        showProject={showProject}
        showList={showList}
        showAddInput={showAddInput && !!effectiveAddItem}
        onAddItem={effectiveAddItem}
        onToggleStatus={toggleStatus}
        onAddSubItem={(parentId) => {
          setAddingToParentId(parentId);
          setSubItemTitle("");
        }}
        onDelete={deleteItem}
        onSelect={handleSelectItem}
        subItemForm={subItemForm}
        emptyMessage={emptyMessage}
      />

      {!parentManagesDrawer && (
        <TodoItemDetailDrawer
          item={selectedItem}
          open={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
          onUpdate={handleUpdateItem}
        />
      )}
    </>
  );
}
