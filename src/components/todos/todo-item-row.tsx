"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { PriorityBadge } from "./priority-badge";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Calendar,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { TodoItem } from "@/types";

interface TodoItemRowProps {
  item: TodoItem;
  level?: number;
  onToggleStatus: (id: string, status: string) => void;
  onAddSubItem: (parentId: string) => void;
  onDelete: (id: string) => void;
  onSelect: (item: TodoItem) => void;
  hideSubTasks?: boolean;
  listLink?: React.ReactNode;
  dueDateBadge?: React.ReactNode;
}

const priorityColors: Record<string, string> = {
  low: "bg-slate-200 dark:bg-slate-700",
  medium: "bg-blue-200 dark:bg-blue-800",
  high: "bg-orange-200 dark:bg-orange-800",
  urgent: "bg-red-200 dark:bg-red-800",
};

export function TodoItemRow({
  item,
  level = 0,
  onToggleStatus,
  onAddSubItem,
  onDelete,
  onSelect,
  hideSubTasks,
  listLink,
  dueDateBadge,
}: TodoItemRowProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const isDone = item.status === "done";
  const hasSubItems = item.subItems && item.subItems.length > 0;
  const isTopLevel = level === 0;
  const showExpanded = !hideSubTasks && isExpanded;

  async function handleToggle() {
    const newStatus = isDone ? "todo" : "done";
    onToggleStatus(item.id, newStatus);
  }

  async function handleDelete() {
    if (confirm("Are you sure you want to delete this item?")) {
      onDelete(item.id);
    }
  }

  // Format due date with relative indicators
  const formatDueDate = (date: Date) => {
    const d = new Date(date);
    if (isToday(d)) return "Today";
    if (isTomorrow(d)) return "Tomorrow";
    return format(d, "MMM d");
  };

  // Check if overdue
  const isOverdue = item.dueDate && isPast(new Date(item.dueDate)) && !isDone;

  // Calculate indentation offset to align sub-items properly
  // Top level has: expand button (24px) + checkbox (24px) = 48px occupied
  // Sub-items should start at the same position as title text
  const indentOffset = level > 0 ? "ml-0" : "";

  return (
    <div
      className={cn(
        "group",
        level > 0 && "ml-11" // Offset for sub-items (aligns with parent's title)
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-all duration-150",
          isDone && "opacity-50",
          !isTopLevel && "bg-muted/20 hover:bg-muted/40"
        )}
      >
        {/* Expand/Collapse button - fixed width */}
        <div className="w-5 flex-shrink-0">
          {isTopLevel && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 p-0 hover:bg-transparent"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {hasSubItems ? (
                isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                )
              ) : null}
            </Button>
          )}
        </div>

        {/* Checkbox - fixed width */}
        <Checkbox
          checked={isDone}
          onCheckedChange={handleToggle}
          className={cn(
            "w-5 h-5 rounded-full border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground",
            !isDone && item.status === "in-progress" && "border-blue-500 bg-blue-100 dark:bg-blue-900/30"
          )}
        />

        {/* Priority indicator dot */}
        <div
          className={cn(
            "w-1.5 h-1.5 rounded-full flex-shrink-0",
            priorityColors[item.priority] || priorityColors.medium
          )}
        />

        {/* Title */}
        <div className="flex-1 min-w-0">
          <button
            className="text-left w-full"
            onClick={() => onSelect(item)}
          >
            <span
              className={cn(
                "text-sm font-medium transition-all",
                isDone && "line-through text-muted-foreground"
              )}
            >
              {item.title}
            </span>
          </button>
          {listLink && (
            <div className="mt-0.5">
              {listLink}
            </div>
          )}
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Has notes indicator */}
          {item.notes && (
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          )}

          {/* Due date - custom badge or default */}
          {dueDateBadge ? (
            <>{dueDateBadge}</>
          ) : item.dueDate ? (
            <div
              className={cn(
                "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full",
                isOverdue
                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Calendar className="h-3 w-3" />
              <span>{formatDueDate(item.dueDate as Date)}</span>
            </div>
          ) : null}

          {/* Priority badge for high/urgent */}
          {(item.priority === "high" || item.priority === "urgent") && !isDone && (
            <PriorityBadge priority={item.priority} className="text-[10px] px-1.5 py-0" />
          )}
        </div>

        {/* Actions */}
        {isTopLevel && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => onAddSubItem(item.id)}
              title="Add sub-item"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Sub-items */}
      {showExpanded && hasSubItems && (
        <div className="relative mt-0.5">
          {/* Vertical line connector */}
          <div className="absolute left-3 top-0 bottom-2 w-px bg-border" />
          <div className="space-y-0.5">
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
        </div>
      )}
    </div>
  );
}
