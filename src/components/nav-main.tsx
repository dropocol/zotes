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

export function NavMain({
  items,
}: {
  items: NavItem[];
}) {
  const pathname = usePathname();

  // Initialize open state from localStorage or based on active path
  const [openItems, setOpenItems] = React.useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};

    const saved = localStorage.getItem("sidebar-open-items");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore parse errors
      }
    }

    // Default: open items that are active or contain the current path
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
  });

  // Persist open state to localStorage
  React.useEffect(() => {
    localStorage.setItem("sidebar-open-items", JSON.stringify(openItems));
  }, [openItems]);

  // Update open state when pathname changes
  React.useEffect(() => {
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
  }, [pathname, items]);

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
