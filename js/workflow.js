/* Salim-KNIME - Workflow Execution */

class WorkflowExecutor {
    constructor(canvas) {
        this.canvas = canvas;
        this.isExecuting = false;
    }

    async executeAll() {
        if (this.isExecuting) return;
        this.isExecuting = true;

        const nodes = Array.from(this.canvas.nodes.values());
        const connections = this.canvas.connections;

        // Build execution order (topological sort)
        const order = this.getExecutionOrder(nodes, connections);
        const results = new Map();

        for (const nodeId of order) {
            const node = this.canvas.nodes.get(nodeId);
            if (!node) continue;

            try {
                this.canvas.updateNodeStatus(nodeId, 'executing');

                // Get inputs from connected nodes
                const inputs = {};
                connections.filter(c => c.targetId === nodeId).forEach(c => {
                    const sourceNode = this.canvas.nodes.get(c.sourceId);
                    if (sourceNode && results.has(c.sourceId)) {
                        inputs.data = results.get(c.sourceId);
                    }
                });

                // Execute node
                const nodeDef = getNodeDef(node.type);
                if (nodeDef && nodeDef.execute) {
                    const result = await nodeDef.execute(inputs, node.config);
                    results.set(nodeId, result);
                    node.result = result;
                    this.canvas.updateNodeStatus(nodeId, 'executed');
                }
            } catch (error) {
                console.error(`Error executing ${nodeId}:`, error);
                node.result = { error: error.message || error };
                this.canvas.updateNodeStatus(nodeId, 'error', error.message);
            }
        }

        this.isExecuting = false;
    }

    async executeNode(nodeId) {
        const node = this.canvas.nodes.get(nodeId);
        if (!node) return;

        try {
            this.canvas.updateNodeStatus(nodeId, 'executing');

            // Get inputs
            const inputs = {};
            this.canvas.connections.filter(c => c.targetId === nodeId).forEach(c => {
                const sourceNode = this.canvas.nodes.get(c.sourceId);
                if (sourceNode && sourceNode.result) {
                    inputs.data = sourceNode.result;
                }
            });

            const nodeDef = getNodeDef(node.type);
            if (nodeDef && nodeDef.execute) {
                const result = await nodeDef.execute(inputs, node.config);
                node.result = result;
                this.canvas.updateNodeStatus(nodeId, 'executed');
                return result;
            }
        } catch (error) {
            node.result = { error: error.message || error };
            this.canvas.updateNodeStatus(nodeId, 'error', error.message);
            throw error;
        }
    }

    getExecutionOrder(nodes, connections) {
        const graph = new Map();
        const inDegree = new Map();

        nodes.forEach(n => {
            graph.set(n.id, []);
            inDegree.set(n.id, 0);
        });

        connections.forEach(c => {
            graph.get(c.sourceId)?.push(c.targetId);
            inDegree.set(c.targetId, (inDegree.get(c.targetId) || 0) + 1);
        });

        const queue = [];
        inDegree.forEach((deg, id) => { if (deg === 0) queue.push(id); });

        const order = [];
        while (queue.length) {
            const id = queue.shift();
            order.push(id);
            graph.get(id)?.forEach(neighbor => {
                inDegree.set(neighbor, inDegree.get(neighbor) - 1);
                if (inDegree.get(neighbor) === 0) queue.push(neighbor);
            });
        }

        return order;
    }

    stopExecution() {
        this.isExecuting = false;
    }
}

// Save/Load Workflow
function saveWorkflow() {
    if (!canvas) return;
    const data = canvas.getWorkflowData();
    // Remove file objects before saving
    data.nodes.forEach(n => {
        if (n.config && n.config.file) n.config.file = null;
    });
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'salim-knime-workflow.json';
    a.click();
    URL.revokeObjectURL(url);
}

function loadWorkflow() {
    const input = document.getElementById('workflowFileInput');
    if (input) input.click();
}

function handleWorkflowLoad(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            canvas.loadWorkflow(data);
        } catch (err) {
            console.error('Failed to load workflow:', err);
        }
    };
    reader.readAsText(file);
}

function newWorkflow() {
    if (canvas) canvas.clear();
}

let executor;
