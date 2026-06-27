"use client";

import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, Pin, PinOff, GitBranch } from "lucide-react";
import Link from "next/link";
import type { MindMap, MindMapData } from "@/types";

interface MindMapsTableProps {
  mindMaps: MindMap[];
  searchQuery?: string;
  onRefresh?: () => void;
  showProjectColumn?: boolean;
  canModify?: boolean;
  emptyMessage?: string;
}

export function MindMapsTable({
  mindMaps,
  searchQuery = "",
  onRefresh = () => {},
  showProjectColumn = true,
  canModify = true,
  emptyMessage,
}: MindMapsTableProps) {
  const filteredMindMaps = useMemo(() => {
    if (!searchQuery) {
      // Sort pinned first, then by updated date.
      return [...mindMaps].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
    }

    const query = searchQuery.toLowerCase();
    return mindMaps.filter((mm) => {
      return (
        mm.title.toLowerCase().includes(query) ||
        (mm.project?.name.toLowerCase().includes(query) ?? false)
      );
    });
  }, [mindMaps, searchQuery]);

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this mindmap?")) return;

    try {
      const response = await fetch(`/api/mindmaps/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error deleting mindmap:", error);
    }
  }

  async function handleTogglePin(mm: MindMap) {
    try {
      const response = await fetch(`/api/mindmaps/${mm.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pinned: !mm.pinned }),
      });

      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error toggling pin:", error);
    }
  }

  const getNodeCount = (data: MindMapData | null | undefined) => {
    if (!data || !Array.isArray(data.nodes)) return 0;
    return data.nodes.length;
  };

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]"></TableHead>
            <TableHead>Title</TableHead>
            <TableHead className="w-[120px]">Nodes</TableHead>
            {showProjectColumn && <TableHead>Project</TableHead>}
            <TableHead className="w-[150px]">Updated</TableHead>
            {canModify && <TableHead className="w-[60px]"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredMindMaps.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showProjectColumn ? 6 : 5} className="text-center text-muted-foreground py-8">
                {emptyMessage || (searchQuery ? "No mindmaps found matching your search" : "No mindmaps yet. Create your first one to get started.")}
              </TableCell>
            </TableRow>
          ) : (
            filteredMindMaps.map((mm) => (
              <TableRow key={mm.id} className="group">
                <TableCell>
                  {mm.pinned && (
                    <Pin className="h-4 w-4 text-primary fill-primary" />
                  )}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/mindmaps/${mm.id}`}
                    className="font-medium hover:text-primary transition-colors"
                  >
                    {mm.title}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="gap-1 font-normal">
                    <GitBranch className="h-3 w-3" />
                    {getNodeCount(mm.data)}
                  </Badge>
                </TableCell>
                {showProjectColumn && (
                  <TableCell>
                    {mm.project ? (
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: mm.project.color || "#f97316" }}
                        />
                        <Link
                          href={`/projects/${mm.project.id}`}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {mm.project.name}
                        </Link>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                )}
                <TableCell className="text-muted-foreground">
                  {new Date(mm.updatedAt).toLocaleDateString()}
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
                        <DropdownMenuItem onClick={() => handleTogglePin(mm)}>
                          {mm.pinned ? (
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
                          onClick={() => handleDelete(mm.id)}
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
