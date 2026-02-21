"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { CalendarIcon, Loader2, Circle, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
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

interface TodoItemDetailDrawerProps {
  item: TodoItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (item: TodoItem) => void;
}

const statusOptions = [
  {
    value: "todo",
    label: "To Do",
    icon: Circle,
    iconColor: "text-slate-400",
    bgColor: "bg-slate-100 dark:bg-slate-800",
    textColor: "text-slate-700 dark:text-slate-300"
  },
  {
    value: "in-progress",
    label: "In Progress",
    icon: Clock,
    iconColor: "text-blue-500",
    bgColor: "bg-blue-100 dark:bg-blue-900/50",
    textColor: "text-blue-700 dark:text-blue-300"
  },
  {
    value: "done",
    label: "Done",
    icon: CheckCircle2,
    iconColor: "text-green-500",
    bgColor: "bg-green-100 dark:bg-green-900/50",
    textColor: "text-green-700 dark:text-green-300"
  },
];

const priorityOptions = [
  { value: "low", label: "Low", color: "bg-slate-200 dark:bg-slate-700" },
  { value: "medium", label: "Medium", color: "bg-blue-200 dark:bg-blue-800" },
  { value: "high", label: "High", color: "bg-orange-200 dark:bg-orange-800" },
  { value: "urgent", label: "Urgent", color: "bg-red-200 dark:bg-red-800" },
];

export function TodoItemDetailDrawer({
  item,
  open,
  onOpenChange,
  onUpdate,
}: TodoItemDetailDrawerProps) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setNotes(item.notes || "");
      setStatus(item.status);
      setPriority(item.priority);
      setDueDate(item.dueDate ? new Date(item.dueDate) : undefined);
    }
  }, [item]);

  async function handleSave() {
    if (!item) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/todo/items/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          notes,
          status,
          priority,
          dueDate: dueDate?.toISOString(),
        }),
      });

      if (response.ok) {
        const updatedItem = await response.json();
        onUpdate(updatedItem);
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error updating todo item:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[500px]">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="text-left font-semibold">
            Task Details
          </SheetTitle>
          <SheetClose className="rounded-sm opacity-70 hover:opacity-100" />
        </SheetHeader>

        <div className="px-6 py-6 space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="bg-muted/30"
            />
          </div>

          {/* Status - Radio buttons for better visual */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Status</Label>
            <RadioGroup
              value={status}
              onValueChange={setStatus}
              className="grid grid-cols-3 gap-2"
            >
              {statusOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <Label
                    key={option.value}
                    htmlFor={option.value}
                    className="cursor-pointer"
                  >
                    <RadioGroupItem
                      value={option.value}
                      id={option.value}
                      className="peer sr-only"
                    />
                    <div
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-md border-2 transition-all cursor-pointer",
                        status === option.value
                          ? `${option.bgColor} ${option.textColor} border-transparent`
                          : "bg-background hover:bg-muted border-border"
                      )}
                    >
                      <Icon className={cn("h-4 w-4", option.iconColor)} />
                      <span className="text-sm font-medium">{option.label}</span>
                    </div>
                  </Label>
                );
              })}
            </RadioGroup>
          </div>

          {/* Priority - Chips selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Priority</Label>
            <RadioGroup
              value={priority}
              onValueChange={setPriority}
              className="flex flex-wrap gap-2"
            >
              {priorityOptions.map((option) => (
                <Label
                  key={option.value}
                  htmlFor={option.value}
                  className="cursor-pointer"
                >
                  <RadioGroupItem
                    value={option.value}
                    id={option.value}
                    className="peer sr-only"
                  />
                  <div
                    className={cn(
                      "px-3 py-1.5 rounded-md border-2 transition-all cursor-pointer text-sm font-medium",
                      priority === option.value
                        ? `${option.color} border-transparent`
                        : "bg-background hover:bg-muted border-border"
                    )}
                  >
                    {option.label}
                  </div>
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Due Date - Custom styled */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start font-normal h-10 px-3 text-left",
                    !dueDate && "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                  className="rounded-lg border"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add additional details, attachments, or subtasks..."
              rows={4}
              className="bg-muted/30 min-h-[100px] resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading} className="flex-1">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
