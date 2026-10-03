import type {
  AgentStep,
  WorkflowDefinition,
  WorkflowNode,
  WorkflowNodeType,
} from "@/types/contracts";

export interface ExecutionPathStep {
  nodeId: string;
  edgeId?: string;
  nodeType: WorkflowNodeType;
  label: string;
  ruleId?: string;
  phase: "policy" | "evaluation" | "action";
  description: string;
}

export interface WorkflowExecutionPath {
  id: string;
  name: string;
  description: string;
  steps: ExecutionPathStep[];
}

export interface WorkflowExecutionState {
  status: "idle" | "running" | "completed" | "failed";
  running: boolean;
  currentStepIndex: number;
  activeNodeId: string | null;
  completedNodeIds: string[];
  activeEdgeIds: string[];
  steps: AgentStep[];
  message: string;
}

export function createDefaultAgentSteps(): AgentStep[] {
  return [
    {
      id: "policy",
      name: "Policy Extraction",
      description: "Load policy rules and structure; ready for evaluation.",
      status: "waiting",
    },
    {
      id: "evaluation",
      name: "Rule Evaluation",
      description: "Traverse condition nodes and verify thresholds.",
      status: "waiting",
    },
    {
      id: "action",
      name: "Action Generation",
      description: "Prepare approvals and routing actions for case decision.",
      status: "waiting",
    },
    {
      id: "automation",
      name: "Optional Automation",
      description: "Simulate non-blocking Make/Zapier webhook delivery.",
      status: "waiting",
    },
  ];
}

export function createInitialExecutionState(): WorkflowExecutionState {
  return {
    status: "idle",
    running: false,
    currentStepIndex: -1,
    activeNodeId: null,
    completedNodeIds: [],
    activeEdgeIds: [],
    steps: createDefaultAgentSteps(),
    message: "",
  };
}

export function mapNodeToTimelinePhase(
  nodeType: WorkflowNodeType,
): "policy" | "evaluation" | "action" {
  if (nodeType === "start") return "policy";
  if (nodeType === "condition") return "evaluation";
  return "action";
}

/**
 * Pure graph traversal algorithm that discovers valid execution paths
 * from start to end nodes for ANY WorkflowDefinition without hardcoded IDs.
 */
