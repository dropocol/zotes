"use client";

import * as React from "react";
import { Layers, ChevronRight } from "lucide-react";
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

type ProjectItem = {
  id: string;
  type: "project";
  url: string;
  name: string;
  color?: string | null;
};

export function NavRecentProjects({ items }: { items: ProjectItem[] }) {
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
            <span className="flex-1 text-left">Projects</span>
            <ChevronRight className="size-3 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton asChild tooltip={item.name}>
                  <Link href={item.url}>
                    <Layers className="size-4 shrink-0" />
                    <span className="truncate">{item.name}</span>
                    {item.color && (
                      <div
                        className="ml-auto size-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                    )}
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
