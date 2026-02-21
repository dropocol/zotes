"use client"

import { useRouter, useSearchParams } from "next/navigation"
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
  const router = useRouter()
  const searchParams = useSearchParams()

  // Read initial values from URL or use defaults (only once on mount)
  const urlPage = Number(searchParams.get("page")) || initialPage
  const urlLimit = Number(searchParams.get("limit")) || initialLimit

  const [currentPage, setCurrentPage] = useState(Math.max(1, urlPage))
  const [limit, setLimit] = useState(Math.max(1, urlLimit))

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

  // Update URL when pagination state changes
  const updateUrl = useCallback(
    (page: number, newLimit?: number) => {
      const params = new URLSearchParams(searchParams.toString())

      params.set("page", page.toString())
      if (newLimit) {
        params.set("limit", newLimit.toString())
      }

      router.push(`?${params.toString()}`, { scroll: false })
    },
    [searchParams, router]
  )

  // Navigation functions
  const setPage = useCallback(
    (page: number) => {
      const validPage = Math.max(1, Math.min(page, totalPages))
      setCurrentPage(validPage)
      updateUrl(validPage)
    },
    [totalPages, updateUrl]
  )

  const setLimitWithValidation = useCallback(
    (newLimit: number) => {
      const validLimit = Math.max(1, newLimit)
      setLimit(validLimit)
      setCurrentPage(1)
      updateUrl(1, validLimit)
    },
    [updateUrl]
  )

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      const newPage = currentPage + 1
      setCurrentPage(newPage)
      updateUrl(newPage)
    }
  }, [hasNextPage, currentPage, updateUrl])

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      const newPage = currentPage - 1
      setCurrentPage(newPage)
      updateUrl(newPage)
    }
  }, [hasPreviousPage, currentPage, updateUrl])

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1)
    updateUrl(1)
  }, [updateUrl])

  const goToLastPage = useCallback(() => {
    setCurrentPage(totalPages)
    updateUrl(totalPages)
  }, [totalPages, updateUrl])

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
