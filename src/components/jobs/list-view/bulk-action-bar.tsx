"use client";

import * as React from "react";
import { Loader2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  JOB_APPLICATION_STATUSES,
  RESPONSE_STATUSES,
  JOB_SOURCES,
  APPLICATION_METHODS,
  getStatusDisplayName,
  getResponseStatusDisplayName,
  getJobSourceDisplayName,
  getApplicationMethodDisplayName,
} from "@/types/jobs";
import type { BulkUpdatePayload } from "../job-context";

// Sentinel value representing "leave this field unchanged".
const UNCHANGED = "__unchanged__";

interface BulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
  onApply: (data: BulkUpdatePayload) => Promise<void>;
}

export function BulkActionBar({ selectedCount, onClear, onApply }: BulkActionBarProps) {
  const [status, setStatus] = React.useState<string>(UNCHANGED);
  const [response, setResponse] = React.useState<string>(UNCHANGED);
  const [source, setSource] = React.useState<string>(UNCHANGED);
  const [method, setMethod] = React.useState<string>(UNCHANGED);
  const [isApplying, setIsApplying] = React.useState(false);

  const hasChange =
    status !== UNCHANGED ||
    response !== UNCHANGED ||
    source !== UNCHANGED ||
    method !== UNCHANGED;

  function resetFields() {
    setStatus(UNCHANGED);
    setResponse(UNCHANGED);
    setSource(UNCHANGED);
    setMethod(UNCHANGED);
  }

  async function handleApply() {
    if (!hasChange || isApplying) return;

    const payload: BulkUpdatePayload = {};
    if (status !== UNCHANGED) payload.status = status as BulkUpdatePayload["status"];
    if (response !== UNCHANGED) payload.responseReceived = response as BulkUpdatePayload["responseReceived"];
    if (source !== UNCHANGED) payload.source = source as BulkUpdatePayload["source"];
    if (method !== UNCHANGED) payload.applicationMethod = method as BulkUpdatePayload["applicationMethod"];

    setIsApplying(true);
    try {
      await onApply(payload);
      resetFields();
    } catch (error) {
      console.error("Error applying bulk update:", error);
    } finally {
      setIsApplying(false);
    }
  }

  return (
    <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-lg sm:flex-row sm:items-center sm:gap-4">
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          {selectedCount} selected
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClear}
          disabled={isApplying}
          className="h-8 text-muted-foreground"
        >
          <X className="mr-1 size-3.5" />
          Clear
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={status} onValueChange={setStatus} disabled={isApplying}>
          <SelectTrigger className="h-8 w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNCHANGED}>— Status: unchanged —</SelectItem>
            {JOB_APPLICATION_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {getStatusDisplayName(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={response} onValueChange={setResponse} disabled={isApplying}>
          <SelectTrigger className="h-8 w-[140px]">
            <SelectValue placeholder="Response" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNCHANGED}>— Response: unchanged —</SelectItem>
            {RESPONSE_STATUSES.map((r) => (
              <SelectItem key={r} value={r}>
                {getResponseStatusDisplayName(r)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={source} onValueChange={setSource} disabled={isApplying}>
          <SelectTrigger className="h-8 w-[140px]">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNCHANGED}>— Source: unchanged —</SelectItem>
            {JOB_SOURCES.map((s) => (
              <SelectItem key={s} value={s}>
                {getJobSourceDisplayName(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={method} onValueChange={setMethod} disabled={isApplying}>
          <SelectTrigger className="h-8 w-[160px]">
            <SelectValue placeholder="Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNCHANGED}>— Method: unchanged —</SelectItem>
            {APPLICATION_METHODS.map((m) => (
              <SelectItem key={m} value={m}>
                {getApplicationMethodDisplayName(m)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="button"
        size="sm"
        onClick={handleApply}
        disabled={!hasChange || isApplying}
        className="sm:ml-auto"
      >
        {isApplying ? (
          <Loader2 className="mr-1.5 size-3.5 animate-spin" />
        ) : (
          <Check className="mr-1.5 size-3.5" />
        )}
        Apply
      </Button>
    </div>
  );
}
