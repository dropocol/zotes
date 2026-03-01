"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SortableTableHead, sortItems, type SortConfig } from "@/components/ui/sortable-table-head";
import { MoreHorizontal, Trash2, Pin, PinOff } from "lucide-react";
import Link from "next/link";
import { Note } from "@/types";

interface NotesTableProps {
  notes: Note[];
  searchQuery?: string;
  onRefresh?: () => void;
  showProjectColumn?: boolean;
  canModify?: boolean;
  emptyMessage?: string;
}

export function NotesTable({
  notes,
  searchQuery = "",
  onRefresh = () => {},
  showProjectColumn = true,
  canModify = true,
  emptyMessage,
}: NotesTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "pinned", direction: "desc" });

  const filteredNotes = useMemo(() => {
    if (!searchQuery) return notes;

    const query = searchQuery.toLowerCase();
    return notes.filter((note) => {
      return (
        note.title.toLowerCase().includes(query) ||
        (note.content?.toLowerCase().includes(query) ?? false) ||
        (note.project?.name.toLowerCase().includes(query) ?? false)
      );
    });
  }, [notes, searchQuery]);

  // Sort with pinned first, then by the sort config
  const sortedNotes = useMemo(() => {
    const sorted = sortItems(filteredNotes, sortConfig);

    // If sorting by pinned, we need special handling
    if (sortConfig.key === "pinned") {
      return sorted.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
    }

    return sorted;
  }, [filteredNotes, sortConfig]);

  const handleSort = (column: string) => {
    setSortConfig((prev) => ({
      key: column,
      direction:
        prev.key === column
          ? prev.direction === "asc"
            ? "desc"
            : prev.direction === "desc"
            ? null
            : "asc"
          : "asc",
    }));
  };

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  }

  async function handleTogglePin(note: Note) {
    try {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pinned: !note.pinned }),
      });

      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error toggling pin:", error);
    }
  }

  // Strip HTML for preview
  const getPreview = (content: string | null | undefined) => {
    if (!content) return "";
    return content.replace(/<[^>]*>/g, "").slice(0, 100);
  };

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableTableHead
              column="pinned"
              label=""
              sortConfig={sortConfig}
              onSort={handleSort}
              className="w-[40px]"
            />
            <SortableTableHead
              column="title"
              label="Title"
              sortConfig={sortConfig}
              onSort={handleSort}
            />
            <TableHead>Preview</TableHead>
            {showProjectColumn && <TableHead>Project</TableHead>}
            <SortableTableHead
              column="updatedAt"
              label="Updated"
              sortConfig={sortConfig}
              onSort={handleSort}
              className="w-[150px]"
            />
            {canModify && <TableHead className="w-[60px]"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedNotes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showProjectColumn ? 6 : 5} className="text-center text-muted-foreground py-8">
                {emptyMessage || (searchQuery ? "No notes found matching your search" : "No notes yet. Create your first note to get started.")}
              </TableCell>
            </TableRow>
          ) : (
            sortedNotes.map((note) => (
              <TableRow key={note.id} className="group">
                <TableCell>
                  {note.pinned && (
                    <Pin className="h-4 w-4 text-primary fill-primary" />
                  )}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/notes/${note.id}`}
                    className="font-medium hover:text-primary transition-colors"
                  >
                    {note.title}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground max-w-[300px] truncate">
                  {getPreview(note.content) || "-"}
                </TableCell>
                {showProjectColumn && (
                  <TableCell>
                    {note.project ? (
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: note.project.color || "#f97316" }}
                        />
                        <Link
                          href={`/projects/${note.project.id}`}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {note.project.name}
                        </Link>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                )}
                <TableCell className="text-muted-foreground">
                  {new Date(note.updatedAt).toLocaleDateString()}
                </TableCell>
                {canModify && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleTogglePin(note)}>
                          {note.pinned ? (
                            <>
                              <PinOff className="mr-2 h-4 w-4" />
                              Unpin
                            </>
                          ) : (
                            <>
                              <Pin className="mr-2 h-4 w-4" />
                              Pin
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(note.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
