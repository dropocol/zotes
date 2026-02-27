"use client";

import { usePageTitle } from "@/hooks/use-page-title";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  usePageTitle();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">zotes</h1>
          <p className="text-muted-foreground mt-2">
            Your personal knowledge management system
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
