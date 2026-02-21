"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { PriorityBadge } from "./priority-badge";
import { ChevronRight, ChevronDown, Plus, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

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

interface TodoItemRowProps {
  item: TodoItem;
  level?: number;
  onToggleStatus: (id: string, status: string) => void;
  onAddSubItem: (parentId: string) => void;
  onDelete: (id: string) => void;
  onSelect: (item: TodoItem) => void;
}

export function TodoItemRow({
  item,
  level = 0,
  onToggleStatus,
  onAddSubItem,
  onDelete,
  onSelect,
}: TodoItemRowProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const isDone = item.status === "done";
  const hasSubItems = item.subItems && item.subItems.length > 0;
  const isTopLevel = level === 0;

  async function handleToggle() {
    const newStatus = isDone ? "todo" : "done";
    onToggleStatus(item.id, newStatus);
  }

  async function handleDelete() {
    if (confirm("Are you sure you want to delete this item?")) {
      onDelete(item.id);
    }
  }

  return (
    <div className={cn(level > 0 && "ml-6 border-l pl-4")}>
      <div
        className={cn(
          "group flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors",
          isDone && "opacity-60"
        )}
      >
        {isTopLevel && (
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab opacity-0 group-hover:opacity-100" />
        )}

        {isTopLevel && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {hasSubItems ? (
              isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )
            ) : (
              <div className="h-3 w-3" />
            )}
          </Button>
        )}

        <Checkbox
          checked={isDone}
          onCheckedChange={handleToggle}
          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />

        <button
          className="flex-1 text-left"
          onClick={() => onSelect(item)}
        >
          <span className={cn(isDone && "line-through")}>{item.title}</span>
        </button>

        <div className="flex items-center gap-2">
          {item.dueDate && (
            <span className="text-xs text-muted-foreground">
              {format(new Date(item.dueDate), "MMM d")}
            </span>
          )}
          <PriorityBadge priority={item.priority} className="text-xs" />
        </div>

        {isTopLevel && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onAddSubItem(item.id)}
            >
              <Plus className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {isExpanded && hasSubItems && (
        <div className="space-y-1">
          {item.subItems!.map((subItem) => (
            <TodoItemRow
              key={subItem.id}
              item={subItem}
              level={level + 1}
              onToggleStatus={onToggleStatus}
              onAddSubItem={onAddSubItem}
              onDelete={onDelete}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
