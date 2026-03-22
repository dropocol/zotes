"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TodoItemInput } from "./todo-item-input";
import { TodoItemRow } from "./todo-item-row";
import { TodoItem } from "@/types";
import { ListTodo } from "lucide-react";
import type { SubItemFormState } from "./todo-item-row";

interface TodoItemsTableProps {
  items: TodoItem[];
  onToggleStatus: (id: string, status: string) => void;
  onAddSubItem: (parentId: string) => void;
  onDelete: (id: string) => void;
  onSelect: (item: TodoItem) => void;
  showProject?: boolean;
  showList?: boolean;
  showAddInput?: boolean;
  onAddItem?: (title: string) => void | Promise<void>;
  emptyMessage?: string;
  subItemForm?: SubItemFormState;
}

export function TodoItemsTable({
  items,
  onToggleStatus,
  onAddSubItem,
  onDelete,
  onSelect,
  showProject = false,
  showList = false,
  showAddInput = false,
  onAddItem,
  emptyMessage = "No tasks yet",
  subItemForm,
}: TodoItemsTableProps) {
  const visibleColumns = 1 + (showProject ? 1 : 0) + (showList ? 1 : 0) + 5; // task + project? + list? + due + recurring + priority + actions

  return (
    <div className="rounded-lg border bg-card">
      {showAddInput && onAddItem && (
        <div className="flex items-center gap-2 p-3 border-b">
          <TodoItemInput onAdd={onAddItem} />
        </div>
      )}

      <Table style={{ tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "100%" }} />
          {showProject && <col style={{ width: "120px" }} />}
          {showList && <col style={{ width: "120px" }} />}
          <col style={{ width: "90px" }} />
          <col style={{ width: "140px" }} />
          <col style={{ width: "70px" }} />
          <col style={{ width: "80px" }} />
        </colgroup>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b">
            <TableHead className="text-xs text-muted-foreground font-medium">Task</TableHead>
            {showProject && (
              <TableHead className="text-xs text-muted-foreground font-medium">Project</TableHead>
            )}
            {showList && (
              <TableHead className="text-xs text-muted-foreground font-medium">List</TableHead>
            )}
            <TableHead className="text-xs text-muted-foreground font-medium">Due</TableHead>
            <TableHead className="text-xs text-muted-foreground font-medium">Recurring</TableHead>
            <TableHead className="text-xs text-muted-foreground font-medium">Priority</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={visibleColumns}
                className="h-32 text-center"
              >
                <div className="flex flex-col items-center justify-center">
                  <ListTodo className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">{emptyMessage}</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TodoItemRow
                key={item.id}
                item={item}
                onToggleStatus={onToggleStatus}
                onAddSubItem={onAddSubItem}
                onDelete={onDelete}
                onSelect={onSelect}
                showProject={showProject}
                showList={showList}
                subItemForm={subItemForm}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
