"use client";

import * as React from "react";
import { Layers, StickyNote, Home, CheckSquare, Moon, Briefcase, List, BarChart3 } from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavRecent } from "@/components/nav-recent";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { TeamSwitcher } from "@/components/team-switcher";
import { ScrollArea } from "@/components/ui/scroll-area";

const data = {
  teams: [
    {
      name: "Zotes",
      logo: StickyNote,
      plan: "Personal",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
      isActive: false,
    },
    {
      title: "Projects",
      url: "/projects",
      icon: Layers,
      isActive: false,
    },
    {
      title: "Notes",
      url: "/notes",
      icon: StickyNote,
      isActive: false,
    },
    {
      title: "Todos",
      url: "/todos",
      icon: CheckSquare,
      isActive: false,
      items: [
        {
          title: "All",
          url: "/todos",
        },
        {
          title: "Upcoming",
          url: "/todos/upcoming",
        },
        {
          title: "Recurring",
          url: "/recurring",
        },
      ],
    },
    {
      title: "Prayers",
      url: "/prayers",
      icon: Moon,
      isActive: false,
    },
    {
      title: "Jobs",
      url: "/jobs",
      icon: Briefcase,
      isActive: false,
      items: [
        {
          title: "List",
          url: "/jobs/list",
        },
        {
          title: "Calendar",
          url: "/jobs/calendar",
        },
        {
          title: "Stats",
          url: "/jobs/stats",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent className="overflow-x-hidden">
        <ScrollArea className="h-full">
          <NavMain items={data.navMain} />
          <SidebarSeparator />
          <NavRecent />
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
