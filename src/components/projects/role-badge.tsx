"use client";

import { Badge } from "@/components/ui/badge";
import { Shield, Eye } from "lucide-react";

interface RoleBadgeProps {
  role: "admin" | "collaborator";
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  if (role === "admin") {
    return (
      <Badge variant="default" className={`gap-1 ${className || ""}`}>
        <Shield className="h-3 w-3" />
        Admin
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className={`gap-1 ${className || ""}`}>
      <Eye className="h-3 w-3" />
      Collaborator
    </Badge>
  );
}
