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
  BackgroundVariant,
  type Connection,
  type Edge,
  type Node,
  type OnConnect,
  type OnNodesChange,
  type OnEdgesChange,
} from "@xyflow/react";
// React Flow base styles are imported once, globally, in src/app/globals.css
// (inside @layer base, after tailwindcss) per the Tailwind v4 + React Flow
// guidance. Do NOT import the stylesheet here.
import { Button } from "@/components/ui/button";
import { Plus, GitBranch } from "lucide-react";
import { TextNode, type TextNodeData } from "./text-node";
import type { MindMapData, MindMapNode } from "@/types";

// Plain object (not inline) so React Flow's nodeTypes reference is stable.
const nodeTypes = { textNode: TextNode };

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
      setEdges((eds) => addEdge(connection, eds));
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

  const createNodeAt = useCallback(
    (position: { x: number; y: number }) => {
      const id = genId();
      setNodes((nds) => [...nds, { id, type: "textNode", position, data: { text: "" } }]);
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
    createNodeAt({ x: -viewport.x / viewport.zoom, y: -viewport.y / viewport.zoom });
  }, [readOnly, reactFlow, createNodeAt]);

  return (
    <div className="relative h-full w-full">
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
        fitView
        fitViewOptions={{ padding: 0.3, maxZoom: 1 }}
        deleteKeyCode={readOnly ? null : ["Backspace", "Delete"]}
        multiSelectionKeyCode={["Meta", "Control", "Shift"]}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
        className="bg-background"
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} className="text-muted-foreground/40" />
        <Controls className="!bg-card !border !shadow-sm" showInteractive={!readOnly} />
        <MiniMap
          pannable
          zoomable
          className="!bg-card !border"
          maskColor="rgb(0 0 0 / 0.05)"
          nodeColor={(n) =>
            (n.data as TextNodeData)?.isRoot ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.4)"
          }
        />
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
