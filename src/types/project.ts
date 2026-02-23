// ============================================================================
// PROJECT TYPES
// ============================================================================

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  userId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ProjectWithCounts extends Project {
  _count?: {
    notes: number;
    todoLists: number;
  };
}
