"use client";

import * as React from "react";
import { StickyNote, ChevronRight } from "lucide-react";
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

type NoteItem = {
  id: string;
  type: "note";
  url: string;
  title: string;
  project?: { id: string; name: string; color?: string | null } | null;
};

export function NavRecentNotes({ items }: { items: NoteItem[] }) {
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
            <span className="flex-1 text-left">Notes</span>
            <ChevronRight className="size-3 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <Link href={item.url}>
                    <StickyNote className="size-4 shrink-0" />
                    <span className="truncate">{item.title}</span>
                    {item.project && (
                      <span
                        className="ml-auto text-[10px] px-1 py-0.5 rounded shrink-0 truncate max-w-16"
                        style={{
                          backgroundColor: item.project.color
                            ? `${item.project.color}20`
                            : undefined,
                          color: item.project.color || "inherit",
                        }}
                      >
                        {item.project.name}
                      </span>
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
