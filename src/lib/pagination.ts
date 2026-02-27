/**
 * Pagination utilities for API routes and client components
 */

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Extract pagination params from URL search params
 */
export function getPaginationParams(searchParams: URLSearchParams): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "25", 10) || 25));

  return { page, limit };
}

/**
 * Calculate skip/take for Prisma and pagination metadata
 */
export function calculatePagination(
  total: number,
  page: number,
  limit: number
): { skip: number; take: number; pagination: PaginationMeta } {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const validPage = Math.min(Math.max(1, page), totalPages);

  return {
    skip: (validPage - 1) * limit,
    take: limit,
    pagination: {
      page: validPage,
      limit,
      total,
      totalPages,
      hasNext: validPage < totalPages,
      hasPrev: validPage > 1,
    },
  };
}

/**
 * Create a paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> {
  const { pagination } = calculatePagination(total, page, limit);

  return {
    data,
    pagination,
  };
}
