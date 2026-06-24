"use client";

import { memo, useState, useRef, useEffect } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";

export interface TextNodeData {
  text: string;
  isRoot?: boolean;
  /** Injected by the canvas so the node can report text edits. */
  onChangeText?: (id: string, text: string) => void;
  [key: string]: unknown;
}

export type TextNodeType = NodeProps & {
  data: TextNodeData;
};

/**
 * Mind map node — a single root <div> with two <Handle> children (target on
 * the left, source on the right). This mirrors the structure React Flow's own
 * built-in nodes use, which we confirmed render edges correctly.
 *
 * The edit callback is passed via `data` (the same pattern as xyflow's
 * official CustomNode example). Double-click to edit; Enter/Cmd+Enter or blur
 * to commit; Escape to cancel.
 */
function TextNodeComponent({ id, data, selected }: TextNodeType) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(data.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const el = textareaRef.current;
      el.focus();
      const len = el.value.length;
      el.setSelectionRange(len, len);
      autoResize(el);
    }
  }, [isEditing]);

  function beginEdit() {
    setDraft(data.text);
    setIsEditing(true);
  }

  function commit() {
    setIsEditing(false);
    data.onChangeText?.(id, draft);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      setDraft(data.text);
      setIsEditing(false);
    } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey || !e.shiftKey)) {
      e.preventDefault();
      commit();
    }
  }

  const isEmpty = !data.text?.trim();

  return (
    <div
      className={cn(
        "group relative w-[200px] rounded-2xl bg-card border shadow-sm",
        "transition-[box-shadow,border-color] duration-150",
        data.isRoot ? "border-transparent ring-1 ring-emerald-500/30" : "border-border",
        selected && "ring-2 ring-sky-400/70 border-transparent shadow-md",
        isEditing && "ring-2 ring-sky-400/70 border-transparent",
      )}
      onDoubleClick={(e) => {
        e.stopPropagation();
        beginEdit();
      }}
    >
      {/* Connection handles: target on the left, source on the right. */}
      <Handle
        id="left"
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !rounded-full !border-2 !border-card !bg-slate-400 hover:!bg-sky-500"
      />
      <Handle
        id="right"
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !rounded-full !border-2 !border-card !bg-slate-400 hover:!bg-sky-500"
      />

      {/* Header chip — pointer-events-none so it never blocks handle drops. */}
      <div
        className={cn(
          "pointer-events-none flex items-center gap-1.5 rounded-t-2xl px-3 py-1.5",
          data.isRoot ? "bg-emerald-500/10" : "bg-muted/50",
        )}
      >
        <span
          className={cn(
            "inline-flex h-1.5 w-1.5 rounded-full",
            data.isRoot ? "bg-emerald-500" : "bg-slate-400",
          )}
        />
        <span
          className={cn(
            "text-[10px] font-semibold uppercase tracking-wider",
            data.isRoot ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
          )}
        >
          {data.isRoot ? "Root" : "Node"}
        </span>
      </div>

      {/* Body: inline-editable text. `nodrag` so text selection doesn't drag the node. */}
      <div className="px-3 py-2.5">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              autoResize(e.target);
            }}
            onKeyDown={handleKeyDown}
            onBlur={commit}
            rows={1}
            placeholder="Type a thought…"
            className="nodrag w-full resize-none border-0 bg-transparent text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/50"
          />
        ) : (
          <div
            className={cn(
              "cursor-text whitespace-pre-wrap break-words text-sm leading-relaxed",
              isEmpty ? "text-muted-foreground/50 italic" : "text-foreground",
            )}
            title={isEmpty ? "Double-click to edit" : undefined}
          >
            {isEmpty ? "Double-click to edit" : data.text}
          </div>
        )}
      </div>
    </div>
  );
}

function autoResize(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

export const TextNode = memo(TextNodeComponent);
