"use client";

import { LucideIcon, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MenuItem {
  icon?: LucideIcon;
  label: string;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}

interface CardDropdownMenuProps {
  items: MenuItem[];
  className?: string;
  triggerClassName?: string;
}

export function CardDropdownMenu({
  items,
  className,
  triggerClassName,
}: CardDropdownMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", triggerClassName)}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={className}>
        {items.map((item, index) => (
          <DropdownMenuItem
            key={index}
            onClick={item.onClick}
            className={item.className}
            disabled={item.disabled}
          >
            {item.icon && <item.icon className="mr-2 h-4 w-4" />}
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
