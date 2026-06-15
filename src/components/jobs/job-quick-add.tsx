"use client";

import * as React from "react";
import { Plus, Loader2, X, History } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface QuickAddJobPayload {
  jobTitle: string;
  companyName: string;
  source: "LINKEDIN";
  applicationMethod: "WEB_PORTAL";
  status: "APPLIED";
  responseReceived: "PENDING";
  jobPostingUrl: null;
  salaryMin: null;
  salaryMax: null;
  salaryCurrency: string;
  location: null;
  isRemote: boolean;
  notes: null;
  dateFound: string | null;
  dateApplied: string;
}

interface JobQuickAddProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: QuickAddJobPayload) => Promise<void>;
}

const STORAGE_KEY = "zotes:quick-add:recent";
const MAX_RECENT = 8;

/**
 * Parse a single-line input into a job title + company name.
 * Splits on the first "@" or " at " (case-insensitive). If no separator
 * is found, the whole string becomes the title and the company falls back
 * to "Unknown" so the entry can always be saved quickly.
 */
function parseQuickAddInput(raw: string): { jobTitle: string; companyName: string } {
  const match = raw.match(/^(.*?)\s*(?:@|\bat\b)\s*(.+)$/i);
  if (match) {
    const jobTitle = match[1].trim();
    const companyName = match[2].trim();
    if (jobTitle && companyName) {
      return { jobTitle, companyName };
    }
  }
  return { jobTitle: raw.trim(), companyName: "Unknown" };
}

function loadRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function saveRecent(entries: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Ignore quota / privacy mode errors.
  }
}

export function JobQuickAdd({ open, onOpenChange, onAdd }: JobQuickAddProps) {
  const [value, setValue] = React.useState("");
  const [isAdding, setIsAdding] = React.useState(false);
  const [recent, setRecent] = React.useState<string[]>([]);
  const [isRecentOpen, setIsRecentOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Load recent entries once on mount.
  React.useEffect(() => {
    setRecent(loadRecent());
  }, []);

  // Focus the input whenever it opens, and clear it when closed.
  React.useEffect(() => {
    if (open) {
      setValue("");
      setIsRecentOpen(false);
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [open]);

  // Suggestions: recent entries that match the current input (case-insensitive),
  // excluding an exact match to what's already typed.
  const suggestions = React.useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return recent;
    return recent.filter((r) => r.toLowerCase().includes(q) && r.toLowerCase() !== q);
  }, [recent, value]);

  async function submit(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed || isAdding) return;

    const { jobTitle, companyName } = parseQuickAddInput(trimmed);

    setIsAdding(true);
    try {
      await onAdd({
        jobTitle,
        companyName,
        source: "LINKEDIN",
        applicationMethod: "WEB_PORTAL",
        status: "APPLIED",
        responseReceived: "PENDING",
        jobPostingUrl: null,
        salaryMin: null,
        salaryMax: null,
        salaryCurrency: "USD",
        location: null,
        isRemote: false,
        notes: null,
        dateFound: null,
        dateApplied: new Date().toISOString(),
      });

      // Persist to recent (deduped, most-recent-first, capped).
      setRecent((prev) => {
        const next = [trimmed, ...prev.filter((r) => r.toLowerCase() !== trimmed.toLowerCase())].slice(
          0,
          MAX_RECENT,
        );
        saveRecent(next);
        return next;
      });

      // Keep the box open and ready for the next quick add.
      setValue("");
      inputRef.current?.focus();
    } catch (error) {
      console.error("Error quick-adding job:", error);
    } finally {
      setIsAdding(false);
    }
  }

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    submit(value);
  }

  if (!open) return null;

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <div className="rounded-xl border bg-card p-2 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-8 w-8 shrink-0 rounded-lg bg-emerald-500/10">
            <Plus className="h-4 w-4 text-emerald-600" />
          </div>
          <Input
            ref={inputRef}
            placeholder="Software Engineer @ Google"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setIsRecentOpen(true);
            }}
            onFocus={() => setIsRecentOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                if (isRecentOpen && suggestions.length > 0) {
                  e.preventDefault();
                  setIsRecentOpen(false);
                } else {
                  e.preventDefault();
                  onOpenChange(false);
                }
              }
            }}
            disabled={isAdding}
            className="border-0 shadow-none focus-visible:ring-0 px-0 h-auto py-1"
          />
          {recent.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground"
              onClick={() => setIsRecentOpen((v) => !v)}
              aria-label="Show recent entries"
              title="Recent"
            >
              <History className="h-4 w-4" />
            </Button>
          )}
          {value.trim() && (
            <Button type="submit" size="sm" disabled={isAdding} className="shrink-0">
              {isAdding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Add"}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground"
            onClick={() => onOpenChange(false)}
            aria-label="Close quick add"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {isRecentOpen && suggestions.length > 0 && (
          <div className="mt-1 border-t pt-1">
            <p className="px-2 py-1 text-xs font-medium text-muted-foreground">Recent</p>
            <div className="flex flex-wrap gap-1.5 px-1 pb-1">
              {suggestions.map((entry) => (
                <button
                  key={entry}
                  type="button"
                  onClick={() => {
                    setValue(entry);
                    setIsRecentOpen(false);
                    inputRef.current?.focus();
                  }}
                  className="rounded-full border bg-background px-2.5 py-1 text-xs text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {entry}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <p className="mt-1.5 pl-10 text-xs text-muted-foreground">
        Tip: use <span className="font-medium">@</span> or{" "}
        <span className="font-medium">&quot;at&quot;</span> to split title and company.
        Everything else is filled in for you.
      </p>
    </form>
  );
}
