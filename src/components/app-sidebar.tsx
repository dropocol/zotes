"use client";

import * as React from "react";
import { FolderKanban, FileText, Home, CheckSquare } from "lucide-react";

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
      logo: FileText,
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
      icon: FolderKanban,
      isActive: false,
    },
    {
      title: "Notes",
      url: "/notes",
      icon: FileText,
      isActive: false,
    },
    {
      title: "Todos",
      url: "/todos",
      icon: CheckSquare,
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
