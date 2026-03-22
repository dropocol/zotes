"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { TodoItemsView } from "@/components/todos/todo-items-view";
import { TodoList, TodoItem } from "@/types";

interface DefaultTodoListSectionProps {
  defaultList: TodoList;
  items: TodoItem[];
  viewAllHref: string;
  canModify?: boolean;
  onRefresh: () => void;
  onAddItem?: (title: string) => void | Promise<void>;
  onSelectItem?: (item: TodoItem) => void;
  className?: string;
}

export function DefaultTodoListSection({
  defaultList,
  items,
  viewAllHref,
  canModify = true,
  onRefresh,
  onAddItem,
  onSelectItem,
  className = "",
}: DefaultTodoListSectionProps) {
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

      <TodoItemsView
        items={items}
        onRefresh={onRefresh}
        todoListId={defaultList.id}
        onAddItem={onAddItem}
        showProject={true}
        showAddInput={canModify}
        onSelectItem={onSelectItem}
      />
    </section>
  );
}
