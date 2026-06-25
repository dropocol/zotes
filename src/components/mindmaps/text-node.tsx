"use client";

import { memo, useState, useRef, useEffect } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { GripVertical } from "lucide-react";

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
 * Mind map node — a simple pill (capsule). Content-hugging width: the pill
 * shrinks to fit short text and grows for longer text (capped), so nodes read
 * like clean chips rather than fixed-size boxes.
 *
 * The capsule chrome (background, border, radius, padding) comes from
 * `.pill-node` in mindmaps.css. The input is controlled and persists via
 * `data.onChangeText`. The grip on the left is a visual affordance for
 * dragging — the whole node is draggable (React Flow default), so the grip
 * carries no `nodrag` class and participates in dragging like the rest of
 * the node.
 */
function TextNodeComponent({ id, data }: TextNodeType) {
  const [draft, setDraft] = useState(data.text);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the draft in sync if the persisted text changes elsewhere.
  useEffect(() => {
    setDraft(data.text);
  }, [data.text]);

  function handleChange(evt: React.ChangeEvent<HTMLInputElement>) {
    const value = evt.target.value;
    setDraft(value);
    data.onChangeText?.(id, value);
  }

  return (
    <div className="pill-node">
      {/* Connector handles, one on each side. */}
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

      {/* Left-side drag affordance. Drags the whole node (no `nodrag` class). */}
      <GripVertical className="pill-node__grip" aria-hidden />

      <input
        ref={inputRef}
        value={draft}
        onChange={handleChange}
        placeholder="Type…"
        className="nodrag"
      />
    </div>
  );
}

export const TextNode = memo(TextNodeComponent);
