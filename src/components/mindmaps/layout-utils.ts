// ============================================================================
// Mind map layout helpers
//
// `findFreePosition` places a node near a desired anchor (e.g. the viewport
// center) and nudges it outward on an expanding spiral until it no longer
// overlaps any existing node. The overlap test reuses the same axis-aligned
// box math as the xyflow `examples/layout/node-collisions` sample, but instead
// of mutually resolving all nodes we keep existing nodes pinned and only move
// the candidate — that's the right behaviour for "Add Node", where we want to
// avoid disturbing the user's existing layout.
// ============================================================================

import type { Node } from "@xyflow/react";

type Rect = { x: number; y: number; width: number; height: number };

function nodeRect(node: Node): Rect {
  const width = node.width ?? node.measured?.width ?? 0;
  const height = node.height ?? node.measured?.height ?? 0;
  return { x: node.position.x, y: node.position.y, width, height };
}

/** True if the two axis-aligned boxes overlap (with an optional margin). */
function rectsOverlap(a: Rect, b: Rect, margin: number): boolean {
  return (
    a.x - margin < b.x + b.width &&
    a.x + a.width + margin > b.x &&
    a.y - margin < b.y + b.height &&
    a.y + a.height + margin > b.y
  );
}

export interface FindFreePositionOptions {
  /** Desired position (node's top-left, in flow coordinates). */
  anchor: { x: number; y: number };
  /** Nodes already on the canvas to avoid. */
  existing: Node[];
  /** Size to assume for the new node if it has no measured dimensions yet. */
  size: { width: number; height: number };
  /** Gap kept between the candidate and other nodes. */
  margin?: number;
  /** Max spiral steps before giving up (returns last tried position). */
  maxSteps?: number;
}

/**
 * Returns a position for a new node, starting at `anchor` and spiraling outward
 * until a non-overlapping spot is found (or `maxSteps` is hit). The spiral step
 * scales with the node size so larger graphs still spread out sensibly.
 */
export function findFreePosition({
  anchor,
  existing,
  size,
  margin = 24,
  maxSteps = 240,
}: FindFreePositionOptions): { x: number; y: number } {
  const candidate: Rect = {
    x: anchor.x,
    y: anchor.y,
    width: size.width,
    height: size.height,
  };

  // Build the obstacle set once; ignore nodes without dimensions.
  const obstacles = existing
    .map(nodeRect)
    .filter((r) => r.width > 0 && r.height > 0);

  // First try the anchor itself — common case on an empty-ish canvas.
  const isFree = (r: Rect) => !obstacles.some((o) => rectsOverlap(r, o, margin));
  if (isFree(candidate)) {
    return { x: candidate.x, y: candidate.y };
  }

  // Expanding spiral: walk angle θ from 0..maxSteps and grow the radius. The
  // archimedean spiral (r = a·θ) gives even spacing; we sample one point per
  // step. Step size is tied to node width so spacing scales with the graph.
  const step = Math.max(size.width, size.height) + margin;
  const a = step / (2 * Math.PI); // spacing between turns ≈ step

  for (let i = 1; i <= maxSteps; i++) {
    const theta = i * 0.5; // ~0.5 rad per step → smooth spiral
    const r = a * theta;
    // Center the candidate on the spiral point (anchor is the node's top-left,
    // so offset by half size to keep it centered on the spiral point).
    const cx = anchor.x + size.width / 2 + r * Math.cos(theta);
    const cy = anchor.y + size.height / 2 + r * Math.sin(theta);
    candidate.x = cx - size.width / 2;
    candidate.y = cy - size.height / 2;
    if (isFree(candidate)) {
      return { x: candidate.x, y: candidate.y };
    }
  }

  // Fallback: return the last tried position rather than overlapping at anchor.
  return { x: candidate.x, y: candidate.y };
}

/**
 * The visible region of the canvas (flow coordinates). Used to pick a sensible
 * anchor for new nodes: the center of whatever the user is currently looking at.
 */
export function viewportCenter(
  viewport: { x: number; y: number; zoom: number },
  paneSize: { width: number; height: number },
): { x: number; y: number } {
  const centerX = (paneSize.width / 2 - viewport.x) / viewport.zoom;
  const centerY = (paneSize.height / 2 - viewport.y) / viewport.zoom;
  return { x: centerX, y: centerY };
}
