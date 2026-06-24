// ============================================================================
// MIND MAP TYPES
// ============================================================================

import type { Project } from "./project";

/** A node with editable plain-text content. */
export interface MindMapNode {
  id: string;
  type: "textNode";
  position: { x: number; y: number };
  data: {
    /** Free-text content. */
    text: string;
    /** Marks the starting point of a branch tree. */
    isRoot?: boolean;
  };
}

/** A connection between two nodes. */
export interface MindMapEdge {
  id: string;
  source: string;
  target: string;
}

/** The shape persisted in the MindMap.data column. */
export interface MindMapData {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
}

export interface MindMap {
  id: string;
  title: string;
  /** Serialized React Flow graph. Stored as JSON in the DB. */
  data?: MindMapData | null;
  projectId?: string | null;
  project?: Project | null;
  userId: string;
  pinned: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Paginated response type
export interface PaginatedMindMapsResponse {
  data: MindMap[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
