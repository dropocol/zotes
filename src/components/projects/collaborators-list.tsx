"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RoleBadge } from "./role-badge";
import { UserPlus, Trash2, Crown } from "lucide-react";
import { InviteCollaboratorDialog } from "./invite-collaborator-dialog";

interface Collaborator {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
  role: string;
  isOwner: boolean;
  collaborationId?: string;
}

interface CollaboratorsListProps {
  projectId: string;
  owner: Collaborator;
  collaborators: Collaborator[];
  isOwner: boolean;
  onRefresh: () => void;
}

export function CollaboratorsList({
  projectId,
  owner,
  collaborators,
  isOwner,
  onRefresh,
}: CollaboratorsListProps) {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleRemove(userId: string) {
    if (!confirm("Are you sure you want to remove this collaborator?")) return;

    setDeletingId(userId);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/collaborators/${userId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error removing collaborator:", error);
    } finally {
      setDeletingId(null);
    }
  }

  function getInitials(name?: string | null, email?: string) {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email?.slice(0, 2).toUpperCase() || "U";
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">People</h3>
        {isOwner && (
          <Button size="sm" variant="outline" onClick={() => setIsInviteOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {/* Owner */}
        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={owner.image || undefined} />
              <AvatarFallback className="text-xs">
                {getInitials(owner.name, owner.email)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{owner.name || owner.email}</span>
                <Crown className="h-3 w-3 text-yellow-500" />
              </div>
              <span className="text-xs text-muted-foreground">{owner.email}</span>
            </div>
          </div>
          <RoleBadge role="admin" />
        </div>

        {/* Collaborators */}
        {collaborators.map((collaborator) => (
          <div
            key={collaborator.id}
            className="flex items-center justify-between p-3 rounded-lg border"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={collaborator.image || undefined} />
                <AvatarFallback className="text-xs">
                  {getInitials(collaborator.name, collaborator.email)}
                </AvatarFallback>
              </Avatar>
              <div>
                <span className="font-medium text-sm">
                  {collaborator.name || collaborator.email}
                </span>
                <p className="text-xs text-muted-foreground">{collaborator.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RoleBadge role={collaborator.role as "admin" | "collaborator"} />
              {isOwner && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemove(collaborator.id)}
                  disabled={deletingId === collaborator.id}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}

        {collaborators.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No collaborators yet. Invite someone to collaborate on this project.
          </p>
        )}
      </div>

      <InviteCollaboratorDialog
        open={isInviteOpen}
        onOpenChange={setIsInviteOpen}
        projectId={projectId}
        onInvited={onRefresh}
      />
    </div>
  );
}
