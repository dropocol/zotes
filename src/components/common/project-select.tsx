"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, Loader2, Plus } from "lucide-react";
import { type ProjectForDropdown } from "@/types/project";

interface ProjectSelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  allowNone?: boolean;
  noneLabel?: string;
  triggerClassName?: string;
  disabled?: boolean;
  initialLimit?: number;
}

interface Project extends ProjectForDropdown {
  isLimitReached?: boolean;
}

export function ProjectSelect({
  value,
  onChange,
  placeholder = "Select a project",
  allowNone = true,
  noneLabel = "No project",
  triggerClassName,
  disabled = false,
  initialLimit = 20,
}: ProjectSelectProps) {
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = initialLimit;

  const fetchProjects = useCallback(
    async (pageNum: number = 1) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: pageNum.toString(),
          limit: limit.toString(),
        });
        const response = await fetch(`/api/projects?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          const newProjects: Project[] = data.data.map((p: Project) => ({
            ...p,
            isLimitReached: data.pagination.hasNext === false,
          }));

          if (pageNum === 1) {
            setProjects(newProjects);
          } else {
            setProjects((prev) => [...prev, ...newProjects]);
          }

          setTotalCount(data.pagination.total);

          // Check if we've reached the limit based on total count
          const loadedCount = pageNum * limit;
          const hasMore = loadedCount < data.pagination.total;
          if (
            !hasMore &&
            projects.length + newProjects.length >= data.pagination.total
          ) {
            setProjects((prev) =>
              prev.map((p, i) =>
                i === prev.length - 1 ? { ...p, isLimitReached: true } : p,
              ),
            );
          }
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [limit],
  );

  useEffect(() => {
    if (projects.length === 0) {
      fetchProjects(1);
    }
  }, [fetchProjects, projects.length]);

  function handleSelect(projectId: string) {
    onChange(projectId === "none" ? null : projectId);
    setOpen(false);
  }

  function handleLoadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProjects(nextPage);
  }

  const selectedProject = value ? projects.find((p) => p.id === value) : null;

  const hasMore = projects.length < totalCount;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between text-left font-normal",
            !selectedProject && "text-muted-foreground",
            triggerClassName,
          )}
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            {selectedProject?.color && (
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: selectedProject.color }}
              />
            )}
            <span className="truncate max-w-[120px]">
              {selectedProject?.name || placeholder}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="start">
        <div className="max-h-[300px] overflow-y-auto">
          {allowNone && (
            <button
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                value === null && "bg-accent",
              )}
              onClick={() => handleSelect("none")}
            >
              <span className="flex-1 text-left">{noneLabel}</span>
              {value === null && <Check className="h-4 w-4" />}
            </button>
          )}
          {projects.map((project) => (
            <button
              key={project.id}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                value === project.id && "bg-accent",
              )}
              onClick={() => handleSelect(project.id)}
            >
              <div
                className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: project.color || "#6b7280" }}
              />
              <span className="flex-1 text-left truncate">{project.name}</span>
              {value === project.id && (
                <Check className="h-4 w-4 flex-shrink-0" />
              )}
            </button>
          ))}
          {isLoading && (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          {hasMore && !isLoading && (
            <button
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors border-t"
              onClick={handleLoadMore}
            >
              Load more projects...
            </button>
          )}
          {!hasMore && projects.length > 0 && !isLoading && (
            <div className="px-3 py-2 text-xs text-center text-muted-foreground border-t">
              {projects.length} of {totalCount} projects
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
