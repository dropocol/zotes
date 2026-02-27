"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { ChevronRight, type LucideIcon } from "lucide-react";
import Link from "next/link";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

interface NavItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  items?: {
    title: string;
    url: string;
  }[];
}

// Helper to get default open items based on current path
function getDefaultOpenItems(items: NavItem[], pathname: string): Record<string, boolean> {
  const defaultOpen: Record<string, boolean> = {};
  items.forEach((item) => {
    if (item.items) {
      const isActive = item.items.some((subItem) => pathname === subItem.url || pathname.startsWith(subItem.url + "/"));
      if (isActive) {
        defaultOpen[item.title] = true;
      }
    }
  });
  return defaultOpen;
}

export function NavMain({
  items,
}: {
  items: NavItem[];
}) {
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);

  // Initialize with path-based defaults (same on server and client initially)
  const [openItems, setOpenItems] = React.useState<Record<string, boolean>>(() =>
    getDefaultOpenItems(items, pathname)
  );

  // After hydration, load from localStorage
  React.useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("sidebar-open-items");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge with current path-based defaults
        setOpenItems((prev) => ({ ...prev, ...parsed }));
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  // Persist open state to localStorage
  React.useEffect(() => {
    if (mounted) {
      localStorage.setItem("sidebar-open-items", JSON.stringify(openItems));
    }
  }, [openItems, mounted]);

  // Update open state when pathname changes
  React.useEffect(() => {
    if (!mounted) return;

    setOpenItems((prev) => {
      const updated = { ...prev };
      let hasChanges = false;

      items.forEach((item) => {
        if (item.items) {
          const isActive = item.items.some(
            (subItem) => pathname === subItem.url || pathname.startsWith(subItem.url + "/")
          );
          if (isActive && !prev[item.title]) {
            updated[item.title] = true;
            hasChanges = true;
          }
        }
      });

      return hasChanges ? updated : prev;
    });
  }, [pathname, items, mounted]);

  const toggleItem = (title: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  // Check if a sub-item is active
  const isSubItemActive = (url: string) => {
    return pathname === url || pathname.startsWith(url + "/");
  };

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) =>
          item.items && item.items.length > 0 ? (
            <Collapsible
              key={item.title}
              open={openItems[item.title] ?? false}
              onOpenChange={() => toggleItem(item.title)}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild isActive={isSubItemActive(subItem.url)}>
                          <Link href={subItem.url}>
                            <span>{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={pathname === item.url || (item.url !== "/dashboard" && pathname.startsWith(item.url))}
              >
                <Link href={item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
