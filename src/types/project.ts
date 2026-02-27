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

// Extended type for projects list with collaboration info
export interface ProjectWithRole extends ProjectWithCounts {
  userRole: string;
  isOwner: boolean;
}

// Lean type for dropdown selections (only essential fields)
export interface ProjectForDropdown {
  id: string;
  name: string;
  color: string | null;
}

// Paginated response type
export interface PaginatedProjectsResponse {
  data: ProjectWithRole[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
