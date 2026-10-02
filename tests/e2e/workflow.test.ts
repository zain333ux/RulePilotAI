import mockWorkflow from "../../mocks/workflow.json";
import { WorkflowDefinition } from "../../types/contracts";

export function verifyWorkflowStructure() {
  console.log("=== Verifying Workflow Structure ===");
  const workflow = mockWorkflow as WorkflowDefinition;

  if (!Array.isArray(workflow.nodes) || workflow.nodes.length === 0) {
    throw new Error("Workflow verification failed: nodes array is empty or missing");
  }

  if (!Array.isArray(workflow.edges) || workflow.edges.length === 0) {
    throw new Error("Workflow verification failed: edges array is empty or missing");
  }

  // Ensure all node types are valid
  const validTypes = new Set(["start", "condition", "action", "approval", "end"]);
  for (const node of workflow.nodes) {
    if (!validTypes.has(node.type)) {
      throw new Error(`Invalid node type: ${node.type} on node ${node.id}`);
    }
  }

  console.log(`✅ Workflow structure verified: ${workflow.nodes.length} nodes, ${workflow.edges.length} edges.`);
  return true;
}

if (typeof require !== "undefined" && require.main === module) {
  verifyWorkflowStructure();
}
