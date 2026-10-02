import type {
  WorkflowDefinition,
  WorkflowNodeType,
} from "@/types/contracts";

export interface PolicyNodeData extends Record<string, unknown> {
  label: string;
  kind: WorkflowNodeType;
  isActive?: boolean;
  isTraversed?: boolean;
}

export interface CalculatedNode {
  id: string;
  type: string;
  data: PolicyNodeData;
  position: {
    x: number;
    y: number;
  };
}

/**
 * Computes hierarchical coordinates for DAG workflows.
 * Cyclic nodes receive fallback positions for display only.
 */
export function createLayout(
  workflow: WorkflowDefinition,
  activeNodeId?: string | null,
  traversedNodeIds?: string[],
): CalculatedNode[] {
  if (
    !workflow ||
    !Array.isArray(workflow.nodes) ||
    workflow.nodes.length === 0
  ) {
    return [];
  }

  const incoming = new Map<string, number>();
  const children = new Map<string, string[]>();
  const levels = new Map<string, number>();

  for (const node of workflow.nodes) {
    incoming.set(node.id, 0);
    children.set(node.id, []);
    levels.set(node.id, 0);
  }

  if (Array.isArray(workflow.edges)) {
    for (const edge of workflow.edges) {
      if (!incoming.has(edge.source) || !incoming.has(edge.target)) {
        continue;
      }

      children.get(edge.source)!.push(edge.target);
      incoming.set(edge.target, (incoming.get(edge.target) ?? 0) + 1);
    }
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

      incoming.set(
        child,
        Math.max(0, (incoming.get(child) ?? 1) - 1),
      );

      if (incoming.get(child) === 0 && !visited.has(child)) {
        queue.push(child);
      }
    }
  }

  // Keep unresolved cyclic nodes visible using fallback rows.
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

  const traversedSet = new Set(traversedNodeIds ?? []);

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
        isActive: node.id === activeNodeId,
        isTraversed: traversedSet.has(node.id),
      },
      position: {
        x: (column - (row.length - 1) / 2) * 340,
        y: level * 190,
      },
    };
  });
}