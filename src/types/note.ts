// ============================================================================
// NOTE TYPES
// ============================================================================

import type { Project } from "./project";

export interface Note {
  id: string;
  title: string;
  content?: string | null;
  projectId?: string | null;
  project?: Project | null;
  userId: string;
  pinned: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Paginated response type
export interface PaginatedNotesResponse {
  data: Note[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
