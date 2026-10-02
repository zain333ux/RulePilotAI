"use client";

import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  MarkerType,
  type Node,
  type Edge,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import { Play, GitBranch, Zap, UserCheck, Flag } from "lucide-react";
import "@xyflow/react/dist/style.css";
import type {
  WorkflowDefinition,
  WorkflowNodeType,
} from "@/types/contracts";

export interface WorkflowGraphProps {
  workflow: WorkflowDefinition;
  activeNodeId?: string | null;
  traversedNodeIds?: string[];
  activeEdgeIds?: string[];
  onNodeClick?: (nodeId: string) => void;
  className?: string;
}

type PolicyNode = Node<
  {
    label: string;
    kind: WorkflowNodeType;
    isActive?: boolean;
    isTraversed?: boolean;
  },
  "policy"
>;

const nodeStyles = {
  start: {
    title: "Start",
    icon: Play,
    background: "#052e16",
    border: "#22c55e",
    color: "#86efac",
  },
  condition: {
    title: "Condition",
    icon: GitBranch,
    background: "#082f49",
    border: "#38bdf8",
    color: "#7dd3fc",
  },
  action: {
    title: "Action",
    icon: Zap,
    background: "#451a03",
    border: "#f59e0b",
    color: "#fcd34d",
  },
  approval: {
    title: "Approval",
    icon: UserCheck,
    background: "#2e1065",
    border: "#a78bfa",
    color: "#c4b5fd",
  },
  end: {
    title: "End",
    icon: Flag,
    background: "#27272a",
    border: "#a1a1aa",
    color: "#e4e4e7",
  },
};

function WorkflowNode({ data, selected }: NodeProps<PolicyNode>) {
  const design = nodeStyles[data.kind];
  const Icon = design.icon;

  const isActive = Boolean(data.isActive);
  const isTraversed = Boolean(data.isTraversed && !isActive);

  const borderColor = isActive
    ? "#818cf8"
    : isTraversed
      ? "#10b981"
      : selected
        ? "#ffffff"
        : design.border;

  const boxShadow = isActive
    ? "0 0 0 3px rgba(129, 140, 248, 0.45), 0 0 24px rgba(99, 102, 241, 0.6)"
    : isTraversed
      ? "0 0 0 2px rgba(16, 185, 129, 0.35), 0 0 12px rgba(16, 185, 129, 0.25)"
      : selected
        ? `0 0 0 4px ${design.border}40`
        : "none";

  return (
    <div
      className="relative w-[220px] border-2 px-4 py-3 transition-all duration-300"
      style={{
        background: design.background,
        borderColor,
        borderRadius:
          data.kind === "start" || data.kind === "end" ? 28 : 12,
        boxShadow,
      }}
    >
      {data.kind !== "start" && (
        <Handle
          type="target"
          position={Position.Top}
          style={{ background: isActive ? "#818cf8" : design.border }}
        />
      )}

      <div className="mb-2 flex items-center justify-between gap-1 text-xs font-semibold uppercase">
        <div className="flex items-center gap-1.5" style={{ color: design.color }}>
          <Icon size={16} />
          <span>{design.title}</span>
        </div>
        {isActive && (
          <span className="flex items-center gap-1 rounded bg-indigo-500/30 px-1.5 py-0.5 text-[9px] font-bold text-indigo-200 ring-1 ring-indigo-400 animate-pulse">
            ACTIVE
          </span>
        )}
        {isTraversed && (
          <span className="flex items-center gap-0.5 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300 ring-1 ring-emerald-500/40">
            DONE
          </span>
        )}
      </div>

      <p className="text-sm font-medium leading-5 text-white">
        {data.label}
      </p>

      {data.kind !== "end" && (
        <Handle
          type="source"
          position={Position.Bottom}
          style={{ background: isActive ? "#818cf8" : design.border }}
        />
      )}
    </div>
  );
}

const nodeTypes: NodeTypes = {
  policy: WorkflowNode,
};

import { createLayout } from "./layout";
export { createLayout };


export function WorkflowGraph({
  workflow,
  activeNodeId,
  traversedNodeIds,
  activeEdgeIds,
  onNodeClick,
  className = "h-[600px] w-full",
}: WorkflowGraphProps) {
  const nodes = useMemo(
    () => createLayout(workflow, activeNodeId, traversedNodeIds),
    [workflow, activeNodeId, traversedNodeIds],
  );

  const edges: Edge[] = useMemo(() => {
    if (!workflow || !Array.isArray(workflow.edges)) return [];
    const activeEdgeSet = new Set(activeEdgeIds ?? []);

    return workflow.edges.map((edge) => {
      const isActive = activeEdgeSet.has(edge.id);

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        type: "smoothstep",
        animated: isActive,
        style: {
          stroke: isActive ? "#38bdf8" : "#818cf8",
          strokeWidth: isActive ? 3 : 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isActive ? "#38bdf8" : "#818cf8",
        },
        labelStyle: {
          fill: isActive ? "#38bdf8" : "#f4f4f5",
          fontSize: 12,
          fontWeight: 600,
        },
        labelBgStyle: {
          fill: "#18181b",
          fillOpacity: 1,
        },
        labelBgPadding: [8, 5] as [number, number],
        labelBgBorderRadius: 5,
      };
    });
  }, [workflow, activeEdgeIds]);

  return (
    <div className={`${className} overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => onNodeClick?.(node.id)}
        nodesDraggable={false}
        nodesConnectable={false}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2}
        colorMode="dark"
      >
        <Background color="#27272a" gap={20} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}