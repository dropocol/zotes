"use client";

import * as React from "react";
import {
  Briefcase,
  CheckSquare,
  Home,
  Layers,
  Moon,
  NotebookPen,
  StickyNote,
  User,
  Users,
  Network,
} from "lucide-react";
import Link from "next/link";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const data = {
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
      title: "Mindmaps",
      url: "/mindmaps",
      icon: Network,
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
    {
      title: "Leads",
      url: "/leads",
      icon: Users,
      isActive: false,
    },
  ],
  navSecondary: [
    {
      title: "Account",
      url: "/account",
      icon: <User />,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href="/dashboard">
                <NotebookPen className="size-5!" />
                <span className="text-base font-semibold">Zotes</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* Recent items hidden for now — re-enable with <NavRecent /> */}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
