"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { TodoItemsTable } from "@/components/todos/todo-items-table";
import type { SubItemFormState } from "./todo-item-row";
import { TodoList, TodoItem } from "@/types";

interface DefaultTodoListSectionProps {
  defaultList: TodoList;
  items: TodoItem[];
  viewAllHref: string;
  canModify?: boolean;
  onAddItem?: (title: string) => void | Promise<void>;
  onToggleStatus?: (id: string, status: string) => void | Promise<void>;
  onDeleteItem?: (id: string) => void | Promise<void>;
  onAddSubItem?: (parentId: string, title: string) => void | Promise<void>;
  onSelectItem?: (item: TodoItem) => void;
  className?: string;
}

export function DefaultTodoListSection({
  defaultList,
  items,
  viewAllHref,
  canModify = true,
  onAddItem,
  onToggleStatus,
  onDeleteItem,
  onAddSubItem,
  onSelectItem,
  className = "",
}: DefaultTodoListSectionProps) {
  const [addingToParentId, setAddingToParentId] = useState<string | null>(null);
  const [subItemTitle, setSubItemTitle] = useState("");

  function handleAddSubItem(parentId: string) {
    setAddingToParentId(parentId);
    setSubItemTitle("");
  }

  async function handleSubmitSubItem(title: string) {
    if (!onAddSubItem || !addingToParentId) return;
    await onAddSubItem(addingToParentId, title);
    setAddingToParentId(null);
    setSubItemTitle("");
  }

  function handleCancelSubItem() {
    setAddingToParentId(null);
    setSubItemTitle("");
  }

  const subItemForm: SubItemFormState = {
    addingToParentId,
    title: subItemTitle,
    onTitleChange: setSubItemTitle,
    onSubmit: handleSubmitSubItem,
    onCancel: handleCancelSubItem,
  };

  return (
    <section className={className}>
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
          <Link href={viewAllHref}>
            View all
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <TodoItemsTable
        items={items}
        showProject={true}
        showList={false}
        showAddInput={canModify && !!onAddItem}
        onAddItem={onAddItem}
        onToggleStatus={onToggleStatus || (() => {})}
        onAddSubItem={handleAddSubItem}
        onDelete={onDeleteItem || (() => {})}
        onSelect={onSelectItem || (() => {})}
        subItemForm={subItemForm}
      />
    </section>
  );
}
