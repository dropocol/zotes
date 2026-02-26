import * as React from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconGradient?: string;
  iconShadow?: string;
  children?: React.ReactNode;
  className?: string;
}

const defaultGradients: Record<string, { gradient: string; shadow: string }> = {
  home: {
    gradient: "from-blue-500 to-indigo-600",
    shadow: "shadow-blue-500/25",
  },
  projects: {
    gradient: "from-violet-500 to-purple-600",
    shadow: "shadow-violet-500/25",
  },
  notes: {
    gradient: "from-amber-500 to-orange-600",
    shadow: "shadow-amber-500/25",
  },
  todos: {
    gradient: "from-cyan-500 to-blue-600",
    shadow: "shadow-cyan-500/25",
  },
  upcoming: {
    gradient: "from-pink-500 to-rose-600",
    shadow: "shadow-pink-500/25",
  },
  recurring: {
    gradient: "from-teal-500 to-emerald-600",
    shadow: "shadow-teal-500/25",
  },
};

export function PageHeader({
  title,
  description,
  icon: Icon,
  iconGradient,
  iconShadow,
  children,
  className,
}: PageHeaderProps) {
  // Try to find a matching gradient based on title
  const key = title.toLowerCase();
  const preset = defaultGradients[key] || {
    gradient: "from-slate-500 to-slate-600",
    shadow: "shadow-slate-500/25",
  };

  const gradient = iconGradient || preset.gradient;
  const shadow = iconShadow || preset.shadow;

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex items-center justify-center rounded-xl bg-gradient-to-br p-2.5 shadow-lg",
            gradient,
            shadow
          )}
        >
          <Icon className="size-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
