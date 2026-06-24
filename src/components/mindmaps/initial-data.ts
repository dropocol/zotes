import type { MindMapData } from "@/types";

/** Creates a fresh canvas seeded with a single editable root node. */
export function createInitialMindMapData(): MindMapData {
  return {
    nodes: [
      {
        id: "root",
        type: "textNode",
        position: { x: 0, y: 0 },
        data: { text: "", isRoot: true },
      },
    ],
    edges: [],
  };
}
