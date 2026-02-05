/* Salim-KNIME - Canvas Management */

class WorkflowCanvas {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.nodesLayer = document.getElementById('nodesLayer');
        this.connectionsLayer = document.getElementById('connectionsLayer');
        this.nodes = new Map();
        this.connections = [];
        this.selectedNode = null;
        this.nodeIdCounter = 0;
        this.scale = 1;
        this.offset = { x: 0, y: 0 };
        this.isDragging = false;
        this.dragNode = null;
        this.dragOffset = { x: 0, y: 0 };
        this.connectingPort = null;
        this.tempConnection = null;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupDragDrop();
    }

    setupEventListeners() {
        // Canvas click to deselect
        this.container.addEventListener('click', (e) => {
            if (e.target === this.container || e.target.classList.contains('nodes-layer')) {
                this.deselectAll();
            }
        });

        // Zoom controls
        document.getElementById('zoomInBtn')?.addEventListener('click', () => this.zoom(0.1));
        document.getElementById('zoomOutBtn')?.addEventListener('click', () => this.zoom(-0.1));
        document.getElementById('fitViewBtn')?.addEventListener('click', () => this.fitView());

        // Delete selected
        document.getElementById('deleteSelectedBtn')?.addEventListener('click', () => this.deleteSelected());
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' && this.selectedNode) this.deleteSelected();
        });

        // Mouse move for connections and dragging
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    }

    setupDragDrop() {
        const nodeItems = document.querySelectorAll('.node-item');
        nodeItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('nodeType', item.dataset.nodeType);
                e.dataTransfer.effectAllowed = 'copy';
            });
        });

        this.container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });

        this.container.addEventListener('drop', (e) => {
            e.preventDefault();
            const nodeType = e.dataTransfer.getData('nodeType');
            if (nodeType) {
                const rect = this.container.getBoundingClientRect();
                const x = (e.clientX - rect.left) / this.scale - this.offset.x;
                const y = (e.clientY - rect.top) / this.scale - this.offset.y;
                this.addNode(nodeType, x, y);
                document.getElementById('canvasWelcome')?.classList.add('hidden');
            }
        });
    }

    addNode(type, x, y) {
        const nodeDef = getNodeDef(type);
        if (!nodeDef) return null;

        const id = `node_${++this.nodeIdCounter}`;
        const node = {
            id, type,
            x: Math.max(20, x - 70),
            y: Math.max(20, y - 30),
            config: { ...nodeDef.config },
            status: 'idle',
            result: null
        };

        this.nodes.set(id, node);
        this.renderNode(node);
        this.selectNode(id);
        return node;
    }

    renderNode(node) {
        const nodeDef = getNodeDef(node.type);
        const el = document.createElement('div');
        el.className = 'workflow-node animate-slideIn';
        el.id = node.id;
        el.style.left = `${node.x}px`;
        el.style.top = `${node.y}px`;

        const hasInput = nodeDef.inputs.length > 0;
        const hasOutput = nodeDef.outputs.length > 0;

        el.innerHTML = `
            <div class="node-header">
                <div class="node-icon" style="background: ${nodeDef.color}">
                    <i class="fas ${nodeDef.icon}"></i>
                </div>
                <span class="node-title">${t(nodeDef.name)}</span>
            </div>
            <div class="node-status" data-i18n="notExecuted">${t('notExecuted')}</div>
            <div class="node-ports">
                ${hasInput ? '<div class="node-port input" data-port="input"></div>' : ''}
                ${hasOutput ? '<div class="node-port output" data-port="output"></div>' : ''}
            </div>
        `;

        // Node dragging
        el.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('node-port')) return;
            this.isDragging = true;
            this.dragNode = node;
            const rect = el.getBoundingClientRect();
            this.dragOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            el.style.zIndex = 100;
        });

        // Node selection
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectNode(node.id);
        });

        // Double click for config/result
        el.addEventListener('dblclick', () => {
            if (node.result) showResult(node.result);
            else openNodeConfig(node);
        });

        // Port connections
        el.querySelectorAll('.node-port').forEach(port => {
            port.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                this.startConnection(node.id, port.dataset.port, e);
            });
            port.addEventListener('mouseup', (e) => {
                e.stopPropagation();
                this.endConnection(node.id, port.dataset.port);
            });
        });

        this.nodesLayer.appendChild(el);
    }

    handleMouseMove(e) {
        if (this.isDragging && this.dragNode) {
            const rect = this.container.getBoundingClientRect();
            const x = (e.clientX - rect.left - this.dragOffset.x) / this.scale;
            const y = (e.clientY - rect.top - this.dragOffset.y) / this.scale;
            this.dragNode.x = Math.max(0, x);
            this.dragNode.y = Math.max(0, y);
            const el = document.getElementById(this.dragNode.id);
            if (el) {
                el.style.left = `${this.dragNode.x}px`;
                el.style.top = `${this.dragNode.y}px`;
            }
            this.updateConnections();
        }

        if (this.connectingPort) {
            const rect = this.container.getBoundingClientRect();
            const x = (e.clientX - rect.left) / this.scale;
            const y = (e.clientY - rect.top) / this.scale;
            this.drawTempConnection(x, y);
        }
    }

    handleMouseUp(e) {
        if (this.isDragging) {
            this.isDragging = false;
            if (this.dragNode) {
                const el = document.getElementById(this.dragNode.id);
                if (el) el.style.zIndex = '';
            }
            this.dragNode = null;
        }

        if (this.connectingPort) {
            this.cancelConnection();
        }
    }

    selectNode(id) {
        this.deselectAll();
        const node = this.nodes.get(id);
        if (node) {
            this.selectedNode = node;
            document.getElementById(id)?.classList.add('selected');
            showNodeProperties(node);
        }
    }

    deselectAll() {
        this.selectedNode = null;
        document.querySelectorAll('.workflow-node.selected').forEach(el => el.classList.remove('selected'));
        hideNodeProperties();
    }

    deleteSelected() {
        if (!this.selectedNode) return;
        const id = this.selectedNode.id;

        // Remove connections
        this.connections = this.connections.filter(c => c.sourceId !== id && c.targetId !== id);
        this.updateConnections();

        // Remove node
        document.getElementById(id)?.remove();
        this.nodes.delete(id);
        this.selectedNode = null;
        hideNodeProperties();

        if (this.nodes.size === 0) {
            document.getElementById('canvasWelcome')?.classList.remove('hidden');
        }
    }

    startConnection(nodeId, portType, e) {
        const node = this.nodes.get(nodeId);
        if (!node) return;

        this.connectingPort = { nodeId, portType };
        const portEl = document.querySelector(`#${nodeId} .node-port.${portType}`);
        const rect = portEl.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        this.connectionStart = {
            x: (rect.left + rect.width / 2 - containerRect.left) / this.scale,
            y: (rect.top + rect.height / 2 - containerRect.top) / this.scale
        };
    }

    drawTempConnection(x, y) {
        if (!this.connectionStart) return;

        if (!this.tempConnection) {
            this.tempConnection = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            this.tempConnection.classList.add('connection-line', 'temp');
            this.connectionsLayer.appendChild(this.tempConnection);
        }

        const path = this.createConnectionPath(this.connectionStart.x, this.connectionStart.y, x, y);
        this.tempConnection.setAttribute('d', path);
    }

    endConnection(targetId, targetPort) {
        if (!this.connectingPort) return;
        if (this.connectingPort.nodeId === targetId) return;
        if (this.connectingPort.portType === targetPort) return;

        const sourceId = this.connectingPort.portType === 'output' ? this.connectingPort.nodeId : targetId;
        const destId = this.connectingPort.portType === 'output' ? targetId : this.connectingPort.nodeId;

        // Check if connection exists
        const exists = this.connections.some(c => c.sourceId === sourceId && c.targetId === destId);
        if (!exists) {
            this.connections.push({ sourceId, targetId: destId });
            this.updateConnections();

            // Mark ports as connected
            document.querySelector(`#${sourceId} .node-port.output`)?.classList.add('connected');
            document.querySelector(`#${destId} .node-port.input`)?.classList.add('connected');
        }

        this.cancelConnection();
    }

    cancelConnection() {
        if (this.tempConnection) {
            this.tempConnection.remove();
            this.tempConnection = null;
        }
        this.connectingPort = null;
        this.connectionStart = null;
    }

    updateConnections() {
        // Clear existing
        this.connectionsLayer.innerHTML = '';

        this.connections.forEach(conn => {
            const sourceEl = document.querySelector(`#${conn.sourceId} .node-port.output`);
            const targetEl = document.querySelector(`#${conn.targetId} .node-port.input`);
            if (!sourceEl || !targetEl) return;

            const containerRect = this.container.getBoundingClientRect();
            const sourceRect = sourceEl.getBoundingClientRect();
            const targetRect = targetEl.getBoundingClientRect();

            const x1 = (sourceRect.left + sourceRect.width / 2 - containerRect.left) / this.scale;
            const y1 = (sourceRect.top + sourceRect.height / 2 - containerRect.top) / this.scale;
            const x2 = (targetRect.left + targetRect.width / 2 - containerRect.left) / this.scale;
            const y2 = (targetRect.top + targetRect.height / 2 - containerRect.top) / this.scale;

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.classList.add('connection-line');
            path.setAttribute('d', this.createConnectionPath(x1, y1, x2, y2));
            this.connectionsLayer.appendChild(path);
        });
    }

    createConnectionPath(x1, y1, x2, y2) {
        const dx = Math.abs(x2 - x1) * 0.5;
        const isRTL = document.dir === 'rtl';
        const cp1x = isRTL ? x1 + dx : x1 - dx;
        const cp2x = isRTL ? x2 - dx : x2 + dx;
        return `M ${x1} ${y1} C ${cp1x} ${y1}, ${cp2x} ${y2}, ${x2} ${y2}`;
    }

    zoom(delta) {
        this.scale = Math.max(0.25, Math.min(2, this.scale + delta));
        this.nodesLayer.style.transform = `scale(${this.scale})`;
        document.getElementById('zoomLevel').textContent = `${Math.round(this.scale * 100)}%`;
        this.updateConnections();
    }

    fitView() {
        this.scale = 1;
        this.offset = { x: 0, y: 0 };
        this.nodesLayer.style.transform = 'scale(1)';
        document.getElementById('zoomLevel').textContent = '100%';
        this.updateConnections();
    }

    getWorkflowData() {
        return {
            nodes: Array.from(this.nodes.values()),
            connections: this.connections
        };
    }

    loadWorkflow(data) {
        this.clear();
        data.nodes.forEach(node => {
            this.nodes.set(node.id, node);
            this.renderNode(node);
            this.nodeIdCounter = Math.max(this.nodeIdCounter, parseInt(node.id.split('_')[1]) || 0);
        });
        this.connections = data.connections || [];
        this.updateConnections();
        if (this.nodes.size > 0) {
            document.getElementById('canvasWelcome')?.classList.add('hidden');
        }
    }

    clear() {
        this.nodesLayer.innerHTML = '';
        this.connectionsLayer.innerHTML = '';
        this.nodes.clear();
        this.connections = [];
        this.selectedNode = null;
        this.nodeIdCounter = 0;
        document.getElementById('canvasWelcome')?.classList.remove('hidden');
    }

    updateNodeStatus(nodeId, status, message = '') {
        const el = document.getElementById(nodeId);
        if (!el) return;
        el.classList.remove('executing', 'executed', 'error');
        if (status !== 'idle') el.classList.add(status);
        const statusEl = el.querySelector('.node-status');
        if (statusEl) {
            statusEl.textContent = message || t(status === 'executing' ? 'executing' : status === 'executed' ? 'executed' : status === 'error' ? 'error' : 'notExecuted');
        }
    }
}

let canvas;