export function discoverWorkflowPaths(
  workflow: WorkflowDefinition,
): WorkflowExecutionPath[] {
  if (
    !workflow ||
    !Array.isArray(workflow.nodes) ||
    workflow.nodes.length === 0
  ) {
    return [];
  }

  const nodeMap = new Map<string, WorkflowNode>();
  for (const node of workflow.nodes) {
    nodeMap.set(node.id, node);
  }

  const outgoing = new Map<
    string,
    { targetId: string; edgeId: string; label?: string }[]
  >();
  for (const node of workflow.nodes) {
    outgoing.set(node.id, []);
  }

  if (Array.isArray(workflow.edges)) {
    for (const edge of workflow.edges) {
      if (nodeMap.has(edge.source) && nodeMap.has(edge.target)) {
        outgoing.get(edge.source)!.push({
          targetId: edge.target,
          edgeId: edge.id,
          label: edge.label,
        });
      }
    }
  }

  const startNodes = workflow.nodes.filter((node) => node.type === "start");
  const initialNodes =
    startNodes.length > 0 ? startNodes : [workflow.nodes[0]];

  const discoveredRawPaths: {
    nodeIds: string[];
    edgeIds: string[];
    labels: string[];
  }[] = [];

  function dfs(
    currentId: string,
    visitedNodes: Set<string>,
    nodePath: string[],
    edgePath: string[],
    edgeLabels: string[],
  ) {
    if (discoveredRawPaths.length >= 8) return; // Cap paths to avoid exponential branching

    const currentNode = nodeMap.get(currentId)!;
    const isEnd =
      currentNode.type === "end" ||
      (outgoing.get(currentId)?.length ?? 0) === 0;

    if (isEnd && nodePath.length > 0) {
      discoveredRawPaths.push({
        nodeIds: [...nodePath],
        edgeIds: [...edgePath],
        labels: [...edgeLabels],
      });
      return;
    }

    const nextEdges = outgoing.get(currentId) ?? [];
    for (const next of nextEdges) {
      if (!visitedNodes.has(next.targetId)) {
        visitedNodes.add(next.targetId);
        nodePath.push(next.targetId);
        edgePath.push(next.edgeId);
        if (next.label) edgeLabels.push(next.label);

        dfs(next.targetId, visitedNodes, nodePath, edgePath, edgeLabels);

        if (next.label) edgeLabels.pop();
        edgePath.pop();
        nodePath.pop();
        visitedNodes.delete(next.targetId);
      }
    }
  }

  for (const start of initialNodes) {
    const visited = new Set<string>([start.id]);
    dfs(start.id, visited, [start.id], [], []);
  }

  // Fallback: If no path reached an end node (e.g. cycle or disconnected), produce a linear slice
  if (discoveredRawPaths.length === 0) {
    discoveredRawPaths.push({
      nodeIds: workflow.nodes.map((n) => n.id),
      edgeIds: (workflow.edges ?? []).map((e) => e.id),
      labels: [],
    });
  }

  return discoveredRawPaths.map((raw, index) => {
    const steps: ExecutionPathStep[] = raw.nodeIds.map((nodeId, idx) => {
      const node = nodeMap.get(nodeId)!;
      const edgeId = idx === 0 ? undefined : raw.edgeIds[idx - 1];
      const phase = mapNodeToTimelinePhase(node.type);

      let description: string;
      if (node.type === "start") {
        description = `Ingested document: ${node.label}`;
      } else if (node.type === "condition") {
        description = `Evaluating rule: ${node.label}${node.ruleId ? ` [${node.ruleId}]` : ""}`;
      } else if (node.type === "approval") {
        description = `Routing approval: ${node.label}`;
      } else if (node.type === "action") {
        description = `Dispatching action: ${node.label}`;
      } else {
        description = `Workflow finalized: ${node.label}`;
      }

      return {
        nodeId: node.id,
        edgeId,
        nodeType: node.type,
        label: node.label,
        ruleId: node.ruleId,
        phase,
        description,
      };
    });

    // Provide friendly scenario name based on branch edge labels or position
    let name = `Execution Route ${index + 1}`;
    const primaryLabel = raw.labels.find((lbl) =>
      Boolean(lbl && lbl.trim().length > 0),
    );
    if (primaryLabel) {
      name = `Route ${index + 1}: ${primaryLabel}`;
    } else if (steps.some((s) => s.nodeType === "approval")) {
      name = `Route ${index + 1}: Hierarchical Approval`;
    } else if (steps.length <= 4) {
      name = `Route ${index + 1}: Fast-Track Disbursal`;
    }

    return {
      id: `path-${index + 1}`,
      name,
      description: `Synchronized traversal across ${steps.length} nodes from '${steps[0].label}' to '${steps[steps.length - 1].label}'.`,
      steps,
    };
  });
}

/**
 * Pure transition function that advances the execution state by one step index.
 * - indices 0 to path.steps.length - 1: graph node traversal
 * - index path.steps.length: automation running
 * - index path.steps.length + 1: automation finalized (success or failure)
 */
