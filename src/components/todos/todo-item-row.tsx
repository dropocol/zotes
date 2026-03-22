"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import { PriorityBadge } from "./priority-badge";
import { RecurringBadge } from "@/components/recurring/recurring-badge";
import { RecurringMiniProgress } from "@/components/recurring/recurring-mini-progress";
import {
  isDateBeforeToday,
  isDateToday,
  isDateTomorrow,
} from "@/utils/date";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Calendar,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { TodoItem } from "@/types";

export interface SubItemFormState {
  addingToParentId: string | null;
  title: string;
  onTitleChange: (title: string) => void;
  onSubmit: (title: string) => void;
  onCancel: () => void;
}

interface TodoItemRowProps {
  item: TodoItem;
  level?: number;
  onToggleStatus: (id: string, status: string) => void;
  onAddSubItem: (parentId: string) => void;
  onDelete: (id: string) => void;
  onSelect: (item: TodoItem) => void;
  hideSubTasks?: boolean;
  showProject?: boolean;
  showList?: boolean;
  subItemForm?: SubItemFormState;
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
  showProject = false,
  showList = false,
  subItemForm,
}: TodoItemRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const effectiveStatus = (item as TodoItem & { _effectiveStatus?: string })._effectiveStatus || item.status;
  const isRecurring = item.isRecurring;
  const isCheckboxChecked = isRecurring ? effectiveStatus === "done" : item.status === "done";
  const showStrikethrough = !isRecurring && item.status === "done";

  const hasSubItems = item.subItems && item.subItems.length > 0;
  const isTopLevel = level === 0;
  const showExpanded = !hideSubTasks && isExpanded;

  async function handleToggle() {
    const newStatus = isCheckboxChecked ? "todo" : "done";

    if (isRecurring) {
      // Use the recurring completions API with local date (matches mini-progress display)
      const today = new Date();
      const localDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      await fetch("/api/recurring/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          todoItemId: item.id,
          date: localDateStr,
          status: newStatus,
        }),
      });
      // Notify RecurringMiniProgress to re-fetch
      window.dispatchEvent(new CustomEvent("recurring-completion-updated", { detail: { todoItemId: item.id } }));
    }

    // Always call onToggleStatus so the parent refreshes data
    onToggleStatus(item.id, newStatus);
  }

  async function handleDelete() {
    if (confirm("Are you sure you want to delete this item?")) {
      onDelete(item.id);
    }
  }

  const formatDueDate = (date: Date) => {
    if (isDateToday(date)) return "Today";
    if (isDateTomorrow(date)) return "Tomorrow";
    return format(new Date(date), "MMM d");
  };

  const isOverdue = item.dueDate && isDateBeforeToday(item.dueDate) && !isCheckboxChecked;

  const todoList = (item as TodoItem & { todoList?: { name?: string; project?: { name?: string; color?: string } | null } | null }).todoList;
  const projectName = todoList?.project?.name;
  const projectColor = todoList?.project?.color;
  const listName = todoList?.name;

  const colSpan = 1 + (showProject ? 1 : 0) + (showList ? 1 : 0) + 5; // task + project? + list? + due + recurring + priority + actions

  const isAddingSubItem = subItemForm && subItemForm.addingToParentId === item.id;

  return (
    <>
      {/* Main row */}
      <TableRow
        className={cn(
          "group",
          showStrikethrough && "opacity-50",
          !isTopLevel && "bg-muted/30 hover:bg-muted/50"
        )}
      >
        {/* Col 1: Expand + Checkbox + Priority + Title */}
        <TableCell className={cn("py-2.5 px-3", !isTopLevel && "pl-11")}>
          <div className="flex items-center gap-2">
            {/* Expand/Collapse chevron */}
            <div className="w-5 flex-shrink-0">
              {isTopLevel && hasSubItems && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 p-0 hover:bg-transparent"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </Button>
              )}
            </div>

            {/* Checkbox */}
            <Checkbox
              checked={isCheckboxChecked}
              onCheckedChange={handleToggle}
              className={cn(
                "w-5 h-5 rounded-full border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground",
                !isCheckboxChecked && item.status === "in-progress" && "border-blue-500 bg-blue-100 dark:bg-blue-900/30"
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
            <button
              className="text-left flex-1 min-w-0"
              onClick={() => onSelect(item)}
            >
              <span
                className={cn(
                  "text-sm font-medium transition-all truncate block",
                  showStrikethrough && "line-through text-muted-foreground"
                )}
              >
                {item.title}
              </span>
            </button>
          </div>
        </TableCell>

        {/* Col 2: Project */}
        {showProject && (
          <TableCell className="py-2.5 px-2">
            {projectName ? (
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: projectColor || "#6b7280" }}
                />
                <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                  {projectName}
                </span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground/40">—</span>
            )}
          </TableCell>
        )}

        {/* Col 3: List */}
        {showList && (
          <TableCell className="py-2.5 px-2">
            {listName ? (
              <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                {listName}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground/40">—</span>
            )}
          </TableCell>
        )}

        {/* Col 4: Due Date */}
        <TableCell className="py-2.5 px-2 w-fit">
          {item.dueDate ? (
            <div
              className={cn(
                "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full whitespace-nowrap w-fit",
                isOverdue
                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Calendar className="h-3 w-3" />
              <span>{formatDueDate(item.dueDate as Date)}</span>
            </div>
          ) : null}
        </TableCell>

        {/* Col 5: Recurring */}
        <TableCell className="py-2.5 px-2">
          {item.isRecurring && item.id && (
            <div className="flex items-center gap-1">
              <RecurringBadge />
              <RecurringMiniProgress
                todoItemId={item.id}
                frequency={item.frequency}
                daysOfWeek={item.daysOfWeek}
                recurrenceStart={item.recurrenceStart}
                recurrenceEnd={item.recurrenceEnd}
              />
            </div>
          )}
        </TableCell>

        {/* Col 6: Priority */}
        <TableCell className="py-2.5 px-2">
          <div className="flex items-center gap-1.5">
            {!isCheckboxChecked && (
              <PriorityBadge priority={item.priority} className="text-[10px] px-1.5 py-0" />
            )}
            {item.notes && (
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
        </TableCell>

        {/* Col 6: Actions */}
        <TableCell className="py-2.5 px-2">
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
        </TableCell>
      </TableRow>

      {/* Sub-item add form — renders right below the clicked row */}
      {isAddingSubItem && (
        <TableRow className="hover:bg-transparent bg-muted/20">
          <TableCell colSpan={colSpan} className="py-1.5 px-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                subItemForm.onSubmit(subItemForm.title);
              }}
              className="ml-11 mr-3 flex items-center gap-2"
            >
              <Input
                placeholder="Add a sub-task..."
                value={subItemForm.title}
                onChange={(e) => subItemForm.onTitleChange(e.target.value)}
                autoFocus
                className="border-0 shadow-none focus-visible:ring-0 px-0 h-auto py-1 text-sm"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!subItemForm.title.trim()}
                className="h-7"
              >
                Add
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7"
                onClick={subItemForm.onCancel}
              >
                Cancel
              </Button>
            </form>
          </TableCell>
        </TableRow>
      )}

      {/* Sub-items rows */}
      {showExpanded && hasSubItems && (
        <>
          {item.subItems!.map((subItem) => (
            <TodoItemRow
              key={subItem.id}
              item={subItem}
              level={level + 1}
              onToggleStatus={onToggleStatus}
              onAddSubItem={onAddSubItem}
              onDelete={onDelete}
              onSelect={onSelect}
              hideSubTasks
              showProject={showProject}
              showList={showList}
              subItemForm={subItemForm}
            />
          ))}
        </>
      )}
    </>
  );
}
