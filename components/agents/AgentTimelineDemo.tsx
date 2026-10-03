"use client";

import { WorkflowExecutionDemo } from "@/components/workflow/WorkflowExecutionDemo";
import type { WorkflowDefinition } from "@/types/contracts";

export interface AgentTimelineDemoProps {
  workflow?: WorkflowDefinition;
  className?: string;
  onActiveNodeChange?: (nodeId: string | null) => void;
  onTraversedNodesChange?: (nodeIds: string[]) => void;
  onActiveEdgesChange?: (edgeIds: string[]) => void;
}

/**
 * Unified execution controller adapter preserving backward compatibility
 * while ensuring single source of truth for execution state.
 */
export function AgentTimelineDemo({
  workflow,
  className = "",
}: AgentTimelineDemoProps) {
  if (!workflow) {
    return null;
  }

  return <WorkflowExecutionDemo workflow={workflow} className={className} />;
}