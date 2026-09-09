"use client";

import * as React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { usePageTitle } from "@/hooks/use-page-title";

export function DashboardLayout({
  children,
  breadcrumbs,
  headerContent,
  headerActions,
  fullHeight = false,
}: {
  children: React.ReactNode;
  breadcrumbs?: { title: string; href?: string }[];
  headerContent?: React.ReactNode;
  headerActions?: React.ReactNode;
  fullHeight?: boolean;
}) {
  usePageTitle();

  return (
    <SidebarProvider
      suppressHydrationWarning
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset
        className={
          fullHeight ? "flex h-screen flex-col overflow-hidden" : undefined
        }
      >
        <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
          <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mx-2 h-4 data-vertical:self-auto"
            />
            {breadcrumbs && (
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={index}>
                      {index > 0 && <BreadcrumbSeparator />}
                      <BreadcrumbItem
                        className={
                          index === breadcrumbs.length - 1
                            ? ""
                            : "hidden md:block"
                        }
                      >
                        {index === breadcrumbs.length - 1 ? (
                          <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink href={crumb.href}>
                            {crumb.title}
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </React.Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            )}
            {headerContent}
            {headerActions && (
              <div className="ml-auto flex shrink-0 items-center gap-2">
                {headerActions}
              </div>
            )}
          </div>
        </header>
        {fullHeight ? (
          <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
        ) : (
          <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6 lg:px-6">
            {children}
          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
