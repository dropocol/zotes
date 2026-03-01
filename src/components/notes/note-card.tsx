"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { CardDropdownMenu } from "@/components/common/card-dropdown-menu";
import { Pin, Trash2 } from "lucide-react";
import type { Note } from "@/types";

interface NoteCardProps {
  note: Note;
  onDelete: (id: string) => void;
  onTogglePin: (id: string, pinned: boolean) => void;
}

export function NoteCard({ note, onDelete, onTogglePin }: NoteCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this note?")) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onDelete(note.id);
      }
    } catch (error) {
      console.error("Error deleting note:", error);
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleTogglePin() {
    try {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pinned: !note.pinned }),
      });

      if (response.ok) {
        onTogglePin(note.id, !note.pinned);
      }
    } catch (error) {
      console.error("Error toggling pin:", error);
    }
  }

  // Strip HTML tags for preview
  const preview = note.content
    ? note.content.replace(/<[^>]*>/g, "").slice(0, 150)
    : "";

  const menuItems = [
    {
      icon: Pin,
      label: note.pinned ? "Unpin" : "Pin",
      onClick: handleTogglePin,
    },
    {
      icon: Trash2,
      label: "Delete",
      onClick: handleDelete,
      className: "text-destructive focus:text-destructive",
      disabled: isDeleting,
    },
  ];

  return (
    <Card className="group relative">
      {note.pinned && (
        <div className="absolute top-2 right-2">
          <Pin className="h-4 w-4 text-primary fill-primary" />
        </div>
      )}
      <Link href={`/notes/${note.id}`}>
        <CardContent className="pt-4">
          <h3 className="font-medium line-clamp-1 mb-2">{note.title}</h3>
          {preview && (
            <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
              {preview}...
            </p>
          )}
          {note.project && (
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: note.project.color || "#f97316" }}
              />
              <span className="text-xs text-muted-foreground">
                {note.project.name}
              </span>
            </div>
          )}
        </CardContent>
      </Link>
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <CardDropdownMenu items={menuItems} />
      </div>
    </Card>
  );
}
