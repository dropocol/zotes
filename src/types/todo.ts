// ============================================================================
// TODO LIST TYPES
// ============================================================================

export interface TodoList {
  id: string;
  name: string;
  description?: string | null;
  projectId?: string | null;
  project?: Project | null;
  userId: string;
  isDefault?: boolean | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  _count?: {
    items: number;
  };
}

// ============================================================================
// TODO ITEM TYPES
// ============================================================================

export enum TodoItemStatus {
  TODO = "todo",
  IN_PROGRESS = "in-progress",
  DONE = "done",
}

export enum TodoItemPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

export interface TodoItem {
  id: string;
  title: string;
  notes?: string | null;
  status: TodoItemStatus | string;
  priority: TodoItemPriority | string;
  dueDate?: Date | string | null;
  order?: number;
  parentId?: string | null;
  todoListId?: string;
  todoList?: TodoList | null;
  userId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  subItems?: TodoItem[];
}

// ============================================================================
// PROJECT TYPE IMPORT
// ============================================================================

import type { Project } from "./project";
