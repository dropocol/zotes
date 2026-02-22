"use client";

import * as React from "react";
import { CheckSquare, ChevronRight } from "lucide-react";
import Link from "next/link";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

type TodoItem = {
  id: string;
  type: "todo";
  url: string;
  title: string;
  priority?: string;
};

function getPriorityColor(priority?: string): string {
  switch (priority) {
    case "urgent":
      return "bg-red-500";
    case "high":
      return "bg-orange-500";
    case "medium":
      return "bg-yellow-500";
    case "low":
      return "bg-slate-400";
    default:
      return "bg-slate-400";
  }
}

export function NavRecentTodos({ items }: { items: TodoItem[] }) {
  const [isOpen, setIsOpen] = React.useState(true);

  if (items.length === 0) {
    return null;
  }

  return (
    <SidebarGroup className="overflow-hidden">
      <Collapsible
        open={isOpen}
        onOpenChange={() => setIsOpen(!isOpen)}
        className="group/collapsible"
      >
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger className="w-full flex items-center gap-1.5">
            <span className="flex-1 text-left">Todos</span>
            <ChevronRight className="size-3 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <Link href={item.url}>
                    <CheckSquare className="size-4 shrink-0" />
                    <span className="truncate">{item.title}</span>
                    <div
                      className={cn(
                        "ml-auto size-2 rounded-full shrink-0",
                        getPriorityColor(item.priority)
                      )}
                    />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  );
}
