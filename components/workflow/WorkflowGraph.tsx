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

interface WorkflowGraphProps {
  workflow: WorkflowDefinition;
}

type PolicyNode = Node<
  {
    label: string;
    kind: WorkflowNodeType;
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

  return (
    <div
      className="w-[220px] border-2 px-4 py-3 transition-shadow"
      style={{
        background: design.background,
        borderColor: selected ? "#ffffff" : design.border,
        borderRadius:
          data.kind === "start" || data.kind === "end" ? 28 : 12,
        boxShadow: selected
          ? `0 0 0 4px ${design.border}40`
          : "none",
      }}
    >
      {data.kind !== "start" && (
        <Handle
          type="target"
          position={Position.Top}
          style={{ background: design.border }}
        />
      )}

      <div
        className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase"
        style={{ color: design.color }}
      >
        <Icon size={16} />
        <span>{design.title}</span>
      </div>

      <p className="text-sm font-medium leading-5 text-white">
        {data.label}
      </p>

      {data.kind !== "end" && (
        <Handle
          type="source"
          position={Position.Bottom}
          style={{ background: design.border }}
        />
      )}
    </div>
  );
}

const nodeTypes: NodeTypes = {
  policy: WorkflowNode,
};

function createLayout(workflow: WorkflowDefinition): PolicyNode[] {
  const incoming = new Map<string, number>();
  const children = new Map<string, string[]>();
  const levels = new Map<string, number>();

  for (const node of workflow.nodes) {
    incoming.set(node.id, 0);
    children.set(node.id, []);
    levels.set(node.id, 0);
  }

  for (const edge of workflow.edges) {
    if (!incoming.has(edge.source) || !incoming.has(edge.target)) {
      continue;
    }

    children.get(edge.source)!.push(edge.target);
    incoming.set(edge.target, incoming.get(edge.target)! + 1);
  }

  const queue = workflow.nodes
    .filter((node) => incoming.get(node.id) === 0)
    .map((node) => node.id);

  const visited = new Set<string>();

  for (let index = 0; index < queue.length; index++) {
    const id = queue[index];
    visited.add(id);

    for (const child of children.get(id) ?? []) {
      levels.set(
        child,
        Math.max(levels.get(child)!, levels.get(id)! + 1),
      );

      incoming.set(child, incoming.get(child)! - 1);

      if (incoming.get(child) === 0) {
        queue.push(child);
      }
    }
  }

  // Keep nodes visible if a future graph contains a cycle.
  let fallbackLevel = Math.max(0, ...levels.values()) + 1;

  for (const node of workflow.nodes) {
    if (!visited.has(node.id)) {
      levels.set(node.id, fallbackLevel++);
    }
  }

  const rows = new Map<number, string[]>();

  for (const node of workflow.nodes) {
    const level = levels.get(node.id)!;
    const row = rows.get(level) ?? [];
    row.push(node.id);
    rows.set(level, row);
  }

  return workflow.nodes.map((node) => {
    const level = levels.get(node.id)!;
    const row = rows.get(level)!;
    const column = row.indexOf(node.id);

    return {
      id: node.id,
      type: "policy",
      data: {
        label: node.label,
        kind: node.type,
      },
      position: {
        x: (column - (row.length - 1) / 2) * 340,
        y: level * 190,
      },
    };
  });
}

export function WorkflowGraph({ workflow }: WorkflowGraphProps) {
  const nodes = useMemo(() => createLayout(workflow), [workflow]);

  const edges: Edge[] = useMemo(
    () =>
      workflow.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        type: "smoothstep",
        style: {
          stroke: "#818cf8",
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#818cf8",
        },
        labelStyle: {
          fill: "#f4f4f5",
          fontSize: 12,
          fontWeight: 600,
        },
        labelBgStyle: {
          fill: "#18181b",
          fillOpacity: 1,
        },
        labelBgPadding: [8, 5] as [number, number],
        labelBgBorderRadius: 5,
      })),
    [workflow.edges],
  );

  return (
    <div className="h-[600px] w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
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