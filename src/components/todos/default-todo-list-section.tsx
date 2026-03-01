"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import Link from "next/link";
import { ExternalLink, ListTodo } from "lucide-react";
import { TodoItemInput } from "@/components/todos/todo-item-input";
import { TodoItemRow } from "@/components/todos/todo-item-row";
import { TodoList, TodoItem } from "@/types";

interface DefaultTodoListSectionProps {
  defaultList: TodoList;
  items: TodoItem[];
  viewAllHref: string;
  canModify?: boolean;
  onAddItem?: (title: string) => void | Promise<void>;
  onToggleStatus?: (id: string, status: string) => void | Promise<void>;
  onDeleteItem?: (id: string) => void | Promise<void>;
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

      <div className="rounded-lg border bg-card">
        {canModify && onAddItem && (
          <div className="flex items-center gap-2 p-3 border-b">
            <TodoItemInput onAdd={async (title) => { await onAddItem(title); }} />
          </div>
        )}

        <div className="divide-y divide-border/50">
          {items.length === 0 ? (
            <EmptyState
              icon={ListTodo}
              title="No tasks yet"
              className="py-12"
              iconClassName="h-10 w-10 mb-3"
            />
          ) : (
            items.map((item) => (
              <TodoItemRow
                key={item.id}
                item={item}
                onToggleStatus={onToggleStatus || (() => {})}
                onAddSubItem={() => {}}
                onDelete={onDeleteItem || (() => {})}
                onSelect={onSelectItem || (() => {})}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
