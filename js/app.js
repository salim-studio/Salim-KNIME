/* Salim-KNIME - Main Application */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize language
    initLanguage();

    // Initialize canvas
    canvas = new WorkflowCanvas('workflowCanvas');
    executor = new WorkflowExecutor(canvas);

    // Setup toolbar buttons
    document.getElementById('newWorkflowBtn')?.addEventListener('click', newWorkflow);
    document.getElementById('openWorkflowBtn')?.addEventListener('click', loadWorkflow);
    document.getElementById('saveWorkflowBtn')?.addEventListener('click', saveWorkflow);
    document.getElementById('executeAllBtn')?.addEventListener('click', () => executor.executeAll());
    document.getElementById('executeSelectedBtn')?.addEventListener('click', () => {
        if (canvas.selectedNode) executor.executeNode(canvas.selectedNode.id);
    });
    document.getElementById('stopExecutionBtn')?.addEventListener('click', () => executor.stopExecution());

    // Theme toggle
    document.getElementById('themeToggleBtn')?.addEventListener('click', toggleTheme);
    initTheme();

    // Language toggle
    document.getElementById('langToggleBtn')?.addEventListener('click', switchLanguage);

    // File inputs
    document.getElementById('fileInput')?.addEventListener('change', (e) => {
        if (e.target.files[0] && currentConfigNode) {
            currentConfigNode.config.file = e.target.files[0];
            updateFileDisplay(e.target.files[0].name);
        }
    });
    document.getElementById('workflowFileInput')?.addEventListener('change', (e) => {
        if (e.target.files[0]) handleWorkflowLoad(e.target.files[0]);
    });

    // Category toggles
    document.querySelectorAll('.category-header').forEach(header => {
        header.addEventListener('click', () => header.classList.toggle('collapsed'));
    });

    // Node search
    document.getElementById('nodeSearch')?.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        document.querySelectorAll('.node-item').forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(query) ? '' : 'none';
        });
    });

    // Properties panel close
    document.getElementById('closePanelBtn')?.addEventListener('click', hideNodeProperties);

    // Result modal
    document.getElementById('closeResultModal')?.addEventListener('click', hideResult);
    document.querySelector('.modal-overlay')?.addEventListener('click', hideResult);
    document.getElementById('exportResultBtn')?.addEventListener('click', exportResult);
});

// Theme
function initTheme() {
    const stored = localStorage.getItem('salim-knime-theme');
    if (stored === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        updateThemeIcon(true);
    }
}

function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
    localStorage.setItem('salim-knime-theme', isDark ? 'light' : 'dark');
    updateThemeIcon(!isDark);
}

function updateThemeIcon(isDark) {
    const icon = document.querySelector('#themeToggleBtn i');
    if (icon) icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
}

// Properties Panel
let currentConfigNode = null;

