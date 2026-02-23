"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Circle, Loader2, CheckCircle2 } from "lucide-react";
import { TodoItemStatus } from "@/types";

interface StatusSelectProps {
  value: TodoItemStatus | string;
  onChange: (value: TodoItemStatus) => void;
  className?: string;
}

const statusConfig: Record<
  TodoItemStatus,
  { label: string; icon: typeof Circle; color: string }
> = {
  [TodoItemStatus.TODO]: {
    label: "To Do",
    icon: Circle,
    color: "text-gray-400",
  },
  [TodoItemStatus.IN_PROGRESS]: {
    label: "In Progress",
    icon: Loader2,
    color: "text-blue-500",
  },
  [TodoItemStatus.DONE]: {
    label: "Done",
    icon: CheckCircle2,
    color: "text-green-500",
  },
};

export function StatusSelect({ value, onChange, className }: StatusSelectProps) {
  const currentStatus = statusConfig[value as TodoItemStatus] || statusConfig[TodoItemStatus.TODO];
  const Icon = currentStatus.icon;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn("w-[140px]", className)}>
        <SelectValue>
          <div className="flex items-center gap-2">
            <Icon className={cn("h-4 w-4", currentStatus.color)} />
            <span>{currentStatus.label}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(statusConfig).map(([key, config]) => {
          const StatusIcon = config.icon;
          return (
            <SelectItem key={key} value={key}>
              <div className="flex items-center gap-2">
                <StatusIcon className={cn("h-4 w-4", config.color)} />
                <span>{config.label}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
