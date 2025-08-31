export function buildWorkflow(baseWorkflow: any, workflowOverrides: Record<string, { inputs?: Record<string, any> }> = {}): any {
  // Deep clone the base workflow to avoid mutations
  const workflow = structuredClone(baseWorkflow);

  // Apply overrides to workflow nodes
  Object.entries(workflowOverrides).forEach(([nodeId, nodeConfig]) => {
    // Check if the node exists in the workflow (either direct or in prompt section)
    const nodeExists = workflow[nodeId] || (workflow.prompt && workflow.prompt[nodeId]);

    if (nodeExists) {
      if (nodeConfig.inputs) {
        // Handle workflow with prompt section (like ComfyUI format)
        if (workflow.prompt && workflow.prompt[nodeId]) {
          workflow.prompt[nodeId].inputs = {
            ...workflow.prompt[nodeId].inputs,
            ...nodeConfig.inputs
          };
        }
        // Handle direct workflow format
        else if (workflow[nodeId]) {
          workflow[nodeId].inputs = {
            ...workflow[nodeId].inputs,
            ...nodeConfig.inputs
          };
        }
      }
    } else {
      console.warn(`Node ${nodeId} does not exist in the workflow, skipping override`);
    }
  });

  return workflow;
}