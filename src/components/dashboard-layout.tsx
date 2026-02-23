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
  return (
    <SidebarProvider suppressHydrationWarning>
      <AppSidebar />
      <SidebarInset className={fullHeight ? "flex flex-col h-screen overflow-hidden" : undefined}>
        <header className="flex h-14 shrink-0 items-center justify-between border-b px-4 sticky top-0 bg-background z-20">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <SidebarTrigger className="-ml-1 shrink-0" />
            <Separator orientation="vertical" className="mr-2 h-4 shrink-0" />
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
          </div>
          {headerActions && (
            <div className="flex items-center gap-2 shrink-0 ml-4">
              {headerActions}
            </div>
          )}
        </header>
        {fullHeight ? (
          <div className="flex-1 overflow-hidden flex flex-col">{children}</div>
        ) : (
          <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
