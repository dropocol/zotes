"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Connection,
  type DefaultEdgeOptions,
  type Edge,
  type Node,
  type OnConnect,
  type OnNodesChange,
  type OnEdgesChange,
} from "@xyflow/react";
// React Flow base styles. Imported here (per component) because the
// `@layer base` import in globals.css does not reliably inline these styles
// under this Turbopack/Next setup — omitting it leaves handles without
// pointer-events/sizing, which silently breaks connections.
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { Plus, GitBranch } from "lucide-react";
import { TextNode, type TextNodeData } from "./text-node";
import { findFreePosition, viewportCenter } from "./layout-utils";
import type { MindMapData, MindMapNode } from "@/types";

// Plain object (not inline) so React Flow's nodeTypes reference is stable.
const nodeTypes = { textNode: TextNode };

// Solid edges for the default look (no marching-ants animation). Light grey
// so connections stay subtle against the light canvas.
const defaultEdgeOptions: DefaultEdgeOptions = {
  style: { stroke: "#c4c9d2", strokeWidth: 1.5 },
};

// Assumed footprint of a freshly added pill node, used for collision-aware
// placement before React Flow has measured the node.
const NEW_NODE_SIZE = { width: 120, height: 32 };

// Match the sample's snap-to-grid behaviour.
const snapGrid: [number, number] = [20, 20];

// Match the sample's starting viewport.
const defaultViewport = { x: 0, y: 0, zoom: 1.5 };

function genId() {
  return `n_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

interface MindMapCanvasProps {
  data: MindMapData;
  onChange: (data: MindMapData) => void;
  readOnly?: boolean;
}

function MindMapCanvasInner({ data, onChange, readOnly = false }: MindMapCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(data.nodes as unknown as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(data.edges as unknown as Edge[]);
  const [lastClickAt, setLastClickAt] = useState(0);
  const reactFlow = useReactFlow();
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep a live ref of nodes/edges so `emit` reads the latest state without
  // being recreated on every change.
  const stateRef = useRef({ nodes, edges });
  useEffect(() => {
    stateRef.current = { nodes, edges };
  }, [nodes, edges]);

  const emit = useCallback(() => {
    const { nodes: n, edges: e } = stateRef.current;
    onChange({
      nodes: n as unknown as MindMapNode[],
      edges: e as unknown as MindMapData["edges"],
    });
  }, [onChange]);

  const handleNodesChange: OnNodesChange<Node> = useCallback(
    (changes) => {
      onNodesChange(changes);
      queueMicrotask(emit);
    },
    [onNodesChange, emit],
  );

  const handleEdgesChange: OnEdgesChange<Edge> = useCallback(
    (changes) => {
      onEdgesChange(changes);
      queueMicrotask(emit);
    },
    [onEdgesChange, emit],
  );

  const handleConnect: OnConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge({ ...connection, style: defaultEdgeOptions.style }, eds));
      queueMicrotask(emit);
    },
    [setEdges, emit],
  );

  const updateNodeText = useCallback(
    (id: string, text: string) => {
      setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, text } } : n)));
      queueMicrotask(emit);
    },
    [setNodes, emit],
  );

  // Inject the edit callback into each node's `data`, memoized on [nodes] so
  // the wrapped array keeps the same reference across renders unless the
  // underlying nodes change. React Flow relies on node-object identity to
  // reuse internal nodes and preserve measured `handleBounds` (which edges
  // need to draw). `updateNodeText` is stable (deps: setNodes, emit) so it
  // won't churn the memo.
  const nodesWithEdit = useMemo(
    () =>
      nodes.map((n) => ({
        ...n,
        data: { ...(n.data as TextNodeData), onChangeText: updateNodeText },
      })),
    [nodes, updateNodeText],
  );

  // Drop a new node at `position` (flow coordinates). `position` is taken as
  // the node's top-left. When `findFree` is set we treat `position` as an
  // anchor and spiral outward to avoid overlapping existing nodes — used by
  // the "Add Node" button so the new node lands in open space.
  const createNodeAt = useCallback(
    (position: { x: number; y: number }, findFree = false) => {
      const id = genId();
      const finalPos = findFree
        ? findFreePosition({
            anchor: position,
            existing: stateRef.current.nodes,
            size: NEW_NODE_SIZE,
          })
        : position;
      setNodes((nds) => [...nds, { id, type: "textNode", position: finalPos, data: { text: "" } }]);
      queueMicrotask(emit);
    },
    [setNodes, emit],
  );

  // Double-click on the pane creates a node at the cursor (React Flow has no
  // onDoubleClick pane handler, so emulate it from two onPaneClick events).
  const handlePaneClick = useCallback<PaneClickHandler>(
    (event) => {
      if (readOnly) return;
      const now = Date.now();
      if (now - lastClickAt < 300) {
        const position = reactFlow.screenToFlowPosition({ x: event.clientX, y: event.clientY });
        createNodeAt({ x: position.x, y: position.y });
        setLastClickAt(0);
      } else {
        setLastClickAt(now);
      }
    },
    [readOnly, lastClickAt, createNodeAt, reactFlow],
  );

  const handleAddNode = useCallback(() => {
    if (readOnly) return;
    const viewport = reactFlow.getViewport();
    const pane = containerRef.current?.getBoundingClientRect();
    // Anchor = center of the visible viewport. Falls back to the old top-left
    // computation if the container isn't measured yet.
    const anchor = pane
      ? viewportCenter(viewport, { width: pane.width, height: pane.height })
      : { x: -viewport.x / viewport.zoom, y: -viewport.y / viewport.zoom };
    // Shift from "center point" to the node's top-left, then find a free spot
    // that doesn't collide with existing nodes.
    createNodeAt(
      { x: anchor.x - NEW_NODE_SIZE.width / 2, y: anchor.y - NEW_NODE_SIZE.height / 2 },
      true,
    );
  }, [readOnly, reactFlow, createNodeAt]);

  return (
    <div className="relative h-full w-full" ref={containerRef}>
      {!readOnly && (
        <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
          <Button type="button" size="sm" variant="default" onClick={handleAddNode}>
            <Plus className="mr-1.5 size-4" />
            Add Node
          </Button>
          <span className="hidden items-center gap-1 rounded-md border bg-card px-2 py-1 text-xs text-muted-foreground shadow-sm sm:inline-flex">
            <GitBranch className="size-3" />
            Drag between node dots to connect · Double-click canvas to add
          </span>
        </div>
      )}

      <ReactFlow
        nodes={nodesWithEdit}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        snapToGrid={!readOnly}
        snapGrid={snapGrid}
        defaultViewport={defaultViewport}
        fitView
        colorMode="light"
        deleteKeyCode={readOnly ? null : ["Backspace", "Delete"]}
        multiSelectionKeyCode={["Meta", "Control", "Shift"]}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
        attributionPosition="bottom-left"
        style={{ backgroundColor: "#f7f9fb" }}
      >
        <Background />
        <Controls showInteractive={!readOnly} />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}

type PaneClickHandler = NonNullable<React.ComponentProps<typeof ReactFlow>["onPaneClick"]>;

export function MindMapCanvas(props: MindMapCanvasProps) {
  return (
    <ReactFlowProvider>
      <MindMapCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