export function stepExecution(
  currentState: WorkflowExecutionState,
  path: WorkflowExecutionPath,
  stepIndex: number,
  shouldFailAutomation: boolean,
): WorkflowExecutionState {
  const totalGraphSteps = path.steps.length;
  const now = new Date().toISOString();

  // Case 1: Traversal of graph nodes
  if (stepIndex >= 0 && stepIndex < totalGraphSteps) {
    const currentPathStep = path.steps[stepIndex];
    const completedNodeIds = path.steps
      .slice(0, stepIndex)
      .map((s) => s.nodeId);
    const activeEdgeIds = path.steps
      .slice(0, stepIndex + 1)
      .map((s) => s.edgeId)
      .filter((id): id is string => Boolean(id));

    const nextSteps = currentState.steps.map((step) => {
      if (currentPathStep.phase === "policy") {
        if (step.id === "policy") {
          return {
            ...step,
            status: "running" as const,
            startedAt: step.startedAt ?? now,
            description: currentPathStep.description,
          };
        }
      } else if (currentPathStep.phase === "evaluation") {
        if (step.id === "policy") {
          return { ...step, status: "completed" as const, completedAt: now };
        }
        if (step.id === "evaluation") {
          return {
            ...step,
            status: "running" as const,
            startedAt: step.startedAt ?? now,
            description: currentPathStep.description,
          };
        }
      } else if (currentPathStep.phase === "action") {
        if (step.id === "policy" || step.id === "evaluation") {
          return { ...step, status: "completed" as const, completedAt: now };
        }
        if (step.id === "action") {
          return {
            ...step,
            status: "running" as const,
            startedAt: step.startedAt ?? now,
            description: currentPathStep.description,
          };
        }
      }
      return step;
    });

    return {
      status: "running",
      running: true,
      currentStepIndex: stepIndex,
      activeNodeId: currentPathStep.nodeId,
      completedNodeIds,
      activeEdgeIds,
      steps: nextSteps,
      message: `Active Step [${stepIndex + 1}/${totalGraphSteps}]: ${currentPathStep.label}`,
    };
  }

  // Case 2: Graph traversal finished, initiating Optional Automation
  if (stepIndex === totalGraphSteps) {
    const allNodeIds = path.steps.map((s) => s.nodeId);
    const allEdgeIds = path.steps
      .map((s) => s.edgeId)
      .filter((id): id is string => Boolean(id));

    const nextSteps = currentState.steps.map((step) => {
      if (
        step.id === "policy" ||
        step.id === "evaluation" ||
        step.id === "action"
      ) {
        return {
          ...step,
          status: "completed" as const,
          completedAt: step.completedAt ?? now,
        };
      }
      if (step.id === "automation") {
        return {
          ...step,
          status: "running" as const,
          startedAt: now,
          description: "Dispatching optional Make/Zapier webhook notification...",
        };
      }
      return step;
    });

    return {
      status: "running",
      running: true,
      currentStepIndex: stepIndex,
      activeNodeId: null,
      completedNodeIds: allNodeIds,
      activeEdgeIds: allEdgeIds,
      steps: nextSteps,
      message: "Core workflow evaluation complete. Testing optional automation webhook...",
    };
  }

  // Case 3: Finalize Automation (Success or Simulated Failure)
  const allNodeIds = path.steps.map((s) => s.nodeId);
  const allEdgeIds = path.steps
    .map((s) => s.edgeId)
    .filter((id): id is string => Boolean(id));

  const nextSteps = currentState.steps.map((step) => {
    if (
      step.id === "policy" ||
      step.id === "evaluation" ||
      step.id === "action"
    ) {
      return {
        ...step,
        status: "completed" as const,
        completedAt: step.completedAt ?? now,
      };
    }
    if (step.id === "automation") {
      return {
        ...step,
        status: shouldFailAutomation
          ? ("failed" as const)
          : ("completed" as const),
        completedAt: now,
        description: shouldFailAutomation
          ? "Optional webhook delivery failed; core rule decision and action draft remain valid."
          : "Optional automation step completed; mock webhook acknowledged.",
        error: shouldFailAutomation
          ? "Simulated webhook delivery failure (HTTP 500 / Timeout)"
          : undefined,
      };
    }
    return step;
  });

  return {
    status: shouldFailAutomation ? "failed" : "completed",
    running: false,
    currentStepIndex: stepIndex,
    activeNodeId: null,
    completedNodeIds: allNodeIds,
    activeEdgeIds: allEdgeIds,
    steps: nextSteps,
    message: shouldFailAutomation
      ? "Optional automation failed. Core RulePilot evaluation and action draft remain available."
      : "Workflow execution completed successfully. All rules evaluated.",
  };
}

export function resetExecutionState(): WorkflowExecutionState {
  return createInitialExecutionState();
}
