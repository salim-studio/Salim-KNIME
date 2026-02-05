/* Salim-KNIME - Nodes Definition */

const NodeTypes = {
    // IO Nodes
    excelReader: {
        name: 'excelReader', category: 'io',
        icon: 'fa-file-excel', color: 'linear-gradient(135deg, #217346, #185c37)',
        inputs: [], outputs: ['data'],
        config: { file: null, sheet: 0, hasHeader: true },
        execute: async function (inputs, config) {
            return new Promise((resolve, reject) => {
                if (!config.file) { reject('No file selected'); return; }
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = new Uint8Array(e.target.result);
                        const workbook = XLSX.read(data, { type: 'array' });
                        const sheetName = workbook.SheetNames[config.sheet || 0];
                        const sheet = workbook.Sheets[sheetName];
                        const json = XLSX.utils.sheet_to_json(sheet, { header: config.hasHeader ? undefined : 1 });
                        resolve({ data: json, columns: json.length ? Object.keys(json[0]) : [] });
                    } catch (err) { reject(err.message); }
                };
                reader.onerror = () => reject('Failed to read file');
                reader.readAsArrayBuffer(config.file);
            });
        }
    },

    csvReader: {
        name: 'csvReader', category: 'io',
        icon: 'fa-file-csv', color: 'linear-gradient(135deg, #ff9800, #f57c00)',
        inputs: [], outputs: ['data'],
        config: { file: null, delimiter: ',', hasHeader: true },
        execute: async function (inputs, config) {
            return new Promise((resolve, reject) => {
                if (!config.file) { reject('No file selected'); return; }
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const text = e.target.result;
                        const lines = text.split('\n').filter(l => l.trim());
                        const delimiter = config.delimiter || ',';
                        const headers = config.hasHeader ? lines[0].split(delimiter).map(h => h.trim()) :
                            lines[0].split(delimiter).map((_, i) => `Col${i + 1}`);
                        const startIdx = config.hasHeader ? 1 : 0;
                        const data = lines.slice(startIdx).map(line => {
                            const values = line.split(delimiter);
                            const row = {};
                            headers.forEach((h, i) => row[h] = isNaN(values[i]) ? values[i]?.trim() : parseFloat(values[i]));
                            return row;
                        });
                        resolve({ data, columns: headers });
                    } catch (err) { reject(err.message); }
                };
                reader.onerror = () => reject('Failed to read file');
                reader.readAsText(config.file);
            });
        }
    },

    tableView: {
        name: 'tableView', category: 'io',
        icon: 'fa-table', color: 'linear-gradient(135deg, #2196f3, #1976d2)',
        inputs: ['data'], outputs: [],
        config: { maxRows: 100 },
        execute: async function (inputs) {
            if (!inputs.data) throw new Error('No input data');
            return { data: inputs.data.data, columns: inputs.data.columns, viewType: 'table' };
        }
    },

    excelWriter: {
        name: 'excelWriter', category: 'io',
        icon: 'fa-file-export', color: 'linear-gradient(135deg, #4caf50, #388e3c)',
        inputs: ['data'], outputs: [],
        config: { filename: 'output.xlsx' },
        execute: async function (inputs, config) {
            if (!inputs.data) throw new Error('No input data');
            const ws = XLSX.utils.json_to_sheet(inputs.data.data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
            XLSX.writeFile(wb, config.filename || 'output.xlsx');
            return { success: true, message: 'File exported' };
        }
    },

    // Processing Nodes
    columnFilter: {
        name: 'columnFilter', category: 'processing',
        icon: 'fa-columns', color: 'linear-gradient(135deg, #9c27b0, #7b1fa2)',
        inputs: ['data'], outputs: ['data'],
        config: { selectedColumns: [] },
        execute: async function (inputs, config) {
            if (!inputs.data) throw new Error('No input data');
            const cols = config.selectedColumns?.length ? config.selectedColumns : inputs.data.columns;
            const data = inputs.data.data.map(row => {
                const newRow = {};
                cols.forEach(c => { if (row.hasOwnProperty(c)) newRow[c] = row[c]; });
                return newRow;
            });
            return { data, columns: cols };
        }
    },

    rowFilter: {
        name: 'rowFilter', category: 'processing',
        icon: 'fa-filter', color: 'linear-gradient(135deg, #e91e63, #c2185b)',
        inputs: ['data'], outputs: ['data'],
        config: { column: '', operator: '>', value: 0 },
        execute: async function (inputs, config) {
            if (!inputs.data) throw new Error('No input data');
            let data = inputs.data.data;
            if (config.column) {
                data = data.filter(row => {
                    const val = parseFloat(row[config.column]);
                    const cmp = parseFloat(config.value);
                    switch (config.operator) {
                        case '>': return val > cmp;
                        case '<': return val < cmp;
                        case '>=': return val >= cmp;
                        case '<=': return val <= cmp;
                        case '==': return val == cmp;
                        case '!=': return val != cmp;
                        default: return true;
                    }
                });
            }
            return { data, columns: inputs.data.columns };
        }
    },

    sorter: {
        name: 'sorter', category: 'processing',
        icon: 'fa-sort', color: 'linear-gradient(135deg, #00bcd4, #0097a7)',
        inputs: ['data'], outputs: ['data'],
        config: { column: '', ascending: true },
        execute: async function (inputs, config) {
            if (!inputs.data) throw new Error('No input data');
            const data = [...inputs.data.data];
            if (config.column) {
                data.sort((a, b) => {
                    const va = a[config.column], vb = b[config.column];
                    const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb));
                    return config.ascending ? cmp : -cmp;
                });
            }
            return { data, columns: inputs.data.columns };
        }
    },

    missingValue: {
        name: 'missingValue', category: 'processing',
        icon: 'fa-eraser', color: 'linear-gradient(135deg, #ff5722, #e64a19)',
        inputs: ['data'], outputs: ['data'],
        config: { strategy: 'remove', replaceValue: 0 },
        execute: async function (inputs, config) {
            if (!inputs.data) throw new Error('No input data');
            let data = inputs.data.data;
            if (config.strategy === 'remove') {
                data = data.filter(row => !Object.values(row).some(v => v === null || v === undefined || v === '' || (typeof v === 'number' && isNaN(v))));
            } else if (config.strategy === 'replace') {
                data = data.map(row => {
                    const newRow = { ...row };
                    for (const key in newRow) {
                        if (newRow[key] === null || newRow[key] === undefined || newRow[key] === '' || (typeof newRow[key] === 'number' && isNaN(newRow[key]))) {
                            newRow[key] = config.replaceValue;
                        }
                    }
                    return newRow;
                });
            }
            return { data, columns: inputs.data.columns };
        }
    },

    // Data Preprocessing Nodes
    standardScaler: {
        name: 'standardScaler', category: 'processing',
        icon: 'fa-balance-scale-right', color: 'linear-gradient(135deg, #6366f1, #4f46e5)',
        inputs: ['data'], outputs: ['data'],
        config: { features: [] },
        execute: async function (inputs, config) {
            if (!inputs.data) throw new Error('No input data');
            if (!config.features?.length) throw new Error('Select features to scale');

            const result = Statistics.standardScale(inputs.data.data, config);
            if (!result) throw new Error('Standard scaling failed');

            return { data: result.data, columns: result.columns, stats: result.stats, viewType: 'scaling' };
        }
    },

    minMaxScaler: {
        name: 'minMaxScaler', category: 'processing',
        icon: 'fa-arrows-alt-h', color: 'linear-gradient(135deg, #14b8a6, #0d9488)',
        inputs: ['data'], outputs: ['data'],
        config: { features: [], minVal: 0, maxVal: 1 },
        execute: async function (inputs, config) {
            if (!inputs.data) throw new Error('No input data');
            if (!config.features?.length) throw new Error('Select features to scale');

            const result = Statistics.minMaxScale(inputs.data.data, config);
            if (!result) throw new Error('Min-Max scaling failed');

            return { data: result.data, columns: result.columns, stats: result.stats, viewType: 'scaling' };
        }
    },

    // Statistics Nodes
    descriptiveStats: {
        name: 'descriptiveStats', category: 'statistics',
        icon: 'fa-chart-bar', color: 'linear-gradient(135deg, #3f51b5, #303f9f)',
        inputs: ['data'], outputs: ['stats'],
        config: { columns: [] },
        execute: async function (inputs, config) {
            if (!inputs.data) throw new Error('No input data');
            const cols = config.columns?.length ? config.columns :
                inputs.data.columns.filter(c => inputs.data.data.some(row => typeof row[c] === 'number'));
            const stats = {};
            cols.forEach(col => {
                const values = inputs.data.data.map(row => parseFloat(row[col])).filter(v => !isNaN(v));
                stats[col] = Statistics.describe(values);
            });
            return { stats, columns: cols, viewType: 'stats' };
        }
    },

    correlation: {
        name: 'correlation', category: 'statistics',
        icon: 'fa-link', color: 'linear-gradient(135deg, #673ab7, #512da8)',
        inputs: ['data'], outputs: ['correlation'],
        config: { columns: [] },
        execute: async function (inputs, config) {
            if (!inputs.data) throw new Error('No input data');
            const cols = config.columns?.length ? config.columns :
                inputs.data.columns.filter(c => inputs.data.data.some(row => typeof row[c] === 'number'));
            const matrix = Statistics.correlationMatrix(inputs.data.data, cols);
            return { matrix, columns: cols, viewType: 'correlation' };
        }
    },

    linearRegression: {
        name: 'linearRegression', category: 'statistics',
        icon: 'fa-chart-line', color: 'linear-gradient(135deg, #009688, #00796b)',
        inputs: ['data'], outputs: ['regression'],
        config: { dependent: '', independents: [] },
        execute: async function (inputs, config) {
            if (!inputs.data) throw new Error('No input data');
            if (!config.dependent) throw new Error('Select dependent variable');
            const y = inputs.data.data.map(row => parseFloat(row[config.dependent])).filter(v => !isNaN(v));
            if (config.independents.length === 1) {
                const x = inputs.data.data.map(row => parseFloat(row[config.independents[0]])).filter(v => !isNaN(v));
                const result = Statistics.linearRegression(x, y);
                return { ...result, dependent: config.dependent, independents: config.independents, viewType: 'regression' };
            } else if (config.independents.length > 1) {
                const X = inputs.data.data.map(row => config.independents.map(c => parseFloat(row[c]))).filter(row => row.every(v => !isNaN(v)));
                const result = Statistics.multipleRegression(X, y);
                return { ...result, dependent: config.dependent, independents: config.independents, viewType: 'regression' };
            }
            throw new Error('Select independent variables');
        }
    },

    tTest: {
        name: 'tTest', category: 'statistics',
        icon: 'fa-balance-scale', color: 'linear-gradient(135deg, #795548, #5d4037)',
        inputs: ['data'], outputs: ['ttest'],
        config: { column1: '', column2: '' },
        execute: async function (inputs, config) {
            if (!inputs.data) throw new Error('No input data');
            if (!config.column1 || !config.column2) throw new Error('Select two columns');
            const s1 = inputs.data.data.map(row => parseFloat(row[config.column1])).filter(v => !isNaN(v));
            const s2 = inputs.data.data.map(row => parseFloat(row[config.column2])).filter(v => !isNaN(v));
            const result = Statistics.tTest(s1, s2);
            return { ...result, column1: config.column1, column2: config.column2, viewType: 'ttest' };
        }
    },

    // Multiple Regression with method selection and transformations
    multipleRegression: {
        name: 'multipleRegression', category: 'statistics',
        icon: 'fa-superscript', color: 'linear-gradient(135deg, #1565c0, #0d47a1)',
        inputs: ['data'], outputs: ['regression'],
        config: {
            dependent: '',
            dependentTransform: 'none', // none, log, log10, sqrt, square, inverse, exp
            dependentDiff: 0, // 0, 1, 2
            independents: [],
            independentTransforms: {}, // {colName: 'log', ...}
            independentDiffs: {}, // {colName: 1, ...}
            instruments: [],
            method: 'OLS', // OLS, GLS, 2SLS, GMM, LIML
            arOrder: 0, // AR(p)
            maOrder: 0  // MA(q)
        },
        execute: async function (inputs, config) {
            if (!inputs.data) throw new Error('No input data');
            if (!config.dependent) throw new Error('Select dependent variable');
            if (!config.independents?.length) throw new Error('Select independent variables');

            const transformNames = {
                'none': '', 'log': 'ln', 'log10': 'log₁₀', 'sqrt': '√',
                'square': '²', 'inverse': '1/', 'exp': 'e^', 'cube': '³', 'cbrt': '∛'
            };

            // Extract raw data
            let rawY = inputs.data.data.map(row => parseFloat(row[config.dependent]));
            let rawX = {};
            config.independents.forEach(col => {
                rawX[col] = inputs.data.data.map(row => parseFloat(row[col]));
            });

            // Apply transformations to Y
            let y = [...rawY];
            if (config.dependentTransform && config.dependentTransform !== 'none') {
                y = Statistics.transform(y, config.dependentTransform);
            }

            // Apply differencing to Y
            if (config.dependentDiff > 0) {
                y = Statistics.difference(y, config.dependentDiff);
            }

            // Apply transformations and differencing to each X
            let xData = {};
            config.independents.forEach(col => {
                let xCol = [...rawX[col]];
                const transform = config.independentTransforms?.[col] || 'none';
                const diff = config.independentDiffs?.[col] || 0;

                if (transform !== 'none') {
                    xCol = Statistics.transform(xCol, transform);
                }
                if (diff > 0) {
                    xCol = Statistics.difference(xCol, diff);
                }
                xData[col] = xCol;
            });

            // Handle length differences due to differencing
            const maxDiff = Math.max(
                config.dependentDiff || 0,
                ...config.independents.map(c => config.independentDiffs?.[c] || 0)
            );

            // Trim to shortest length
            let minLen = y.length;
            config.independents.forEach(col => {
                if (xData[col].length < minLen) minLen = xData[col].length;
            });

            // Align from end (latest data)
            y = y.slice(-minLen);
            config.independents.forEach(col => {
                xData[col] = xData[col].slice(-minLen);
            });

            // Add AR terms if specified
            let arLabels = [];
            if (config.arOrder > 0) {
                const arTerms = Statistics.createARTerms(y, config.arOrder);
                arTerms.forEach((lag, i) => {
                    xData[`AR(${i + 1})`] = lag;
                    arLabels.push(`AR(${i + 1})`);
                });
                // Trim data for AR
                const arTrim = config.arOrder;
                y = y.slice(arTrim);
                config.independents.forEach(col => {
                    xData[col] = xData[col].slice(arTrim);
                });
                arLabels.forEach(label => {
                    xData[label] = xData[label].slice(0, y.length);
                });
            }

            // Filter valid rows
            const validIndices = [];
            for (let i = 0; i < y.length; i++) {
                if (!isNaN(y[i]) && config.independents.every(col => !isNaN(xData[col][i])) &&
                    arLabels.every(label => !isNaN(xData[label]?.[i]))) {
                    validIndices.push(i);
                }
            }

            y = validIndices.map(i => y[i]);
            const allVars = [...config.independents, ...arLabels];
            const X = validIndices.map(i => allVars.map(col => xData[col][i]));

            // Prepare instruments for 2SLS, GMM, LIML
            let Z = null;
            if (config.instruments?.length && ['2SLS', 'GMM', 'LIML'].includes(config.method)) {
                Z = validIndices.map(i => config.instruments.map(col =>
                    parseFloat(inputs.data.data[i + maxDiff]?.[col]) || 0
                ));
            }

            // Run regression with selected method
            const result = Statistics.advancedRegression(X, y, config.method, Z);
            if (!result) throw new Error('Regression failed');

            // Build regression equation
            let yLabel = config.dependent;
            if (config.dependentTransform && config.dependentTransform !== 'none') {
                yLabel = `${transformNames[config.dependentTransform]}(${yLabel})`;
            }
            if (config.dependentDiff > 0) {
                yLabel = `Δ${''.repeat(config.dependentDiff - 1)}${yLabel}`;
            }

            let equation = `${yLabel} = ${result.intercept?.toFixed(4)}`;
            allVars.forEach((col, i) => {
                let xLabel = col;
                if (!arLabels.includes(col)) {
                    const transform = config.independentTransforms?.[col] || 'none';
                    const diff = config.independentDiffs?.[col] || 0;
                    if (transform !== 'none') {
                        xLabel = `${transformNames[transform]}(${xLabel})`;
                    }
                    if (diff > 0) {
                        xLabel = `Δ${''.repeat(diff - 1)}${xLabel}`;
                    }
                }
                const coef = result.coefficients[i];
                equation += ` ${coef >= 0 ? '+' : '-'} ${Math.abs(coef).toFixed(4)}·${xLabel}`;
            });

            return {
                ...result,
                dependent: config.dependent,
                dependentTransform: config.dependentTransform,
                dependentDiff: config.dependentDiff,
                independents: config.independents,
                independentTransforms: config.independentTransforms,
                independentDiffs: config.independentDiffs,
                instruments: config.instruments,
                arOrder: config.arOrder,
                maOrder: config.maOrder,
                arLabels,
                allVariables: allVars,
                equation,
                viewType: 'multiRegression'
            };
        }
    },

    // ARDL - Autoregressive Distributed Lag
    ardl: {
        name: 'ardl', category: 'statistics',
        icon: 'fa-wave-square', color: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
        inputs: ['data'], outputs: ['ardl'],
        config: {
            dependent: '',
            dependentTransform: 'none',
            dependentDiff: 0,
            independents: [],
            independentTransforms: {},
            independentDiffs: {},
            pLag: 1,
            qLags: {},
            maxLag: 4,
            criterion: 'AIC',
            includeConstant: true,
            includeTrend: false
        },
        execute: async function (inputs, config) {
            if (!inputs.data) throw new Error('No input data');
            if (!config.dependent) throw new Error('Select dependent variable');
            if (!config.independents?.length) throw new Error('Select independent variables');

            const transformNames = {
                'none': '', 'log': 'ln', 'log10': 'log₁₀', 'sqrt': '√',
                'square': '²', 'inverse': '1/', 'exp': 'e^', 'cube': '³', 'cbrt': '∛'
            };

            // Extract and transform dependent variable
            let y = inputs.data.data.map(row => parseFloat(row[config.dependent]));
            if (config.dependentTransform && config.dependentTransform !== 'none') {
                y = Statistics.transform(y, config.dependentTransform);
            }
            if (config.dependentDiff > 0) {
                y = Statistics.difference(y, config.dependentDiff);
            }

            // Extract and transform independent variables
            const X = {};
            const xLabels = {};
            config.independents.forEach(col => {
                let xCol = inputs.data.data.map(row => parseFloat(row[col]));
                const transform = config.independentTransforms?.[col] || 'none';
                const diff = config.independentDiffs?.[col] || 0;

                let label = col;
                if (transform !== 'none') {
                    xCol = Statistics.transform(xCol, transform);
                    label = `${transformNames[transform]}(${label})`;
                }
                if (diff > 0) {
                    xCol = Statistics.difference(xCol, diff);
                    label = `Δ${''.repeat(diff - 1)}${label}`;
                }
                X[col] = xCol;
                xLabels[col] = label;
            });

            // Handle length differences due to differencing
            const maxDiff = Math.max(
                config.dependentDiff || 0,
                ...config.independents.map(c => config.independentDiffs?.[c] || 0)
            );

            // Align all arrays to same length
            let minLen = y.length;
            config.independents.forEach(col => {
                if (X[col].length < minLen) minLen = X[col].length;
            });

            y = y.slice(-minLen);
            config.independents.forEach(col => {
                X[col] = X[col].slice(-minLen);
            });

            // Filter valid rows
            const validIndices = [];
            for (let i = 0; i < y.length; i++) {
                if (!isNaN(y[i]) && config.independents.every(col => !isNaN(X[col][i]))) {
                    validIndices.push(i);
                }
            }

            const yClean = validIndices.map(i => y[i]);
            const XClean = {};
            config.independents.forEach(col => {
                XClean[col] = validIndices.map(i => X[col][i]);
            });

            // Set up lag orders
            const qLags = {};
            config.independents.forEach(col => {
                qLags[col] = config.qLags?.[col] || 1;
            });

            // Run ARDL analysis
            const result = Statistics.ardlAnalysis(yClean, XClean, {
                pLag: config.pLag || 1,
                qLags,
                includeConstant: config.includeConstant !== false,
                includeTrend: config.includeTrend === true
            });

            if (!result) throw new Error('ARDL estimation failed');

            // Build dependent variable label
            let yLabel = config.dependent;
            if (config.dependentTransform && config.dependentTransform !== 'none') {
                yLabel = `${transformNames[config.dependentTransform]}(${yLabel})`;
            }
            if (config.dependentDiff > 0) {
                yLabel = `Δ${''.repeat(config.dependentDiff - 1)}${yLabel}`;
            }

            return {
                ...result,
                dependent: config.dependent,
                dependentLabel: yLabel,
                independents: config.independents,
                independentLabels: xLabels,
                dependentTransform: config.dependentTransform,
                dependentDiff: config.dependentDiff,
                independentTransforms: config.independentTransforms,
                independentDiffs: config.independentDiffs,
                pLag: config.pLag,
                qLags,
                viewType: 'ardl'
            };
        }
    },

    // VAR/VECM - Vector Autoregressive / Vector Error Correction Model
    varVecm: {
        name: 'varVecm', category: 'statistics',
        icon: 'fa-diagram-project', color: 'linear-gradient(135deg, #0891b2, #0e7490)',
        inputs: ['data'], outputs: ['varVecm'],
        config: {
            endogenous: [],
            transforms: {},       // {varName: 'log', ...}
            diffs: {},            // {varName: 1, ...}
            p: 2,                 // Lag order
            includeConstant: true,
            includeTrend: false,
            testCointegration: true,
            vecmRank: 1
        },
        execute: async function (inputs, config) {
            if (!inputs.data) throw new Error('No input data');
            if (!config.endogenous?.length || config.endogenous.length < 2) {
                throw new Error('Select at least 2 endogenous variables');
            }

            const transformNames = {
                'none': '', 'log': 'ln', 'log10': 'log₁₀', 'sqrt': '√',
                'square': '²', 'inverse': '1/', 'exp': 'e^', 'cube': '³', 'cbrt': '∛'
            };

            // Extract data for each endogenous variable
            const data = {};
            const labels = {};

            config.endogenous.forEach(col => {
                let arr = inputs.data.data.map(row => parseFloat(row[col])).filter(v => !isNaN(v));
                const transform = config.transforms?.[col] || 'none';
                const diff = config.diffs?.[col] || 0;

                let label = col;
                if (transform !== 'none') {
                    arr = Statistics.transform(arr, transform);
                    label = `${transformNames[transform]}(${label})`;
                }
                if (diff > 0) {
                    arr = Statistics.difference(arr, diff);
                    label = `Δ${''.repeat(diff - 1)}${label}`;
                }
                data[col] = arr.filter(v => !isNaN(v));
                labels[col] = label;
            });

            // Align lengths
            let minLen = Math.min(...config.endogenous.map(c => data[c].length));
            if (minLen < 10) {
                throw new Error('Not enough observations after transformations (need at least 10)');
            }
            config.endogenous.forEach(col => {
                data[col] = data[col].slice(-minLen);
            });

            // Run VAR/VECM analysis (transforms already applied, don't pass them again)
            const result = Statistics.varAnalysis(data, {
                p: config.p || 2,
                includeConstant: config.includeConstant !== false,
                includeTrend: config.includeTrend === true,
                testCointegration: config.testCointegration !== false,
                vecmRank: config.vecmRank || 1
                // Note: transforms and diffs not passed since already applied above
            });

            if (!result) throw new Error('VAR/VECM estimation failed - check data or reduce lag order');

            return {
                ...result,
                endogenous: config.endogenous,
                labels,
                transforms: config.transforms,
                diffs: config.diffs,
                viewType: 'varVecm'
            };
        }
    },

    // Stationarity Test - ADF, KPSS, Phillips-Perron
    stationarityTest: {
        name: 'stationarityTest', category: 'statistics',
        icon: 'fa-chart-area', color: 'linear-gradient(135deg, #dc2626, #b91c1c)',
        inputs: ['data'], outputs: ['stationarity'],
        config: {
            variable: '',
            transformation: 'none',  // none, log, log10, sqrt, square, inverse, exp
            differencing: 0,         // 0, 1, 2
            trend: 'c',              // 'n' (none), 'c' (constant), 'ct' (constant + trend)
            maxLag: null,            // Auto-select if null
            arOrder: 0,              // AR order for ARMA filtering
            maOrder: 0               // MA order for ARMA filtering
        },
        execute: async function (inputs, config) {
            if (!inputs.data) throw new Error('No input data');
            if (!config.variable) throw new Error('Select a variable');

            const transformNames = {
                'none': '', 'log': 'ln', 'log10': 'log₁₀', 'sqrt': '√',
                'square': '²', 'inverse': '1/', 'exp': 'e^', 'cube': '³', 'cbrt': '∛'
            };

            // Extract series
            let series = inputs.data.data.map(row => parseFloat(row[config.variable])).filter(v => !isNaN(v));

            if (series.length < 10) {
                throw new Error('Not enough valid observations (need at least 10)');
            }

            // Build label
            let label = config.variable;
            if (config.transformation && config.transformation !== 'none') {
                label = `${transformNames[config.transformation]}(${label})`;
            }
            if (config.differencing > 0) {
                label = `Δ${''.repeat(config.differencing - 1)}${label}`;
            }

            // Run stationarity analysis
            const result = Statistics.stationarityAnalysis(series, {
                transformation: config.transformation || 'none',
                differencing: config.differencing || 0,
                trend: config.trend || 'c',
                maxLag: config.maxLag
            });

            if (result.error) {
                throw new Error(result.error);
            }

            return {
                ...result,
                variable: config.variable,
                variableLabel: label,
                transformation: config.transformation,
                differencing: config.differencing,
                arOrder: config.arOrder || 0,
                maOrder: config.maOrder || 0,
                trend: config.trend,
                viewType: 'stationarity'
            };
        }
    },

    // Panel Data Analysis - Fixed Effects, Random Effects, Pooled OLS
    panelData: {
        name: 'panelData', category: 'statistics',
        icon: 'fa-table-columns', color: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
        inputs: ['data'], outputs: ['panel'],
        config: {
            entityColumn: '',         // Cross-sectional identifier
            timeColumn: '',           // Time identifier (optional)
            dependent: '',            // Dependent variable
            independents: [],         // Independent variables
            method: 'All',            // 'Pooled', 'FE', 'RE', 'All'
            dependentTransform: 'none',
            dependentDiff: 0,
            independentTransforms: {},
            independentDiffs: {},
            arOrder: 0,
            maOrder: 0,
            runHausman: true
        },
        execute: async function (inputs, config) {
            if (!inputs.data) throw new Error('No input data');
            if (!config.entityColumn) throw new Error('Select entity (cross-section) column');
            if (!config.dependent) throw new Error('Select dependent variable');
            if (!config.independents?.length) throw new Error('Select at least one independent variable');

            const transformNames = {
                'none': '', 'log': 'ln', 'log10': 'log₁₀', 'sqrt': '√',
                'square': '²', 'inverse': '1/', 'exp': 'e^', 'cube': '³', 'cbrt': '∛'
            };

            // Build labels for display
            const labels = {
                dependent: config.dependent,
                independents: {}
            };

            if (config.dependentTransform && config.dependentTransform !== 'none') {
                labels.dependent = `${transformNames[config.dependentTransform]}(${config.dependent})`;
            }
            if (config.dependentDiff > 0) {
                labels.dependent = `Δ${''.repeat(config.dependentDiff - 1)}${labels.dependent}`;
            }

            config.independents.forEach(ind => {
                let label = ind;
                const transform = config.independentTransforms?.[ind] || 'none';
                const diff = config.independentDiffs?.[ind] || 0;
                if (transform !== 'none') {
                    label = `${transformNames[transform]}(${label})`;
                }
                if (diff > 0) {
                    label = `Δ${''.repeat(diff - 1)}${label}`;
                }
                labels.independents[ind] = label;
            });

            // Run panel analysis
            const result = Statistics.panelAnalysis(inputs.data.data, {
                ...config,
                entities: [...new Set(inputs.data.data.map(r => r[config.entityColumn]))].filter(e => e != null),
                periods: config.timeColumn
                    ? [...new Set(inputs.data.data.map(r => r[config.timeColumn]))].filter(t => t != null)
                    : []
            });

            if (!result) {
                throw new Error('Panel analysis failed - check data structure');
            }

            return {
                ...result,
                labels,
                entityColumn: config.entityColumn,
                timeColumn: config.timeColumn,
                dependent: config.dependent,
                independents: config.independents,
                arOrder: config.arOrder || 0,
                maOrder: config.maOrder || 0,
                viewType: 'panel'
            };
        }
    },


    // Visualization Nodes

    scatterPlot: {
        name: 'scatterPlot', category: 'visualization',
        icon: 'fa-braille', color: 'linear-gradient(135deg, #f44336, #d32f2f)',
        inputs: ['data'], outputs: [],
        config: { xColumn: '', yColumn: '' },
        execute: async function (inputs, config) {
            if (!inputs.data) throw new Error('No input data');
            return { data: inputs.data.data, xColumn: config.xColumn, yColumn: config.yColumn, viewType: 'scatter' };
        }
    },

    lineChart: {
        name: 'lineChart', category: 'visualization',
        icon: 'fa-chart-line', color: 'linear-gradient(135deg, #4caf50, #388e3c)',
        inputs: ['data'], outputs: [],
        config: { xColumn: '', yColumn: '' },
        execute: async function (inputs, config) {
            if (!inputs.data) throw new Error('No input data');
            return { data: inputs.data.data, xColumn: config.xColumn, yColumn: config.yColumn, viewType: 'line' };
        }
    },

    barChart: {
        name: 'barChart', category: 'visualization',
        icon: 'fa-chart-bar', color: 'linear-gradient(135deg, #ff9800, #f57c00)',
        inputs: ['data'], outputs: [],
        config: { labelColumn: '', valueColumn: '' },
        execute: async function (inputs, config) {
            if (!inputs.data) throw new Error('No input data');
            return { data: inputs.data.data, labelColumn: config.labelColumn, valueColumn: config.valueColumn, viewType: 'bar' };
        }
    },

    histogram: {
        name: 'histogram', category: 'visualization',
        icon: 'fa-signal', color: 'linear-gradient(135deg, #607d8b, #455a64)',
        inputs: ['data'], outputs: [],
        config: { column: '', bins: 10 },
        execute: async function (inputs, config) {
            if (!inputs.data) throw new Error('No input data');
            const values = inputs.data.data.map(row => parseFloat(row[config.column])).filter(v => !isNaN(v));
            const min = Math.min(...values), max = Math.max(...values);
            const binWidth = (max - min) / config.bins;
            const bins = Array(config.bins).fill(0);
            values.forEach(v => {
                const idx = Math.min(Math.floor((v - min) / binWidth), config.bins - 1);
                bins[idx]++;
            });
            const labels = Array(config.bins).fill(0).map((_, i) => `${(min + i * binWidth).toFixed(1)}-${(min + (i + 1) * binWidth).toFixed(1)}`);
            return { bins, labels, column: config.column, viewType: 'histogram' };
        }
    },

    pieChart: {
        name: 'pieChart', category: 'visualization',
        icon: 'fa-chart-pie', color: 'linear-gradient(135deg, #e91e63, #c2185b)',
        inputs: ['data'], outputs: [],
        config: { labelColumn: '', valueColumn: '' },
        execute: async function (inputs, config) {
            if (!inputs.data) throw new Error('No input data');
            return { data: inputs.data.data, labelColumn: config.labelColumn, valueColumn: config.valueColumn, viewType: 'pie' };
        }
    },

    // =============================================
    // Views Nodes
    // =============================================

    imageView: {
        name: 'imageView', category: 'views',
        icon: 'fa-image', color: 'linear-gradient(135deg, #ec4899, #db2777)',
        inputs: ['data'], outputs: [],
        config: { imageColumn: '', maxWidth: 400, maxHeight: 300 },
        execute: async function (inputs, config) {
            if (!inputs.data) throw new Error('No input data');
            if (!config.imageColumn) throw new Error('Select image column');
            const images = inputs.data.data.map(row => row[config.imageColumn]).filter(Boolean);
            return { images, maxWidth: config.maxWidth, maxHeight: config.maxHeight, viewType: 'imageView' };
        }
    },

    textView: {
        name: 'textView', category: 'views',
        icon: 'fa-align-left', color: 'linear-gradient(135deg, #6366f1, #4f46e5)',
        inputs: ['data'], outputs: [],
        config: { textColumn: '', fontSize: 14, maxLines: 100 },
        execute: async function (inputs, config) {
            if (!inputs.data) throw new Error('No input data');
            if (!config.textColumn) throw new Error('Select text column');
            const texts = inputs.data.data.map(row => row[config.textColumn]).filter(Boolean);
            return { texts, fontSize: config.fontSize, maxLines: config.maxLines, viewType: 'textView' };
        }
    },

    statisticsView: {
        name: 'statisticsView', category: 'views',
        icon: 'fa-info-circle', color: 'linear-gradient(135deg, #3b82f6, #2563eb)',
        inputs: ['data'], outputs: [],
        config: { columns: [] },
        execute: async function (inputs, config) {
            if (!inputs.data) throw new Error('No input data');
            const cols = config.columns?.length ? config.columns : inputs.data.columns.filter(c => {
                const vals = inputs.data.data.map(r => parseFloat(r[c]));
                return vals.some(v => !isNaN(v));
            });
            const stats = {};
            cols.forEach(col => {
                const values = inputs.data.data.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
                if (values.length > 0) {
                    const sum = values.reduce((a, b) => a + b, 0);
                    const mean = sum / values.length;
                    const sorted = [...values].sort((a, b) => a - b);
                    const median = sorted.length % 2 === 0
                        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
                        : sorted[Math.floor(sorted.length / 2)];
                    const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length;
                    stats[col] = {
                        count: values.length,
                        sum: sum,
                        mean: mean,
                        median: median,
                        min: Math.min(...values),
                        max: Math.max(...values),
                        std: Math.sqrt(variance)
                    };
                }
            });
            return { stats, columns: cols, viewType: 'statisticsView' };
        }
    },

    tileView: {
        name: 'tileView', category: 'views',
        icon: 'fa-th-large', color: 'linear-gradient(135deg, #14b8a6, #0d9488)',
        inputs: ['data'], outputs: [],
        config: { titleColumn: '', valueColumn: '', maxTiles: 20, color: '#14b8a6' },
        execute: async function (inputs, config) {
            if (!inputs.data) throw new Error('No input data');
            const tiles = inputs.data.data.slice(0, config.maxTiles || 20).map(row => ({
                title: row[config.titleColumn] || '',
                value: row[config.valueColumn] || ''
            }));
            return { tiles, color: config.color, viewType: 'tileView' };
        }
    },

    boxPlot: {
        name: 'boxPlot', category: 'views',
        icon: 'fa-box', color: 'linear-gradient(135deg, #f97316, #ea580c)',
        inputs: ['data'], outputs: [],
        config: { columns: [] },
        execute: async function (inputs, config) {
            if (!inputs.data) throw new Error('No input data');
            if (!config.columns?.length) throw new Error('Select columns for box plot');
            const boxData = {};
            config.columns.forEach(col => {
                const values = inputs.data.data.map(r => parseFloat(r[col])).filter(v => !isNaN(v)).sort((a, b) => a - b);
                if (values.length > 0) {
                    const q1Idx = Math.floor(values.length * 0.25);
                    const q2Idx = Math.floor(values.length * 0.5);
                    const q3Idx = Math.floor(values.length * 0.75);
                    const q1 = values[q1Idx];
                    const q2 = values[q2Idx];
                    const q3 = values[q3Idx];
                    const iqr = q3 - q1;
                    const lowerWhisker = Math.max(values[0], q1 - 1.5 * iqr);
                    const upperWhisker = Math.min(values[values.length - 1], q3 + 1.5 * iqr);
                    const outliers = values.filter(v => v < lowerWhisker || v > upperWhisker);
                    boxData[col] = { min: values[0], max: values[values.length - 1], q1, q2, q3, lowerWhisker, upperWhisker, outliers };
                }
            });
            return { boxData, columns: config.columns, viewType: 'boxPlot' };
        }
    },

    heatmap: {
        name: 'heatmap', category: 'views',
        icon: 'fa-th', color: 'linear-gradient(135deg, #ef4444, #dc2626)',
        inputs: ['data'], outputs: [],
        config: { columns: [], colorScheme: 'redBlue' },
        execute: async function (inputs, config) {
            if (!inputs.data) throw new Error('No input data');
            const cols = config.columns?.length ? config.columns : inputs.data.columns.filter(c => {
                const vals = inputs.data.data.map(r => parseFloat(r[c]));
                return vals.some(v => !isNaN(v));
            });
            // Calculate correlation matrix
            const matrix = [];
            cols.forEach((col1, i) => {
                const row = [];
                cols.forEach((col2, j) => {
                    const x = inputs.data.data.map(r => parseFloat(r[col1])).filter(v => !isNaN(v));
                    const y = inputs.data.data.map(r => parseFloat(r[col2])).filter(v => !isNaN(v));
                    const minLen = Math.min(x.length, y.length);
                    const xTrim = x.slice(0, minLen);
                    const yTrim = y.slice(0, minLen);
                    const meanX = xTrim.reduce((a, b) => a + b, 0) / minLen;
                    const meanY = yTrim.reduce((a, b) => a + b, 0) / minLen;
                    let num = 0, denX = 0, denY = 0;
                    for (let k = 0; k < minLen; k++) {
                        num += (xTrim[k] - meanX) * (yTrim[k] - meanY);
                        denX += Math.pow(xTrim[k] - meanX, 2);
                        denY += Math.pow(yTrim[k] - meanY, 2);
                    }
                    const corr = denX && denY ? num / Math.sqrt(denX * denY) : 0;
                    row.push(corr);
                });
                matrix.push(row);
            });
            return { matrix, columns: cols, colorScheme: config.colorScheme, viewType: 'heatmap' };
        }
    },

    areaChart: {
        name: 'areaChart', category: 'views',
        icon: 'fa-chart-area', color: 'linear-gradient(135deg, #06b6d4, #0891b2)',
        inputs: ['data'], outputs: [],
        config: { xColumn: '', yColumns: [], fill: true, stacked: false },
        execute: async function (inputs, config) {
            if (!inputs.data) throw new Error('No input data');
            if (!config.xColumn) throw new Error('Select X-axis column');
            if (!config.yColumns?.length) throw new Error('Select Y-axis columns');
            const labels = inputs.data.data.map(r => r[config.xColumn]);
            const datasets = config.yColumns.map((col, i) => ({
                label: col,
                data: inputs.data.data.map(r => parseFloat(r[col]) || 0),
                fill: config.fill !== false
            }));
            return { labels, datasets, stacked: config.stacked, viewType: 'areaChart' };
        }
    },

    radarChart: {
        name: 'radarChart', category: 'views',
        icon: 'fa-spider', color: 'linear-gradient(135deg, #a855f7, #9333ea)',
        inputs: ['data'], outputs: [],
        config: { labelColumn: '', valueColumns: [], maxRows: 5 },
        execute: async function (inputs, config) {
            if (!inputs.data) throw new Error('No input data');
            if (!config.valueColumns?.length) throw new Error('Select value columns');
            const labels = config.valueColumns;
            const datasets = inputs.data.data.slice(0, config.maxRows || 5).map((row, i) => ({
                label: row[config.labelColumn] || `Series ${i + 1}`,
                data: config.valueColumns.map(col => parseFloat(row[col]) || 0)
            }));
            return { labels, datasets, viewType: 'radarChart' };
        }
    },

    //================================
    // Machine Learning Nodes
    // =============================================

    knnClassifier: {
        name: 'knnClassifier', category: 'ml',
        icon: 'fa-users', color: 'linear-gradient(135deg, #06b6d4, #0891b2)',
        inputs: ['data'], outputs: ['model'],
        config: { k: 5, target: '', features: [], trainRatio: 0.8, cv: false, cvFolds: 5 },
        execute: async function (inputs, config) {
            if (!inputs.data) throw new Error('No input data');
            if (!config.target) throw new Error('Select target column');
            if (!config.features?.length) throw new Error('Select feature columns');

            if (config.cv) {
                const cvResult = Statistics.trainWithCV(inputs.data.data, config, (data, cfg) => Statistics.knnClassify(data, cfg));
                if (!cvResult) throw new Error('KNN CV training failed');
                return { ...cvResult, target: config.target, features: config.features, viewType: 'cvResult' };
            }

            const result = Statistics.knnClassify(inputs.data.data, config);
            if (!result) throw new Error('KNN training failed');

            return { ...result, target: config.target, features: config.features, viewType: 'mlResult' };
        }
    },

    decisionTree: {
        name: 'decisionTree', category: 'ml',
        icon: 'fa-sitemap', color: 'linear-gradient(135deg, #10b981, #059669)',
        inputs: ['data'], outputs: ['model'],
        config: { target: '', features: [], maxDepth: 10, minSamples: 2, trainRatio: 0.8, cv: false, cvFolds: 5 },
        execute: async function (inputs, config) {
            if (!inputs.data) throw new Error('No input data');
            if (!config.target) throw new Error('Select target column');
            if (!config.features?.length) throw new Error('Select feature columns');

            if (config.cv) {
                const cvResult = Statistics.trainWithCV(inputs.data.data, config, (data, cfg) => Statistics.decisionTreeTrain(data, cfg));
                if (!cvResult) throw new Error('Decision Tree CV training failed');
                return { ...cvResult, target: config.target, features: config.features, viewType: 'cvResult' };
            }

            const result = Statistics.decisionTreeTrain(inputs.data.data, config);
            if (!result) throw new Error('Decision Tree training failed');

            return { ...result, target: config.target, features: config.features, viewType: 'mlResult' };
        }
    },

    randomForest: {
        name: 'randomForest', category: 'ml',
        icon: 'fa-tree', color: 'linear-gradient(135deg, #22c55e, #16a34a)',
        inputs: ['data'], outputs: ['model'],
        config: { target: '', features: [], nTrees: 10, maxDepth: 10, trainRatio: 0.8, cv: false, cvFolds: 5 },
        execute: async function (inputs, config) {
            if (!inputs.data) throw new Error('No input data');
            if (!config.target) throw new Error('Select target column');
            if (!config.features?.length) throw new Error('Select feature columns');

            if (config.cv) {
                const cvResult = Statistics.trainWithCV(inputs.data.data, config, (data, cfg) => Statistics.randomForestTrain(data, cfg));
                if (!cvResult) throw new Error('Random Forest CV training failed');
                return { ...cvResult, target: config.target, features: config.features, viewType: 'cvResult' };
            }

            const result = Statistics.randomForestTrain(inputs.data.data, config);
            if (!result) throw new Error('Random Forest training failed');

            return { ...result, target: config.target, features: config.features, viewType: 'mlResult' };
        }
    },

    logisticRegression: {
        name: 'logisticRegression', category: 'ml',
        icon: 'fa-chart-s-curve', color: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
        inputs: ['data'], outputs: ['model'],
        config: { target: '', features: [], learningRate: 0.1, epochs: 100, trainRatio: 0.8, cv: false, cvFolds: 5 },
        execute: async function (inputs, config) {
            if (!inputs.data) throw new Error('No input data');
            if (!config.target) throw new Error('Select target column');
            if (!config.features?.length) throw new Error('Select feature columns');

            if (config.cv) {
                const cvResult = Statistics.trainWithCV(inputs.data.data, config, (data, cfg) => Statistics.logisticRegressionTrain(data, cfg));
                if (!cvResult) throw new Error('Logistic Regression CV training failed');
                return { ...cvResult, target: config.target, features: config.features, viewType: 'cvResult' };
            }

            const result = Statistics.logisticRegressionTrain(inputs.data.data, config);
            if (!result) throw new Error('Logistic Regression training failed');

            return { ...result, target: config.target, features: config.features, viewType: 'mlResult' };
        }
    },

    kMeansClustering: {
        name: 'kMeansClustering', category: 'ml',
        icon: 'fa-object-group', color: 'linear-gradient(135deg, #f59e0b, #d97706)',
        inputs: ['data'], outputs: ['clustered'],
        config: { k: 3, features: [], maxIterations: 100 },
        execute: async function (inputs, config) {
            if (!inputs.data) throw new Error('No input data');
            if (!config.features?.length) throw new Error('Select feature columns');

            const result = Statistics.kMeansCluster(inputs.data.data, config);
            if (!result) throw new Error('K-Means clustering failed');

            return { ...result, features: config.features, viewType: 'clustering' };
        }
    },

    naiveBayes: {
        name: 'naiveBayes', category: 'ml',
        icon: 'fa-percentage', color: 'linear-gradient(135deg, #ec4899, #db2777)',
        inputs: ['data'], outputs: ['model'],
        config: { target: '', features: [], laplace: 1, trainRatio: 0.8, cv: false, cvFolds: 5 },
        execute: async function (inputs, config) {
            if (!inputs.data) throw new Error('No input data');
            if (!config.target) throw new Error('Select target column');
            if (!config.features?.length) throw new Error('Select feature columns');

            if (config.cv) {
                const cvResult = Statistics.trainWithCV(inputs.data.data, config, (data, cfg) => Statistics.naiveBayesTrain(data, cfg));
                if (!cvResult) throw new Error('Naive Bayes CV training failed');
                return { ...cvResult, target: config.target, features: config.features, viewType: 'cvResult' };
            }

            const result = Statistics.naiveBayesTrain(inputs.data.data, config);
            if (!result) throw new Error('Naive Bayes training failed');

            return { ...result, target: config.target, features: config.features, viewType: 'mlResult' };
        }
    },

    // Support Vector Machine
    svm: {
        name: 'svm', category: 'ml',
        icon: 'fa-vector-square', color: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
        inputs: ['data'], outputs: ['model'],
        config: { target: '', features: [], kernel: 'linear', C: 1.0, gamma: 0.1, trainRatio: 0.8 },
        execute: async function (inputs, config) {
            if (!inputs.data) throw new Error('No input data');
            if (!config.target) throw new Error('Select target column');
            if (!config.features?.length) throw new Error('Select feature columns');

            const result = Statistics.svmTrain(inputs.data.data, config);
            if (!result) throw new Error('SVM training failed');

            return { ...result, target: config.target, features: config.features, viewType: 'mlResult' };
        }
    },

    // Gradient Boosting
    gradientBoosting: {
        name: 'gradientBoosting', category: 'ml',
        icon: 'fa-layer-group', color: 'linear-gradient(135deg, #84cc16, #65a30d)',
        inputs: ['data'], outputs: ['model'],
        config: { target: '', features: [], nEstimators: 50, learningRate: 0.1, maxDepth: 3, trainRatio: 0.8 },
        execute: async function (inputs, config) {
            if (!inputs.data) throw new Error('No input data');
            if (!config.target) throw new Error('Select target column');
            if (!config.features?.length) throw new Error('Select feature columns');

            const result = Statistics.gradientBoostingTrain(inputs.data.data, config);
            if (!result) throw new Error('Gradient Boosting training failed');

            return { ...result, target: config.target, features: config.features, viewType: 'mlResult' };
        }
    },

    // AdaBoost
    adaBoost: {
        name: 'adaBoost', category: 'ml',
        icon: 'fa-rocket', color: 'linear-gradient(135deg, #f97316, #ea580c)',
        inputs: ['data'], outputs: ['model'],
        config: { target: '', features: [], nEstimators: 50, learningRate: 1.0, trainRatio: 0.8 },
        execute: async function (inputs, config) {
            if (!inputs.data) throw new Error('No input data');
            if (!config.target) throw new Error('Select target column');
            if (!config.features?.length) throw new Error('Select feature columns');

            const result = Statistics.adaBoostTrain(inputs.data.data, config);
            if (!result) throw new Error('AdaBoost training failed');

            return { ...result, target: config.target, features: config.features, viewType: 'mlResult' };
        }
    },

    // Principal Component Analysis
    pca: {
        name: 'pca', category: 'ml',
        icon: 'fa-compress-arrows-alt', color: 'linear-gradient(135deg, #a855f7, #9333ea)',
        inputs: ['data'], outputs: ['pca'],
        config: { features: [], nComponents: 2 },
        execute: async function (inputs, config) {
            if (!inputs.data) throw new Error('No input data');
            if (!config.features?.length) throw new Error('Select feature columns');

            const result = Statistics.pcaAnalysis(inputs.data.data, config);
            if (!result) throw new Error('PCA analysis failed');

            return { ...result, features: config.features, viewType: 'pca' };
        }
    },

    // =============================================
    // ML Visualization Nodes
    // =============================================

    rocCurve: {
        name: 'rocCurve', category: 'mlViz',
        icon: 'fa-chart-line', color: 'linear-gradient(135deg, #ef4444, #dc2626)',
        inputs: ['model'], outputs: [],
        config: {},
        execute: async function (inputs, config) {
            if (!inputs.model) throw new Error('No model connected');
            if (!inputs.model.probabilities) throw new Error('Model must have probability outputs');

            const result = Statistics.calculateROC(inputs.model);
            if (!result) throw new Error('ROC calculation failed');

            return { ...result, viewType: 'rocCurve' };
        }
    },

    prCurve: {
        name: 'prCurve', category: 'mlViz',
        icon: 'fa-wave-square', color: 'linear-gradient(135deg, #3b82f6, #2563eb)',
        inputs: ['model'], outputs: [],
        config: {},
        execute: async function (inputs, config) {
            if (!inputs.model) throw new Error('No model connected');
            if (!inputs.model.probabilities) throw new Error('Model must have probability outputs');

            const result = Statistics.calculatePR(inputs.model);
            if (!result) throw new Error('PR calculation failed');

            return { ...result, viewType: 'prCurve' };
        }
    },

    learningCurve: {
        name: 'learningCurve', category: 'mlViz',
        icon: 'fa-graduation-cap', color: 'linear-gradient(135deg, #22c55e, #16a34a)',
        inputs: ['model'], outputs: [],
        config: {},
        execute: async function (inputs, config) {
            if (!inputs.model) throw new Error('No model connected');
            if (!inputs.model.trainingHistory) throw new Error('Model must have training history');

            return { ...inputs.model.trainingHistory, viewType: 'learningCurve' };
        }
    },

    featureImportance: {
        name: 'featureImportance', category: 'mlViz',
        icon: 'fa-sort-amount-down', color: 'linear-gradient(135deg, #f59e0b, #d97706)',
        inputs: ['model'], outputs: [],
        config: {},
        execute: async function (inputs, config) {
            if (!inputs.model) throw new Error('No model connected');
            if (!inputs.model.featureImportance) throw new Error('Model does not have feature importance');

            return {
                featureImportance: inputs.model.featureImportance,
                features: inputs.model.features,
                viewType: 'featureImportance'
            };
        }
    },

    elbowCurve: {
        name: 'elbowCurve', category: 'mlViz',
        icon: 'fa-chart-bar', color: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
        inputs: ['data'], outputs: [],
        config: { features: [], maxK: 10 },
        execute: async function (inputs, config) {
            if (!inputs.data) throw new Error('No input data');
            if (!config.features?.length) throw new Error('Select feature columns');

            const result = Statistics.calculateElbowCurve(inputs.data.data, config);
            if (!result) throw new Error('Elbow curve calculation failed');

            return { ...result, viewType: 'elbowCurve' };
        }
    },

    confusionHeatmap: {
        name: 'confusionHeatmap', category: 'mlViz',
        icon: 'fa-th', color: 'linear-gradient(135deg, #ec4899, #db2777)',
        inputs: ['model'], outputs: [],
        config: {},
        execute: async function (inputs, config) {
            if (!inputs.model) throw new Error('No model connected');
            if (!inputs.model.confusionMatrix) throw new Error('Model must have confusion matrix');

            return {
                confusionMatrix: inputs.model.confusionMatrix,
                classes: inputs.model.classes,
                viewType: 'confusionHeatmap'
            };
        }
    },

    // =============================================
    // Deep Learning Nodes
    // =============================================

    neuralNetwork: {
        name: 'neuralNetwork', category: 'dl',
        icon: 'fa-project-diagram', color: 'linear-gradient(135deg, #6366f1, #4f46e5)',
        inputs: ['data'], outputs: ['model'],
        config: {
            target: '',
            features: [],
            hiddenLayers: '16,8', // comma-separated layer sizes
            activation: 'relu', // relu, sigmoid, tanh
            learningRate: 0.01,
            epochs: 100,
            trainRatio: 0.8
        },
        execute: async function (inputs, config) {
            if (!inputs.data) throw new Error('No input data');
            if (!config.target) throw new Error('Select target column');
            if (!config.features?.length) throw new Error('Select feature columns');

            const result = Statistics.neuralNetworkTrain(inputs.data.data, config);
            if (!result) throw new Error('Neural Network training failed');

            return { ...result, target: config.target, features: config.features, viewType: 'neuralNetwork' };
        }
    },

    modelPredictor: {
        name: 'modelPredictor', category: 'dl',
        icon: 'fa-magic', color: 'linear-gradient(135deg, #14b8a6, #0d9488)',
        inputs: ['data', 'model'], outputs: ['predictions'],
        config: {},
        execute: async function (inputs, config) {
            if (!inputs.data) throw new Error('No input data');
            if (!inputs.model) throw new Error('No model connected');

            const result = Statistics.modelPredict(inputs.data.data, inputs.model);
            if (!result) throw new Error('Prediction failed');

            return { ...result, viewType: 'predictions' };
        }
    }
};

function getNodeDef(type) { return NodeTypes[type] || null; }
