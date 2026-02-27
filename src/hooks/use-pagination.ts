"use client"

import { useSearchParams } from "next/navigation"
import { useState, useCallback, useMemo } from "react"

interface UsePaginationOptions {
  totalItems: number
  initialPage?: number
  initialLimit?: number
  maxPagesToShow?: number
}

interface UsePaginationReturn {
  currentPage: number
  limit: number
  totalPages: number
  startIndex: number
  endIndex: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  pages: number[]
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  nextPage: () => void
  previousPage: () => void
  goToFirstPage: () => void
  goToLastPage: () => void
}

export function usePagination({
  totalItems,
  initialPage = 1,
  initialLimit = 25,
  maxPagesToShow = 7,
}: UsePaginationOptions): UsePaginationReturn {
  const searchParams = useSearchParams()

  // Read from URL or use defaults - derived during render, not in effect
  const urlPage = Number(searchParams.get("page")) || initialPage
  const urlLimit = Number(searchParams.get("limit")) || initialLimit

  // Internal state for user interactions (starts from URL values)
  const [internalPage, setInternalPage] = useState<number | null>(null)
  const [internalLimit, setInternalLimit] = useState<number | null>(null)

  // Use internal state if user has interacted, otherwise use URL values
  const currentPage = internalPage ?? Math.max(1, urlPage)
  const limit = internalLimit ?? Math.max(1, urlLimit)

  const totalPages = Math.max(1, Math.ceil(totalItems / limit))

  // Calculate start and end indices for current page
  const startIndex = (currentPage - 1) * limit
  const endIndex = Math.min(startIndex + limit, totalItems)

  // Check if there are next/previous pages
  const hasNextPage = currentPage < totalPages
  const hasPreviousPage = currentPage > 1

  // Generate page numbers to show in pagination
  const pages = useMemo(() => {
    if (totalPages <= 1) return []

    const pagesArray: number[] = []
    const halfMaxPages = Math.floor(maxPagesToShow / 2)

    let startPage = Math.max(1, currentPage - halfMaxPages)
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pagesArray.push(i)
    }

    return pagesArray
  }, [currentPage, totalPages, maxPagesToShow])

  // Navigation functions (URL sync is handled by parent component)
  const setPage = useCallback(
    (page: number) => {
      const validPage = Math.max(1, Math.min(page, totalPages))
      setInternalPage(validPage)
    },
    [totalPages]
  )

  const setLimitWithValidation = useCallback(
    (newLimit: number) => {
      const validLimit = Math.max(1, newLimit)
      setInternalLimit(validLimit)
      setInternalPage(1)
    },
    []
  )

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setInternalPage(currentPage + 1)
    }
  }, [hasNextPage, currentPage])

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setInternalPage(currentPage - 1)
    }
  }, [hasPreviousPage, currentPage])

  const goToFirstPage = useCallback(() => {
    setInternalPage(1)
  }, [])

  const goToLastPage = useCallback(() => {
    setInternalPage(totalPages)
  }, [totalPages])

  return {
    currentPage,
    limit,
    totalPages,
    startIndex,
    endIndex,
    hasNextPage,
    hasPreviousPage,
    pages,
    setPage,
    setLimit: setLimitWithValidation,
    nextPage,
    previousPage,
    goToFirstPage,
    goToLastPage,
  }
}
