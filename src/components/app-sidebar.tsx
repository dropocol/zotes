"use client";

import * as React from "react";
import { Layers, StickyNote, Home, CheckSquare, CalendarDays, Moon } from "lucide-react";

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
      isActive: true,
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
    },
    {
      title: "Upcoming",
      url: "/todos/upcoming",
      icon: CalendarDays,
      isActive: false,
    },
    {
      title: "Prayers",
      url: "/prayers",
      icon: Moon,
      isActive: false,
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
        <NavMain items={data.navMain} />
        <SidebarSeparator />
        <NavRecent />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
