"use client";

import React, { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { WorkflowDefinition } from "@/types/contracts";

interface WorkflowGraphProps {
  workflow: WorkflowDefinition;
}

export function WorkflowGraph({ workflow }: WorkflowGraphProps) {
  // Map WorkflowDefinition nodes to React Flow Node objects with simple default positioning
  const initialNodes: Node[] = useMemo(() => {
    return workflow.nodes.map((n, index) => ({
      id: n.id,
      data: { label: n.label, type: n.type },
      position: { x: 250, y: index * 100 },
      style: {
        background: n.type === "approval" ? "#312e81" : n.type === "condition" ? "#1e293b" : "#09090b",
        color: "#ffffff",
        border: "1px solid #3f3f46",
        borderRadius: "8px",
        padding: "10px",
        fontSize: "12px",
        fontWeight: 500,
        width: 220,
        textAlign: "center",
      },
    }));
  }, [workflow.nodes]);

  const initialEdges: Edge[] = useMemo(() => {
    return workflow.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      animated: true,
      style: { stroke: "#6366f1" },
    }));
  }, [workflow.edges]);

  return (
    <div className="w-full h-[500px] rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
      <ReactFlow nodes={initialNodes} edges={initialEdges} fitView>
        <Background color="#27272a" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