function showNodeProperties(node) {
    const panel = document.getElementById('propertiesPanel');
    const content = document.getElementById('propertiesContent');
    if (!panel || !content) return;

    panel.classList.add('open');
    currentConfigNode = node;
    const nodeDef = getNodeDef(node.type);

    let html = `<div class="property-group">
        <div class="property-group-title">${t('nodeSettings')}</div>
        <div class="property-item">
            <label>${t('nodeName')}</label>
            <input type="text" value="${t(nodeDef.name)}" readonly>
        </div>`;

    // Node-specific config UI
    if (node.type === 'excelReader' || node.type === 'csvReader') {
        html += `<div class="property-item">
            <label>${t('selectFile')}</label>
            <button class="btn btn-secondary btn-block" onclick="document.getElementById('fileInput').click()">
                <i class="fas fa-upload"></i> ${node.config.file?.name || t('noFileSelected')}
            </button>
        </div>`;
    }

    if (node.type === 'columnFilter' || node.type === 'descriptiveStats' || node.type === 'correlation') {
        const cols = getAvailableColumns(node);
        html += `<div class="property-item">
            <label>${t('selectColumns')}</label>
            <select multiple id="configColumns" onchange="updateNodeConfig('selectedColumns', getSelectedOptions('configColumns'))">
                ${cols.map(c => `<option value="${c}" ${node.config.selectedColumns?.includes(c) ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>`;
    }

    if (node.type === 'rowFilter') {
        const cols = getAvailableColumns(node);
        html += `<div class="property-item">
            <label>Column</label>
            <select id="configColumn" onchange="updateNodeConfig('column', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.column === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>
        <div class="property-item">
            <label>Operator</label>
            <select id="configOperator" onchange="updateNodeConfig('operator', this.value)">
                ${['>', '<', '>=', '<=', '==', '!='].map(op => `<option value="${op}" ${node.config.operator === op ? 'selected' : ''}>${op}</option>`).join('')}
            </select>
        </div>
        <div class="property-item">
            <label>Value</label>
            <input type="number" value="${node.config.value || 0}" onchange="updateNodeConfig('value', parseFloat(this.value))">
        </div>`;
    }

    if (node.type === 'sorter') {
        const cols = getAvailableColumns(node);
        html += `<div class="property-item">
            <label>Column</label>
            <select onchange="updateNodeConfig('column', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.column === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>
        <div class="property-item">
            <label><input type="checkbox" ${node.config.ascending ? 'checked' : ''} onchange="updateNodeConfig('ascending', this.checked)"> Ascending</label>
        </div>`;
    }

    if (node.type === 'linearRegression') {
        const cols = getAvailableColumns(node);
        html += `<div class="property-item">
            <label>${t('dependentVar')}</label>
            <select onchange="updateNodeConfig('dependent', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.dependent === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>
        <div class="property-item">
            <label>${t('independentVars')}</label>
            <select multiple id="configIndeps" onchange="updateNodeConfig('independents', getSelectedOptions('configIndeps'))">
                ${cols.map(c => `<option value="${c}" ${node.config.independents?.includes(c) ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>`;
    }

    if (node.type === 'tTest') {
        const cols = getAvailableColumns(node);
        html += `<div class="property-item">
            <label>Column 1</label>
            <select onchange="updateNodeConfig('column1', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.column1 === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>
        <div class="property-item">
            <label>Column 2</label>
            <select onchange="updateNodeConfig('column2', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.column2 === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>`;
    }

    if (node.type === 'multipleRegression') {
        const cols = getAvailableColumns(node);
        const methods = ['OLS', 'GLS', '2SLS', 'GMM', 'LIML'];
        const transforms = ['none', 'log', 'log10', 'sqrt', 'square', 'inverse', 'exp', 'cube', 'cbrt'];
        const diffs = [0, 1, 2];

        html += `<div class="property-item">
            <label>${t('estimationMethod')}</label>
            <select onchange="updateNodeConfig('method', this.value)">
                ${methods.map(m => `<option value="${m}" ${node.config.method === m ? 'selected' : ''}>${t('method' + m)}</option>`).join('')}
            </select>
        </div>
        
        <div class="property-group-title" style="margin-top:12px">${t('dependentVar')}</div>
        <div class="property-item">
            <label>${t('dependentVar')}</label>
            <select onchange="updateNodeConfig('dependent', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.dependent === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>
        <div class="property-item" style="display:flex;gap:8px">
            <div style="flex:1">
                <label>${t('transformation')}</label>
                <select onchange="updateNodeConfig('dependentTransform', this.value)" style="width:100%">
                    ${transforms.map(tr => `<option value="${tr}" ${node.config.dependentTransform === tr ? 'selected' : ''}>${t('transform' + tr.charAt(0).toUpperCase() + tr.slice(1))}</option>`).join('')}
                </select>
            </div>
            <div style="flex:1">
                <label>${t('differencing')}</label>
                <select onchange="updateNodeConfig('dependentDiff', parseInt(this.value))" style="width:100%">
                    ${diffs.map(d => `<option value="${d}" ${node.config.dependentDiff === d ? 'selected' : ''}>${t('diff' + d)}</option>`).join('')}
                </select>
            </div>
        </div>
        
        <div class="property-group-title" style="margin-top:12px">${t('independentVars')}</div>
        <div class="property-item">
            <label>${t('independentVars')}</label>
            <select multiple id="configIndeps2" onchange="updateNodeConfig('independents', getSelectedOptions('configIndeps2'))">
                ${cols.map(c => `<option value="${c}" ${node.config.independents?.includes(c) ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>`;

        // Per-variable transformations
        if (node.config.independents?.length) {
            html += `<div class="property-item"><label>تحويلات المتغيرات المستقلة:</label></div>`;
            node.config.independents.forEach(col => {
                html += `<div class="property-item" style="display:flex;gap:8px;align-items:center">
                    <span style="min-width:60px;font-size:12px">${col}</span>
                    <select onchange="updateTransform('${col}', this.value)" style="flex:1">
                        ${transforms.map(tr => `<option value="${tr}" ${node.config.independentTransforms?.[col] === tr ? 'selected' : ''}>${t('transform' + tr.charAt(0).toUpperCase() + tr.slice(1))}</option>`).join('')}
                    </select>
                    <select onchange="updateDiff('${col}', parseInt(this.value))" style="flex:1">
                        ${diffs.map(d => `<option value="${d}" ${node.config.independentDiffs?.[col] === d ? 'selected' : ''}>${t('diff' + d)}</option>`).join('')}
                    </select>
                </div>`;
            });
        }

        html += `<div class="property-group-title" style="margin-top:12px">${t('arOrder')} / ${t('maOrder')}</div>
        <div class="property-item" style="display:flex;gap:8px">
            <div style="flex:1">
                <label>${t('arOrder')}</label>
                <input type="number" min="0" max="5" value="${node.config.arOrder || 0}" onchange="updateNodeConfig('arOrder', parseInt(this.value))" style="width:100%">
            </div>
            <div style="flex:1">
                <label>${t('maOrder')}</label>
                <input type="number" min="0" max="5" value="${node.config.maOrder || 0}" onchange="updateNodeConfig('maOrder', parseInt(this.value))" style="width:100%">
            </div>
        </div>
        
        <div class="property-item">
            <label>${t('instruments')} (2SLS/GMM/LIML)</label>
            <select multiple id="configInstruments" onchange="updateNodeConfig('instruments', getSelectedOptions('configInstruments'))">
                ${cols.map(c => `<option value="${c}" ${node.config.instruments?.includes(c) ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>`;
    }

    if (node.type === 'ardl') {
        const cols = getAvailableColumns(node);
        const transforms = ['none', 'log', 'log10', 'sqrt', 'square', 'inverse', 'exp', 'cube', 'cbrt'];
        const diffs = [0, 1, 2];
        const lags = [1, 2, 3, 4, 5];

        // Dependent Variable Section
        html += `<div class="property-group-title" style="margin-top:12px">${t('dependentVar')}</div>
        <div class="property-item">
            <label>${t('dependentVar')}</label>
            <select onchange="updateNodeConfig('dependent', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.dependent === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>
        <div class="property-item" style="display:flex;gap:8px">
            <div style="flex:1">
                <label>${t('transformation')}</label>
                <select onchange="updateNodeConfig('dependentTransform', this.value)" style="width:100%">
                    ${transforms.map(tr => `<option value="${tr}" ${node.config.dependentTransform === tr ? 'selected' : ''}>${t('transform' + tr.charAt(0).toUpperCase() + tr.slice(1))}</option>`).join('')}
                </select>
            </div>
            <div style="flex:1">
                <label>${t('differencing')}</label>
                <select onchange="updateNodeConfig('dependentDiff', parseInt(this.value))" style="width:100%">
                    ${diffs.map(d => `<option value="${d}" ${node.config.dependentDiff === d ? 'selected' : ''}>${t('diff' + d)}</option>`).join('')}
                </select>
            </div>
        </div>
        <div class="property-item">
            <label>${t('yLag')} (p)</label>
            <select onchange="updateNodeConfig('pLag', parseInt(this.value))">
                ${lags.map(l => `<option value="${l}" ${node.config.pLag === l ? 'selected' : ''}>${l}</option>`).join('')}
            </select>
        </div>
        
        <div class="property-group-title" style="margin-top:12px">${t('independentVars')}</div>
        <div class="property-item">
            <label>${t('independentVars')}</label>
            <select multiple id="configARDLIndeps" onchange="updateNodeConfig('independents', getSelectedOptions('configARDLIndeps'))">
                ${cols.map(c => `<option value="${c}" ${node.config.independents?.includes(c) ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>`;

        // Per-variable settings for independent variables
        if (node.config.independents?.length) {
            html += `<div class="property-item"><label style="font-weight:600">${t('transformation')} + ${t('differencing')} + ${t('xLag')}:</label></div>`;
            node.config.independents.forEach(col => {
                html += `<div class="property-item" style="display:flex;gap:4px;align-items:center;flex-wrap:wrap">
                    <span style="min-width:50px;font-size:11px;font-weight:500">${col}</span>
                    <select onchange="updateTransform('${col}', this.value)" style="flex:1;min-width:60px;font-size:11px">
                        ${transforms.map(tr => `<option value="${tr}" ${node.config.independentTransforms?.[col] === tr ? 'selected' : ''}>${t('transform' + tr.charAt(0).toUpperCase() + tr.slice(1))}</option>`).join('')}
                    </select>
                    <select onchange="updateDiff('${col}', parseInt(this.value))" style="flex:1;min-width:50px;font-size:11px">
                        ${diffs.map(d => `<option value="${d}" ${node.config.independentDiffs?.[col] === d ? 'selected' : ''}>${t('diff' + d)}</option>`).join('')}
                    </select>
                    <select onchange="updateQLag('${col}', parseInt(this.value))" style="flex:1;min-width:40px;font-size:11px">
                        ${lags.map(l => `<option value="${l}" ${node.config.qLags?.[col] === l ? 'selected' : ''}>${l}</option>`).join('')}
                    </select>
                </div>`;
            });
        }

        // Model Options
        html += `<div class="property-group-title" style="margin-top:12px">${t('nodeSettings')}</div>
        <div class="property-item" style="display:flex;gap:16px">
            <label><input type="checkbox" ${node.config.includeConstant !== false ? 'checked' : ''} onchange="updateNodeConfig('includeConstant', this.checked)"> ${t('includeConstant')}</label>
            <label><input type="checkbox" ${node.config.includeTrend ? 'checked' : ''} onchange="updateNodeConfig('includeTrend', this.checked)"> ${t('includeTrend')}</label>
        </div>
        <div class="property-item">
            <label>${t('criterion')}</label>
            <select onchange="updateNodeConfig('criterion', this.value)">
                ${['AIC', 'BIC', 'HQ'].map(c => `<option value="${c}" ${node.config.criterion === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>`;
    }

    if (node.type === 'varVecm') {
        const cols = getAvailableColumns(node);
        const transforms = ['none', 'log', 'log10', 'sqrt', 'square', 'inverse', 'exp', 'cube', 'cbrt'];
        const diffs = [0, 1, 2];
        const lags = [1, 2, 3, 4, 5, 6, 7, 8];

        // Endogenous Variables Section
        html += `<div class="property-group-title" style="margin-top:12px">${t('endogenousVars')}</div>
        <div class="property-item">
            <label>${t('endogenousVars')} (${t('min')}: 2)</label>
            <select multiple id="configVAREndog" onchange="updateNodeConfig('endogenous', getSelectedOptions('configVAREndog'))" style="min-height:100px">
                ${cols.map(c => `<option value="${c}" ${node.config.endogenous?.includes(c) ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>`;

        // Per-variable settings for endogenous variables
        if (node.config.endogenous?.length) {
            html += `<div class="property-item"><label style="font-weight:600">${t('transformation')} + ${t('differencing')}:</label></div>`;
            node.config.endogenous.forEach(col => {
                html += `<div class="property-item" style="display:flex;gap:4px;align-items:center;flex-wrap:wrap">
                    <span style="min-width:60px;font-size:11px;font-weight:500">${col}</span>
                    <select onchange="updateVARTransform('${col}', this.value)" style="flex:1;min-width:70px;font-size:11px">
                        ${transforms.map(tr => `<option value="${tr}" ${node.config.transforms?.[col] === tr ? 'selected' : ''}>${t('transform' + tr.charAt(0).toUpperCase() + tr.slice(1))}</option>`).join('')}
                    </select>
                    <select onchange="updateVARDiff('${col}', parseInt(this.value))" style="flex:1;min-width:50px;font-size:11px">
                        ${diffs.map(d => `<option value="${d}" ${node.config.diffs?.[col] === d ? 'selected' : ''}>${t('diff' + d)}</option>`).join('')}
                    </select>
                </div>`;
            });
        }

        // Model Options
        html += `<div class="property-group-title" style="margin-top:12px">${t('lagOrder')}</div>
        <div class="property-item">
            <label>${t('lagOrder')} (p)</label>
            <select onchange="updateNodeConfig('p', parseInt(this.value))">
                ${lags.map(l => `<option value="${l}" ${node.config.p === l ? 'selected' : ''}>${l}</option>`).join('')}
            </select>
        </div>
        
        <div class="property-group-title" style="margin-top:12px">${t('nodeSettings')}</div>
        <div class="property-item" style="display:flex;gap:8px;flex-wrap:wrap">
            <label><input type="checkbox" ${node.config.includeConstant !== false ? 'checked' : ''} onchange="updateNodeConfig('includeConstant', this.checked)"> ${t('includeConstant')}</label>
            <label><input type="checkbox" ${node.config.includeTrend ? 'checked' : ''} onchange="updateNodeConfig('includeTrend', this.checked)"> ${t('includeTrend')}</label>
        </div>
        <div class="property-item" style="display:flex;gap:8px;flex-wrap:wrap">
            <label><input type="checkbox" ${node.config.testCointegration !== false ? 'checked' : ''} onchange="updateNodeConfig('testCointegration', this.checked)"> ${t('johansenTest')}</label>
        </div>
        <div class="property-item">
            <label>VECM ${t('cointegrationRank')}</label>
            <select onchange="updateNodeConfig('vecmRank', parseInt(this.value))">
                ${[1, 2, 3, 4, 5].map(r => `<option value="${r}" ${node.config.vecmRank === r ? 'selected' : ''}>${r}</option>`).join('')}
            </select>
        </div>`;
    }

    if (node.type === 'stationarityTest') {
        const cols = getAvailableColumns(node);
        const transforms = ['none', 'log', 'log10', 'sqrt', 'square', 'inverse', 'exp', 'cube', 'cbrt'];
        const diffs = [0, 1, 2];
        const trends = ['n', 'c', 'ct'];

        html += `<div class="property-group-title" style="margin-top:12px">${t('selectVariable')}</div>
        <div class="property-item">
            <label>${t('selectVariable')}</label>
            <select onchange="updateNodeConfig('variable', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.variable === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>
        
        <div class="property-group-title" style="margin-top:12px">${t('transformation')} + ${t('differencing')}</div>
        <div class="property-item" style="display:flex;gap:8px">
            <div style="flex:1">
                <label>${t('transformation')}</label>
                <select onchange="updateNodeConfig('transformation', this.value)" style="width:100%">
                    ${transforms.map(tr => `<option value="${tr}" ${node.config.transformation === tr ? 'selected' : ''}>${t('transform' + tr.charAt(0).toUpperCase() + tr.slice(1))}</option>`).join('')}
                </select>
            </div>
            <div style="flex:1">
                <label>${t('differencing')}</label>
                <select onchange="updateNodeConfig('differencing', parseInt(this.value))" style="width:100%">
                    ${diffs.map(d => `<option value="${d}" ${node.config.differencing === d ? 'selected' : ''}>${t('diff' + d)}</option>`).join('')}
                </select>
            </div>
        </div>
        
        <div class="property-group-title" style="margin-top:12px">${t('trendOption')}</div>
        <div class="property-item">
            <label>${t('trendOption')}</label>
            <select onchange="updateNodeConfig('trend', this.value)">
                <option value="n" ${node.config.trend === 'n' ? 'selected' : ''}>${t('trendNone')}</option>
                <option value="c" ${node.config.trend === 'c' || !node.config.trend ? 'selected' : ''}>${t('trendConstant')}</option>
                <option value="ct" ${node.config.trend === 'ct' ? 'selected' : ''}>${t('trendConstantTrend')}</option>
            </select>
        </div>
        
        <div class="property-group-title" style="margin-top:12px">${t('arOrder')} / ${t('maOrder')}</div>
        <div class="property-item" style="display:flex;gap:8px">
            <div style="flex:1">
                <label>${t('arOrder')}</label>
                <input type="number" min="0" max="5" value="${node.config.arOrder || 0}" onchange="updateNodeConfig('arOrder', parseInt(this.value))" style="width:100%">
            </div>
            <div style="flex:1">
                <label>${t('maOrder')}</label>
                <input type="number" min="0" max="5" value="${node.config.maOrder || 0}" onchange="updateNodeConfig('maOrder', parseInt(this.value))" style="width:100%">
            </div>
        </div>`;
    }

    if (node.type === 'panelData') {
        const cols = getAvailableColumns(node);
        const transforms = ['none', 'log', 'log10', 'sqrt', 'square', 'inverse', 'exp', 'cube', 'cbrt'];
        const diffs = [0, 1, 2];
        const methods = ['All', 'Pooled', 'FE', 'RE'];

        // Entity and Time Columns
        html += `<div class="property-group-title" style="margin-top:12px">${t('entityColumn')} / ${t('timeColumn')}</div>
        <div class="property-item" style="display:flex;gap:8px">
            <div style="flex:1">
                <label>${t('entityColumn')} *</label>
                <select onchange="updateNodeConfig('entityColumn', this.value)" style="width:100%">
                    <option value="">--</option>
                    ${cols.map(c => `<option value="${c}" ${node.config.entityColumn === c ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
            </div>
            <div style="flex:1">
                <label>${t('timeColumn')}</label>
                <select onchange="updateNodeConfig('timeColumn', this.value)" style="width:100%">
                    <option value="">--</option>
                    ${cols.map(c => `<option value="${c}" ${node.config.timeColumn === c ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
            </div>
        </div>

        <div class="property-group-title" style="margin-top:12px">${t('dependentVar')}</div>
        <div class="property-item">
            <label>${t('dependentVar')}</label>
            <select onchange="updateNodeConfig('dependent', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.dependent === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>
        <div class="property-item" style="display:flex;gap:8px">
            <div style="flex:1">
                <label>${t('transformation')}</label>
                <select onchange="updateNodeConfig('dependentTransform', this.value)" style="width:100%">
                    ${transforms.map(tr => `<option value="${tr}" ${node.config.dependentTransform === tr ? 'selected' : ''}>${t('transform' + tr.charAt(0).toUpperCase() + tr.slice(1))}</option>`).join('')}
                </select>
            </div>
            <div style="flex:1">
                <label>${t('differencing')}</label>
                <select onchange="updateNodeConfig('dependentDiff', parseInt(this.value))" style="width:100%">
                    ${diffs.map(d => `<option value="${d}" ${node.config.dependentDiff === d ? 'selected' : ''}>${t('diff' + d)}</option>`).join('')}
                </select>
            </div>
        </div>

        <div class="property-group-title" style="margin-top:12px">${t('independentVars')}</div>
        <div class="property-item">
            <label>${t('independentVars')}</label>
            <select multiple id="configPanelIndeps" onchange="updateNodeConfig('independents', getSelectedOptions('configPanelIndeps'))">
                ${cols.map(c => `<option value="${c}" ${node.config.independents?.includes(c) ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>`;

        // Per-variable settings
        if (node.config.independents?.length) {
            html += `<div class="property-item"><label style="font-weight:600">${t('transformation')} + ${t('differencing')}:</label></div>`;
            node.config.independents.forEach(col => {
                html += `<div class="property-item" style="display:flex;gap:4px;align-items:center;flex-wrap:wrap">
                    <span style="min-width:60px;font-size:11px;font-weight:500">${col}</span>
                    <select onchange="updateTransform('${col}', this.value)" style="flex:1;min-width:60px;font-size:11px">
                        ${transforms.map(tr => `<option value="${tr}" ${node.config.independentTransforms?.[col] === tr ? 'selected' : ''}>${t('transform' + tr.charAt(0).toUpperCase() + tr.slice(1))}</option>`).join('')}
                    </select>
                    <select onchange="updateDiff('${col}', parseInt(this.value))" style="flex:1;min-width:50px;font-size:11px">
                        ${diffs.map(d => `<option value="${d}" ${node.config.independentDiffs?.[col] === d ? 'selected' : ''}>${t('diff' + d)}</option>`).join('')}
                    </select>
                </div>`;
            });
        }

        // Method and Options
        html += `<div class="property-group-title" style="margin-top:12px">${t('nodeSettings')}</div>
        <div class="property-item">
            <label>${t('estimationMethod')}</label>
            <select onchange="updateNodeConfig('method', this.value)">
                <option value="All" ${node.config.method === 'All' ? 'selected' : ''}>${t('runAllModels')}</option>
                <option value="Pooled" ${node.config.method === 'Pooled' ? 'selected' : ''}>${t('pooledOLS')}</option>
                <option value="FE" ${node.config.method === 'FE' ? 'selected' : ''}>${t('fixedEffects')}</option>
                <option value="RE" ${node.config.method === 'RE' ? 'selected' : ''}>${t('randomEffects')}</option>
            </select>
        </div>
        <div class="property-item">
            <label><input type="checkbox" ${node.config.runHausman !== false ? 'checked' : ''} onchange="updateNodeConfig('runHausman', this.checked)"> ${t('hausmanTest')}</label>
        </div>
        <div class="property-item" style="display:flex;gap:8px">
            <div style="flex:1">
                <label>${t('arOrder')}</label>
                <input type="number" min="0" max="5" value="${node.config.arOrder || 0}" onchange="updateNodeConfig('arOrder', parseInt(this.value))" style="width:100%">
            </div>
            <div style="flex:1">
                <label>${t('maOrder')}</label>
                <input type="number" min="0" max="5" value="${node.config.maOrder || 0}" onchange="updateNodeConfig('maOrder', parseInt(this.value))" style="width:100%">
            </div>
        </div>`;
    }

    if (['scatterPlot', 'lineChart'].includes(node.type)) {
        const cols = getAvailableColumns(node);
        html += `<div class="property-item">
            <label>${t('xAxis')}</label>
            <select onchange="updateNodeConfig('xColumn', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.xColumn === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>
        <div class="property-item">
            <label>${t('yAxis')}</label>
            <select onchange="updateNodeConfig('yColumn', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.yColumn === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>`;
    }

    if (['barChart', 'pieChart'].includes(node.type)) {
        const cols = getAvailableColumns(node);
        html += `<div class="property-item">
            <label>Label Column</label>
            <select onchange="updateNodeConfig('labelColumn', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.labelColumn === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>
        <div class="property-item">
            <label>Value Column</label>
            <select onchange="updateNodeConfig('valueColumn', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.valueColumn === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>`;
    }

    if (node.type === 'histogram') {
        const cols = getAvailableColumns(node);
        html += `<div class="property-item">
            <label>Column</label>
            <select onchange="updateNodeConfig('column', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.column === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>
        <div class="property-item">
            <label>Bins</label>
            <input type="number" value="${node.config.bins || 10}" min="2" max="100" onchange="updateNodeConfig('bins', parseInt(this.value))">
        </div>`;
    }

    // Machine Learning Nodes - Classification
    if (['knnClassifier', 'decisionTree', 'randomForest', 'logisticRegression', 'naiveBayes'].includes(node.type)) {
        const cols = getAvailableColumns(node);
        const selectedFeatures = node.config.features || [];
        html += `<div class="property-item">
            <label>${t('targetColumn')}</label>
            <select onchange="updateNodeConfig('target', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.target === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>
        <div class="property-item">
            <label>${t('featureColumns')}</label>
            <div style="max-height:120px;overflow-y:auto;border:1px solid var(--border-color);border-radius:6px;padding:8px">
                ${cols.filter(c => c !== node.config.target).map(c => `
                    <label style="display:flex;align-items:center;gap:6px;margin:4px 0;cursor:pointer">
                        <input type="checkbox" ${selectedFeatures.includes(c) ? 'checked' : ''} 
                            onchange="toggleFeature('${c}')"> ${c}
                    </label>
                `).join('')}
            </div>
        </div>
        <div class="property-item">
            <label>${t('trainRatio')}</label>
            <input type="range" min="0.5" max="0.9" step="0.1" value="${node.config.trainRatio || 0.8}" 
                onchange="updateNodeConfig('trainRatio', parseFloat(this.value));this.nextElementSibling.textContent=this.value">
            <span>${node.config.trainRatio || 0.8}</span>
        </div>
        <div class="property-item" style="display:flex;gap:12px;align-items:center">
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
                <input type="checkbox" ${node.config.cv ? 'checked' : ''} 
                    onchange="updateNodeConfig('cv', this.checked);showNodeProperties(currentConfigNode)"> ${t('useCrossValidation')}
            </label>
            ${node.config.cv ? `
            <div style="display:flex;align-items:center;gap:6px">
                <label style="font-size:0.85rem">${t('cvFolds')}:</label>
                <input type="number" min="2" max="10" value="${node.config.cvFolds || 5}" 
                    onchange="updateNodeConfig('cvFolds', parseInt(this.value))" style="width:60px">
            </div>
            ` : ''}
        </div>`;

        // KNN specific
        if (node.type === 'knnClassifier') {
            html += `<div class="property-item">
                <label>${t('kNeighbors')}</label>
                <input type="number" min="1" max="50" value="${node.config.k || 5}" onchange="updateNodeConfig('k', parseInt(this.value))">
            </div>`;
        }

        // Decision Tree specific
        if (node.type === 'decisionTree') {
            html += `<div class="property-item" style="display:flex;gap:8px">
                <div style="flex:1">
                    <label>${t('maxDepth')}</label>
                    <input type="number" min="1" max="30" value="${node.config.maxDepth || 10}" onchange="updateNodeConfig('maxDepth', parseInt(this.value))" style="width:100%">
                </div>
                <div style="flex:1">
                    <label>${t('minSamples')}</label>
                    <input type="number" min="1" max="20" value="${node.config.minSamples || 2}" onchange="updateNodeConfig('minSamples', parseInt(this.value))" style="width:100%">
                </div>
            </div>`;
        }

        // Random Forest specific
        if (node.type === 'randomForest') {
            html += `<div class="property-item" style="display:flex;gap:8px">
                <div style="flex:1">
                    <label>${t('nTrees')}</label>
                    <input type="number" min="1" max="100" value="${node.config.nTrees || 10}" onchange="updateNodeConfig('nTrees', parseInt(this.value))" style="width:100%">
                </div>
                <div style="flex:1">
                    <label>${t('maxDepth')}</label>
                    <input type="number" min="1" max="30" value="${node.config.maxDepth || 10}" onchange="updateNodeConfig('maxDepth', parseInt(this.value))" style="width:100%">
                </div>
            </div>`;
        }

        // Logistic Regression specific
        if (node.type === 'logisticRegression') {
            html += `<div class="property-item" style="display:flex;gap:8px">
                <div style="flex:1">
                    <label>${t('learningRate')}</label>
                    <input type="number" min="0.001" max="1" step="0.01" value="${node.config.learningRate || 0.1}" onchange="updateNodeConfig('learningRate', parseFloat(this.value))" style="width:100%">
                </div>
                <div style="flex:1">
                    <label>${t('epochs')}</label>
                    <input type="number" min="10" max="1000" value="${node.config.epochs || 100}" onchange="updateNodeConfig('epochs', parseInt(this.value))" style="width:100%">
                </div>
            </div>`;
        }
    }

    // K-Means Clustering
    if (node.type === 'kMeansClustering') {
        const cols = getAvailableColumns(node);
        const selectedFeatures = node.config.features || [];
        html += `<div class="property-item">
            <label>${t('featureColumns')}</label>
            <div style="max-height:120px;overflow-y:auto;border:1px solid var(--border-color);border-radius:6px;padding:8px">
                ${cols.map(c => `
                    <label style="display:flex;align-items:center;gap:6px;margin:4px 0;cursor:pointer">
                        <input type="checkbox" ${selectedFeatures.includes(c) ? 'checked' : ''} 
                            onchange="toggleFeature('${c}')"> ${c}
                    </label>
                `).join('')}
            </div>
        </div>
        <div class="property-item" style="display:flex;gap:8px">
            <div style="flex:1">
                <label>${t('nClusters')}</label>
                <input type="number" min="2" max="20" value="${node.config.k || 3}" onchange="updateNodeConfig('k', parseInt(this.value))" style="width:100%">
            </div>
            <div style="flex:1">
                <label>${t('maxIterations')}</label>
                <input type="number" min="10" max="500" value="${node.config.maxIterations || 100}" onchange="updateNodeConfig('maxIterations', parseInt(this.value))" style="width:100%">
            </div>
        </div>`;
    }

    // Neural Network
    if (node.type === 'neuralNetwork') {
        const cols = getAvailableColumns(node);
        const selectedFeatures = node.config.features || [];
        html += `<div class="property-item">
            <label>${t('targetColumn')}</label>
            <select onchange="updateNodeConfig('target', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.target === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>
        <div class="property-item">
            <label>${t('featureColumns')}</label>
            <div style="max-height:100px;overflow-y:auto;border:1px solid var(--border-color);border-radius:6px;padding:8px">
                ${cols.filter(c => c !== node.config.target).map(c => `
                    <label style="display:flex;align-items:center;gap:6px;margin:4px 0;cursor:pointer">
                        <input type="checkbox" ${selectedFeatures.includes(c) ? 'checked' : ''} 
                            onchange="toggleFeature('${c}')"> ${c}
                    </label>
                `).join('')}
            </div>
        </div>
        <div class="property-item">
            <label>${t('hiddenLayers')} (comma-separated)</label>
            <input type="text" value="${node.config.hiddenLayers || '16,8'}" placeholder="16,8" onchange="updateNodeConfig('hiddenLayers', this.value)">
        </div>
        <div class="property-item">
            <label>${t('activation')}</label>
            <select onchange="updateNodeConfig('activation', this.value)">
                <option value="relu" ${node.config.activation === 'relu' ? 'selected' : ''}>ReLU</option>
                <option value="sigmoid" ${node.config.activation === 'sigmoid' ? 'selected' : ''}>Sigmoid</option>
                <option value="tanh" ${node.config.activation === 'tanh' ? 'selected' : ''}>Tanh</option>
            </select>
        </div>
        <div class="property-item" style="display:flex;gap:8px">
            <div style="flex:1">
                <label>${t('learningRate')}</label>
                <input type="number" min="0.001" max="0.5" step="0.005" value="${node.config.learningRate || 0.01}" onchange="updateNodeConfig('learningRate', parseFloat(this.value))" style="width:100%">
            </div>
            <div style="flex:1">
                <label>${t('epochs')}</label>
                <input type="number" min="10" max="1000" value="${node.config.epochs || 100}" onchange="updateNodeConfig('epochs', parseInt(this.value))" style="width:100%">
            </div>
        </div>
        <div class="property-item">
            <label>${t('trainRatio')}</label>
            <input type="range" min="0.5" max="0.9" step="0.1" value="${node.config.trainRatio || 0.8}" 
                onchange="updateNodeConfig('trainRatio', parseFloat(this.value));this.nextElementSibling.textContent=this.value">
            <span>${node.config.trainRatio || 0.8}</span>
        </div>`;
    }

    // SVM
    if (node.type === 'svm') {
        const cols = getAvailableColumns(node);
        const selectedFeatures = node.config.features || [];
        html += `<div class="property-item">
            <label>${t('targetColumn')}</label>
            <select onchange="updateNodeConfig('target', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.target === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>
        <div class="property-item">
            <label>${t('featureColumns')}</label>
            <div style="max-height:100px;overflow-y:auto;border:1px solid var(--border-color);border-radius:6px;padding:8px">
                ${cols.filter(c => c !== node.config.target).map(c => `
                    <label style="display:flex;align-items:center;gap:6px;margin:4px 0;cursor:pointer">
                        <input type="checkbox" ${selectedFeatures.includes(c) ? 'checked' : ''} 
                            onchange="toggleFeature('${c}')"> ${c}
                    </label>
                `).join('')}
            </div>
        </div>
        <div class="property-item">
            <label>${t('kernel')}</label>
            <select onchange="updateNodeConfig('kernel', this.value)">
                <option value="linear" ${node.config.kernel === 'linear' ? 'selected' : ''}>Linear</option>
                <option value="rbf" ${node.config.kernel === 'rbf' ? 'selected' : ''}>RBF</option>
                <option value="poly" ${node.config.kernel === 'poly' ? 'selected' : ''}>Polynomial</option>
            </select>
        </div>
        <div class="property-item" style="display:flex;gap:8px">
            <div style="flex:1">
                <label>${t('regularization')} (C)</label>
                <input type="number" min="0.01" max="100" step="0.1" value="${node.config.C || 1.0}" onchange="updateNodeConfig('C', parseFloat(this.value))" style="width:100%">
            </div>
            <div style="flex:1">
                <label>${t('gamma')}</label>
                <input type="number" min="0.001" max="10" step="0.01" value="${node.config.gamma || 0.1}" onchange="updateNodeConfig('gamma', parseFloat(this.value))" style="width:100%">
            </div>
        </div>
        <div class="property-item">
            <label>${t('trainRatio')}</label>
            <input type="range" min="0.5" max="0.9" step="0.1" value="${node.config.trainRatio || 0.8}" 
                onchange="updateNodeConfig('trainRatio', parseFloat(this.value));this.nextElementSibling.textContent=this.value">
            <span>${node.config.trainRatio || 0.8}</span>
        </div>`;
    }

    // Gradient Boosting
    if (node.type === 'gradientBoosting') {
        const cols = getAvailableColumns(node);
        const selectedFeatures = node.config.features || [];
        html += `<div class="property-item">
            <label>${t('targetColumn')}</label>
            <select onchange="updateNodeConfig('target', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.target === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>
        <div class="property-item">
            <label>${t('featureColumns')}</label>
            <div style="max-height:100px;overflow-y:auto;border:1px solid var(--border-color);border-radius:6px;padding:8px">
                ${cols.filter(c => c !== node.config.target).map(c => `
                    <label style="display:flex;align-items:center;gap:6px;margin:4px 0;cursor:pointer">
                        <input type="checkbox" ${selectedFeatures.includes(c) ? 'checked' : ''} 
                            onchange="toggleFeature('${c}')"> ${c}
                    </label>
                `).join('')}
            </div>
        </div>
        <div class="property-item" style="display:flex;gap:8px">
            <div style="flex:1">
                <label>${t('nEstimators')}</label>
                <input type="number" min="10" max="200" value="${node.config.nEstimators || 50}" onchange="updateNodeConfig('nEstimators', parseInt(this.value))" style="width:100%">
            </div>
            <div style="flex:1">
                <label>${t('maxDepth')}</label>
                <input type="number" min="1" max="20" value="${node.config.maxDepth || 3}" onchange="updateNodeConfig('maxDepth', parseInt(this.value))" style="width:100%">
            </div>
        </div>
        <div class="property-item">
            <label>${t('learningRate')}</label>
            <input type="number" min="0.01" max="1" step="0.01" value="${node.config.learningRate || 0.1}" onchange="updateNodeConfig('learningRate', parseFloat(this.value))">
        </div>
        <div class="property-item">
            <label>${t('trainRatio')}</label>
            <input type="range" min="0.5" max="0.9" step="0.1" value="${node.config.trainRatio || 0.8}" 
                onchange="updateNodeConfig('trainRatio', parseFloat(this.value));this.nextElementSibling.textContent=this.value">
            <span>${node.config.trainRatio || 0.8}</span>
        </div>`;
    }

    // AdaBoost
    if (node.type === 'adaBoost') {
        const cols = getAvailableColumns(node);
        const selectedFeatures = node.config.features || [];
        html += `<div class="property-item">
            <label>${t('targetColumn')}</label>
            <select onchange="updateNodeConfig('target', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.target === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>
        <div class="property-item">
            <label>${t('featureColumns')}</label>
            <div style="max-height:100px;overflow-y:auto;border:1px solid var(--border-color);border-radius:6px;padding:8px">
                ${cols.filter(c => c !== node.config.target).map(c => `
                    <label style="display:flex;align-items:center;gap:6px;margin:4px 0;cursor:pointer">
                        <input type="checkbox" ${selectedFeatures.includes(c) ? 'checked' : ''} 
                            onchange="toggleFeature('${c}')"> ${c}
                    </label>
                `).join('')}
            </div>
        </div>
        <div class="property-item" style="display:flex;gap:8px">
            <div style="flex:1">
                <label>${t('nEstimators')}</label>
                <input type="number" min="10" max="200" value="${node.config.nEstimators || 50}" onchange="updateNodeConfig('nEstimators', parseInt(this.value))" style="width:100%">
            </div>
            <div style="flex:1">
                <label>${t('learningRate')}</label>
                <input type="number" min="0.1" max="2" step="0.1" value="${node.config.learningRate || 1.0}" onchange="updateNodeConfig('learningRate', parseFloat(this.value))" style="width:100%">
            </div>
        </div>
        <div class="property-item">
            <label>${t('trainRatio')}</label>
            <input type="range" min="0.5" max="0.9" step="0.1" value="${node.config.trainRatio || 0.8}" 
                onchange="updateNodeConfig('trainRatio', parseFloat(this.value));this.nextElementSibling.textContent=this.value">
            <span>${node.config.trainRatio || 0.8}</span>
        </div>`;
    }

    // PCA
    if (node.type === 'pca') {
        const cols = getAvailableColumns(node);
        const selectedFeatures = node.config.features || [];
        html += `<div class="property-item">
            <label>${t('featureColumns')}</label>
            <div style="max-height:120px;overflow-y:auto;border:1px solid var(--border-color);border-radius:6px;padding:8px">
                ${cols.map(c => `
                    <label style="display:flex;align-items:center;gap:6px;margin:4px 0;cursor:pointer">
                        <input type="checkbox" ${selectedFeatures.includes(c) ? 'checked' : ''} 
                            onchange="toggleFeature('${c}')"> ${c}
                    </label>
                `).join('')}
            </div>
        </div>
        <div class="property-item">
            <label>${t('nComponents')}</label>
            <input type="number" min="1" max="20" value="${node.config.nComponents || 2}" onchange="updateNodeConfig('nComponents', parseInt(this.value))">
        </div>`;
    }

    // Elbow Curve
    if (node.type === 'elbowCurve') {
        const cols = getAvailableColumns(node);
        const selectedFeatures = node.config.features || [];
        html += `<div class="property-item">
            <label>${t('featureColumns')}</label>
            <div style="max-height:120px;overflow-y:auto;border:1px solid var(--border-color);border-radius:6px;padding:8px">
                ${cols.map(c => `
                    <label style="display:flex;align-items:center;gap:6px;margin:4px 0;cursor:pointer">
                        <input type="checkbox" ${selectedFeatures.includes(c) ? 'checked' : ''} 
                            onchange="toggleFeature('${c}')"> ${c}
                    </label>
                `).join('')}
            </div>
        </div>
        <div class="property-item">
            <label>${t('maxK')}</label>
            <input type="number" min="2" max="20" value="${node.config.maxK || 10}" onchange="updateNodeConfig('maxK', parseInt(this.value))">
        </div>`;
    }

    // StandardScaler
    if (node.type === 'standardScaler') {
        const cols = getAvailableColumns(node);
        const selectedFeatures = node.config.features || [];
        html += `<div class="property-item">
            <label>${t('selectFeaturesToScale')}</label>
            <div style="max-height:150px;overflow-y:auto;border:1px solid var(--border-color);border-radius:6px;padding:8px">
                ${cols.map(c => `
                    <label style="display:flex;align-items:center;gap:6px;margin:4px 0;cursor:pointer">
                        <input type="checkbox" ${selectedFeatures.includes(c) ? 'checked' : ''} 
                            onchange="toggleFeature('${c}')"> ${c}
                    </label>
                `).join('')}
            </div>
        </div>
        <div class="property-item">
            <p style="color:var(--text-secondary);font-size:0.85rem;margin:8px 0">
                <i class="fas fa-info-circle"></i> ${t('standardScaler')}: z = (x - μ) / σ
            </p>
        </div>`;
    }

    // MinMaxScaler
    if (node.type === 'minMaxScaler') {
        const cols = getAvailableColumns(node);
        const selectedFeatures = node.config.features || [];
        html += `<div class="property-item">
            <label>${t('selectFeaturesToScale')}</label>
            <div style="max-height:120px;overflow-y:auto;border:1px solid var(--border-color);border-radius:6px;padding:8px">
                ${cols.map(c => `
                    <label style="display:flex;align-items:center;gap:6px;margin:4px 0;cursor:pointer">
                        <input type="checkbox" ${selectedFeatures.includes(c) ? 'checked' : ''} 
                            onchange="toggleFeature('${c}')"> ${c}
                    </label>
                `).join('')}
            </div>
        </div>
        <div class="property-item" style="display:flex;gap:8px">
            <div style="flex:1">
                <label>${t('minValue')}</label>
                <input type="number" step="0.1" value="${node.config.minVal ?? 0}" onchange="updateNodeConfig('minVal', parseFloat(this.value))" style="width:100%">
            </div>
            <div style="flex:1">
                <label>${t('maxValue')}</label>
                <input type="number" step="0.1" value="${node.config.maxVal ?? 1}" onchange="updateNodeConfig('maxVal', parseFloat(this.value))" style="width:100%">
            </div>
        </div>
        <div class="property-item">
            <p style="color:var(--text-secondary);font-size:0.85rem;margin:8px 0">
                <i class="fas fa-info-circle"></i> ${t('minMaxScaler')}: x' = (x - min) / (max - min)
            </p>
        </div>`;
    }

    // Independent Samples T-Test
    if (node.type === 'independentTTest') {
        const cols = getAvailableColumns(node);
        html += `<div class="property-item">
            <label>${t('valueColumn')}</label>
            <select onchange="updateNodeConfig('valueColumn', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.valueColumn === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>
        <div class="property-item">
            <label>${t('groupColumn')}</label>
            <select onchange="updateNodeConfig('groupColumn', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.groupColumn === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>
        <div class="property-item">
            <label><input type="checkbox" ${node.config.equalVariance !== false ? 'checked' : ''} onchange="updateNodeConfig('equalVariance', this.checked)"> ${t('equalVariances')}</label>
        </div>
        <div class="property-item">
            <p style="color:var(--text-secondary);font-size:0.85rem;margin:8px 0">
                <i class="fas fa-info-circle"></i> ${t('independentTTestInfo')}
            </p>
        </div>`;
    }

    // Paired Samples T-Test
    if (node.type === 'pairedTTest') {
        const cols = getAvailableColumns(node);
        html += `<div class="property-item">
            <label>${t('sample1')}</label>
            <select onchange="updateNodeConfig('sample1Column', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.sample1Column === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>
        <div class="property-item">
            <label>${t('sample2')}</label>
            <select onchange="updateNodeConfig('sample2Column', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.sample2Column === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>
        <div class="property-item">
            <p style="color:var(--text-secondary);font-size:0.85rem;margin:8px 0">
                <i class="fas fa-info-circle"></i> ${t('pairedTTestInfo')}
            </p>
        </div>`;
    }

    // Two-Way ANOVA
    if (node.type === 'twoWayAnova') {
        const cols = getAvailableColumns(node);
        html += `<div class="property-item">
            <label>${t('valueColumn')}</label>
            <select onchange="updateNodeConfig('valueColumn', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.valueColumn === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>
        <div class="property-item">
            <label>${t('factor1')} (${t('groupColumn')})</label>
            <select onchange="updateNodeConfig('factor1Column', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.factor1Column === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>
        <div class="property-item">
            <label>${t('factor2')} (${t('groupColumn')})</label>
            <select onchange="updateNodeConfig('factor2Column', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.factor2Column === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>
        <div class="property-item">
            <p style="color:var(--text-secondary);font-size:0.85rem;margin:8px 0">
                <i class="fas fa-info-circle"></i> ${t('twoWayAnovaInfo')}
            </p>
        </div>`;
    }

    // ANCOVA
    if (node.type === 'ancova') {
        const cols = getAvailableColumns(node);
        html += `<div class="property-item">
            <label>${t('valueColumn')} (${t('dependentVar')})</label>
            <select onchange="updateNodeConfig('valueColumn', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.valueColumn === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>
        <div class="property-item">
            <label>${t('groupColumn')}</label>
            <select onchange="updateNodeConfig('groupColumn', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.groupColumn === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>
        <div class="property-item">
            <label>${t('covariate')}</label>
            <select onchange="updateNodeConfig('covariateColumn', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.covariateColumn === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>
        <div class="property-item">
            <p style="color:var(--text-secondary);font-size:0.85rem;margin:8px 0">
                <i class="fas fa-info-circle"></i> ${t('ancovaInfo')}
            </p>
        </div>`;
    }

    // ===== Non-Parametric Tests Property Panels =====

    // Data Entry Node
    if (node.type === 'dataEntry') {
        const columns = node.config.columns || ['Variable1', 'Variable2'];
        const data = node.config.data || [];
        const rows = node.config.rows || 10;

        html += `<div class="property-item">
            <label>${t('selectColumns')}</label>
            <input type="text" value="${columns.join(',')}" 
                onchange="updateNodeConfig('columns', this.value.split(',').map(c=>c.trim()))" 
                placeholder="Variable1, Variable2">
            <small style="color:var(--text-secondary)">${t('separateByComma') || 'Separate column names with commas'}</small>
        </div>
        <div class="property-item">
            <label>${t('maxRows') || 'Rows'}</label>
            <input type="number" min="1" max="100" value="${rows}" 
                onchange="updateNodeConfig('rows', parseInt(this.value))">
        </div>
        <div class="property-item">
            <button class="btn" id="editDataBtn" data-node-id="${node.id}" style="width:100%">
                <i class="fas fa-edit"></i> ${t('editData') || 'Edit Data'}
            </button>
        </div>`;
    }

    // Mann-Whitney U Test
    if (node.type === 'mannWhitneyU') {
        const cols = getAvailableColumns(node);
        html += `<div class="property-item">
            <label>${t('valueColumn')}</label>
            <select onchange="updateNodeConfig('valueColumn', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.valueColumn === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>
        <div class="property-item">
            <label>${t('groupColumn')}</label>
            <select onchange="updateNodeConfig('groupColumn', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.groupColumn === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>
        <div class="property-item">
            <p style="color:var(--text-secondary);font-size:0.85rem;margin:8px 0">
                <i class="fas fa-info-circle"></i> ${t('mannWhitneyInfo') || 'Non-parametric alternative to independent t-test'}
            </p>
        </div>`;
    }

    // Wilcoxon Signed-Rank Test
    if (node.type === 'wilcoxonSignedRank') {
        const cols = getAvailableColumns(node);
        html += `<div class="property-item">
            <label>${t('sample1')} (${t('column1') || 'Column 1'})</label>
            <select onchange="updateNodeConfig('column1', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.column1 === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>
        <div class="property-item">
            <label>${t('sample2')} (${t('column2') || 'Column 2'})</label>
            <select onchange="updateNodeConfig('column2', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.column2 === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>
        <div class="property-item">
            <p style="color:var(--text-secondary);font-size:0.85rem;margin:8px 0">
                <i class="fas fa-info-circle"></i> ${t('wilcoxonInfo') || 'Non-parametric alternative to paired t-test'}
            </p>
        </div>`;
    }

    // Kruskal-Wallis Test
    if (node.type === 'kruskalWallis') {
        const cols = getAvailableColumns(node);
        html += `<div class="property-item">
            <label>${t('valueColumn')}</label>
            <select onchange="updateNodeConfig('valueColumn', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.valueColumn === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>
        <div class="property-item">
            <label>${t('groupColumn')}</label>
            <select onchange="updateNodeConfig('groupColumn', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.groupColumn === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>
        <div class="property-item">
            <p style="color:var(--text-secondary);font-size:0.85rem;margin:8px 0">
                <i class="fas fa-info-circle"></i> ${t('kruskalWallisInfo') || 'Non-parametric alternative to one-way ANOVA'}
            </p>
        </div>`;
    }

    // Friedman Test
    if (node.type === 'friedmanTest') {
        const cols = getAvailableColumns(node);
        html += `<div class="property-item">
            <label>${t('subjectColumn') || 'Subject Column'}</label>
            <select onchange="updateNodeConfig('subjectColumn', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.subjectColumn === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>
        <div class="property-item">
            <label>${t('conditionColumn') || 'Condition Column'}</label>
            <select onchange="updateNodeConfig('conditionColumn', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.conditionColumn === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>
        <div class="property-item">
            <label>${t('valueColumn')}</label>
            <select onchange="updateNodeConfig('valueColumn', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.valueColumn === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>
        <div class="property-item">
            <p style="color:var(--text-secondary);font-size:0.85rem;margin:8px 0">
                <i class="fas fa-info-circle"></i> ${t('friedmanInfo') || 'Non-parametric alternative to repeated measures ANOVA'}
            </p>
        </div>`;
    }

    // Chi-Square Test
    if (node.type === 'chiSquareTest') {
        const cols = getAvailableColumns(node);
        html += `<div class="property-item">
            <label>${t('variable1') || 'Variable 1'}</label>
            <select onchange="updateNodeConfig('variable1Column', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.variable1Column === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>
        <div class="property-item">
            <label>${t('variable2') || 'Variable 2'}</label>
            <select onchange="updateNodeConfig('variable2Column', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.variable2Column === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>
        <div class="property-item">
            <p style="color:var(--text-secondary);font-size:0.85rem;margin:8px 0">
                <i class="fas fa-info-circle"></i> ${t('chiSquareInfo') || 'Test for independence between categorical variables'}
            </p>
        </div>`;
    }

    // Spearman Correlation
    if (node.type === 'spearmanCorrelation') {
        const cols = getAvailableColumns(node);
        html += `<div class="property-item">
            <label>${t('xAxis')} (X)</label>
            <select onchange="updateNodeConfig('xColumn', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.xColumn === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>
        <div class="property-item">
            <label>${t('yAxis')} (Y)</label>
            <select onchange="updateNodeConfig('yColumn', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.yColumn === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>
        <div class="property-item">
            <p style="color:var(--text-secondary);font-size:0.85rem;margin:8px 0">
                <i class="fas fa-info-circle"></i> ${t('spearmanInfo') || 'Non-parametric rank correlation coefficient'}
            </p>
        </div>`;
    }

    // ===== Views Nodes Property Panels =====
    if (node.type === 'imageView') {
        const cols = getAvailableColumns(node);
        html += `<div class="property-item">
            <label>${t('imageColumn')}</label>
            <select onchange="updateNodeConfig('imageColumn', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.imageColumn === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>
        <div class="property-item" style="display:flex;gap:8px">
            <div style="flex:1">
                <label>${t('maxWidth')}</label>
                <input type="number" min="100" max="1000" value="${node.config.maxWidth || 400}" onchange="updateNodeConfig('maxWidth', parseInt(this.value))" style="width:100%">
            </div>
            <div style="flex:1">
                <label>${t('maxHeight')}</label>
                <input type="number" min="100" max="1000" value="${node.config.maxHeight || 300}" onchange="updateNodeConfig('maxHeight', parseInt(this.value))" style="width:100%">
            </div>
        </div>`;
    }

    if (node.type === 'textView') {
        const cols = getAvailableColumns(node);
        html += `<div class="property-item">
            <label>${t('textColumn')}</label>
            <select onchange="updateNodeConfig('textColumn', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.textColumn === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>
        <div class="property-item" style="display:flex;gap:8px">
            <div style="flex:1">
                <label>${t('fontSize')}</label>
                <input type="number" min="10" max="24" value="${node.config.fontSize || 14}" onchange="updateNodeConfig('fontSize', parseInt(this.value))" style="width:100%">
            </div>
            <div style="flex:1">
                <label>${t('maxLines')}</label>
                <input type="number" min="10" max="500" value="${node.config.maxLines || 100}" onchange="updateNodeConfig('maxLines', parseInt(this.value))" style="width:100%">
            </div>
        </div>`;
    }

    if (node.type === 'statisticsView' || node.type === 'boxPlot' || node.type === 'heatmap') {
        const cols = getAvailableColumns(node);
        const selectedCols = node.config.columns || [];
        html += `<div class="property-item">
            <label>${t('selectColumns')}</label>
            <div style="max-height:150px;overflow-y:auto;border:1px solid var(--border-color);border-radius:6px;padding:8px">
                ${cols.map(c => `
                    <label style="display:flex;align-items:center;gap:6px;margin:4px 0;cursor:pointer">
                        <input type="checkbox" ${selectedCols.includes(c) ? 'checked' : ''} 
                            onchange="toggleFeature('${c}');updateNodeConfig('columns', currentConfigNode.config.features || [])"> ${c}
                    </label>
                `).join('')}
            </div>
        </div>`;
        if (node.type === 'heatmap') {
            html += `<div class="property-item">
                <label>${t('colorScheme')}</label>
                <select onchange="updateNodeConfig('colorScheme', this.value)">
                    <option value="redBlue" ${node.config.colorScheme === 'redBlue' ? 'selected' : ''}>${t('redBlue')}</option>
                    <option value="greenRed" ${node.config.colorScheme === 'greenRed' ? 'selected' : ''}>${t('greenRed')}</option>
                    <option value="yellowPurple" ${node.config.colorScheme === 'yellowPurple' ? 'selected' : ''}>${t('yellowPurple')}</option>
                </select>
            </div>`;
        }
    }

    if (node.type === 'tileView') {
        const cols = getAvailableColumns(node);
        html += `<div class="property-item">
            <label>${t('titleColumn')}</label>
            <select onchange="updateNodeConfig('titleColumn', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.titleColumn === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>
        <div class="property-item">
            <label>${t('valueColumn')}</label>
            <select onchange="updateNodeConfig('valueColumn', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.valueColumn === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>
        <div class="property-item">
            <label>${t('maxTiles')}</label>
            <input type="number" min="1" max="100" value="${node.config.maxTiles || 20}" onchange="updateNodeConfig('maxTiles', parseInt(this.value))">
        </div>
        <div class="property-item">
            <label>${t('tileColor')}</label>
            <input type="color" value="${node.config.color || '#14b8a6'}" onchange="updateNodeConfig('color', this.value)">
        </div>`;
    }

    if (node.type === 'areaChart') {
        const cols = getAvailableColumns(node);
        const selectedYCols = node.config.yColumns || [];
        html += `<div class="property-item">
            <label>${t('xAxis')}</label>
            <select onchange="updateNodeConfig('xColumn', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.xColumn === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>
        <div class="property-item">
            <label>${t('yAxis')} (${t('multiple')})</label>
            <div style="max-height:120px;overflow-y:auto;border:1px solid var(--border-color);border-radius:6px;padding:8px">
                ${cols.map(c => `
                    <label style="display:flex;align-items:center;gap:6px;margin:4px 0;cursor:pointer">
                        <input type="checkbox" ${selectedYCols.includes(c) ? 'checked' : ''} 
                            onchange="const arr = currentConfigNode.config.yColumns || []; if(this.checked) arr.push('${c}'); else arr.splice(arr.indexOf('${c}'),1); updateNodeConfig('yColumns', arr)"> ${c}
                    </label>
                `).join('')}
            </div>
        </div>
        <div class="property-item" style="display:flex;gap:12px">
            <label><input type="checkbox" ${node.config.fill !== false ? 'checked' : ''} onchange="updateNodeConfig('fill', this.checked)"> ${t('fill')}</label>
            <label><input type="checkbox" ${node.config.stacked ? 'checked' : ''} onchange="updateNodeConfig('stacked', this.checked)"> ${t('stacked')}</label>
        </div>`;
    }

    if (node.type === 'radarChart') {
        const cols = getAvailableColumns(node);
        const selectedCols = node.config.valueColumns || [];
        html += `<div class="property-item">
            <label>${t('labelColumn')}</label>
            <select onchange="updateNodeConfig('labelColumn', this.value)">
                <option value="">--</option>
                ${cols.map(c => `<option value="${c}" ${node.config.labelColumn === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>
        <div class="property-item">
            <label>${t('valueColumns')}</label>
            <div style="max-height:120px;overflow-y:auto;border:1px solid var(--border-color);border-radius:6px;padding:8px">
                ${cols.map(c => `
                    <label style="display:flex;align-items:center;gap:6px;margin:4px 0;cursor:pointer">
                        <input type="checkbox" ${selectedCols.includes(c) ? 'checked' : ''} 
                            onchange="const arr = currentConfigNode.config.valueColumns || []; if(this.checked) arr.push('${c}'); else arr.splice(arr.indexOf('${c}'),1); updateNodeConfig('valueColumns', arr)"> ${c}
                    </label>
                `).join('')}
            </div>
        </div>
        <div class="property-item">
            <label>${t('maxRows')}</label>
            <input type="number" min="1" max="10" value="${node.config.maxRows || 5}" onchange="updateNodeConfig('maxRows', parseInt(this.value))">
        </div>`;
    }

    // ML Visualization nodes (rocCurve, prCurve, learningCurve, featureImportance, confusionHeatmap) - no extra config needed
    if (['rocCurve', 'prCurve', 'learningCurve', 'featureImportance', 'confusionHeatmap'].includes(node.type)) {
        html += `<div class="property-item">
            <p style="color:var(--text-secondary);font-size:0.9rem;margin:0">
                ${t('connectModelToVisualize')}
            </p>
        </div>`;
    }

    html += `</div>
    <div class="property-group">
        <button class="btn btn-primary btn-block" onclick="executeCurrentNode()">
            <i class="fas fa-play"></i> ${t('execute')}
        </button>
    </div>`;

    content.innerHTML = html;

    // Bind event listener for Data Entry Edit button
    const editDataBtn = document.getElementById('editDataBtn');
    console.log('Looking for editDataBtn:', editDataBtn);
    if (editDataBtn) {
        editDataBtn.addEventListener('click', function () {
            alert('Button clicked! Now opening modal...');
            const nodeId = this.getAttribute('data-node-id');
            console.log('Edit Data button clicked, nodeId:', nodeId);

            // Check if function exists
            if (typeof openDataEntryEditor === 'function') {
                console.log('openDataEntryEditor is defined, calling it...');
                try {
                    openDataEntryEditor(nodeId);
                } catch (e) {
                    console.error('Error calling openDataEntryEditor:', e);
                    alert('Error: ' + e.message);
                }
            } else {
                console.error('openDataEntryEditor is NOT defined!');
                alert('Error: openDataEntryEditor function is not defined!');
            }
        });
        console.log('Event listener added to editDataBtn');
    } else {
        console.log('editDataBtn not found');
    }
}

function hideNodeProperties() {
    document.getElementById('propertiesPanel')?.classList.remove('open');
    currentConfigNode = null;
}

function updateNodeConfig(key, value) {
    if (currentConfigNode) currentConfigNode.config[key] = value;
}

function updateTransform(col, value) {
    if (currentConfigNode) {
        if (!currentConfigNode.config.independentTransforms) {
            currentConfigNode.config.independentTransforms = {};
        }
        currentConfigNode.config.independentTransforms[col] = value;
    }
}

function updateDiff(col, value) {
    if (currentConfigNode) {
        if (!currentConfigNode.config.independentDiffs) {
            currentConfigNode.config.independentDiffs = {};
        }
        currentConfigNode.config.independentDiffs[col] = value;
    }
}

function updateQLag(col, value) {
    if (currentConfigNode) {
        if (!currentConfigNode.config.qLags) {
            currentConfigNode.config.qLags = {};
        }
        currentConfigNode.config.qLags[col] = value;
    }
}

function updateVARTransform(col, value) {
    if (currentConfigNode) {
        if (!currentConfigNode.config.transforms) {
            currentConfigNode.config.transforms = {};
        }
        currentConfigNode.config.transforms[col] = value;
    }
}

function updateVARDiff(col, value) {
    if (currentConfigNode) {
        if (!currentConfigNode.config.diffs) {
            currentConfigNode.config.diffs = {};
        }
        currentConfigNode.config.diffs[col] = value;
    }
}

function getSelectedOptions(id) {
    const sel = document.getElementById(id);
    return sel ? Array.from(sel.selectedOptions).map(o => o.value) : [];
}

function updateFileDisplay(name) {
    const btn = document.querySelector('.property-item button');
    if (btn) btn.innerHTML = `<i class="fas fa-file"></i> ${name}`;
}

function getAvailableColumns(node) {
    // Get columns from connected input node
    const conn = canvas.connections.find(c => c.targetId === node.id);
    if (conn) {
        const source = canvas.nodes.get(conn.sourceId);
        if (source?.result?.columns) return source.result.columns;
    }
    return node.config.columns || [];
}

function executeCurrentNode() {
    if (currentConfigNode) executor.executeNode(currentConfigNode.id).then(result => {
        if (result) showResult(result);
    }).catch(console.error);
}

function openNodeConfig(node) {
    showNodeProperties(node);
}

// Result Modal
let currentResult = null;

function showResult(result) {
    currentResult = result;
    const modal = document.getElementById('resultModal');
    const body = document.getElementById('resultModalBody');
    const title = document.getElementById('resultModalTitle');
    if (!modal || !body) return;

    let html = '';

    if (result.viewType === 'table') {
        title.textContent = t('tableView');
        html = renderTable(result.data, result.columns);
    } else if (result.viewType === 'stats') {
        title.textContent = t('descriptiveStats');
        html = renderStatsTable(result.stats);
    } else if (result.viewType === 'correlation') {
        title.textContent = t('correlation');
        html = renderCorrelationMatrix(result.matrix, result.columns);
    } else if (result.viewType === 'regression') {
        title.textContent = t('linearRegression');
        html = renderRegressionResult(result);
    } else if (result.viewType === 'multiRegression') {
        title.textContent = t('multipleRegression') + ' (' + (result.method || 'OLS') + ')';
        html = renderMultiRegressionResult(result);
    } else if (result.viewType === 'ttest') {
        title.textContent = t('tTest');
        html = renderTTestResult(result);
    } else if (result.viewType === 'ardl') {
        title.textContent = t('ardl') + ' - ' + (result.specification || 'ARDL');
        html = renderARDLResult(result);
    } else if (result.viewType === 'varVecm') {
        title.textContent = t('varVecm') + ' - ' + (result.var?.specification || 'VAR/VECM');
        html = renderVARVECMResult(result);
    } else if (result.viewType === 'stationarity') {
        title.textContent = t('stationarityTest');
        html = renderStationarityResult(result);
    } else if (result.viewType === 'panel') {
        title.textContent = t('panelData') + ' - ' + (result.bestMethod || 'Panel Analysis');
        html = renderPanelResult(result);
    } else if (result.viewType === 'independentTTest') {
        title.textContent = t('independentTTest');
        html = renderIndependentTTestResult(result);
    } else if (result.viewType === 'pairedTTest') {
        title.textContent = t('pairedTTest');
        html = renderPairedTTestResult(result);
    } else if (result.viewType === 'twoWayAnova') {
        title.textContent = t('twoWayAnova');
        html = renderTwoWayAnovaResult(result);
    } else if (result.viewType === 'ancova') {
        title.textContent = t('ancova');
        html = renderAncovaResult(result);
    } else if (result.viewType === 'mannWhitneyU') {
        title.textContent = t('mannWhitneyU');
        html = renderMannWhitneyUResult(result);
    } else if (result.viewType === 'wilcoxonSignedRank') {
        title.textContent = t('wilcoxonSignedRank');
        html = renderWilcoxonSignedRankResult(result);
    } else if (result.viewType === 'kruskalWallis') {
        title.textContent = t('kruskalWallis');
        html = renderKruskalWallisResult(result);
    } else if (result.viewType === 'friedmanTest') {
        title.textContent = t('friedmanTest');
        html = renderFriedmanResult(result);
    } else if (result.viewType === 'chiSquareTest') {
        title.textContent = t('chiSquareTest');
        html = renderChiSquareTestResult(result);
    } else if (result.viewType === 'spearmanCorrelation') {
        title.textContent = t('spearmanCorrelation');
        html = renderSpearmanCorrelationResult(result);
    } else if (['scatter', 'line', 'bar', 'histogram', 'pie'].includes(result.viewType)) {
        title.textContent = t(result.viewType + 'Chart') || result.viewType;
        html = '<div class="chart-container"><canvas id="resultChart"></canvas></div>';
    } else if (result.viewType === 'mlResult') {
        title.textContent = t(result.method?.toLowerCase().replace(/\s/g, '') || 'mlNodes') + ' - ' + t('accuracy');
        html = renderMLResult(result);
    } else if (result.viewType === 'cvResult') {
        title.textContent = t('crossValidation') + ' (K=' + (result.k || 5) + ')';
        html = renderCVResult(result);
    } else if (result.viewType === 'clustering') {
        title.textContent = t('kMeans') + ' (K=' + (result.k || '?') + ')';
        html = renderClusteringResult(result);
    } else if (result.viewType === 'neuralNetwork') {
        title.textContent = t('neuralNetwork') + ' - ' + (result.architecture?.join('→') || 'MLP');
        html = renderNeuralNetworkResult(result);
    } else if (result.viewType === 'predictions') {
        title.textContent = t('modelPredictor');
        html = renderTable(result.data, result.columns);
    } else if (result.viewType === 'pca') {
        title.textContent = t('pca') + ' - ' + (result.nComponents || 2) + ' ' + t('components');
        html = renderPCAResult(result);
    } else if (result.viewType === 'rocCurve') {
        title.textContent = t('rocCurve') + ' (AUC: ' + (result.auc?.toFixed(3) || '?') + ')';
        html = '<div class="chart-container"><canvas id="resultChart"></canvas></div>';
    } else if (result.viewType === 'prCurve') {
        title.textContent = t('prCurve') + ' (AP: ' + (result.averagePrecision?.toFixed(3) || '?') + ')';
        html = '<div class="chart-container"><canvas id="resultChart"></canvas></div>';
    } else if (result.viewType === 'learningCurve') {
        title.textContent = t('learningCurve');
        html = '<div class="chart-container"><canvas id="resultChart"></canvas></div>';
    } else if (result.viewType === 'featureImportance') {
        title.textContent = t('featureImportance');
        html = '<div class="chart-container"><canvas id="resultChart"></canvas></div>';
    } else if (result.viewType === 'elbowCurve') {
        title.textContent = t('elbowCurve');
        html = '<div class="chart-container"><canvas id="resultChart"></canvas></div>';
    } else if (result.viewType === 'confusionHeatmap') {
        title.textContent = t('confusionHeatmap');
        html = renderConfusionHeatmap(result);
    } else if (result.viewType === 'imageView') {
        title.textContent = t('imageView');
        html = renderImageView(result);
    } else if (result.viewType === 'textView') {
        title.textContent = t('textView');
        html = renderTextView(result);
    } else if (result.viewType === 'statisticsView') {
        title.textContent = t('statisticsView');
        html = renderStatisticsView(result);
    } else if (result.viewType === 'tileView') {
        title.textContent = t('tileView');
        html = renderTileView(result);
    } else if (result.viewType === 'boxPlot') {
        title.textContent = t('boxPlot');
        html = '<div class="chart-container"><canvas id="resultChart"></canvas></div>';
    } else if (result.viewType === 'heatmap') {
        title.textContent = t('heatmap');
        html = renderHeatmapView(result);
    } else if (result.viewType === 'areaChart') {
        title.textContent = t('areaChart');
        html = '<div class="chart-container"><canvas id="resultChart"></canvas></div>';
    } else if (result.viewType === 'radarChart') {
        title.textContent = t('radarChart');
        html = '<div class="chart-container"><canvas id="resultChart"></canvas></div>';
    } else if (result.error) {
        title.textContent = t('error');
        html = `<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>${result.error}</p></div>`;
    }

    body.innerHTML = html;
    modal.classList.add('open');

    // Render chart if needed
    if (['scatter', 'line', 'bar', 'histogram', 'pie'].includes(result.viewType)) {
        setTimeout(() => renderChart(result), 100);
    }
    // Render ML visualization charts
    if (['rocCurve', 'prCurve', 'learningCurve', 'featureImportance', 'elbowCurve'].includes(result.viewType)) {
        setTimeout(() => renderMLVisualization(result), 100);
    }
    // Render view node charts
    if (['boxPlot', 'areaChart', 'radarChart'].includes(result.viewType)) {
        setTimeout(() => renderViewChart(result), 100);
    }
}

function hideResult() {
    document.getElementById('resultModal')?.classList.remove('open');
    currentResult = null;
}

function renderTable(data, columns) {
    if (!data?.length) return `<div class="empty-state"><i class="fas fa-table"></i><p>${t('noData')}</p></div>`;
    const maxRows = Math.min(data.length, 100);
    return `<table class="result-table">
        <thead><tr>${columns.map(c => `<th>${c}</th>`).join('')}</tr></thead>
        <tbody>${data.slice(0, maxRows).map(row => `<tr>${columns.map(c => `<td>${row[c] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>${data.length > 100 ? `<p style="text-align:center;color:var(--text-muted);margin-top:10px">Showing 100 of ${data.length} rows</p>` : ''}`;
}

function renderStatsTable(stats) {
    const cols = Object.keys(stats);
    const metrics = ['count', 'mean', 'median', 'mode', 'std', 'variance', 'min', 'max', 'range', 'sum'];
    return `<table class="result-table">
        <thead><tr><th></th>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead>
        <tbody>${metrics.map(m => `<tr><th>${t(m)}</th>${cols.map(c => `<td>${typeof stats[c][m] === 'number' ? stats[c][m].toFixed(4) : stats[c][m]}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>`;
}

function renderCorrelationMatrix(matrix, columns) {
    return `<table class="result-table">
        <thead><tr><th></th>${columns.map(c => `<th>${c}</th>`).join('')}</tr></thead>
        <tbody>${columns.map(c1 => `<tr><th>${c1}</th>${columns.map(c2 => `<td style="background:${getCorrelationColor(matrix[c1][c2])}">${matrix[c1][c2].toFixed(3)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>`;
}

function getCorrelationColor(val) {
    const intensity = Math.abs(val);
    const hue = val > 0 ? 120 : 0;
    return `hsla(${hue}, 70%, 50%, ${intensity * 0.5})`;
}

function renderRegressionResult(result) {
    let html = `<table class="result-table">
        <tbody>
        <tr><th>${t('rSquared')}</th><td>${result.rSquared?.toFixed(4) || 'N/A'}</td></tr>
        <tr><th>${t('intercept')}</th><td>${result.intercept?.toFixed(4) || 'N/A'}</td></tr>`;
    if (result.slope !== undefined) {
        html += `<tr><th>${t('coefficient')} (${result.independents?.[0]})</th><td>${result.slope?.toFixed(4)}</td></tr>`;
    } else if (result.coefficients) {
        result.coefficients.forEach((c, i) => {
            html += `<tr><th>${t('coefficient')} (${result.independents?.[i]})</th><td>${c.toFixed(4)}</td></tr>`;
        });
    }
    html += `<tr><th>N</th><td>${result.n || 'N/A'}</td></tr></tbody></table>`;
    return html;
}

function renderTTestResult(result) {
    return `<table class="result-table">
        <tbody>
        <tr><th>T-Statistic</th><td>${result.tStatistic?.toFixed(4) || 'N/A'}</td></tr>
        <tr><th>Degrees of Freedom</th><td>${result.degreesOfFreedom || 'N/A'}</td></tr>
        <tr><th>${t('mean')} (${result.column1})</th><td>${result.mean1?.toFixed(4) || 'N/A'}</td></tr>
        <tr><th>${t('mean')} (${result.column2})</th><td>${result.mean2?.toFixed(4) || 'N/A'}</td></tr>
        </tbody>
    </table>`;
}

function renderIndependentTTestResult(result) {
    const sigClass = result.significant ? 'color:#22c55e' : 'color:#ef4444';
    let html = `<div style="background:var(--bg-tertiary);padding:12px;border-radius:8px;margin-bottom:16px">
        <strong>${t('testType')}: </strong>${result.testType === 'Student' ? t('studentTTest') : t('welchTTest')}
    </div>`;

    // Group Statistics
    html += `<h4 style="margin:16px 0 8px;font-size:14px">${t('groupStatistics')}</h4>
    <table class="result-table">
        <thead><tr>
            <th>${t('group')}</th>
            <th>N</th>
            <th>${t('mean')}</th>
            <th>${t('std')}</th>
            <th>${t('variance')}</th>
        </tr></thead>
        <tbody>
        <tr>
            <td><strong>${result.group1Name || 'Group 1'}</strong></td>
            <td>${result.group1Stats?.n || 'N/A'}</td>
            <td>${result.group1Stats?.mean?.toFixed(4) || 'N/A'}</td>
            <td>${result.group1Stats?.std?.toFixed(4) || 'N/A'}</td>
            <td>${result.group1Stats?.variance?.toFixed(4) || 'N/A'}</td>
        </tr>
        <tr>
            <td><strong>${result.group2Name || 'Group 2'}</strong></td>
            <td>${result.group2Stats?.n || 'N/A'}</td>
            <td>${result.group2Stats?.mean?.toFixed(4) || 'N/A'}</td>
            <td>${result.group2Stats?.std?.toFixed(4) || 'N/A'}</td>
            <td>${result.group2Stats?.variance?.toFixed(4) || 'N/A'}</td>
        </tr>
        </tbody>
    </table>`;

    // Test Results
    html += `<h4 style="margin:16px 0 8px;font-size:14px">${t('testResults')}</h4>
    <table class="result-table">
        <tbody>
        <tr><th>${t('meanDifference')}</th><td>${result.meanDifference?.toFixed(4) || 'N/A'}</td></tr>
        <tr><th>T-${t('statistic')}</th><td>${result.tStatistic?.toFixed(4) || 'N/A'}</td></tr>
        <tr><th>${t('degreesOfFreedom')}</th><td>${result.degreesOfFreedom?.toFixed(2) || 'N/A'}</td></tr>
        <tr><th>P-${t('value')}</th><td style="${sigClass}">${result.pValue?.toFixed(4) || 'N/A'}</td></tr>
        <tr><th>${t('standardError')}</th><td>${result.standardError?.toFixed(4) || 'N/A'}</td></tr>
        <tr><th>${t('cohensD')}</th><td>${result.cohensD?.toFixed(4) || 'N/A'} (${t(result.effectSize || 'small')})</td></tr>
        <tr><th>${t('ci95')}</th><td>[${result.confidenceInterval?.lower?.toFixed(4)}, ${result.confidenceInterval?.upper?.toFixed(4)}]</td></tr>
        </tbody>
    </table>`;

    // Levene's Test
    if (result.leveneTest) {
        html += `<h4 style="margin:16px 0 8px;font-size:14px">${t('levenesTest')}</h4>
        <table class="result-table">
            <tbody>
            <tr><th>F-${t('statistic')}</th><td>${result.leveneTest.fStatistic?.toFixed(4) || 'N/A'}</td></tr>
            <tr><th>P-${t('value')}</th><td>${result.leveneTest.pValue?.toFixed(4) || 'N/A'}</td></tr>
            <tr><th>${t('conclusion')}</th><td>${result.leveneTest.equalVariances ? t('equalVariances') : t('unequalVariances')}</td></tr>
            </tbody>
        </table>`;
    }

    // Conclusion
    html += `<div style="margin-top:16px;padding:12px;border-radius:8px;background:${result.significant ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'}">
        <strong style="${sigClass}">${result.conclusion}</strong> (α = 0.05)
    </div>`;

    return html;
}

function renderPairedTTestResult(result) {
    const sigClass = result.significant ? 'color:#22c55e' : 'color:#ef4444';

    // Sample Statistics
    let html = `<h4 style="margin:0 0 8px;font-size:14px">${t('sampleStatistics')}</h4>
    <table class="result-table">
        <thead><tr>
            <th>${t('sample')}</th>
            <th>${t('mean')}</th>
            <th>${t('std')}</th>
        </tr></thead>
        <tbody>
        <tr>
            <td><strong>${result.sample1Column || t('sample1')}</strong></td>
            <td>${result.sample1Stats?.mean?.toFixed(4) || 'N/A'}</td>
            <td>${result.sample1Stats?.std?.toFixed(4) || 'N/A'}</td>
        </tr>
        <tr>
            <td><strong>${result.sample2Column || t('sample2')}</strong></td>
            <td>${result.sample2Stats?.mean?.toFixed(4) || 'N/A'}</td>
            <td>${result.sample2Stats?.std?.toFixed(4) || 'N/A'}</td>
        </tr>
        </tbody>
    </table>`;

    // Paired Differences
    html += `<h4 style="margin:16px 0 8px;font-size:14px">${t('pairedDifferences')}</h4>
    <table class="result-table">
        <tbody>
        <tr><th>${t('meanDifference')}</th><td>${result.differences?.mean?.toFixed(4) || 'N/A'}</td></tr>
        <tr><th>${t('std')}</th><td>${result.differences?.std?.toFixed(4) || 'N/A'}</td></tr>
        <tr><th>${t('standardError')}</th><td>${result.differences?.se?.toFixed(4) || 'N/A'}</td></tr>
        <tr><th>${t('correlation')}</th><td>${result.correlation?.toFixed(4) || 'N/A'}</td></tr>
        </tbody>
    </table>`;

    // Test Results
    html += `<h4 style="margin:16px 0 8px;font-size:14px">${t('testResults')}</h4>
    <table class="result-table">
        <tbody>
        <tr><th>${t('pairs')}</th><td>${result.nPairs || 'N/A'}</td></tr>
        <tr><th>T-${t('statistic')}</th><td>${result.tStatistic?.toFixed(4) || 'N/A'}</td></tr>
        <tr><th>${t('degreesOfFreedom')}</th><td>${result.degreesOfFreedom || 'N/A'}</td></tr>
        <tr><th>P-${t('value')}</th><td style="${sigClass}">${result.pValue?.toFixed(4) || 'N/A'}</td></tr>
        <tr><th>${t('cohensD')}</th><td>${result.cohensD?.toFixed(4) || 'N/A'} (${t(result.effectSize || 'small')})</td></tr>
        <tr><th>${t('ci95')}</th><td>[${result.confidenceInterval?.lower?.toFixed(4)}, ${result.confidenceInterval?.upper?.toFixed(4)}]</td></tr>
        </tbody>
    </table>`;

    // Conclusion
    html += `<div style="margin-top:16px;padding:12px;border-radius:8px;background:${result.significant ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'}">
        <strong style="${sigClass}">${result.conclusion}</strong> (α = 0.05)
    </div>`;

    return html;
}

function renderTwoWayAnovaResult(result) {
    // ANOVA Table
    let html = `<h4 style="margin:0 0 8px;font-size:14px">${t('anovaTable')}</h4>
    <table class="result-table">
        <thead><tr>
            <th>${t('source')}</th>
            <th>SS</th>
            <th>df</th>
            <th>MS</th>
            <th>F</th>
            <th>P-${t('value')}</th>
            <th>η²</th>
        </tr></thead>
        <tbody>`;

    const sources = [
        { name: result.factor1?.name || 'Factor 1', data: result.factor1 },
        { name: result.factor2?.name || 'Factor 2', data: result.factor2 },
        { name: t('interaction'), data: result.interaction }
    ];

    sources.forEach(src => {
        if (src.data) {
            const sigStyle = src.data.pValue < 0.05 ? 'color:#22c55e;font-weight:bold' : 'color:#ef4444';
            html += `<tr>
                <td><strong>${src.name}</strong></td>
                <td>${src.data.SS?.toFixed(4) || 'N/A'}</td>
                <td>${src.data.df || 'N/A'}</td>
                <td>${src.data.MS?.toFixed(4) || 'N/A'}</td>
                <td>${src.data.F?.toFixed(4) || 'N/A'}</td>
                <td style="${sigStyle}">${src.data.pValue?.toFixed(4) || 'N/A'}</td>
                <td>${src.data.etaSquared?.toFixed(4) || 'N/A'}</td>
            </tr>`;
        }
    });

    html += `<tr style="background:var(--bg-tertiary)">
        <td><strong>${t('error')}</strong></td>
        <td>${result.error?.SS?.toFixed(4) || 'N/A'}</td>
        <td>${result.error?.df || 'N/A'}</td>
        <td>${result.error?.MS?.toFixed(4) || 'N/A'}</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
    </tr>
    <tr style="background:var(--bg-secondary)">
        <td><strong>${t('total')}</strong></td>
        <td>${result.total?.SS?.toFixed(4) || 'N/A'}</td>
        <td>${result.total?.df || 'N/A'}</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
    </tr>
    </tbody></table>`;

    // Summary
    html += `<div style="margin-top:16px;padding:12px;border-radius:8px;background:var(--bg-tertiary)">
        <div><strong>${t('grandMean')}:</strong> ${result.grandMean?.toFixed(4) || 'N/A'}</div>
        <div><strong>N:</strong> ${result.N || 'N/A'}</div>
    </div>`;

    // Significance Summary
    html += `<h4 style="margin:16px 0 8px;font-size:14px">${t('significanceTest')} (α = 0.05)</h4>
    <ul style="margin:0;padding-left:20px">
        <li>${result.factor1?.name}: ${result.factor1?.significant ? '✓ ' + t('significant') : '✗ ' + t('notSignificant')}</li>
        <li>${result.factor2?.name}: ${result.factor2?.significant ? '✓ ' + t('significant') : '✗ ' + t('notSignificant')}</li>
        <li>${t('interaction')}: ${result.interaction?.significant ? '✓ ' + t('significant') : '✗ ' + t('notSignificant')}</li>
    </ul>`;

    return html;
}

function renderAncovaResult(result) {
    // ANCOVA Table
    let html = `<h4 style="margin:0 0 8px;font-size:14px">${t('ancovaTable')}</h4>
    <table class="result-table">
        <thead><tr>
            <th>${t('source')}</th>
            <th>SS</th>
            <th>df</th>
            <th>MS</th>
            <th>F</th>
            <th>P-${t('value')}</th>
            <th>η²p</th>
        </tr></thead>
        <tbody>`;

    // Group effect
    const grpSig = result.groupEffect?.pValue < 0.05 ? 'color:#22c55e;font-weight:bold' : 'color:#ef4444';
    html += `<tr>
        <td><strong>${result.groupColumn || t('group')}</strong></td>
        <td>${result.groupEffect?.SS?.toFixed(4) || 'N/A'}</td>
        <td>${result.groupEffect?.df || 'N/A'}</td>
        <td>${result.groupEffect?.MS?.toFixed(4) || 'N/A'}</td>
        <td>${result.groupEffect?.F?.toFixed(4) || 'N/A'}</td>
        <td style="${grpSig}">${result.groupEffect?.pValue?.toFixed(4) || 'N/A'}</td>
        <td>${result.groupEffect?.partialEtaSquared?.toFixed(4) || 'N/A'}</td>
    </tr>`;

    // Covariate effect
    const covSig = result.covariateEffect?.pValue < 0.05 ? 'color:#22c55e;font-weight:bold' : 'color:#ef4444';
    html += `<tr>
        <td><strong>${result.covariateColumn || t('covariate')}</strong></td>
        <td>${result.covariateEffect?.SS?.toFixed(4) || 'N/A'}</td>
        <td>${result.covariateEffect?.df || 'N/A'}</td>
        <td>${result.covariateEffect?.MS?.toFixed(4) || 'N/A'}</td>
        <td>${result.covariateEffect?.F?.toFixed(4) || 'N/A'}</td>
        <td style="${covSig}">${result.covariateEffect?.pValue?.toFixed(4) || 'N/A'}</td>
        <td>${result.covariateEffect?.partialEtaSquared?.toFixed(4) || 'N/A'}</td>
    </tr>`;

    // Error
    html += `<tr style="background:var(--bg-tertiary)">
        <td><strong>${t('error')}</strong></td>
        <td>${result.error?.SS?.toFixed(4) || 'N/A'}</td>
        <td>${result.error?.df || 'N/A'}</td>
        <td>${result.error?.MS?.toFixed(4) || 'N/A'}</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
    </tr>
    </tbody></table>`;

    // Adjusted Means
    html += `<h4 style="margin:16px 0 8px;font-size:14px">${t('adjustedMeans')}</h4>
    <table class="result-table">
        <thead><tr><th>${t('group')}</th><th>N</th><th>${t('observedMean')}</th><th>${t('adjustedMean')}</th></tr></thead>
        <tbody>`;

    result.groups?.forEach(g => {
        html += `<tr>
            <td><strong>${g}</strong></td>
            <td>${result.groupStats?.[g]?.n || 'N/A'}</td>
            <td>${result.groupStats?.[g]?.meanY?.toFixed(4) || 'N/A'}</td>
            <td>${result.adjustedMeans?.[g]?.toFixed(4) || 'N/A'}</td>
        </tr>`;
    });
    html += `</tbody></table>`;

    // Covariate Slope
    html += `<div style="margin-top:16px;padding:12px;border-radius:8px;background:var(--bg-tertiary)">
        <div><strong>${t('covariateSlope')}:</strong> ${result.covariateSlope?.toFixed(4) || 'N/A'}</div>
        <div><strong>N:</strong> ${result.N || 'N/A'}</div>
    </div>`;

    // Conclusion
    html += `<h4 style="margin:16px 0 8px;font-size:14px">${t('conclusions')} (α = 0.05)</h4>
    <ul style="margin:0;padding-left:20px">
        <li>${t('groupEffect')}: ${result.groupEffect?.significant ? '✓ ' + t('significant') : '✗ ' + t('notSignificant')}</li>
        <li>${t('covariateEffect')}: ${result.covariateEffect?.significant ? '✓ ' + t('significant') : '✗ ' + t('notSignificant')}</li>
    </ul>`;

    return html;
}

// ===== Non-Parametric Test Render Functions =====

function renderMannWhitneyUResult(result) {
    const sigClass = result.significant ? 'color:#22c55e;font-weight:bold' : 'color:#ef4444';

    let html = `<h4 style="margin:0 0 8px;font-size:14px">${t('groupStatistics')}</h4>
    <table class="result-table">
        <thead><tr><th>${t('group')}</th><th>N</th><th>${t('median')}</th><th>${t('sumRanks') || 'Sum Ranks'}</th></tr></thead>
        <tbody>
        <tr><td>${result.groupNames?.[0] || 'Group 1'}</td><td>${result.n1}</td><td>${result.median1?.toFixed(4)}</td><td>${result.R1?.toFixed(2)}</td></tr>
        <tr><td>${result.groupNames?.[1] || 'Group 2'}</td><td>${result.n2}</td><td>${result.median2?.toFixed(4)}</td><td>${result.R2?.toFixed(2)}</td></tr>
        </tbody>
    </table>`;

    html += `<h4 style="margin:16px 0 8px;font-size:14px">${t('testResults')}</h4>
    <table class="result-table">
        <tbody>
        <tr><th>U</th><td>${result.U?.toFixed(2)}</td></tr>
        <tr><th>Z</th><td>${result.zStatistic?.toFixed(4)}</td></tr>
        <tr><th>P-${t('value')}</th><td style="${sigClass}">${result.pValue?.toFixed(4)}</td></tr>
        <tr><th>${t('effectSize') || 'Effect Size'} (r)</th><td>${result.effectSize?.toFixed(4)} (${t(result.effectSizeLabel)})</td></tr>
        </tbody>
    </table>`;

    html += `<div style="margin-top:16px;padding:12px;border-radius:8px;background:${result.significant ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'}">
        <strong style="${sigClass}">${t(result.conclusion?.includes('Significant') ? 'significant' : 'notSignificant')}</strong> (α = 0.05)
    </div>`;

    return html;
}

function renderWilcoxonSignedRankResult(result) {
    const sigClass = result.significant ? 'color:#22c55e;font-weight:bold' : 'color:#ef4444';

    let html = `<h4 style="margin:0 0 8px;font-size:14px">${t('sampleStatistics')}</h4>
    <table class="result-table">
        <tbody>
        <tr><th>${t('sample1')}</th><td>${t('median')}: ${result.median1?.toFixed(4)}</td></tr>
        <tr><th>${t('sample2')}</th><td>${t('median')}: ${result.median2?.toFixed(4)}</td></tr>
        <tr><th>${t('medianDiff') || 'Median Difference'}</th><td>${result.medianDiff?.toFixed(4)}</td></tr>
        </tbody>
    </table>`;

    html += `<h4 style="margin:16px 0 8px;font-size:14px">${t('testResults')}</h4>
    <table class="result-table">
        <tbody>
        <tr><th>${t('pairs')}</th><td>${result.nPairs} (${result.nEffective} ${t('effective') || 'effective'})</td></tr>
        <tr><th>W+</th><td>${result.Wplus?.toFixed(2)}</td></tr>
        <tr><th>W-</th><td>${result.Wminus?.toFixed(2)}</td></tr>
        <tr><th>W</th><td>${result.W?.toFixed(2)}</td></tr>
        <tr><th>Z</th><td>${result.zStatistic?.toFixed(4)}</td></tr>
        <tr><th>P-${t('value')}</th><td style="${sigClass}">${result.pValue?.toFixed(4)}</td></tr>
        <tr><th>${t('effectSize') || 'Effect Size'} (r)</th><td>${result.effectSize?.toFixed(4)} (${t(result.effectSizeLabel)})</td></tr>
        </tbody>
    </table>`;

    html += `<div style="margin-top:16px;padding:12px;border-radius:8px;background:${result.significant ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'}">
        <strong style="${sigClass}">${t(result.conclusion?.includes('Significant') ? 'significant' : 'notSignificant')}</strong> (α = 0.05)
    </div>`;

    return html;
}

function renderKruskalWallisResult(result) {
    const sigClass = result.significant ? 'color:#22c55e;font-weight:bold' : 'color:#ef4444';

    let html = `<h4 style="margin:0 0 8px;font-size:14px">${t('groupStatistics')}</h4>
    <table class="result-table">
        <thead><tr><th>${t('group')}</th><th>N</th><th>${t('median')}</th><th>${t('meanRank') || 'Mean Rank'}</th></tr></thead>
        <tbody>`;

    result.groups?.forEach(g => {
        const stats = result.groupStats?.[g];
        html += `<tr>
            <td>${g}</td>
            <td>${stats?.n}</td>
            <td>${stats?.median?.toFixed(4)}</td>
            <td>${stats?.meanRank?.toFixed(2)}</td>
        </tr>`;
    });

    html += `</tbody></table>`;

    html += `<h4 style="margin:16px 0 8px;font-size:14px">${t('testResults')}</h4>
    <table class="result-table">
        <tbody>
        <tr><th>H (${t('statistic')})</th><td>${result.H?.toFixed(4)}</td></tr>
        <tr><th>${t('degreesOfFreedom')}</th><td>${result.df}</td></tr>
        <tr><th>P-${t('value')}</th><td style="${sigClass}">${result.pValue?.toFixed(4)}</td></tr>
        <tr><th>η² (${t('effectSize') || 'Effect Size'})</th><td>${result.etaSquared?.toFixed(4)}</td></tr>
        </tbody>
    </table>`;

    html += `<div style="margin-top:16px;padding:12px;border-radius:8px;background:${result.significant ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'}">
        <strong style="${sigClass}">${t(result.conclusion?.includes('Significant') ? 'significant' : 'notSignificant')}</strong> (α = 0.05)
    </div>`;

    return html;
}

function renderFriedmanResult(result) {
    const sigClass = result.significant ? 'color:#22c55e;font-weight:bold' : 'color:#ef4444';

    let html = `<h4 style="margin:0 0 8px;font-size:14px">${t('conditionColumn') || 'Conditions'}</h4>
    <table class="result-table">
        <thead><tr><th>${t('condition') || 'Condition'}</th><th>${t('sumRanks') || 'Sum Ranks'}</th><th>${t('meanRank') || 'Mean Rank'}</th></tr></thead>
        <tbody>`;

    result.conditions?.forEach(c => {
        html += `<tr>
            <td>${c}</td>
            <td>${result.rankSums?.[c]?.toFixed(2)}</td>
            <td>${result.meanRanks?.[c]?.toFixed(2)}</td>
        </tr>`;
    });

    html += `</tbody></table>`;

    html += `<h4 style="margin:16px 0 8px;font-size:14px">${t('testResults')}</h4>
    <table class="result-table">
        <tbody>
        <tr><th>${t('subjects') || 'Subjects'}</th><td>${result.n}</td></tr>
        <tr><th>χ² (${t('statistic')})</th><td>${result.Q?.toFixed(4)}</td></tr>
        <tr><th>${t('degreesOfFreedom')}</th><td>${result.df}</td></tr>
        <tr><th>P-${t('value')}</th><td style="${sigClass}">${result.pValue?.toFixed(4)}</td></tr>
        <tr><th>Kendall's W</th><td>${result.kendallW?.toFixed(4)}</td></tr>
        </tbody>
    </table>`;

    html += `<div style="margin-top:16px;padding:12px;border-radius:8px;background:${result.significant ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'}">
        <strong style="${sigClass}">${t(result.conclusion?.includes('Significant') ? 'significant' : 'notSignificant')}</strong> (α = 0.05)
    </div>`;

    return html;
}

function renderChiSquareTestResult(result) {
    const sigClass = result.significant ? 'color:#22c55e;font-weight:bold' : 'color:#ef4444';

    // Contingency Table
    let html = `<h4 style="margin:0 0 8px;font-size:14px">${t('contingencyTable') || 'Contingency Table'}</h4>
    <table class="result-table">
        <thead><tr><th></th>${result.var2Values?.map(v => `<th>${v}</th>`).join('')}<th>${t('total')}</th></tr></thead>
        <tbody>`;

    result.var1Values?.forEach(v1 => {
        html += `<tr><th>${v1}</th>`;
        result.var2Values?.forEach(v2 => {
            html += `<td>${result.observed?.[v1]?.[v2] || 0}</td>`;
        });
        html += `<td><strong>${result.rowTotals?.[v1] || 0}</strong></td></tr>`;
    });

    html += `<tr><th>${t('total')}</th>`;
    result.var2Values?.forEach(v2 => {
        html += `<td><strong>${result.colTotals?.[v2] || 0}</strong></td>`;
    });
    html += `<td><strong>${result.grandTotal || 0}</strong></td></tr>`;

    html += `</tbody></table>`;

    // Test Results
    html += `<h4 style="margin:16px 0 8px;font-size:14px">${t('testResults')}</h4>
    <table class="result-table">
        <tbody>
        <tr><th>χ²</th><td>${result.chiSquare?.toFixed(4)}</td></tr>
        <tr><th>${t('degreesOfFreedom')}</th><td>${result.df}</td></tr>
        <tr><th>P-${t('value')}</th><td style="${sigClass}">${result.pValue?.toFixed(4)}</td></tr>
        <tr><th>Cramér's V</th><td>${result.cramersV?.toFixed(4)} (${t(result.effectSizeLabel)})</td></tr>
        </tbody>
    </table>`;

    html += `<div style="margin-top:16px;padding:12px;border-radius:8px;background:${result.significant ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'}">
        <strong style="${sigClass}">${result.significant ? t('variablesAssociated') || 'Variables are associated' : t('variablesIndependent') || 'Variables are independent'}</strong> (α = 0.05)
    </div>`;

    return html;
}

function renderSpearmanCorrelationResult(result) {
    const sigClass = result.significant ? 'color:#22c55e;font-weight:bold' : 'color:#ef4444';

    let html = `<h4 style="margin:0 0 8px;font-size:14px">${t('spearmanCorrelation') || "Spearman's Correlation"}</h4>
    <table class="result-table">
        <tbody>
        <tr><th>N</th><td>${result.n}</td></tr>
        <tr><th>ρ (rho)</th><td><strong style="font-size:1.2em">${result.rho?.toFixed(4)}</strong></td></tr>
        <tr><th>${t('direction') || 'Direction'}</th><td>${t(result.direction)}</td></tr>
        <tr><th>${t('strength') || 'Strength'}</th><td>${t(result.strength)}</td></tr>
        <tr><th>t-${t('statistic')}</th><td>${result.tStatistic?.toFixed(4)}</td></tr>
        <tr><th>${t('degreesOfFreedom')}</th><td>${result.df}</td></tr>
        <tr><th>P-${t('value')}</th><td style="${sigClass}">${result.pValue?.toFixed(4)}</td></tr>
        </tbody>
    </table>`;

    html += `<div style="margin-top:16px;padding:12px;border-radius:8px;background:${result.significant ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'}">
        <strong style="${sigClass}">${t(result.conclusion?.includes('Significant') ? 'significantCorrelation' : 'noSignificantCorrelation') || result.conclusion}</strong> (α = 0.05)
    </div>`;

    return html;
}

function renderMultiRegressionResult(result) {
    // Regression Equation
    let html = `<div class="regression-equation" style="background:var(--bg-tertiary);padding:12px;border-radius:8px;margin-bottom:16px;font-family:monospace;font-size:13px;overflow-x:auto">
        <strong>${t('equation')}:</strong><br>
        <span style="color:var(--primary)">${result.equation || 'N/A'}</span>
    </div>`;

    // Model Summary Table
    html += `<h4 style="margin:16px 0 8px;font-size:14px">${t('estimationMethod')}: <strong>${result.method || 'OLS'}</strong></h4>
    <table class="result-table">
        <tbody>
        <tr><th>${t('rSquared')}</th><td>${result.rSquared?.toFixed(4) || 'N/A'}</td>
            <th>${t('adjRSquared')}</th><td>${result.adjRSquared?.toFixed(4) || 'N/A'}</td></tr>
        <tr><th>${t('fStatistic')}</th><td>${result.fStatistic?.toFixed(4) || 'N/A'}</td>
            <th>P(F)</th><td>${result.fPValue?.toFixed(4) || 'N/A'}</td></tr>
        <tr><th>${t('durbinWatson')}</th><td>${result.durbinWatson?.toFixed(4) || 'N/A'}</td>
            <th>${t('modelSignificant')}</th><td>${result.fPValue < 0.05 ? '✓ ' + t('yes') : '✗ ' + t('no')}</td></tr>
        <tr><th>N</th><td>${result.n || 'N/A'}</td>
            <th>K</th><td>${result.k || 'N/A'}</td></tr>
        </tbody>
    </table>`;

    // Coefficients Table
    html += `<h4 style="margin:16px 0 8px;font-size:14px">${t('coefficient')}s</h4>
    <table class="result-table">
        <thead><tr>
            <th>Variable</th>
            <th>${t('coefficient')}</th>
            <th>${t('stdError')}</th>
            <th>${t('tStat')}</th>
            <th>P-Value</th>
            <th>${t('significant')}</th>
        </tr></thead>
        <tbody>
        <tr>
            <td><strong>${t('intercept')}</strong></td>
            <td>${result.intercept?.toFixed(4) || 'N/A'}</td>
            <td>${result.interceptStdError?.toFixed(4) || 'N/A'}</td>
            <td>${result.interceptTStat?.toFixed(4) || 'N/A'}</td>
            <td>${result.interceptPValue?.toFixed(4) || 'N/A'}</td>
            <td>${result.interceptPValue < 0.05 ? '<span style="color:#22c55e">✓</span>' : '<span style="color:#ef4444">✗</span>'}</td>
        </tr>`;

    if (result.allVariables && result.coefficients) {
        result.allVariables.forEach((varName, i) => {
            const coef = result.coefficients[i];
            const se = result.stdErrors?.[i];
            const tStat = result.tStats?.[i];
            const pVal = result.pValues?.[i];
            const sig = pVal < 0.05;
            html += `<tr>
                <td><strong>${varName}</strong></td>
                <td>${coef?.toFixed(4) || 'N/A'}</td>
                <td>${se?.toFixed(4) || 'N/A'}</td>
                <td>${tStat?.toFixed(4) || 'N/A'}</td>
                <td>${pVal?.toFixed(4) || 'N/A'}</td>
                <td>${sig ? '<span style="color:#22c55e">✓</span>' : '<span style="color:#ef4444">✗</span>'}</td>
            </tr>`;
        });
    } else if (result.coefficients) {
        result.coefficients.forEach((c, i) => {
            html += `<tr>
                <td><strong>${result.independents?.[i] || 'X' + (i + 1)}</strong></td>
                <td>${c.toFixed(4)}</td>
                <td>N/A</td><td>N/A</td><td>N/A</td><td>-</td>
            </tr>`;
        });
    }
    html += `</tbody></table>`;

    // Instruments info for 2SLS/GMM/LIML
    if (result.instruments?.length) {
        html += `<div style="margin-top:16px;padding:12px;background:var(--bg-tertiary);border-radius:8px">
            <strong>${t('instruments')}:</strong> ${result.instruments.join(', ')}
        </div>`;
    }

    // AR/MA terms info
    if (result.arLabels?.length) {
        html += `<div style="margin-top:8px;padding:12px;background:var(--bg-tertiary);border-radius:8px">
            <strong>AR Terms:</strong> ${result.arLabels.join(', ')}
        </div>`;
    }

    // Model Diagnostics
    if (result.diagnostics) {
        const d = result.diagnostics;
        html += `<h4 style="margin:16px 0 8px;font-size:14px">${t('modelDiagnostics')}</h4>
        <table class="result-table">
            <thead><tr>
                <th>${t('test')}</th>
                <th>${t('testStatistic')}</th>
                <th>P-Value</th>
                <th>${t('conclusion')}</th>
            </tr></thead>
            <tbody>`;

        // Jarque-Bera Test
        if (d.jarqueBera) {
            const jb = d.jarqueBera;
            const jbColor = jb.isNormal ? '#22c55e' : '#ef4444';
            html += `<tr>
                <td><strong>${t('jarqueBera')}</strong></td>
                <td>${jb.statistic?.toFixed(4) || 'N/A'}</td>
                <td>${jb.pValue?.toFixed(4) || 'N/A'}</td>
                <td style="color:${jbColor};font-weight:600">${jb.isNormal ? '✓ ' + t('normalResiduals') : '✗ ' + t('nonNormalResiduals')}</td>
            </tr>`;
        }

        // Serial Correlation (Breusch-Godfrey)
        if (d.serialCorrelation) {
            const sc = d.serialCorrelation;
            const scColor = sc.hasSerialCorrelation ? '#ef4444' : '#22c55e';
            html += `<tr>
                <td><strong>${t('serialCorrelation')}</strong></td>
                <td>${sc.statistic?.toFixed(4) || 'N/A'}</td>
                <td>${sc.pValue?.toFixed(4) || 'N/A'}</td>
                <td style="color:${scColor};font-weight:600">${sc.hasSerialCorrelation ? '✗ ' + t('hasSerialCorrelation') : '✓ ' + t('noSerialCorrelation')}</td>
            </tr>`;
        }

        // Heteroskedasticity (Breusch-Pagan)
        if (d.heteroskedasticity) {
            const bp = d.heteroskedasticity;
            const bpColor = bp.hasHeteroskedasticity ? '#ef4444' : '#22c55e';
            html += `<tr>
                <td><strong>${t('heteroskedasticity')}</strong></td>
                <td>${bp.statistic?.toFixed(4) || 'N/A'}</td>
                <td>${bp.pValue?.toFixed(4) || 'N/A'}</td>
                <td style="color:${bpColor};font-weight:600">${bp.hasHeteroskedasticity ? '✗ ' + t('hasHeteroskedasticity') : '✓ ' + t('homoskedastic')}</td>
            </tr>`;
        }

        html += `</tbody></table>`;
    }

    return html;
}

function renderARDLResult(result) {
    let html = '';

    // Model Specification
    html += `<div class="regression-equation" style="background:var(--bg-tertiary);padding:12px;border-radius:8px;margin-bottom:16px;font-family:monospace;font-size:13px">
        <strong>${t('ardl')}:</strong> <span style="color:var(--primary)">${result.specification || 'ARDL Model'}</span>
    </div>`;

    // Bounds Test Section
    if (result.boundsTest) {
        const bt = result.boundsTest;
        const conclusionColor = bt.conclusion.includes('exists') || bt.conclusion.includes('يوجد') ? '#22c55e' :
            bt.conclusion.includes('No') || bt.conclusion.includes('لا') ? '#ef4444' : '#f59e0b';
        html += `<h4 style="margin:16px 0 8px;font-size:14px">${t('boundsTest')}</h4>
        <table class="result-table">
            <tbody>
            <tr><th>F-${t('fStatistic')}</th><td><strong>${bt.fStatistic?.toFixed(4) || 'N/A'}</strong></td></tr>
            <tr><th>${t('criticalValues')} (5%)</th><td>${t('lowerBound')}: ${bt.criticalValues?.lower?.toFixed(2)} | ${t('upperBound')}: ${bt.criticalValues?.upper?.toFixed(2)}</td></tr>
            <tr><th>${t('cointegration')}</th><td style="color:${conclusionColor};font-weight:600">${bt.conclusion}</td></tr>
            </tbody>
        </table>`;
    }

    // Model Diagnostics
    if (result.diagnostics) {
        const d = result.diagnostics;
        html += `<h4 style="margin:16px 0 8px;font-size:14px">${t('modelDiagnostics')}</h4>
        <table class="result-table">
            <tbody>
            <tr><th>${t('rSquared')}</th><td>${d.rSquared?.toFixed(4) || 'N/A'}</td>
                <th>${t('adjRSquared')}</th><td>${d.adjRSquared?.toFixed(4) || 'N/A'}</td></tr>
            <tr><th>${t('fStatistic')}</th><td>${d.fStatistic?.toFixed(4) || 'N/A'}</td>
                <th>P(F)</th><td>${d.fPValue?.toFixed(4) || 'N/A'}</td></tr>
            <tr><th>${t('durbinWatson')}</th><td>${d.durbinWatson?.toFixed(4) || 'N/A'}</td>
                <th>N</th><td>${d.n || 'N/A'}</td></tr>
            </tbody>
        </table>`;

        // Diagnostic Tests Table
        html += `<h4 style="margin:16px 0 8px;font-size:14px">${t('diagnosticTests')}</h4>
        <table class="result-table">
            <thead><tr>
                <th>${t('test')}</th>
                <th>${t('testStatistic')}</th>
                <th>P-Value</th>
                <th>${t('conclusion')}</th>
            </tr></thead>
            <tbody>`;

        // Jarque-Bera Test
        if (d.jarqueBera) {
            const jb = d.jarqueBera;
            const jbColor = jb.isNormal ? '#22c55e' : '#ef4444';
            html += `<tr>
                <td><strong>${t('jarqueBera')}</strong></td>
                <td>${jb.statistic?.toFixed(4) || 'N/A'}</td>
                <td>${jb.pValue?.toFixed(4) || 'N/A'}</td>
                <td style="color:${jbColor};font-weight:600">${jb.isNormal ? '✓ ' + t('normalResiduals') : '✗ ' + t('nonNormalResiduals')}</td>
            </tr>`;
        }

        // Serial Correlation (Breusch-Godfrey)
        if (d.serialCorrelation) {
            const sc = d.serialCorrelation;
            const scColor = sc.hasSerialCorrelation ? '#ef4444' : '#22c55e';
            html += `<tr>
                <td><strong>${t('serialCorrelation')}</strong></td>
                <td>${sc.statistic?.toFixed(4) || 'N/A'}</td>
                <td>${sc.pValue?.toFixed(4) || 'N/A'}</td>
                <td style="color:${scColor};font-weight:600">${sc.hasSerialCorrelation ? '✗ ' + t('hasSerialCorrelation') : '✓ ' + t('noSerialCorrelation')}</td>
            </tr>`;
        }

        // Heteroskedasticity (Breusch-Pagan)
        if (d.heteroskedasticity) {
            const bp = d.heteroskedasticity;
            const bpColor = bp.hasHeteroskedasticity ? '#ef4444' : '#22c55e';
            html += `<tr>
                <td><strong>${t('heteroskedasticity')}</strong></td>
                <td>${bp.statistic?.toFixed(4) || 'N/A'}</td>
                <td>${bp.pValue?.toFixed(4) || 'N/A'}</td>
                <td style="color:${bpColor};font-weight:600">${bp.hasHeteroskedasticity ? '✗ ' + t('hasHeteroskedasticity') : '✓ ' + t('homoskedastic')}</td>
            </tr>`;
        }

        // CUSUM Test
        if (d.cusum) {
            const cs = d.cusum;
            const csColor = cs.isStable ? '#22c55e' : '#ef4444';
            html += `<tr>
                <td><strong>${t('cusumTest')}</strong></td>
                <td>${cs.statistic?.toFixed(4) || 'N/A'}</td>
                <td>CV: ${cs.criticalValue?.toFixed(4) || 'N/A'}</td>
                <td style="color:${csColor};font-weight:600">${cs.isStable ? '✓ ' + t('cusumStable') : '✗ ' + t('cusumUnstable')}</td>
            </tr>`;
        }

        // Ramsey RESET Test
        if (d.ramseyReset) {
            const rr = d.ramseyReset;
            const rrColor = rr.isCorrect ? '#22c55e' : '#ef4444';
            html += `<tr>
                <td><strong>${t('ramseyReset')}</strong></td>
                <td>${rr.statistic?.toFixed(4) || 'N/A'}</td>
                <td>${rr.pValue?.toFixed(4) || 'N/A'}</td>
                <td style="color:${rrColor};font-weight:600">${rr.isCorrect ? '✓ ' + t('correctSpecification') : '✗ ' + t('misspecification')}</td>
            </tr>`;
        }

        // Bounds Test (from boundsTest result)
        if (result.boundsTest) {
            const bt = result.boundsTest;
            const btColor = bt.conclusion?.includes('exists') || bt.conclusion?.includes('يوجد') ? '#22c55e' :
                bt.conclusion?.includes('No') || bt.conclusion?.includes('لا') ? '#ef4444' : '#f59e0b';
            const btConclusion = bt.conclusion?.includes('exists') || bt.conclusion?.includes('يوجد') ?
                '✓ ' + t('cointegrationExists') :
                bt.conclusion?.includes('No') || bt.conclusion?.includes('لا') ?
                    '✗ ' + t('noCointegration') : '⚠ ' + t('inconclusive');
            html += `<tr>
                <td><strong>${t('boundsTest')}</strong></td>
                <td>F = ${bt.fStatistic?.toFixed(4) || 'N/A'}</td>
                <td>I(0): ${bt.criticalValues?.lower?.toFixed(2)} | I(1): ${bt.criticalValues?.upper?.toFixed(2)}</td>
                <td style="color:${btColor};font-weight:600">${btConclusion}</td>
            </tr>`;
        }

        html += `</tbody></table>`;
    }

    // Long-Run Coefficients
    if (result.longRun) {
        const lr = result.longRun;
        html += `<h4 style="margin:16px 0 8px;font-size:14px">${t('longRunCoef')}</h4>
        <table class="result-table">
            <thead><tr><th>Variable</th><th>${t('coefficient')}</th></tr></thead>
            <tbody>
            <tr><td><strong>${t('intercept')}</strong></td><td>${lr.intercept?.toFixed(4) || 'N/A'}</td></tr>`;
        if (lr.coefficients) {
            for (const [varName, coef] of Object.entries(lr.coefficients)) {
                html += `<tr><td><strong>${varName}</strong></td><td>${coef?.toFixed(4) || 'N/A'}</td></tr>`;
            }
        }
        html += `</tbody></table>
        <div style="margin-top:8px;font-size:12px;color:var(--text-muted)">
            Long-run multiplier: ${lr.multiplier?.toFixed(4) || 'N/A'} | AR Sum: ${lr.arSum?.toFixed(4) || 'N/A'}
        </div>`;
    }

    // Short-Run Coefficients (ECM)
    if (result.shortRun) {
        const sr = result.shortRun;
        const ecmColor = sr.ecm < 0 && sr.ecm > -1 ? '#22c55e' : sr.ecm < -1 ? '#f59e0b' : '#ef4444';
        html += `<h4 style="margin:16px 0 8px;font-size:14px">${t('shortRunCoef')} (ECM)</h4>
        <div style="background:var(--bg-tertiary);padding:12px;border-radius:8px;margin-bottom:12px">
            <strong>${t('ecm')}:</strong> <span style="color:${ecmColor};font-weight:600">${sr.ecm?.toFixed(4) || 'N/A'}</span>
            <span style="font-size:12px;margin-left:8px">(${sr.ecmInterpretation || ''})</span>
        </div>
        <table class="result-table">
            <thead><tr>
                <th>Variable</th>
                <th>${t('coefficient')}</th>
                <th>${t('stdError')}</th>
                <th>${t('tStat')}</th>
                <th>P-Value</th>
            </tr></thead>
            <tbody>
            <tr><td><strong>${t('intercept')}</strong></td><td>${sr.intercept?.toFixed(4) || 'N/A'}</td><td>-</td><td>-</td><td>-</td></tr>`;
        if (sr.coefficients) {
            sr.coefficients.forEach(c => {
                html += `<tr>
                    <td><strong>${c.name}</strong></td>
                    <td>${c.coefficient?.toFixed(4) || 'N/A'}</td>
                    <td>${c.stdError?.toFixed(4) || 'N/A'}</td>
                    <td>${c.tStat?.toFixed(4) || 'N/A'}</td>
                    <td>${c.pValue?.toFixed(4) || 'N/A'}</td>
                </tr>`;
            });
        }
        html += `</tbody></table>`;
    }

    return html;
}

function renderVARVECMResult(result) {
    let html = '';

    // Model Specification
    html += `<div class="regression-equation" style="background:var(--bg-tertiary);padding:12px;border-radius:8px;margin-bottom:16px;font-family:monospace;font-size:13px">
        <strong>${t('var')}:</strong> <span style="color:var(--primary)">${result.var?.specification || 'VAR Model'}</span>
        <span style="margin-left:16px;color:var(--text-muted)">Variables: ${result.varNames?.join(', ') || 'N/A'}</span>
    </div>`;

    // Information Criteria
    if (result.var?.informationCriteria) {
        const ic = result.var.informationCriteria;
        html += `<h4 style="margin:16px 0 8px;font-size:14px">${t('informationCriteria')}</h4>
        <table class="result-table">
            <tbody>
            <tr><th>AIC</th><td>${ic.AIC?.toFixed(4) || 'N/A'}</td>
                <th>BIC</th><td>${ic.BIC?.toFixed(4) || 'N/A'}</td>
                <th>HQ</th><td>${ic.HQ?.toFixed(4) || 'N/A'}</td></tr>
            <tr><th>N</th><td>${result.var?.n || 'N/A'}</td>
                <th>K</th><td>${result.var?.k || 'N/A'}</td>
                <th>Lags (p)</th><td>${result.var?.p || 'N/A'}</td></tr>
            </tbody>
        </table>`;
    }

    // VAR Equations
    if (result.var?.equations) {
        html += `<h4 style="margin:16px 0 8px;font-size:14px">${t('varEquation')}s</h4>`;
        for (const [varName, eq] of Object.entries(result.var.equations)) {
            html += `<div style="margin-bottom:16px;padding:12px;background:var(--bg-tertiary);border-radius:8px">
            <h5 style="margin:0 0 8px;font-size:13px;color:var(--primary)">${varName} Equation</h5>
            <table class="result-table" style="font-size:12px">
                <tbody>
                <tr><th>R²</th><td>${eq.rSquared?.toFixed(4) || 'N/A'}</td>
                    <th>Adj. R²</th><td>${eq.adjRSquared?.toFixed(4) || 'N/A'}</td></tr>
                <tr><th>F-Stat</th><td>${eq.fStatistic?.toFixed(4) || 'N/A'}</td>
                    <th>D-W</th><td>${eq.durbinWatson?.toFixed(4) || 'N/A'}</td></tr>
                </tbody>
            </table>
            <details style="margin-top:8px">
                <summary style="cursor:pointer;font-size:12px">${t('coefficient')}s</summary>
                <table class="result-table" style="margin-top:8px;font-size:11px">
                    <thead><tr><th>Variable</th><th>${t('coefficient')}</th><th>${t('stdError')}</th><th>t-Stat</th><th>P-Value</th></tr></thead>
                    <tbody>
                    <tr><td>${t('intercept')}</td><td>${eq.intercept?.toFixed(4)}</td>
                        <td>${eq.interceptStdError?.toFixed(4) || '-'}</td>
                        <td>${eq.interceptTStat?.toFixed(4) || '-'}</td>
                        <td>${eq.interceptPValue?.toFixed(4) || '-'}</td></tr>
                    ${eq.coefficients?.map((c, i) => `<tr>
                        <td>${eq.regNames?.[i] || 'X' + i}</td>
                        <td>${c?.toFixed(4)}</td>
                        <td>${eq.stdErrors?.[i]?.toFixed(4) || '-'}</td>
                        <td>${eq.tStats?.[i]?.toFixed(4) || '-'}</td>
                        <td>${eq.pValues?.[i]?.toFixed(4) || '-'}</td>
                    </tr>`).join('') || ''}
                    </tbody>
                </table>
            </details>
            </div>`;
        }
    }

    // Johansen Cointegration Test
    if (result.johansen) {
        const jh = result.johansen;
        const rankColor = jh.rank > 0 ? '#22c55e' : '#ef4444';
        html += `<h4 style="margin:16px 0 8px;font-size:14px">${t('johansenTest')}</h4>
        <div style="background:var(--bg-tertiary);padding:12px;border-radius:8px;margin-bottom:12px">
            <strong>${t('cointegrationRank')}:</strong> 
            <span style="color:${rankColor};font-weight:600">${jh.rank}</span>
            <span style="margin-left:16px;font-size:12px;color:var(--text-muted)">(${jh.specification || ''})</span>
        </div>
        
        <table class="result-table">
            <thead><tr>
                <th>H₀: rank ≤</th>
                <th>${t('eigenvalues')}</th>
                <th>${t('traceTest')}</th>
                <th>Critical (5%)</th>
                <th>${t('maxEigenTest')}</th>
                <th>Critical (5%)</th>
            </tr></thead>
            <tbody>
            ${jh.eigenvalues?.map((ev, i) => `<tr>
                <td>${i}</td>
                <td>${ev?.toFixed(4)}</td>
                <td style="${jh.traceStatistics?.[i] > jh.traceCriticalValues?.[i] ? 'color:#22c55e;font-weight:600' : ''}">${jh.traceStatistics?.[i]?.toFixed(4) || '-'}</td>
                <td>${jh.traceCriticalValues?.[i]?.toFixed(2) || '-'}</td>
                <td style="${jh.maxStatistics?.[i] > jh.maxCriticalValues?.[i] ? 'color:#22c55e;font-weight:600' : ''}">${jh.maxStatistics?.[i]?.toFixed(4) || '-'}</td>
                <td>${jh.maxCriticalValues?.[i]?.toFixed(2) || '-'}</td>
            </tr>`).join('') || ''}
            </tbody>
        </table>`;
    }

    // VECM Results
    if (result.vecm) {
        const vm = result.vecm;
        html += `<h4 style="margin:16px 0 8px;font-size:14px">${t('vecm')} - ${vm.specification || ''}</h4>
        
        <div style="background:var(--bg-tertiary);padding:12px;border-radius:8px;margin-bottom:12px">
            <strong>${t('adjustmentCoef')} (α):</strong><br>
            ${Object.entries(vm.alpha || {}).map(([v, a]) =>
            `<span style="display:inline-block;margin:4px 8px 4px 0;padding:4px 8px;background:var(--bg-primary);border-radius:4px">
                    ${v}: <strong style="color:${a < 0 ? '#22c55e' : '#ef4444'}">${a?.toFixed(4)}</strong>
                </span>`
        ).join('')}
        </div>`;

        // VECM Equations
        if (vm.equations) {
            html += `<details style="margin-top:12px">
                <summary style="cursor:pointer;font-weight:600">VECM ${t('varEquation')}s</summary>`;
            for (const [varName, eq] of Object.entries(vm.equations)) {
                html += `<div style="margin:8px 0;padding:8px;background:var(--bg-tertiary);border-radius:4px">
                    <strong>Δ${varName}:</strong> R²=${eq.rSquared?.toFixed(4)}, DW=${eq.durbinWatson?.toFixed(4)}
                </div>`;
            }
            html += `</details>`;
        }
    }

    // Granger Causality Tests
    if (result.grangerTests?.length) {
        html += `<h4 style="margin:16px 0 8px;font-size:14px">${t('grangerCausality')}</h4>
        <table class="result-table">
            <thead><tr>
                <th>Null Hypothesis</th>
                <th>F-Statistic</th>
                <th>P-Value</th>
                <th>Result</th>
            </tr></thead>
            <tbody>
            ${result.grangerTests.map(gt => `<tr>
                <td>${gt.causingVar} → ${gt.affectedVar}</td>
                <td>${gt.fStatistic?.toFixed(4)}</td>
                <td>${gt.pValue?.toFixed(4)}</td>
                <td style="color:${gt.significant ? '#22c55e' : '#ef4444'};font-weight:600">
                    ${gt.significant ? '✓ ' + t('causesGranger') : '✗ ' + t('doesNotCauseGranger')}
                </td>
            </tr>`).join('')}
            </tbody>
        </table>`;
    }

    return html;
}

function renderStationarityResult(result) {
    let html = '';

    // Variable Info
    const trendLabels = { 'n': t('trendNone'), 'c': t('trendConstant'), 'ct': t('trendConstantTrend') };

    html += `<div class="regression-equation" style="background:var(--bg-tertiary);padding:12px;border-radius:8px;margin-bottom:16px">
        <strong>${t('stationarityTest')}</strong><br>
        <span style="color:var(--primary)">${result.variableLabel || result.variable}</span>
        <span style="margin-left:16px;color:var(--text-muted)">N: ${result.n}</span>
        <span style="margin-left:16px;color:var(--text-muted)">${t('trendOption')}: ${trendLabels[result.trend] || result.trend}</span>
    </div>`;

    // Overall Conclusion
    const conclusionColor = result.conclusion === 'stationary' || result.conclusion === 'likely stationary' ? '#22c55e' :
        result.conclusion === 'non-stationary' || result.conclusion === 'likely non-stationary' ? '#ef4444' : '#f59e0b';
    html += `<div style="background:var(--bg-tertiary);padding:16px;border-radius:8px;margin-bottom:16px;text-align:center">
        <strong style="font-size:16px">${t('conclusion')}</strong><br>
        <span style="color:${conclusionColor};font-size:20px;font-weight:700">${result.conclusion?.toUpperCase()}</span>
    </div>`;

    // ADF Test Results
    if (result.adf) {
        const adf = result.adf;
        const adfColor = adf.isStationary ? '#22c55e' : '#ef4444';
        html += `<h4 style="margin:16px 0 8px;font-size:14px">${t('adfTest')} (ADF)</h4>
        <div style="margin-bottom:8px;padding:8px;background:var(--bg-tertiary);border-radius:4px;font-size:12px;color:var(--text-muted)">
            ${adf.hypothesis}
        </div>
        <table class="result-table">
            <tbody>
            <tr><th>${t('testStatistic')}</th><td style="color:${adfColor};font-weight:600">${adf.tStatistic?.toFixed(4) || 'N/A'}</td></tr>
            <tr><th>${t('pValue')}</th><td>${adf.pValue?.toFixed(4) || 'N/A'}</td></tr>
            <tr><th>${t('usedLag')}</th><td>${adf.usedLag ?? 'N/A'}</td></tr>
            <tr><th>${t('criticalValue')} (1%)</th><td>${adf.criticalValues?.['1%']?.toFixed(2) || 'N/A'}</td></tr>
            <tr><th>${t('criticalValue')} (5%)</th><td>${adf.criticalValues?.['5%']?.toFixed(2) || 'N/A'}</td></tr>
            <tr><th>${t('criticalValue')} (10%)</th><td>${adf.criticalValues?.['10%']?.toFixed(2) || 'N/A'}</td></tr>
            <tr><th>${t('conclusion')}</th><td style="color:${adfColor};font-weight:600">${adf.significant}</td></tr>
            </tbody>
        </table>`;
    }

    // KPSS Test Results
    if (result.kpss) {
        const kpss = result.kpss;
        const kpssColor = kpss.isStationary ? '#22c55e' : '#ef4444';
        html += `<h4 style="margin:16px 0 8px;font-size:14px">${t('kpssTest')}</h4>
        <div style="margin-bottom:8px;padding:8px;background:var(--bg-tertiary);border-radius:4px;font-size:12px;color:var(--text-muted)">
            ${kpss.hypothesis}
        </div>
        <table class="result-table">
            <tbody>
            <tr><th>${t('testStatistic')}</th><td style="color:${kpssColor};font-weight:600">${kpss.statistic?.toFixed(4) || 'N/A'}</td></tr>
            <tr><th>Bandwidth</th><td>${kpss.bandwidth ?? 'N/A'}</td></tr>
            <tr><th>${t('criticalValue')} (1%)</th><td>${kpss.criticalValues?.['1%']?.toFixed(3) || 'N/A'}</td></tr>
            <tr><th>${t('criticalValue')} (5%)</th><td>${kpss.criticalValues?.['5%']?.toFixed(3) || 'N/A'}</td></tr>
            <tr><th>${t('criticalValue')} (10%)</th><td>${kpss.criticalValues?.['10%']?.toFixed(3) || 'N/A'}</td></tr>
            <tr><th>${t('conclusion')}</th><td style="color:${kpssColor};font-weight:600">${kpss.significant}</td></tr>
            </tbody>
        </table>`;
    }

    // PP Test Results
    if (result.pp) {
        const pp = result.pp;
        const ppColor = pp.isStationary ? '#22c55e' : '#ef4444';
        html += `<h4 style="margin:16px 0 8px;font-size:14px">${t('ppTest')} (PP)</h4>
        <div style="margin-bottom:8px;padding:8px;background:var(--bg-tertiary);border-radius:4px;font-size:12px;color:var(--text-muted)">
            ${pp.hypothesis}
        </div>
        <table class="result-table">
            <tbody>
            <tr><th>${t('testStatistic')}</th><td style="color:${ppColor};font-weight:600">${pp.tStatistic?.toFixed(4) || 'N/A'}</td></tr>
            <tr><th>Bandwidth</th><td>${pp.bandwidth ?? 'N/A'}</td></tr>
            <tr><th>${t('criticalValue')} (1%)</th><td>${pp.criticalValues?.['1%']?.toFixed(2) || 'N/A'}</td></tr>
            <tr><th>${t('criticalValue')} (5%)</th><td>${pp.criticalValues?.['5%']?.toFixed(2) || 'N/A'}</td></tr>
            <tr><th>${t('criticalValue')} (10%)</th><td>${pp.criticalValues?.['10%']?.toFixed(2) || 'N/A'}</td></tr>
            <tr><th>${t('conclusion')}</th><td style="color:${ppColor};font-weight:600">${pp.significant}</td></tr>
            </tbody>
        </table>`;
    }

    // Transformation Info
    if (result.transformation !== 'none' || result.differencing > 0) {
        html += `<div style="margin-top:16px;padding:12px;background:var(--bg-tertiary);border-radius:8px;font-size:12px">
            <strong>Applied Transformations:</strong>
            ${result.transformation !== 'none' ? `<span style="margin-left:8px">${t('transformation')}: ${result.transformation}</span>` : ''}
            ${result.differencing > 0 ? `<span style="margin-left:8px">${t('differencing')}: ${result.differencing}</span>` : ''}
        </div>`;
    }

    return html;
}

function renderPanelResult(result) {
    let html = '';

    // Panel Data Summary
    html += `<div style="background:var(--bg-tertiary);padding:12px;border-radius:8px;margin-bottom:16px">
        <div style="display:flex;flex-wrap:wrap;gap:16px">
            <span><strong>${t('nObs')}:</strong> ${result.pooled?.nObs || result.fe?.nObs || result.re?.nObs || 'N/A'}</span>
            <span><strong>${t('nEntities')}:</strong> ${result.pooled?.nEntities || result.fe?.nEntities || result.re?.nEntities || 'N/A'}</span>
            <span><strong>${t('nPeriods')}:</strong> ${result.pooled?.nPeriods || result.fe?.nPeriods || result.re?.nPeriods || 'N/A'}</span>
        </div>
    </div>`;

    // Best Model Recommendation
    if (result.bestMethod) {
        const methodName = result.bestMethod === 'Fixed Effects' ? t('fixedEffects') :
            result.bestMethod === 'Random Effects' ? t('randomEffects') :
                result.bestMethod === 'Pooled OLS' ? t('pooledOLS') : result.bestMethod;
        html += `<div style="background:linear-gradient(135deg, #22c55e20, #22c55e10);padding:12px;border-radius:8px;margin-bottom:16px;border:1px solid #22c55e40">
            <strong>${t('bestModel')}:</strong> <span style="color:#22c55e;font-weight:600">${methodName}</span>
        </div>`;
    }

    // Helper function to render model results
    const renderModelTable = (model, title) => {
        if (!model) return '';
        let modelHtml = `<h4 style="margin:16px 0 8px;font-size:14px;font-weight:600">${title}</h4>
        <table class="result-table">
            <tbody>
            <tr><th>${t('rSquared')}</th><td>${model.rSquared?.toFixed(4) || 'N/A'}</td>
                <th>${t('adjRSquared')}</th><td>${model.adjRSquared?.toFixed(4) || 'N/A'}</td></tr>
            <tr><th>${t('nObs')}</th><td>${model.nObs || 'N/A'}</td>
                <th>${t('nEntities')}</th><td>${model.nEntities || 'N/A'}</td></tr>`;

        // Add method-specific info
        if (model.method === 'Random Effects' && model.rho !== undefined) {
            modelHtml += `<tr><th>${t('rho')}</th><td>${model.rho?.toFixed(4) || 'N/A'}</td>
                <th>${t('theta')}</th><td>${model.theta?.toFixed(4) || 'N/A'}</td></tr>`;
        }

        modelHtml += `</tbody></table>`;

        // Coefficients
        if (model.coefficients?.length) {
            modelHtml += `<table class="result-table" style="margin-top:8px">
                <thead><tr>
                    <th>Variable</th>
                    <th>${t('coefficient')}</th>
                    <th>${t('stdError')}</th>
                    <th>${t('tStat')}</th>
                    <th>P-Value</th>
                    <th>${t('significant')}</th>
                </tr></thead>
                <tbody>
                <tr>
                    <td><strong>${t('intercept')}</strong></td>
                    <td>${model.intercept?.toFixed(4) || 'N/A'}</td>
                    <td>${model.interceptStdError?.toFixed(4) || 'N/A'}</td>
                    <td>${model.interceptTStat?.toFixed(4) || 'N/A'}</td>
                    <td>${model.interceptPValue?.toFixed(4) || 'N/A'}</td>
                    <td>${(model.interceptPValue || 1) < 0.05 ? '<span style="color:#22c55e">✓</span>' : '<span style="color:#ef4444">✗</span>'}</td>
                </tr>`;

            const varNames = result.independents || [];
            model.coefficients.forEach((coef, i) => {
                const se = model.stdErrors?.[i];
                const tStat = model.tStats?.[i];
                const pVal = model.pValues?.[i];
                const sig = (pVal || 1) < 0.05;
                const label = result.labels?.independents?.[varNames[i]] || varNames[i] || `X${i + 1}`;
                modelHtml += `<tr>
                    <td><strong>${label}</strong></td>
                    <td>${coef?.toFixed(4) || 'N/A'}</td>
                    <td>${se?.toFixed(4) || 'N/A'}</td>
                    <td>${tStat?.toFixed(4) || 'N/A'}</td>
                    <td>${pVal?.toFixed(4) || 'N/A'}</td>
                    <td>${sig ? '<span style="color:#22c55e">✓</span>' : '<span style="color:#ef4444">✗</span>'}</td>
                </tr>`;
            });

            modelHtml += `</tbody></table>`;
        }

        return modelHtml;
    };

    // Render Pooled OLS
    if (result.pooled) {
        html += renderModelTable(result.pooled, t('pooledOLS'));
    }

    // Render Fixed Effects
    if (result.fe) {
        html += renderModelTable(result.fe, t('fixedEffects'));

        // F-test for Fixed Effects
        if (result.fe.fTestFE) {
            const fTest = result.fe.fTestFE;
            html += `<div style="margin-top:8px;padding:8px;background:var(--bg-tertiary);border-radius:6px;font-size:13px">
                <strong>F-Test (FE vs Pooled):</strong> F = ${fTest.fStatistic?.toFixed(4)}, 
                p-value = ${fTest.pValue?.toFixed(4)}
                ${fTest.significant ? '<span style="color:#22c55e;margin-left:8px">✓ Fixed Effects preferred</span>' : '<span style="color:#ef4444;margin-left:8px">✗ Pooled OLS sufficient</span>'}
            </div>`;
        }
    }

    // Render Random Effects
    if (result.re) {
        html += renderModelTable(result.re, t('randomEffects'));
    }

    // Hausman Test
    if (result.hausman) {
        const h = result.hausman;
        html += `<h4 style="margin:20px 0 8px;font-size:14px;font-weight:600">${t('hausmanTest')}</h4>
        <table class="result-table">
            <tbody>
            <tr><th>χ² ${t('testStatistic')}</th><td><strong>${h.chi2Statistic?.toFixed(4) || 'N/A'}</strong></td></tr>
            <tr><th>Degrees of Freedom</th><td>${h.df || 'N/A'}</td></tr>
            <tr><th>P-Value</th><td>${h.pValue?.toFixed(4) || 'N/A'}</td></tr>
            <tr><th>${t('conclusion')}</th><td style="color:${h.significant ? '#22c55e' : '#3b82f6'};font-weight:600">
                ${h.recommendation || 'N/A'}
            </td></tr>
            </tbody>
        </table>
        <div style="margin-top:8px;padding:10px;background:var(--bg-tertiary);border-radius:6px;font-size:12px">
            ${h.conclusion}
        </div>`;
    }

    return html;
}

// Toggle feature selection for ML nodes
function toggleFeature(column) {
    if (!currentConfigNode) return;
    const features = currentConfigNode.config.features || [];
    const idx = features.indexOf(column);
    if (idx >= 0) {
        features.splice(idx, 1);
    } else {
        features.push(column);
    }
    currentConfigNode.config.features = features;
    showNodeProperties(currentConfigNode);
}

// Render ML classification results
function renderMLResult(result) {
    let html = '';

    // Summary Stats
    html += `<div style="background:var(--bg-tertiary);padding:12px;border-radius:8px;margin-bottom:16px">
        <div style="display:flex;flex-wrap:wrap;gap:16px">
            <span><strong>${t('trainAccuracy')}:</strong> ${(result.trainSize)} samples</span>
            <span><strong>${t('testAccuracy')}:</strong> ${(result.testSize)} samples</span>
            <span><strong>Method:</strong> ${result.method || 'Classification'}</span>
        </div>
    </div>`;

    // Accuracy (big highlight)
    html += `<div style="background:linear-gradient(135deg, #22c55e20, #22c55e10);padding:20px;border-radius:8px;margin-bottom:16px;border:1px solid #22c55e40;text-align:center">
        <div style="font-size:14px;color:var(--text-secondary);margin-bottom:4px">${t('accuracy')}</div>
        <div style="font-size:36px;font-weight:700;color:#22c55e">${(result.accuracy * 100).toFixed(2)}%</div>
    </div>`;

    // Per-class metrics
    if (result.metrics && result.classes) {
        html += `<h4 style="margin:16px 0 8px;font-size:14px;font-weight:600">${t('precision')}, ${t('recall')}, ${t('f1Score')}</h4>
        <table class="result-table">
            <thead><tr>
                <th>Class</th>
                <th>${t('precision')}</th>
                <th>${t('recall')}</th>
                <th>${t('f1Score')}</th>
                <th>Support</th>
            </tr></thead>
            <tbody>`;

        result.classes.forEach(cls => {
            const m = result.metrics[cls] || {};
            html += `<tr>
                <td><strong>${cls}</strong></td>
                <td>${(m.precision * 100).toFixed(1)}%</td>
                <td>${(m.recall * 100).toFixed(1)}%</td>
                <td>${(m.f1 * 100).toFixed(1)}%</td>
                <td>${m.support || 0}</td>
            </tr>`;
        });

        html += `</tbody></table>`;
    }

    // Confusion Matrix
    if (result.confusionMatrix && result.classes) {
        html += `<h4 style="margin:20px 0 8px;font-size:14px;font-weight:600">${t('confusionMatrix')}</h4>
        <table class="result-table">
            <thead><tr><th></th>${result.classes.map(c => `<th>${c}</th>`).join('')}</tr></thead>
            <tbody>`;

        result.classes.forEach(actual => {
            html += `<tr><td><strong>${actual}</strong></td>`;
            result.classes.forEach(predicted => {
                const count = result.confusionMatrix[actual]?.[predicted] || 0;
                const isCorrect = actual === predicted;
                html += `<td style="background:${isCorrect ? 'rgba(34,197,94,0.2)' : count > 0 ? 'rgba(239,68,68,0.1)' : 'transparent'};font-weight:${isCorrect ? '600' : '400'}">${count}</td>`;
            });
            html += `</tr>`;
        });

        html += `</tbody></table>`;
    }

    return html;
}

// Render Cross-Validation results
function renderCVResult(result) {
    let html = '';

    // Overall CV Summary
    html += `<div style="background:var(--bg-tertiary);padding:12px;border-radius:8px;margin-bottom:16px">
        <div style="display:flex;flex-wrap:wrap;gap:16px">
            <span><strong>${t('crossValidation')}:</strong> ${result.k || 5}-Fold</span>
            <span><strong>${t('method')}:</strong> ${result.method || 'K-Fold CV'}</span>
        </div>
    </div>`;

    // Mean Accuracy (big highlight)
    html += `<div style="background:linear-gradient(135deg, #3b82f620, #3b82f610);padding:20px;border-radius:8px;margin-bottom:16px;border:1px solid #3b82f640;text-align:center">
        <div style="font-size:14px;color:var(--text-secondary);margin-bottom:4px">${t('meanCVAccuracy')}</div>
        <div style="font-size:36px;font-weight:700;color:#3b82f6">${(result.meanAccuracy * 100).toFixed(2)}%</div>
        <div style="font-size:14px;color:var(--text-secondary);margin-top:4px">± ${(result.stdAccuracy * 100).toFixed(2)}% (${t('stdCVAccuracy')})</div>
    </div>`;

    // Mean F1 if available
    if (result.meanF1 !== undefined) {
        html += `<div style="display:flex;gap:16px;margin-bottom:16px">
            <div style="flex:1;background:var(--bg-tertiary);padding:16px;border-radius:8px;text-align:center">
                <div style="font-size:12px;color:var(--text-secondary)">${t('f1Score')} (${t('mean')})</div>
                <div style="font-size:24px;font-weight:600;color:#a855f7">${(result.meanF1 * 100).toFixed(2)}%</div>
            </div>
            <div style="flex:1;background:var(--bg-tertiary);padding:16px;border-radius:8px;text-align:center">
                <div style="font-size:12px;color:var(--text-secondary)">${t('f1Score')} (Std)</div>
                <div style="font-size:24px;font-weight:600;color:#a855f7">± ${((result.stdF1 || 0) * 100).toFixed(2)}%</div>
            </div>
        </div>`;
    }

    // Per-fold results table
    if (result.folds && result.folds.length > 0) {
        html += `<h4 style="margin:16px 0 8px;font-size:14px;font-weight:600">${t('cvFolds')} Details</h4>
        <table class="result-table">
            <thead><tr>
                <th>Fold</th>
                <th>Train Size</th>
                <th>Test Size</th>
                <th>${t('accuracy')}</th>
                <th>${t('f1Score')}</th>
            </tr></thead>
            <tbody>`;

        result.folds.forEach(fold => {
            html += `<tr>
                <td><strong>${fold.fold}</strong></td>
                <td>${fold.trainSize || '-'}</td>
                <td>${fold.testSize || '-'}</td>
                <td>${fold.accuracy !== undefined ? (fold.accuracy * 100).toFixed(2) + '%' : '-'}</td>
                <td>${fold.f1 !== undefined ? (fold.f1 * 100).toFixed(2) + '%' : '-'}</td>
            </tr>`;
        });

        html += `</tbody></table>`;
    }

    return html;
}

// Render K-Means clustering results
function renderClusteringResult(result) {
    let html = '';

    // Summary
    html += `<div style="background:var(--bg-tertiary);padding:12px;border-radius:8px;margin-bottom:16px">
        <div style="display:flex;flex-wrap:wrap;gap:16px">
            <span><strong>${t('nClusters')}:</strong> ${result.k}</span>
            <span><strong>${t('nObs')}:</strong> ${result.nPoints}</span>
            <span><strong>${t('inertia')}:</strong> ${result.inertia?.toFixed(2)}</span>
        </div>
    </div>`;

    // Cluster sizes
    if (result.clusterSizes) {
        html += `<h4 style="margin:16px 0 8px;font-size:14px;font-weight:600">Cluster Sizes</h4>
        <div style="display:flex;gap:8px;flex-wrap:wrap">`;
        result.clusterSizes.forEach((size, i) => {
            const colors = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#8b5cf6', '#06b6d4'];
            html += `<div style="background:${colors[i % colors.length]}20;border:1px solid ${colors[i % colors.length]};padding:8px 16px;border-radius:6px;text-align:center">
                <div style="font-size:12px;color:var(--text-secondary)">Cluster ${i}</div>
                <div style="font-size:18px;font-weight:600">${size}</div>
            </div>`;
        });
        html += `</div>`;
    }

    // Cluster centroids
    if (result.centroids && result.features) {
        html += `<h4 style="margin:20px 0 8px;font-size:14px;font-weight:600">${t('clusterCenters')}</h4>
        <table class="result-table">
            <thead><tr><th>Cluster</th>${result.features.map(f => `<th>${f}</th>`).join('')}</tr></thead>
            <tbody>`;

        result.centroids.forEach((centroid, i) => {
            html += `<tr><td><strong>Cluster ${i}</strong></td>`;
            centroid.forEach(val => {
                html += `<td>${val?.toFixed(3)}</td>`;
            });
            html += `</tr>`;
        });

        html += `</tbody></table>`;
    }

    // Clustered data preview
    if (result.data) {
        html += `<h4 style="margin:20px 0 8px;font-size:14px;font-weight:600">Data Preview (first 20 rows)</h4>`;
        html += renderTable(result.data.slice(0, 20), result.columns);
    }

    return html;
}

// Render Neural Network results
function renderNeuralNetworkResult(result) {
    let html = '';

    // Architecture
    html += `<div style="background:linear-gradient(135deg, #6366f120, #6366f110);padding:16px;border-radius:8px;margin-bottom:16px;border:1px solid #6366f140">
        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px">Network Architecture</div>
        <div style="font-size:18px;font-weight:600;color:#6366f1">${result.architecture?.join(' → ') || 'N/A'}</div>
        <div style="font-size:12px;margin-top:8px;color:var(--text-secondary)">
            ${t('activation')}: ${result.activation} | ${t('learningRate')}: ${result.learningRate} | ${t('epochs')}: ${result.epochs}
        </div>
    </div>`;

    // Accuracy (big highlight)
    html += `<div style="display:flex;gap:12px;margin-bottom:16px">
        <div style="flex:1;background:linear-gradient(135deg, #22c55e20, #22c55e10);padding:16px;border-radius:8px;border:1px solid #22c55e40;text-align:center">
            <div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px">${t('testAccuracy')}</div>
            <div style="font-size:28px;font-weight:700;color:#22c55e">${(result.accuracy * 100).toFixed(2)}%</div>
        </div>
        <div style="flex:1;background:linear-gradient(135deg, #3b82f620, #3b82f610);padding:16px;border-radius:8px;border:1px solid #3b82f640;text-align:center">
            <div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px">${t('trainAccuracy')}</div>
            <div style="font-size:28px;font-weight:700;color:#3b82f6">${(result.trainAccuracy * 100).toFixed(2)}%</div>
        </div>
        <div style="flex:1;background:linear-gradient(135deg, #f59e0b20, #f59e0b10);padding:16px;border-radius:8px;border:1px solid #f59e0b40;text-align:center">
            <div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px">Final Loss</div>
            <div style="font-size:28px;font-weight:700;color:#f59e0b">${result.finalLoss?.toFixed(4)}</div>
        </div>
    </div>`;

    // Training history (mini chart representation)
    if (result.history?.loss?.length) {
        const losses = result.history.loss;
        const accs = result.history.accuracy;
        const maxLoss = Math.max(...losses);

        html += `<h4 style="margin:16px 0 8px;font-size:14px;font-weight:600">${t('trainingHistory')}</h4>
        <div style="display:flex;height:80px;align-items:flex-end;gap:1px;background:var(--bg-tertiary);padding:8px;border-radius:6px">`;

        // Sample points for visualization
        const step = Math.max(1, Math.floor(losses.length / 50));
        for (let i = 0; i < losses.length; i += step) {
            const height = (1 - losses[i] / maxLoss) * 100;
            html += `<div style="flex:1;background:linear-gradient(to top, #3b82f6, #6366f1);height:${Math.max(5, height)}%;border-radius:2px" title="Epoch ${i + 1}: Loss ${losses[i]?.toFixed(4)}"></div>`;
        }

        html += `</div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-secondary);margin-top:4px">
            <span>Epoch 1</span>
            <span>Epoch ${losses.length}</span>
        </div>`;
    }

    // Per-class metrics
    if (result.metrics && result.classes) {
        html += `<h4 style="margin:20px 0 8px;font-size:14px;font-weight:600">${t('precision')}, ${t('recall')}, ${t('f1Score')}</h4>
        <table class="result-table">
            <thead><tr>
                <th>Class</th>
                <th>${t('precision')}</th>
                <th>${t('recall')}</th>
                <th>${t('f1Score')}</th>
            </tr></thead>
            <tbody>`;

        result.classes.forEach(cls => {
            const m = result.metrics[cls] || {};
            html += `<tr>
                <td><strong>${cls}</strong></td>
                <td>${(m.precision * 100).toFixed(1)}%</td>
                <td>${(m.recall * 100).toFixed(1)}%</td>
                <td>${(m.f1 * 100).toFixed(1)}%</td>
            </tr>`;
        });

        html += `</tbody></table>`;
    }

    return html;
}

function renderChart(result) {
    const ctx = document.getElementById('resultChart')?.getContext('2d');
    if (!ctx) return;

    let config;
    if (result.viewType === 'scatter') {
        const points = result.data.map(row => ({ x: row[result.xColumn], y: row[result.yColumn] })).filter(p => !isNaN(p.x) && !isNaN(p.y));
        config = { type: 'scatter', data: { datasets: [{ label: `${result.xColumn} vs ${result.yColumn}`, data: points, backgroundColor: 'rgba(99, 102, 241, 0.6)' }] } };
    } else if (result.viewType === 'line') {
        const labels = result.data.map(row => row[result.xColumn]);
        const values = result.data.map(row => row[result.yColumn]);
        config = { type: 'line', data: { labels, datasets: [{ label: result.yColumn, data: values, borderColor: '#6366f1', fill: false }] } };
    } else if (result.viewType === 'bar') {
        const labels = result.data.map(row => row[result.labelColumn]);
        const values = result.data.map(row => row[result.valueColumn]);
        config = { type: 'bar', data: { labels, datasets: [{ label: result.valueColumn, data: values, backgroundColor: '#6366f1' }] } };
    } else if (result.viewType === 'histogram') {
        config = { type: 'bar', data: { labels: result.labels, datasets: [{ label: result.column, data: result.bins, backgroundColor: '#6366f1' }] } };
    } else if (result.viewType === 'pie') {
        const labels = result.data.map(row => row[result.labelColumn]);
        const values = result.data.map(row => row[result.valueColumn]);
        const colors = labels.map((_, i) => `hsl(${(i * 360 / labels.length)}, 70%, 50%)`);
        config = { type: 'pie', data: { labels, datasets: [{ data: values, backgroundColor: colors }] } };
    }

    if (config) new Chart(ctx, config);
}

function exportResult() {
    if (!currentResult) return;
    if (currentResult.data) {
        const ws = XLSX.utils.json_to_sheet(currentResult.data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Results');
        XLSX.writeFile(wb, 'salim-knime-results.xlsx');
    } else if (currentResult.stats) {
        const rows = [];
        const cols = Object.keys(currentResult.stats);
        const metrics = Object.keys(currentResult.stats[cols[0]]);
        metrics.forEach(m => {
            const row = { metric: m };
            cols.forEach(c => row[c] = currentResult.stats[c][m]);
            rows.push(row);
        });
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Statistics');
        XLSX.writeFile(wb, 'salim-knime-stats.xlsx');
    }
}

// Render PCA Results
function renderPCAResult(result) {
    let html = `<div class="result-section">
        <h4><i class="fas fa-compress-arrows-alt"></i> ${t('pcaComponents')}</h4>
        <table class="result-table">
            <thead><tr>
                <th>${t('component')}</th>
                <th>${t('eigenvalue')}</th>
                <th>${t('explainedVariance')}</th>
                <th>${t('cumulative')}</th>
            </tr></thead>
            <tbody>`;

    result.components?.forEach((comp, i) => {
        html += `<tr>
            <td><strong>${comp.name}</strong></td>
            <td>${comp.eigenvalue?.toFixed(4)}</td>
            <td>${(comp.explainedVariance * 100).toFixed(2)}%</td>
            <td>${(result.cumulativeVariance[i] * 100).toFixed(2)}%</td>
        </tr>`;
    });
    html += `</tbody></table></div>`;

    // Feature Loadings
    if (result.components?.length > 0) {
        html += `<div class="result-section">
            <h4><i class="fas fa-th-list"></i> ${t('featureLoadings')}</h4>
            <table class="result-table">
                <thead><tr>
                    <th>${t('feature')}</th>
                    ${result.components.map(c => `<th>${c.name}</th>`).join('')}
                </tr></thead>
                <tbody>`;

        const features = result.components[0]?.loadings?.map(l => l.feature) || [];
        features.forEach((f, j) => {
            html += `<tr><td><strong>${f}</strong></td>`;
            result.components.forEach(comp => {
                const loading = comp.loadings[j]?.loading || 0;
                const color = loading > 0 ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)';
                html += `<td style="background:${color}">${loading.toFixed(4)}</td>`;
            });
            html += `</tr>`;
        });
        html += `</tbody></table></div>`;
    }

    return html;
}

// Render Confusion Matrix Heatmap
function renderConfusionHeatmap(result) {
    const classes = result.classes || [];
    const matrix = result.confusionMatrix || {};

    let html = `<div class="result-section">
        <h4><i class="fas fa-th"></i> ${t('confusionMatrix')}</h4>
        <table class="result-table" style="text-align:center">
            <thead><tr><th>${t('actual')} \\ ${t('predicted')}</th>`;

    classes.forEach(c => html += `<th>${c}</th>`);
    html += `</tr></thead><tbody>`;

    // Find max value for color scaling
    let maxVal = 0;
    classes.forEach(actual => {
        classes.forEach(pred => {
            const val = matrix[actual]?.[pred] || 0;
            if (val > maxVal) maxVal = val;
        });
    });

    classes.forEach(actual => {
        html += `<tr><td><strong>${actual}</strong></td>`;
        classes.forEach(pred => {
            const val = matrix[actual]?.[pred] || 0;
            const intensity = maxVal > 0 ? val / maxVal : 0;
            const isDiagonal = actual === pred;
            const color = isDiagonal
                ? `rgba(34,197,94,${0.2 + intensity * 0.6})`
                : `rgba(239,68,68,${intensity * 0.6})`;
            html += `<td style="background:${color};font-weight:${isDiagonal ? 'bold' : 'normal'}">${val}</td>`;
        });
        html += `</tr>`;
    });

    html += `</tbody></table></div>`;
    return html;
}

// Render ML Visualization Charts
function renderMLVisualization(result) {
    const ctx = document.getElementById('resultChart')?.getContext('2d');
    if (!ctx) return;

    let config;

    if (result.viewType === 'rocCurve') {
        const points = result.points?.map(p => ({ x: p.fpr, y: p.tpr })) || [];
        config = {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: `ROC Curve (AUC = ${result.auc?.toFixed(3)})`,
                        data: points,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239,68,68,0.1)',
                        fill: true,
                        tension: 0
                    },
                    {
                        label: 'Random (AUC = 0.5)',
                        data: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
                        borderColor: '#94a3b8',
                        borderDash: [5, 5],
                        fill: false
                    }
                ]
            },
            options: {
                scales: {
                    x: { title: { display: true, text: 'False Positive Rate' }, min: 0, max: 1 },
                    y: { title: { display: true, text: 'True Positive Rate' }, min: 0, max: 1 }
                }
            }
        };
    } else if (result.viewType === 'prCurve') {
        const points = result.points?.map(p => ({ x: p.recall, y: p.precision })) || [];
        config = {
            type: 'line',
            data: {
                datasets: [{
                    label: `PR Curve (AP = ${result.averagePrecision?.toFixed(3)})`,
                    data: points,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59,130,246,0.1)',
                    fill: true,
                    tension: 0
                }]
            },
            options: {
                scales: {
                    x: { title: { display: true, text: 'Recall' }, min: 0, max: 1 },
                    y: { title: { display: true, text: 'Precision' }, min: 0, max: 1 }
                }
            }
        };
    } else if (result.viewType === 'learningCurve') {
        const epochs = result.loss?.map((_, i) => i + 1) || [];
        config = {
            type: 'line',
            data: {
                labels: epochs,
                datasets: [
                    {
                        label: 'Loss',
                        data: result.loss || [],
                        borderColor: '#ef4444',
                        yAxisID: 'y'
                    },
                    {
                        label: 'Accuracy',
                        data: result.accuracy || [],
                        borderColor: '#22c55e',
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                scales: {
                    x: { title: { display: true, text: 'Epoch' } },
                    y: { type: 'linear', position: 'left', title: { display: true, text: 'Loss' } },
                    y1: { type: 'linear', position: 'right', title: { display: true, text: 'Accuracy' }, grid: { drawOnChartArea: false } }
                }
            }
        };
    } else if (result.viewType === 'featureImportance') {
        const features = result.featureImportance?.map(f => f.feature) || [];
        const importances = result.featureImportance?.map(f => f.importance) || [];
        config = {
            type: 'bar',
            data: {
                labels: features,
                datasets: [{
                    label: t('importance'),
                    data: importances,
                    backgroundColor: '#f59e0b'
                }]
            },
            options: {
                indexAxis: 'y',
                scales: {
                    x: { title: { display: true, text: t('importance') } }
                }
            }
        };
    } else if (result.viewType === 'elbowCurve') {
        const ks = result.points?.map(p => p.k) || [];
        const inertias = result.points?.map(p => p.inertia) || [];
        config = {
            type: 'line',
            data: {
                labels: ks,
                datasets: [{
                    label: 'Inertia (WCSS)',
                    data: inertias,
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139,92,246,0.1)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                scales: {
                    x: { title: { display: true, text: 'Number of Clusters (K)' } },
                    y: { title: { display: true, text: 'Inertia' } }
                }
            }
        };
    }

    if (config) new Chart(ctx, config);
}

// =============================================
// Views Render Functions
// =============================================

function renderImageView(result) {
    if (!result.images?.length) return `<div class="empty-state"><i class="fas fa-image"></i><p>${t('noImages')}</p></div>`;
    return `<div style="display:flex;flex-wrap:wrap;gap:16px;justify-content:center;padding:16px">
        ${result.images.slice(0, 20).map(src => `
            <img src="${src}" alt="Image" style="max-width:${result.maxWidth || 400}px;max-height:${result.maxHeight || 300}px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);object-fit:contain" onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 100 100\\'><text x=\\'50\\' y=\\'50\\' text-anchor=\\'middle\\' dy=\\'.3em\\' fill=\\'%23999\\'>Image Error</text></svg>'">
        `).join('')}
    </div>${result.images.length > 20 ? `<p style="text-align:center;color:var(--text-muted)">Showing 20 of ${result.images.length} images</p>` : ''}`;
}

function renderTextView(result) {
    if (!result.texts?.length) return `<div class="empty-state"><i class="fas fa-align-left"></i><p>${t('noText')}</p></div>`;
    const maxLines = result.maxLines || 100;
    return `<div style="padding:16px;font-size:${result.fontSize || 14}px;line-height:1.6;max-height:500px;overflow-y:auto;white-space:pre-wrap;background:var(--bg-secondary);border-radius:8px">
        ${result.texts.slice(0, maxLines).map((text, i) => `<div style="padding:8px 0;border-bottom:1px solid var(--border-color)">${i + 1}. ${text}</div>`).join('')}
    </div>${result.texts.length > maxLines ? `<p style="text-align:center;color:var(--text-muted);margin-top:10px">Showing ${maxLines} of ${result.texts.length} items</p>` : ''}`;
}

function renderStatisticsView(result) {
    if (!result.stats || !result.columns?.length) return `<div class="empty-state"><i class="fas fa-info-circle"></i><p>${t('noStats')}</p></div>`;
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
    return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;padding:16px">
        ${result.columns.map((col, i) => {
        const s = result.stats[col];
        if (!s) return '';
        return `<div style="background:var(--bg-secondary);border-radius:12px;padding:20px;border-left:4px solid ${colors[i % colors.length]}">
                <h4 style="margin:0 0 16px 0;color:${colors[i % colors.length]};font-size:1.1rem">${col}</h4>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                    <div><div style="color:var(--text-muted);font-size:0.85rem">${t('count')}</div><div style="font-weight:600">${s.count?.toLocaleString() ?? '-'}</div></div>
                    <div><div style="color:var(--text-muted);font-size:0.85rem">${t('sum')}</div><div style="font-weight:600">${s.sum?.toFixed(2) ?? '-'}</div></div>
                    <div><div style="color:var(--text-muted);font-size:0.85rem">${t('mean')}</div><div style="font-weight:600">${s.mean?.toFixed(4) ?? '-'}</div></div>
                    <div><div style="color:var(--text-muted);font-size:0.85rem">${t('median')}</div><div style="font-weight:600">${s.median?.toFixed(4) ?? '-'}</div></div>
                    <div><div style="color:var(--text-muted);font-size:0.85rem">${t('min')}</div><div style="font-weight:600">${s.min?.toFixed(4) ?? '-'}</div></div>
                    <div><div style="color:var(--text-muted);font-size:0.85rem">${t('max')}</div><div style="font-weight:600">${s.max?.toFixed(4) ?? '-'}</div></div>
                    <div style="grid-column:span 2"><div style="color:var(--text-muted);font-size:0.85rem">${t('stdDev')}</div><div style="font-weight:600">${s.std?.toFixed(4) ?? '-'}</div></div>
                </div>
            </div>`;
    }).join('')}
    </div>`;
}

function renderTileView(result) {
    if (!result.tiles?.length) return `<div class="empty-state"><i class="fas fa-th-large"></i><p>${t('noData')}</p></div>`;
    const color = result.color || '#14b8a6';
    return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;padding:16px">
        ${result.tiles.map(tile => `
            <div style="background:linear-gradient(135deg,${color}22,${color}11);border:1px solid ${color}44;border-radius:12px;padding:20px;text-align:center;transition:transform 0.2s" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                <div style="font-size:1.5rem;font-weight:700;color:${color}">${tile.value || '-'}</div>
                <div style="color:var(--text-secondary);font-size:0.9rem;margin-top:8px">${tile.title || '-'}</div>
            </div>
        `).join('')}
    </div>`;
}

function renderHeatmapView(result) {
    if (!result.matrix?.length || !result.columns?.length) return `<div class="empty-state"><i class="fas fa-th"></i><p>${t('noData')}</p></div>`;
    const getColor = (val, scheme) => {
        const clamped = Math.max(-1, Math.min(1, val));
        if (scheme === 'greenRed') {
            return clamped >= 0 ? `rgba(34,197,94,${Math.abs(clamped)})` : `rgba(239,68,68,${Math.abs(clamped)})`;
        } else if (scheme === 'yellowPurple') {
            return clamped >= 0 ? `rgba(168,85,247,${Math.abs(clamped)})` : `rgba(234,179,8,${Math.abs(clamped)})`;
        }
        return clamped >= 0 ? `rgba(59,130,246,${Math.abs(clamped)})` : `rgba(239,68,68,${Math.abs(clamped)})`;
    };
    return `<div style="overflow-x:auto;padding:16px"><table class="result-table" style="min-width:fit-content">
        <thead><tr><th></th>${result.columns.map(c => `<th style="font-size:0.8rem;padding:8px">${c}</th>`).join('')}</tr></thead>
        <tbody>${result.matrix.map((row, i) => `<tr>
            <th style="font-size:0.8rem;padding:8px">${result.columns[i]}</th>
            ${row.map((val, j) => `<td style="background:${getColor(val, result.colorScheme)};color:${Math.abs(val) > 0.5 ? '#fff' : 'var(--text-primary)'};font-weight:${i === j ? '700' : '400'};text-align:center;padding:10px;font-size:0.85rem">${val.toFixed(2)}</td>`).join('')}
        </tr>`).join('')}</tbody>
    </table></div>`;
}

function renderViewChart(result) {
    const ctx = document.getElementById('resultChart')?.getContext('2d');
    if (!ctx) return;

    let config = null;
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

    if (result.viewType === 'boxPlot') {
        // Simple box plot approximation using bar chart
        const datasets = result.columns.map((col, i) => {
            const d = result.boxData[col];
            return {
                label: col,
                data: [d?.q1 || 0, d?.q2 || 0, d?.q3 || 0],
                backgroundColor: colors[i % colors.length] + '88',
                borderColor: colors[i % colors.length],
                borderWidth: 2
            };
        });
        config = {
            type: 'bar',
            data: { labels: ['Q1', 'Median', 'Q3'], datasets },
            options: {
                responsive: true,
                plugins: { title: { display: true, text: t('boxPlot') + ' - Quartiles' } },
                scales: { y: { beginAtZero: false } }
            }
        };
    } else if (result.viewType === 'areaChart') {
        config = {
            type: 'line',
            data: {
                labels: result.labels,
                datasets: result.datasets.map((ds, i) => ({
                    ...ds,
                    borderColor: colors[i % colors.length],
                    backgroundColor: colors[i % colors.length] + '33',
                    fill: ds.fill !== false,
                    tension: 0.3
                }))
            },
            options: {
                responsive: true,
                plugins: { filler: { propagate: true } },
                scales: { y: { stacked: result.stacked || false } }
            }
        };
    } else if (result.viewType === 'radarChart') {
        config = {
            type: 'radar',
            data: {
                labels: result.labels,
                datasets: result.datasets.map((ds, i) => ({
                    ...ds,
                    borderColor: colors[i % colors.length],
                    backgroundColor: colors[i % colors.length] + '33',
                    fill: true
                }))
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'top' } },
                scales: { r: { beginAtZero: true } }
            }
        };
    }

    if (config) new Chart(ctx, config);
}

// ========================================
// Data Entry Editor (SPSS-like)
// ========================================
let currentDataEntryNode = null;
let dataEntryColumns = [];
let dataEntryData = [];

function openDataEntryEditor(nodeId) {
    try {
        console.log('openDataEntryEditor called with nodeId:', nodeId);
        alert('Inside openDataEntryEditor function');

        // Find node - try canvas.nodes first, then check if canvas exists
        let node = null;
        if (typeof canvas !== 'undefined' && canvas.nodes) {
            node = canvas.nodes.find(n => n.id === nodeId);
            console.log('Node found:', node);
        }

        if (!node) {
            console.error('Node not found:', nodeId);
            // Try to open modal anyway with default data
            node = { id: nodeId, config: { columns: ['Variable1', 'Variable2'], data: [], rows: 10 } };
        }

        currentDataEntryNode = node;
        dataEntryColumns = [...(node.config.columns || ['Variable1', 'Variable2'])];
        dataEntryData = JSON.parse(JSON.stringify(node.config.data || []));

        // Ensure minimum rows
        const minRows = node.config.rows || 10;
        while (dataEntryData.length < minRows) {
            const row = {};
            dataEntryColumns.forEach(col => row[col] = '');
            dataEntryData.push(row);
        }

        console.log('Before renderDataEntryGrid');
        renderDataEntryGrid();
        console.log('After renderDataEntryGrid');

        updateDataEntryInfo();
        console.log('After updateDataEntryInfo');

        const modal = document.getElementById('dataEntryModal');
        console.log('Modal element:', modal);
        if (modal) {
            modal.classList.add('open');
            console.log('Modal classes after adding open:', modal.classList);
            alert('Modal should be open now!');
        } else {
            console.error('dataEntryModal element not found!');
            alert('Error: Modal element not found');
        }
    } catch (error) {
        console.error('Error in openDataEntryEditor:', error);
        alert('Error: ' + error.message);
    }
}

function closeDataEntryEditor() {
    document.getElementById('dataEntryModal').classList.remove('open');
    currentDataEntryNode = null;
}

function renderDataEntryGrid() {
    const grid = document.getElementById('dataEntryGrid');
    if (!grid) return;

    let html = '<thead><tr>';
    // Row number header
    html += '<th class="row-num">#</th>';
    // Column headers
    dataEntryColumns.forEach((col, i) => {
        html += `<th>
            <input type="text" class="col-header-input" 
                value="${col}" 
                onchange="updateColumnName(${i}, this.value)"
                onfocus="this.select()">
            ${dataEntryColumns.length > 1 ?
                `<button class="delete-col-btn" onclick="deleteDataColumn(${i})" title="${t('delete')}">
                    <i class="fas fa-times"></i>
                </button>` : ''}
        </th>`;
    });
    html += '</tr></thead><tbody>';

    // Data rows
    dataEntryData.forEach((row, rowIndex) => {
        html += '<tr>';
        html += `<td class="row-num">
            ${rowIndex + 1}
            <button class="delete-row-btn" onclick="deleteDataRow(${rowIndex})" title="${t('delete')}">
                <i class="fas fa-times"></i>
            </button>
        </td>`;
        dataEntryColumns.forEach((col, colIndex) => {
            const value = row[col] || '';
            html += `<td>
                <input type="text" class="cell-input" 
                    value="${value}" 
                    data-row="${rowIndex}" 
                    data-col="${colIndex}"
                    onchange="updateDataCell(${rowIndex}, ${colIndex}, this.value)"
                    onkeydown="handleCellKeydown(event, ${rowIndex}, ${colIndex})"
                    onfocus="this.select()">
            </td>`;
        });
        html += '</tr>';
    });

    html += '</tbody>';
    grid.innerHTML = html;
}

function updateDataCell(rowIndex, colIndex, value) {
    const colName = dataEntryColumns[colIndex];
    if (dataEntryData[rowIndex]) {
        dataEntryData[rowIndex][colName] = value;
    }
    updateDataEntryInfo();
}

function updateColumnName(colIndex, newName) {
    const oldName = dataEntryColumns[colIndex];
    if (oldName === newName) return;

    // Update column name
    dataEntryColumns[colIndex] = newName;

    // Update data to use new column name
    dataEntryData.forEach(row => {
        if (row.hasOwnProperty(oldName)) {
            row[newName] = row[oldName];
            delete row[oldName];
        }
    });

    renderDataEntryGrid();
}

function handleCellKeydown(event, rowIndex, colIndex) {
    const key = event.key;
    const grid = document.getElementById('dataEntryGrid');
    const inputs = grid.querySelectorAll('.cell-input');
    const currentIndex = rowIndex * dataEntryColumns.length + colIndex;

    if (key === 'Tab' || key === 'Enter') {
        event.preventDefault();
        const isShift = event.shiftKey;
        let nextIndex = isShift ? currentIndex - 1 : currentIndex + 1;

        // If at end of row and pressing Enter/Tab, move to next row
        if (key === 'Enter' && !isShift) {
            nextIndex = (rowIndex + 1) * dataEntryColumns.length + colIndex;
            // Add new row if at last row
            if (rowIndex === dataEntryData.length - 1) {
                addDataRow();
                setTimeout(() => {
                    const newInputs = grid.querySelectorAll('.cell-input');
                    const newIndex = rowIndex * dataEntryColumns.length + colIndex + dataEntryColumns.length;
                    if (newInputs[newIndex]) newInputs[newIndex].focus();
                }, 50);
                return;
            }
        }

        if (nextIndex >= 0 && nextIndex < inputs.length) {
            inputs[nextIndex].focus();
        }
    } else if (key === 'ArrowDown') {
        event.preventDefault();
        const nextIndex = (rowIndex + 1) * dataEntryColumns.length + colIndex;
        if (inputs[nextIndex]) inputs[nextIndex].focus();
    } else if (key === 'ArrowUp') {
        event.preventDefault();
        const nextIndex = (rowIndex - 1) * dataEntryColumns.length + colIndex;
        if (nextIndex >= 0 && inputs[nextIndex]) inputs[nextIndex].focus();
    } else if (key === 'ArrowRight' && event.target.selectionStart === event.target.value.length) {
        event.preventDefault();
        if (inputs[currentIndex + 1]) inputs[currentIndex + 1].focus();
    } else if (key === 'ArrowLeft' && event.target.selectionStart === 0) {
        event.preventDefault();
        if (currentIndex > 0 && inputs[currentIndex - 1]) inputs[currentIndex - 1].focus();
    }
}

function addDataRow() {
    const row = {};
    dataEntryColumns.forEach(col => row[col] = '');
    dataEntryData.push(row);
    renderDataEntryGrid();
    updateDataEntryInfo();
}

function addDataColumn() {
    // Generate unique column name
    let num = dataEntryColumns.length + 1;
    let newName = `Variable${num}`;
    while (dataEntryColumns.includes(newName)) {
        num++;
        newName = `Variable${num}`;
    }

    dataEntryColumns.push(newName);
    dataEntryData.forEach(row => row[newName] = '');
    renderDataEntryGrid();
    updateDataEntryInfo();
}

function deleteDataRow(rowIndex) {
    if (dataEntryData.length <= 1) return;
    dataEntryData.splice(rowIndex, 1);
    renderDataEntryGrid();
    updateDataEntryInfo();
}

function deleteDataColumn(colIndex) {
    if (dataEntryColumns.length <= 1) return;
    const colName = dataEntryColumns[colIndex];
    dataEntryColumns.splice(colIndex, 1);
    dataEntryData.forEach(row => delete row[colName]);
    renderDataEntryGrid();
    updateDataEntryInfo();
}

function clearDataEntry() {
    if (!confirm(t('confirmDelete') || 'Clear all data?')) return;
    dataEntryData = [];
    const minRows = currentDataEntryNode?.config?.rows || 10;
    for (let i = 0; i < minRows; i++) {
        const row = {};
        dataEntryColumns.forEach(col => row[col] = '');
        dataEntryData.push(row);
    }
    renderDataEntryGrid();
    updateDataEntryInfo();
}

function importDataFile() {
    const input = document.getElementById('dataEntryFileInput');
    if (input) {
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) handleDataFileImport(file);
            input.value = '';
        };
        input.click();
    }
}

async function handleDataFileImport(file) {
    try {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            if (json.length > 0) {
                // First row as headers
                dataEntryColumns = json[0].map((h, i) => h?.toString().trim() || `Variable${i + 1}`);

                // Rest as data
                dataEntryData = [];
                for (let i = 1; i < json.length; i++) {
                    const row = {};
                    dataEntryColumns.forEach((col, j) => {
                        row[col] = json[i][j] ?? '';
                    });
                    dataEntryData.push(row);
                }

                // Ensure minimum rows
                const minRows = currentDataEntryNode?.config?.rows || 10;
                while (dataEntryData.length < minRows) {
                    const row = {};
                    dataEntryColumns.forEach(col => row[col] = '');
                    dataEntryData.push(row);
                }

                renderDataEntryGrid();
                updateDataEntryInfo();
            }
        };
        reader.readAsArrayBuffer(file);
    } catch (error) {
        console.error('Import error:', error);
        alert(t('error') + ': ' + error.message);
    }
}

function saveDataEntry() {
    if (!currentDataEntryNode) return;

    // Filter out empty rows
    const cleanedData = dataEntryData.filter(row =>
        dataEntryColumns.some(col => row[col] !== '' && row[col] != null)
    );

    currentDataEntryNode.config.columns = [...dataEntryColumns];
    currentDataEntryNode.config.data = cleanedData;

    // Update properties panel
    showNodeProperties(currentDataEntryNode);

    closeDataEntryEditor();
}

function updateDataEntryInfo() {
    const info = document.getElementById('dataEntryInfo');
    if (info) {
        const filledRows = dataEntryData.filter(row =>
            dataEntryColumns.some(col => row[col] !== '' && row[col] != null)
        ).length;
        info.textContent = `${dataEntryColumns.length} ${t('selectColumns') || 'columns'} × ${filledRows} ${t('maxRows') || 'rows'}`;
    }
}

