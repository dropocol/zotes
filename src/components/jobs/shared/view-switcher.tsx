"use client";

import * as React from "react";
import { List, Kanban, Calendar, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { JobBoardViewType, JobBoardView } from "@/types/jobs";

interface ViewSwitcherProps {
  view: JobBoardViewType;
  onViewChange: (view: JobBoardViewType) => void;
}

const VIEW_OPTIONS: {
  value: JobBoardViewType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: JobBoardView.LIST, label: "List", icon: List },
  { value: JobBoardView.KANBAN, label: "Kanban", icon: Kanban },
  { value: JobBoardView.CALENDAR, label: "Calendar", icon: Calendar },
  { value: JobBoardView.STATS, label: "Stats", icon: BarChart3 },
];

export function ViewSwitcher({ view, onViewChange }: ViewSwitcherProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 rounded-lg border p-1">
        {VIEW_OPTIONS.map((option) => (
          <Tooltip key={option.value}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 w-8 p-0",
                  view === option.value && "bg-primary text-primary-foreground"
                )}
                onClick={() => onViewChange(option.value)}
              >
                <option.icon className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{option.label}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
