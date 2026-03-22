"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, MoreHorizontal, Star, Trash2 } from "lucide-react";
import { TodoList } from "@/types";

interface TodoListsTableProps {
  todoLists: TodoList[];
  getHref: (todoList: TodoList) => string;
  canModify?: boolean;
  showSetDefault?: boolean;
  onSetDefault?: (id: string) => void;
  onDelete?: (id: string) => void;
  emptyMessage?: string;
}

export function TodoListsTable({
  todoLists,
  getHref,
  canModify = true,
  showSetDefault = true,
  onSetDefault,
  onDelete,
  emptyMessage = "No todo lists yet.",
}: TodoListsTableProps) {
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px] pr-2"></TableHead>
            <TableHead className="pl-1">Name</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Updated</TableHead>
            {canModify && <TableHead className="w-[60px]"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {todoLists.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={canModify ? 5 : 4}
                className="text-center text-muted-foreground py-8"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            todoLists.map((todoList) => (
              <TableRow key={todoList.id} className="group">
                <TableCell className="pr-0 pl-4">
                  <CheckSquare className="h-4 w-4 text-muted-foreground" />
                </TableCell>
                <TableCell className="pl-2">
                  <Link
                    href={getHref(todoList)}
                    className="font-medium hover:text-primary transition-colors"
                  >
                    {todoList.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {todoList._count?.items ?? 0}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(todoList.updatedAt)}
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
                        {showSetDefault &&
                          !todoList.isDefault &&
                          onSetDefault && (
                            <DropdownMenuItem
                              onClick={() => onSetDefault(todoList.id)}
                            >
                              <Star className="mr-2 h-4 w-4" />
                              Set as Default
                            </DropdownMenuItem>
                          )}
                        {onDelete && (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => onDelete(todoList.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
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
