"use client";

import * as React from "react";
import { Calendar, CalendarDays, Grid3X3, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CalendarViewType, CalendarView } from "@/types/prayers";

interface ViewSwitcherProps {
  view: CalendarViewType;
  onViewChange: (view: CalendarViewType) => void;
}

const VIEW_OPTIONS: {
  value: CalendarViewType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: CalendarView.DAILY, label: "Daily", icon: Calendar },
  { value: CalendarView.WEEKLY, label: "Weekly", icon: CalendarDays },
  { value: CalendarView.MONTHLY, label: "Monthly", icon: Grid3X3 },
  { value: CalendarView.YEARLY, label: "Yearly", icon: LayoutGrid },
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
