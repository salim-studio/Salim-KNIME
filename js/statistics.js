/* Salim-KNIME - Statistics Module */

const Statistics = {
    // Calculate mean
    mean(arr) {
        if (!arr.length) return 0;
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    },

    // Calculate median
    median(arr) {
        if (!arr.length) return 0;
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    },

    // Calculate mode
    mode(arr) {
        if (!arr.length) return 0;
        const freq = {};
        arr.forEach(v => freq[v] = (freq[v] || 0) + 1);
        let maxFreq = 0, mode = arr[0];
        for (const [val, count] of Object.entries(freq)) {
            if (count > maxFreq) { maxFreq = count; mode = parseFloat(val); }
        }
        return mode;
    },

    // Calculate variance
    variance(arr, sample = true) {
        if (arr.length < 2) return 0;
        const m = this.mean(arr);
        const sqDiffs = arr.map(v => Math.pow(v - m, 2));
        return sqDiffs.reduce((a, b) => a + b, 0) / (arr.length - (sample ? 1 : 0));
    },

    // Calculate standard deviation
    std(arr, sample = true) {
        return Math.sqrt(this.variance(arr, sample));
    },

    // Calculate sum
    sum(arr) {
        return arr.reduce((a, b) => a + b, 0);
    },

    // Calculate min
    min(arr) {
        return arr.length ? Math.min(...arr) : 0;
    },

    // Calculate max
    max(arr) {
        return arr.length ? Math.max(...arr) : 0;
    },

    // Calculate range
    range(arr) {
        return this.max(arr) - this.min(arr);
    },

    // Calculate skewness
    skewness(arr) {
        if (arr.length < 3) return 0;
        const n = arr.length;
        const m = this.mean(arr);
        const s = this.std(arr, false);
        if (s === 0) return 0;
        const sum = arr.reduce((acc, v) => acc + Math.pow((v - m) / s, 3), 0);
        return (n / ((n - 1) * (n - 2))) * sum;
    },

    // Calculate kurtosis
    kurtosis(arr) {
        if (arr.length < 4) return 0;
        const n = arr.length;
        const m = this.mean(arr);
        const s = this.std(arr, false);
        if (s === 0) return 0;
        const sum = arr.reduce((acc, v) => acc + Math.pow((v - m) / s, 4), 0);
        return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sum - (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
    },

    // Descriptive statistics for array
    describe(arr) {
        const clean = arr.filter(v => typeof v === 'number' && !isNaN(v));
        return {
            count: clean.length,
            mean: this.mean(clean),
            median: this.median(clean),
            mode: this.mode(clean),
            std: this.std(clean),
            variance: this.variance(clean),
            min: this.min(clean),
            max: this.max(clean),
            range: this.range(clean),
            sum: this.sum(clean),
            skewness: this.skewness(clean),
            kurtosis: this.kurtosis(clean)
        };
    },

    // Pearson correlation coefficient
    correlation(x, y) {
        if (x.length !== y.length || x.length < 2) return 0;
        const n = x.length;
        const meanX = this.mean(x), meanY = this.mean(y);
        let num = 0, denX = 0, denY = 0;
        for (let i = 0; i < n; i++) {
            const dx = x[i] - meanX, dy = y[i] - meanY;
            num += dx * dy;
            denX += dx * dx;
            denY += dy * dy;
        }
        const den = Math.sqrt(denX * denY);
        return den === 0 ? 0 : num / den;
    },

    // Correlation matrix for multiple columns
    correlationMatrix(data, columns) {
        const matrix = {};
        columns.forEach(col1 => {
            matrix[col1] = {};
            columns.forEach(col2 => {
                const x = data.map(row => parseFloat(row[col1])).filter(v => !isNaN(v));
                const y = data.map(row => parseFloat(row[col2])).filter(v => !isNaN(v));
                matrix[col1][col2] = this.correlation(x, y);
            });
        });
        return matrix;
    },

    // Simple linear regression
    linearRegression(x, y) {
        if (x.length !== y.length || x.length < 2) return null;
        const n = x.length;
        const meanX = this.mean(x), meanY = this.mean(y);
        let num = 0, den = 0;
        for (let i = 0; i < n; i++) {
            num += (x[i] - meanX) * (y[i] - meanY);
            den += Math.pow(x[i] - meanX, 2);
        }
        const slope = den === 0 ? 0 : num / den;
        const intercept = meanY - slope * meanX;

        // R-squared
        const predicted = x.map(xi => slope * xi + intercept);
        const ssRes = y.reduce((acc, yi, i) => acc + Math.pow(yi - predicted[i], 2), 0);
        const ssTot = y.reduce((acc, yi) => acc + Math.pow(yi - meanY, 2), 0);
        const rSquared = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

        return { slope, intercept, rSquared, n };
    },

    // Multiple linear regression with full diagnostics
    multipleRegression(X, y) {
        const n = y.length;
        const k = X[0].length;

        // Add intercept column
        const XwithIntercept = X.map(row => [1, ...row]);

        // Matrix operations for OLS: β = (X'X)^(-1) X'y
        const Xt = this.transpose(XwithIntercept);
        const XtX = this.matMul(Xt, XwithIntercept);
        const XtXinv = this.matInverse(XtX);
        if (!XtXinv) return null;

        const Xty = this.matVecMul(Xt, y);
        const coefficients = this.matVecMul(XtXinv, Xty);

        // Calculate predicted values and residuals
        const predicted = XwithIntercept.map(row =>
            row.reduce((sum, val, i) => sum + val * coefficients[i], 0)
        );
        const residuals = y.map((yi, i) => yi - predicted[i]);

        // Calculate R-squared and Adjusted R-squared
        const meanY = this.mean(y);
        const ssRes = residuals.reduce((acc, r) => acc + r * r, 0);
        const ssTot = y.reduce((acc, yi) => acc + Math.pow(yi - meanY, 2), 0);
        const ssReg = ssTot - ssRes;
        const rSquared = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
        const adjRSquared = 1 - ((1 - rSquared) * (n - 1)) / (n - k - 1);

        // Calculate MSE and standard errors
        const dfResidual = n - k - 1;
        const dfRegression = k;
        const mse = dfResidual > 0 ? ssRes / dfResidual : 0;
        const se = Math.sqrt(mse);

        // Standard errors of coefficients
        const stdErrors = XtXinv.map((row, i) => Math.sqrt(row[i] * mse));

        // T-statistics for each coefficient
        const tStats = coefficients.map((coef, i) => stdErrors[i] > 0 ? coef / stdErrors[i] : 0);

        // P-values (approximation using normal distribution for large samples)
        const pValues = tStats.map(t => 2 * (1 - this.normalCDF(Math.abs(t))));

        // Significance at 0.05 level
        const significant = pValues.map(p => p < 0.05);

        // F-statistic for overall model significance
        const msReg = dfRegression > 0 ? ssReg / dfRegression : 0;
        const msRes = dfResidual > 0 ? ssRes / dfResidual : 0;
        const fStatistic = msRes > 0 ? msReg / msRes : 0;
        const fPValue = 1 - this.fCDF(fStatistic, dfRegression, dfResidual);
        const modelSignificant = fPValue < 0.05;

        // Durbin-Watson statistic
        let dwNum = 0;
        for (let i = 1; i < residuals.length; i++) {
            dwNum += Math.pow(residuals[i] - residuals[i - 1], 2);
        }
        const dwDen = residuals.reduce((acc, r) => acc + r * r, 0);
        const durbinWatson = dwDen > 0 ? dwNum / dwDen : 2;

        return {
            intercept: coefficients[0],
            coefficients: coefficients.slice(1),
            stdErrors: stdErrors.slice(1),
            interceptStdError: stdErrors[0],
            tStats: tStats.slice(1),
            interceptTStat: tStats[0],
            pValues: pValues.slice(1),
            interceptPValue: pValues[0],
            significant: significant.slice(1),
            interceptSignificant: significant[0],
            rSquared,
            adjRSquared,
            se,
            fStatistic,
            fPValue,
            modelSignificant,
            durbinWatson,
            n,
            k,
            dfRegression,
            dfResidual,
            ssReg,
            ssRes,
            ssTot
        };
    },

    // Normal CDF approximation
    normalCDF(x) {
        const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
        const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
        const sign = x < 0 ? -1 : 1;
        x = Math.abs(x) / Math.sqrt(2);
        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
        return 0.5 * (1.0 + sign * y);
    },

    // F-distribution CDF approximation
    fCDF(f, df1, df2) {
        if (f <= 0 || df1 <= 0 || df2 <= 0) return 0;
        const x = df2 / (df2 + df1 * f);
        return 1 - this.incompleteBeta(df2 / 2, df1 / 2, x);
    },

    // Incomplete Beta function approximation
    incompleteBeta(a, b, x) {
        if (x <= 0) return 0;
        if (x >= 1) return 1;
        // Simple approximation using continued fraction
        const maxIter = 100;
        const eps = 1e-10;
        let result = Math.pow(x, a) * Math.pow(1 - x, b) / (a * this.beta(a, b));
        let sum = 0, term = 1;
        for (let n = 0; n < maxIter && Math.abs(term) > eps; n++) {
            term *= (a + n) * x / (a + b + n);
            sum += term / (a + n + 1);
        }
        return result * (1 + sum);
    },

    // Beta function
    beta(a, b) {
        return Math.exp(this.logGamma(a) + this.logGamma(b) - this.logGamma(a + b));
    },

    // Log Gamma approximation (Stirling)
    logGamma(x) {
        if (x <= 0) return 0;
        return 0.5 * Math.log(2 * Math.PI / x) + x * (Math.log(x + 1 / (12 * x - 1 / (10 * x))) - 1);
    },

    // ========================================
    // Variable Transformations
    // ========================================

    transform(arr, type) {
        switch (type) {
            case 'log':
                return arr.map(v => v > 0 ? Math.log(v) : NaN);
            case 'log10':
                return arr.map(v => v > 0 ? Math.log10(v) : NaN);
            case 'sqrt':
                return arr.map(v => v >= 0 ? Math.sqrt(v) : NaN);
            case 'square':
                return arr.map(v => v * v);
            case 'inverse':
                return arr.map(v => v !== 0 ? 1 / v : NaN);
            case 'exp':
                return arr.map(v => Math.exp(v));
            case 'cube':
                return arr.map(v => v * v * v);
            case 'cbrt':
                return arr.map(v => Math.cbrt(v));
            default:
                return arr;
        }
    },

    // First difference
    difference(arr, order = 1) {
        let result = [...arr];
        for (let d = 0; d < order; d++) {
            const diff = [];
            for (let i = 1; i < result.length; i++) {
                diff.push(result[i] - result[i - 1]);
            }
            result = diff;
        }
        return result;
    },

    // AR terms (lagged dependent variable)
    createARTerms(arr, p) {
        const lags = [];
        for (let lag = 1; lag <= p; lag++) {
            const lagged = [];
            for (let i = lag; i < arr.length; i++) {
                lagged.push(arr[i - lag]);
            }
            lags.push(lagged);
        }
        return lags;
    },

    // MA terms (lagged residuals - needs iterative estimation)
    createMATerms(residuals, q) {
        const lags = [];
        for (let lag = 1; lag <= q; lag++) {
            const lagged = [];
            for (let i = lag; i < residuals.length; i++) {
                lagged.push(residuals[i - lag]);
            }
            lags.push(lagged);
        }
        return lags;
    },


    // Matrix transpose
    transpose(matrix) {
        return matrix[0].map((_, i) => matrix.map(row => row[i]));
    },

    // Matrix multiplication
    matMul(A, B) {
        const result = [];
        for (let i = 0; i < A.length; i++) {
            result[i] = [];
            for (let j = 0; j < B[0].length; j++) {
                let sum = 0;
                for (let k = 0; k < A[0].length; k++) {
                    sum += A[i][k] * B[k][j];
                }
                result[i][j] = sum;
            }
        }
        return result;
    },

    // Matrix-vector multiplication
    matVecMul(A, v) {
        return A.map(row => row.reduce((sum, val, i) => sum + val * v[i], 0));
    },

    // Matrix inverse (Gauss-Jordan)
    matInverse(matrix) {
        const n = matrix.length;
        const augmented = matrix.map((row, i) => {
            const identity = new Array(n).fill(0);
            identity[i] = 1;
            return [...row, ...identity];
        });

        for (let i = 0; i < n; i++) {
            let maxRow = i;
            for (let k = i + 1; k < n; k++) {
                if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) maxRow = k;
            }
            [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

            if (Math.abs(augmented[i][i]) < 1e-10) return null;

            const pivot = augmented[i][i];
            for (let j = 0; j < 2 * n; j++) augmented[i][j] /= pivot;

            for (let k = 0; k < n; k++) {
                if (k !== i) {
                    const factor = augmented[k][i];
                    for (let j = 0; j < 2 * n; j++) augmented[k][j] -= factor * augmented[i][j];
                }
            }
        }

        return augmented.map(row => row.slice(n));
    },

    // T-test (two-sample)
    tTest(sample1, sample2) {
        const n1 = sample1.length, n2 = sample2.length;
        const mean1 = this.mean(sample1), mean2 = this.mean(sample2);
        const var1 = this.variance(sample1), var2 = this.variance(sample2);
        const pooledVar = ((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2);
        const se = Math.sqrt(pooledVar * (1 / n1 + 1 / n2));
        const tStat = se === 0 ? 0 : (mean1 - mean2) / se;
        const df = n1 + n2 - 2;
        return { tStatistic: tStat, degreesOfFreedom: df, mean1, mean2 };
    },

    // T-distribution CDF approximation
    tCDF(t, df) {
        if (df <= 0) return 0.5;
        const x = df / (df + t * t);
        const prob = 0.5 * this.incompleteBeta(df / 2, 0.5, x);
        return t >= 0 ? 1 - prob : prob;
    },

    // Regularized incomplete beta function I_x(a,b)
    incompleteBeta(a, b, x) {
        if (x <= 0) return 0;
        if (x >= 1) return 1;

        // Use continued fraction expansion for better convergence
        const bt = Math.exp(
            this.logGamma(a + b) - this.logGamma(a) - this.logGamma(b) +
            a * Math.log(x) + b * Math.log(1 - x)
        );

        // Use continued fraction when x < (a+1)/(a+b+2)
        if (x < (a + 1) / (a + b + 2)) {
            return bt * this.betaCF(a, b, x) / a;
        } else {
            return 1 - bt * this.betaCF(b, a, 1 - x) / b;
        }
    },

    // Continued fraction for incomplete beta
    betaCF(a, b, x) {
        const MAXIT = 100;
        const EPS = 1e-14;
        const FPMIN = 1e-30;

        let qab = a + b;
        let qap = a + 1;
        let qam = a - 1;
        let c = 1;
        let d = 1 - qab * x / qap;
        if (Math.abs(d) < FPMIN) d = FPMIN;
        d = 1 / d;
        let h = d;

        for (let m = 1; m <= MAXIT; m++) {
            let m2 = 2 * m;
            let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
            d = 1 + aa * d;
            if (Math.abs(d) < FPMIN) d = FPMIN;
            c = 1 + aa / c;
            if (Math.abs(c) < FPMIN) c = FPMIN;
            d = 1 / d;
            h *= d * c;

            aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
            d = 1 + aa * d;
            if (Math.abs(d) < FPMIN) d = FPMIN;
            c = 1 + aa / c;
            if (Math.abs(c) < FPMIN) c = FPMIN;
            d = 1 / d;
            let del = d * c;
            h *= del;

            if (Math.abs(del - 1) < EPS) break;
        }
        return h;
    },

    // F-distribution CDF (uses incomplete beta function)
    fCDF(f, df1, df2) {
        if (f <= 0 || df1 <= 0 || df2 <= 0) return 0;
        const x = (df1 * f) / (df1 * f + df2);
        return this.incompleteBeta(df1 / 2, df2 / 2, x);
    },

    // Independent Samples T-Test (with Welch's correction option)
    independentTTest(group1, group2, equalVariance = true) {
        const n1 = group1.length, n2 = group2.length;
        if (n1 < 2 || n2 < 2) {
            return { error: 'Insufficient data (need at least 2 samples per group)' };
        }

        const mean1 = this.mean(group1), mean2 = this.mean(group2);
        const var1 = this.variance(group1), var2 = this.variance(group2);
        const std1 = Math.sqrt(var1), std2 = Math.sqrt(var2);
        const meanDiff = mean1 - mean2;

        let tStatistic, df, se;

        if (equalVariance) {
            // Pooled variance (Student's t-test)
            const pooledVar = ((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2);
            se = Math.sqrt(pooledVar * (1 / n1 + 1 / n2));
            tStatistic = se === 0 ? 0 : meanDiff / se;
            df = n1 + n2 - 2;
        } else {
            // Welch's t-test (unequal variances)
            se = Math.sqrt(var1 / n1 + var2 / n2);
            tStatistic = se === 0 ? 0 : meanDiff / se;
            // Welch-Satterthwaite degrees of freedom
            const v1 = var1 / n1, v2 = var2 / n2;
            df = Math.pow(v1 + v2, 2) / (Math.pow(v1, 2) / (n1 - 1) + Math.pow(v2, 2) / (n2 - 1));
        }

        // Two-tailed p-value
        const pValue = 2 * (1 - this.tCDF(Math.abs(tStatistic), df));
        const significant = pValue < 0.05;

        // Levene's test for equality of variances
        const leveneResult = this.levenesTest(group1, group2);

        // Effect size (Cohen's d)
        const pooledStd = Math.sqrt(((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2));
        const cohensD = pooledStd === 0 ? 0 : meanDiff / pooledStd;

        // 95% Confidence interval for mean difference
        const tCritical = 1.96; // Approximate for large df
        const ciLower = meanDiff - tCritical * se;
        const ciUpper = meanDiff + tCritical * se;

        return {
            testType: equalVariance ? 'Student' : 'Welch',
            group1Stats: { n: n1, mean: mean1, std: std1, variance: var1 },
            group2Stats: { n: n2, mean: mean2, std: std2, variance: var2 },
            meanDifference: meanDiff,
            tStatistic,
            degreesOfFreedom: df,
            pValue,
            significant,
            standardError: se,
            cohensD,
            effectSize: Math.abs(cohensD) < 0.2 ? 'negligible' : Math.abs(cohensD) < 0.5 ? 'small' : Math.abs(cohensD) < 0.8 ? 'medium' : 'large',
            confidenceInterval: { lower: ciLower, upper: ciUpper, level: 0.95 },
            leveneTest: leveneResult,
            conclusion: significant ? 'Significant difference' : 'No significant difference'
        };
    },

    // Levene's Test for equality of variances
    levenesTest(group1, group2) {
        const n1 = group1.length, n2 = group2.length;
        const N = n1 + n2;
        const k = 2;

        const mean1 = this.mean(group1), mean2 = this.mean(group2);
        const z1 = group1.map(x => Math.abs(x - mean1));
        const z2 = group2.map(x => Math.abs(x - mean2));

        const zMean1 = this.mean(z1), zMean2 = this.mean(z2);
        const zMeanTotal = (n1 * zMean1 + n2 * zMean2) / N;

        const ssb = n1 * Math.pow(zMean1 - zMeanTotal, 2) + n2 * Math.pow(zMean2 - zMeanTotal, 2);
        const ssw = z1.reduce((sum, z) => sum + Math.pow(z - zMean1, 2), 0) +
            z2.reduce((sum, z) => sum + Math.pow(z - zMean2, 2), 0);

        const msb = ssb / (k - 1);
        const msw = ssw / (N - k);
        const fStatistic = msw === 0 ? 0 : msb / msw;
        const pValue = 1 - this.fCDF(fStatistic, k - 1, N - k);

        return {
            fStatistic,
            pValue,
            equalVariances: pValue > 0.05,
            conclusion: pValue > 0.05 ? 'Equal variances' : 'Unequal variances'
        };
    },

    // Paired Samples T-Test
    pairedTTest(sample1, sample2) {
        if (sample1.length !== sample2.length) {
            return { error: 'Samples must have equal length for paired t-test' };
        }

        const n = sample1.length;
        if (n < 2) {
            return { error: 'Insufficient data (need at least 2 pairs)' };
        }

        // Calculate differences
        const differences = sample1.map((x, i) => x - sample2[i]);
        const meanDiff = this.mean(differences);
        const stdDiff = this.std(differences);
        const seDiff = stdDiff / Math.sqrt(n);

        const tStatistic = seDiff === 0 ? 0 : meanDiff / seDiff;
        const df = n - 1;

        // Two-tailed p-value
        const pValue = 2 * (1 - this.tCDF(Math.abs(tStatistic), df));
        const significant = pValue < 0.05;

        const mean1 = this.mean(sample1), mean2 = this.mean(sample2);
        const std1 = this.std(sample1), std2 = this.std(sample2);

        // Effect size (Cohen's d for paired samples)
        const cohensD = stdDiff === 0 ? 0 : meanDiff / stdDiff;

        // Correlation between pairs
        const correlation = this.correlation(sample1, sample2);

        // 95% Confidence interval
        const tCritical = 2.0; // Approximate
        const ciLower = meanDiff - tCritical * seDiff;
        const ciUpper = meanDiff + tCritical * seDiff;

        return {
            nPairs: n,
            sample1Stats: { mean: mean1, std: std1 },
            sample2Stats: { mean: mean2, std: std2 },
            differences: {
                mean: meanDiff,
                std: stdDiff,
                se: seDiff
            },
            tStatistic,
            degreesOfFreedom: df,
            pValue,
            significant,
            cohensD,
            effectSize: Math.abs(cohensD) < 0.2 ? 'negligible' : Math.abs(cohensD) < 0.5 ? 'small' : Math.abs(cohensD) < 0.8 ? 'medium' : 'large',
            correlation,
            confidenceInterval: { lower: ciLower, upper: ciUpper, level: 0.95 },
            conclusion: significant ? 'Significant difference' : 'No significant difference'
        };
    },

    // Two-Way ANOVA
    twoWayAnova(data, factor1Col, factor2Col, valueCol) {
        // Extract unique levels for each factor
        const factor1Levels = [...new Set(data.map(d => d[factor1Col]))].filter(x => x != null);
        const factor2Levels = [...new Set(data.map(d => d[factor2Col]))].filter(x => x != null);

        const a = factor1Levels.length; // Number of levels for factor 1
        const b = factor2Levels.length; // Number of levels for factor 2

        if (a < 2 || b < 2) {
            return { error: 'Each factor needs at least 2 levels' };
        }

        // Organize data into cells
        const cells = {};
        const cellMeans = {};
        let grandMean = 0;
        let N = 0;
        const allValues = [];

        factor1Levels.forEach(f1 => {
            cells[f1] = {};
            cellMeans[f1] = {};
            factor2Levels.forEach(f2 => {
                const cellData = data.filter(d => d[factor1Col] === f1 && d[factor2Col] === f2)
                    .map(d => parseFloat(d[valueCol]))
                    .filter(v => !isNaN(v));
                cells[f1][f2] = cellData;
                cellMeans[f1][f2] = cellData.length > 0 ? this.mean(cellData) : 0;
                N += cellData.length;
                allValues.push(...cellData);
            });
        });

        if (N < 3) {
            return { error: 'Insufficient data for analysis' };
        }

        grandMean = this.mean(allValues);

        // Calculate marginal means
        const factor1Means = {};
        factor1Levels.forEach(f1 => {
            const vals = data.filter(d => d[factor1Col] === f1).map(d => parseFloat(d[valueCol])).filter(v => !isNaN(v));
            factor1Means[f1] = vals.length > 0 ? this.mean(vals) : 0;
        });

        const factor2Means = {};
        factor2Levels.forEach(f2 => {
            const vals = data.filter(d => d[factor2Col] === f2).map(d => parseFloat(d[valueCol])).filter(v => !isNaN(v));
            factor2Means[f2] = vals.length > 0 ? this.mean(vals) : 0;
        });

        // Sum of Squares
        let SS_A = 0, SS_B = 0, SS_AB = 0, SS_E = 0, SS_T = 0;

        // SS Total
        allValues.forEach(v => { SS_T += Math.pow(v - grandMean, 2); });

        // SS for Factor A (main effect)
        factor1Levels.forEach(f1 => {
            const n = data.filter(d => d[factor1Col] === f1).map(d => parseFloat(d[valueCol])).filter(v => !isNaN(v)).length;
            SS_A += n * Math.pow(factor1Means[f1] - grandMean, 2);
        });

        // SS for Factor B (main effect)
        factor2Levels.forEach(f2 => {
            const n = data.filter(d => d[factor2Col] === f2).map(d => parseFloat(d[valueCol])).filter(v => !isNaN(v)).length;
            SS_B += n * Math.pow(factor2Means[f2] - grandMean, 2);
        });

        // SS Error (within cells) and SS Interaction
        factor1Levels.forEach(f1 => {
            factor2Levels.forEach(f2 => {
                const cellData = cells[f1][f2];
                const cellMean = cellMeans[f1][f2];
                const nij = cellData.length;

                // SS Error
                cellData.forEach(v => { SS_E += Math.pow(v - cellMean, 2); });

                // SS Interaction
                if (nij > 0) {
                    SS_AB += nij * Math.pow(cellMean - factor1Means[f1] - factor2Means[f2] + grandMean, 2);
                }
            });
        });

        // Degrees of freedom
        const df_A = a - 1;
        const df_B = b - 1;
        const df_AB = (a - 1) * (b - 1);
        const df_E = N - a * b;
        const df_T = N - 1;

        if (df_E <= 0) {
            return { error: 'Not enough data for error estimation (need replicates within cells)' };
        }

        // Mean Squares
        const MS_A = SS_A / df_A;
        const MS_B = SS_B / df_B;
        const MS_AB = SS_AB / df_AB;
        const MS_E = SS_E / df_E;

        // F-statistics
        const F_A = MS_E === 0 ? 0 : MS_A / MS_E;
        const F_B = MS_E === 0 ? 0 : MS_B / MS_E;
        const F_AB = MS_E === 0 ? 0 : MS_AB / MS_E;

        // P-values
        const p_A = 1 - this.fCDF(F_A, df_A, df_E);
        const p_B = 1 - this.fCDF(F_B, df_B, df_E);
        const p_AB = 1 - this.fCDF(F_AB, df_AB, df_E);

        // Effect sizes (Eta-squared)
        const eta2_A = SS_T > 0 ? SS_A / SS_T : 0;
        const eta2_B = SS_T > 0 ? SS_B / SS_T : 0;
        const eta2_AB = SS_T > 0 ? SS_AB / SS_T : 0;

        return {
            grandMean,
            N,
            factor1: {
                name: factor1Col,
                levels: factor1Levels,
                means: factor1Means,
                SS: SS_A,
                df: df_A,
                MS: MS_A,
                F: F_A,
                pValue: p_A,
                significant: p_A < 0.05,
                etaSquared: eta2_A
            },
            factor2: {
                name: factor2Col,
                levels: factor2Levels,
                means: factor2Means,
                SS: SS_B,
                df: df_B,
                MS: MS_B,
                F: F_B,
                pValue: p_B,
                significant: p_B < 0.05,
                etaSquared: eta2_B
            },
            interaction: {
                SS: SS_AB,
                df: df_AB,
                MS: MS_AB,
                F: F_AB,
                pValue: p_AB,
                significant: p_AB < 0.05,
                etaSquared: eta2_AB
            },
            error: {
                SS: SS_E,
                df: df_E,
                MS: MS_E
            },
            total: {
                SS: SS_T,
                df: df_T
            },
            cellMeans,
            anovaTable: [
                { source: factor1Col, SS: SS_A, df: df_A, MS: MS_A, F: F_A, pValue: p_A },
                { source: factor2Col, SS: SS_B, df: df_B, MS: MS_B, F: F_B, pValue: p_B },
                { source: 'Interaction', SS: SS_AB, df: df_AB, MS: MS_AB, F: F_AB, pValue: p_AB },
                { source: 'Error', SS: SS_E, df: df_E, MS: MS_E, F: null, pValue: null },
                { source: 'Total', SS: SS_T, df: df_T, MS: null, F: null, pValue: null }
            ]
        };
    },

    // ANCOVA (Analysis of Covariance)
    ancova(data, groupCol, valueCol, covariateCol) {
        const groups = [...new Set(data.map(d => d[groupCol]))].filter(x => x != null);
        const k = groups.length;

        if (k < 2) {
            return { error: 'Need at least 2 groups for ANCOVA' };
        }

        // Extract data per group
        const groupData = {};
        let N = 0;
        const allY = [], allX = [];

        groups.forEach(g => {
            const gData = data.filter(d => d[groupCol] === g);
            const y = gData.map(d => parseFloat(d[valueCol])).filter(v => !isNaN(v));
            const x = gData.map(d => parseFloat(d[covariateCol])).filter(v => !isNaN(v));

            // Ensure paired data
            const validPairs = [];
            for (let i = 0; i < Math.min(y.length, x.length); i++) {
                if (!isNaN(gData[i]?.[valueCol]) && !isNaN(gData[i]?.[covariateCol])) {
                    validPairs.push({ y: parseFloat(gData[i][valueCol]), x: parseFloat(gData[i][covariateCol]) });
                }
            }

            groupData[g] = {
                y: validPairs.map(p => p.y),
                x: validPairs.map(p => p.x),
                n: validPairs.length
            };
            N += validPairs.length;
            allY.push(...validPairs.map(p => p.y));
            allX.push(...validPairs.map(p => p.x));
        });

        if (N < k + 2) {
            return { error: 'Insufficient data for ANCOVA' };
        }

        const grandMeanY = this.mean(allY);
        const grandMeanX = this.mean(allX);

        // Calculate group means
        const groupStats = {};
        groups.forEach(g => {
            groupStats[g] = {
                n: groupData[g].n,
                meanY: this.mean(groupData[g].y),
                meanX: this.mean(groupData[g].x)
            };
        });

        // Calculate pooled within-group regression coefficient (b_pooled)
        let SS_xy_within = 0, SS_xx_within = 0, SS_yy_within = 0;

        groups.forEach(g => {
            const gd = groupData[g];
            const meanX = groupStats[g].meanX;
            const meanY = groupStats[g].meanY;
            for (let i = 0; i < gd.n; i++) {
                SS_xy_within += (gd.x[i] - meanX) * (gd.y[i] - meanY);
                SS_xx_within += Math.pow(gd.x[i] - meanX, 2);
                SS_yy_within += Math.pow(gd.y[i] - meanY, 2);
            }
        });

        const b_pooled = SS_xx_within === 0 ? 0 : SS_xy_within / SS_xx_within;

        // Calculate adjusted means
        const adjustedMeans = {};
        groups.forEach(g => {
            adjustedMeans[g] = groupStats[g].meanY - b_pooled * (groupStats[g].meanX - grandMeanX);
        });

        // ANCOVA Sum of Squares
        // SS Between (adjusted)
        let SS_between_adj = 0;
        groups.forEach(g => {
            SS_between_adj += groupData[g].n * Math.pow(adjustedMeans[g] - grandMeanY, 2);
        });

        // SS Within (error, adjusted for covariate)
        const SS_error = SS_yy_within - Math.pow(SS_xy_within, 2) / SS_xx_within;

        // SS Covariate
        let SS_total_xy = 0, SS_total_xx = 0;
        for (let i = 0; i < allY.length; i++) {
            SS_total_xy += (allX[i] - grandMeanX) * (allY[i] - grandMeanY);
            SS_total_xx += Math.pow(allX[i] - grandMeanX, 2);
        }
        const SS_covariate = SS_total_xx === 0 ? 0 : Math.pow(SS_total_xy, 2) / SS_total_xx;

        // Degrees of freedom
        const df_between = k - 1;
        const df_covariate = 1;
        const df_error = N - k - 1;

        if (df_error <= 0) {
            return { error: 'Insufficient degrees of freedom' };
        }

        // Mean Squares
        const MS_between = SS_between_adj / df_between;
        const MS_covariate = SS_covariate / df_covariate;
        const MS_error = SS_error / df_error;

        // F-statistics
        const F_group = MS_error === 0 ? 0 : MS_between / MS_error;
        const F_covariate = MS_error === 0 ? 0 : MS_covariate / MS_error;

        // P-values
        const p_group = 1 - this.fCDF(F_group, df_between, df_error);
        const p_covariate = 1 - this.fCDF(F_covariate, df_covariate, df_error);

        // Effect size (Partial Eta-squared)
        const SS_total = SS_between_adj + SS_error;
        const partialEta2_group = SS_total > 0 ? SS_between_adj / (SS_between_adj + SS_error) : 0;
        const partialEta2_cov = SS_total > 0 ? SS_covariate / (SS_covariate + SS_error) : 0;

        return {
            N,
            groups,
            groupStats,
            adjustedMeans,
            covariateSlope: b_pooled,
            grandMeanY,
            grandMeanX,
            groupEffect: {
                SS: SS_between_adj,
                df: df_between,
                MS: MS_between,
                F: F_group,
                pValue: p_group,
                significant: p_group < 0.05,
                partialEtaSquared: partialEta2_group
            },
            covariateEffect: {
                SS: SS_covariate,
                df: df_covariate,
                MS: MS_covariate,
                F: F_covariate,
                pValue: p_covariate,
                significant: p_covariate < 0.05,
                partialEtaSquared: partialEta2_cov
            },
            error: {
                SS: SS_error,
                df: df_error,
                MS: MS_error
            },
            ancovaTable: [
                { source: groupCol, SS: SS_between_adj, df: df_between, MS: MS_between, F: F_group, pValue: p_group },
                { source: covariateCol, SS: SS_covariate, df: df_covariate, MS: MS_covariate, F: F_covariate, pValue: p_covariate },
                { source: 'Error', SS: SS_error, df: df_error, MS: MS_error, F: null, pValue: null }
            ]
        };
    },

    // ========================================
    // Non-Parametric Tests
    // ========================================

    // Mann-Whitney U Test (non-parametric alternative to independent t-test)
    mannWhitneyU(sample1, sample2) {
        const n1 = sample1.length, n2 = sample2.length;
        if (n1 < 2 || n2 < 2) {
            return { error: 'Insufficient data (need at least 2 samples per group)' };
        }

        // Combine and rank
        const combined = [
            ...sample1.map(v => ({ value: v, group: 1 })),
            ...sample2.map(v => ({ value: v, group: 2 }))
        ].sort((a, b) => a.value - b.value);

        // Assign ranks (handling ties)
        const ranks = this.assignRanks(combined.map(c => c.value));
        combined.forEach((c, i) => c.rank = ranks[i]);

        // Sum of ranks for each group
        const R1 = combined.filter(c => c.group === 1).reduce((s, c) => s + c.rank, 0);
        const R2 = combined.filter(c => c.group === 2).reduce((s, c) => s + c.rank, 0);

        // Calculate U statistics
        const U1 = n1 * n2 + (n1 * (n1 + 1)) / 2 - R1;
        const U2 = n1 * n2 + (n2 * (n2 + 1)) / 2 - R2;
        const U = Math.min(U1, U2);

        // Normal approximation for p-value (valid for n1, n2 >= 8)
        const meanU = (n1 * n2) / 2;
        const stdU = Math.sqrt((n1 * n2 * (n1 + n2 + 1)) / 12);
        const z = stdU === 0 ? 0 : (U - meanU) / stdU;
        const pValue = 2 * (1 - this.normalCDF(Math.abs(z)));

        // Effect size (r = Z / sqrt(N))
        const r = z / Math.sqrt(n1 + n2);

        return {
            n1, n2,
            U1, U2, U,
            R1, R2,
            zStatistic: z,
            pValue,
            significant: pValue < 0.05,
            effectSize: Math.abs(r),
            effectSizeLabel: Math.abs(r) < 0.1 ? 'negligible' : Math.abs(r) < 0.3 ? 'small' : Math.abs(r) < 0.5 ? 'medium' : 'large',
            median1: this.median(sample1),
            median2: this.median(sample2),
            conclusion: pValue < 0.05 ? 'Significant difference' : 'No significant difference'
        };
    },

    // Assign ranks with tie handling (average rank for ties)
    assignRanks(values) {
        const n = values.length;
        const ranks = new Array(n);
        let i = 0;
        while (i < n) {
            let j = i;
            // Find end of tie group
            while (j < n - 1 && values[j] === values[j + 1]) j++;
            // Average rank for tied values
            const avgRank = (i + j + 2) / 2; // +2 because ranks start at 1
            for (let k = i; k <= j; k++) ranks[k] = avgRank;
            i = j + 1;
        }
        return ranks;
    },

    // Normal CDF approximation
    normalCDF(z) {
        const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
        const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
        const sign = z < 0 ? -1 : 1;
        z = Math.abs(z) / Math.sqrt(2);
        const t = 1 / (1 + p * z);
        const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);
        return 0.5 * (1 + sign * y);
    },

    // Wilcoxon Signed-Rank Test (non-parametric alternative to paired t-test)
    wilcoxonSignedRank(sample1, sample2) {
        if (sample1.length !== sample2.length) {
            return { error: 'Samples must have equal length' };
        }

        const n = sample1.length;
        if (n < 5) {
            return { error: 'Insufficient data (need at least 5 pairs)' };
        }

        // Calculate differences and remove zeros
        const diffs = [];
        for (let i = 0; i < n; i++) {
            const d = sample1[i] - sample2[i];
            if (d !== 0) diffs.push({ diff: d, absDiff: Math.abs(d), sign: d > 0 ? 1 : -1 });
        }

        if (diffs.length < 5) {
            return { error: 'Too many tied pairs (zero differences)' };
        }

        // Sort by absolute difference and assign ranks
        diffs.sort((a, b) => a.absDiff - b.absDiff);
        const ranks = this.assignRanks(diffs.map(d => d.absDiff));
        diffs.forEach((d, i) => d.rank = ranks[i]);

        // Sum of positive and negative ranks
        const Wplus = diffs.filter(d => d.sign > 0).reduce((s, d) => s + d.rank, 0);
        const Wminus = diffs.filter(d => d.sign < 0).reduce((s, d) => s + d.rank, 0);
        const W = Math.min(Wplus, Wminus);
        const nEffective = diffs.length;

        // Normal approximation
        const meanW = (nEffective * (nEffective + 1)) / 4;
        const stdW = Math.sqrt((nEffective * (nEffective + 1) * (2 * nEffective + 1)) / 24);
        const z = stdW === 0 ? 0 : (W - meanW) / stdW;
        const pValue = 2 * (1 - this.normalCDF(Math.abs(z)));

        // Effect size (r)
        const r = z / Math.sqrt(nEffective);

        return {
            nPairs: n,
            nEffective,
            Wplus, Wminus, W,
            zStatistic: z,
            pValue,
            significant: pValue < 0.05,
            effectSize: Math.abs(r),
            effectSizeLabel: Math.abs(r) < 0.1 ? 'negligible' : Math.abs(r) < 0.3 ? 'small' : Math.abs(r) < 0.5 ? 'medium' : 'large',
            median1: this.median(sample1),
            median2: this.median(sample2),
            medianDiff: this.median(sample1.map((v, i) => v - sample2[i])),
            conclusion: pValue < 0.05 ? 'Significant difference' : 'No significant difference'
        };
    },

    // Kruskal-Wallis H Test (non-parametric alternative to one-way ANOVA)
    kruskalWallis(data, groupCol, valueCol) {
        const groups = [...new Set(data.map(d => d[groupCol]))].filter(g => g != null);
        const k = groups.length;

        if (k < 2) {
            return { error: 'Need at least 2 groups' };
        }

        // Extract values per group
        const groupData = {};
        groups.forEach(g => {
            groupData[g] = data.filter(d => d[groupCol] === g)
                .map(d => parseFloat(d[valueCol]))
                .filter(v => !isNaN(v));
        });

        // Check sample sizes
        const N = Object.values(groupData).reduce((s, g) => s + g.length, 0);
        if (N < 5) {
            return { error: 'Insufficient data' };
        }

        // Combine and rank all values
        const combined = [];
        groups.forEach(g => {
            groupData[g].forEach(v => combined.push({ value: v, group: g }));
        });
        combined.sort((a, b) => a.value - b.value);
        const ranks = this.assignRanks(combined.map(c => c.value));
        combined.forEach((c, i) => c.rank = ranks[i]);

        // Sum of ranks per group
        const rankSums = {};
        const groupStats = {};
        groups.forEach(g => {
            const gRanks = combined.filter(c => c.group === g).map(c => c.rank);
            const n = gRanks.length;
            const sumR = gRanks.reduce((s, r) => s + r, 0);
            const meanR = sumR / n;
            rankSums[g] = sumR;
            groupStats[g] = {
                n,
                sumRanks: sumR,
                meanRank: meanR,
                median: this.median(groupData[g])
            };
        });

        // Calculate H statistic
        let H = 0;
        groups.forEach(g => {
            const n = groupStats[g].n;
            const R = rankSums[g];
            H += (R * R) / n;
        });
        H = (12 / (N * (N + 1))) * H - 3 * (N + 1);

        // Degrees of freedom
        const df = k - 1;

        // P-value (chi-squared approximation)
        const pValue = 1 - this.chiSquaredCDF(H, df);

        // Effect size (eta-squared)
        const etaSquared = (H - k + 1) / (N - k);

        return {
            N, k,
            H,
            df,
            pValue,
            significant: pValue < 0.05,
            etaSquared: Math.max(0, etaSquared),
            groups,
            groupStats,
            conclusion: pValue < 0.05 ? 'Significant difference between groups' : 'No significant difference'
        };
    },

    // Friedman Test (non-parametric alternative to repeated measures ANOVA)
    friedmanTest(data, subjectCol, conditionCol, valueCol) {
        const subjects = [...new Set(data.map(d => d[subjectCol]))].filter(s => s != null);
        const conditions = [...new Set(data.map(d => d[conditionCol]))].filter(c => c != null);

        const n = subjects.length; // Number of subjects
        const k = conditions.length; // Number of conditions

        if (n < 3 || k < 2) {
            return { error: 'Need at least 3 subjects and 2 conditions' };
        }

        // Build matrix: rows = subjects, cols = conditions
        const matrix = [];
        for (const subj of subjects) {
            const row = {};
            for (const cond of conditions) {
                const val = data.find(d => d[subjectCol] === subj && d[conditionCol] === cond);
                row[cond] = val ? parseFloat(val[valueCol]) : NaN;
            }
            if (conditions.every(c => !isNaN(row[c]))) {
                matrix.push({ subject: subj, values: row });
            }
        }

        const nValid = matrix.length;
        if (nValid < 3) {
            return { error: 'Insufficient complete cases' };
        }

        // Rank within each subject (row)
        const rankedMatrix = matrix.map(row => {
            const vals = conditions.map(c => row.values[c]);
            const ranks = this.assignRanks([...vals].sort((a, b) => a - b).indexOf);
            // Proper ranking
            const sorted = vals.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
            const properRanks = new Array(k);
            const assignedRanks = this.assignRanks(sorted.map(s => s.v));
            sorted.forEach((s, ri) => properRanks[s.i] = assignedRanks[ri]);
            return { subject: row.subject, ranks: properRanks };
        });

        // Sum of ranks per condition
        const rankSums = conditions.map((_, ci) =>
            rankedMatrix.reduce((s, r) => s + r.ranks[ci], 0)
        );

        // Friedman statistic
        const sumR2 = rankSums.reduce((s, R) => s + R * R, 0);
        const Q = (12 / (nValid * k * (k + 1))) * sumR2 - 3 * nValid * (k + 1);

        // Degrees of freedom
        const df = k - 1;

        // P-value
        const pValue = 1 - this.chiSquaredCDF(Q, df);

        // Kendall's W (effect size)
        const kendallW = Q / (nValid * (k - 1));

        return {
            n: nValid,
            k,
            Q,
            df,
            pValue,
            significant: pValue < 0.05,
            kendallW,
            conditions,
            rankSums: conditions.reduce((obj, c, i) => { obj[c] = rankSums[i]; return obj; }, {}),
            meanRanks: conditions.reduce((obj, c, i) => { obj[c] = rankSums[i] / nValid; return obj; }, {}),
            conclusion: pValue < 0.05 ? 'Significant difference between conditions' : 'No significant difference'
        };
    },

    // Chi-Square Test for Independence
    chiSquareTest(data, var1Col, var2Col) {
        // Create contingency table
        const var1Values = [...new Set(data.map(d => d[var1Col]))].filter(v => v != null);
        const var2Values = [...new Set(data.map(d => d[var2Col]))].filter(v => v != null);

        if (var1Values.length < 2 || var2Values.length < 2) {
            return { error: 'Each variable needs at least 2 categories' };
        }

        const observed = {};
        const rowTotals = {};
        const colTotals = {};
        let grandTotal = 0;

        // Initialize
        var1Values.forEach(v1 => {
            observed[v1] = {};
            rowTotals[v1] = 0;
            var2Values.forEach(v2 => {
                observed[v1][v2] = 0;
            });
        });
        var2Values.forEach(v2 => colTotals[v2] = 0);

        // Count observations
        data.forEach(d => {
            const v1 = d[var1Col], v2 = d[var2Col];
            if (v1 != null && v2 != null && observed[v1] && observed[v1][v2] !== undefined) {
                observed[v1][v2]++;
                rowTotals[v1]++;
                colTotals[v2]++;
                grandTotal++;
            }
        });

        if (grandTotal < 20) {
            return { error: 'Insufficient data (need at least 20 observations)' };
        }

        // Calculate expected values and chi-square
        const expected = {};
        let chiSquare = 0;
        var1Values.forEach(v1 => {
            expected[v1] = {};
            var2Values.forEach(v2 => {
                const exp = (rowTotals[v1] * colTotals[v2]) / grandTotal;
                expected[v1][v2] = exp;
                const obs = observed[v1][v2];
                if (exp > 0) {
                    chiSquare += Math.pow(obs - exp, 2) / exp;
                }
            });
        });

        // Degrees of freedom
        const df = (var1Values.length - 1) * (var2Values.length - 1);

        // P-value
        const pValue = 1 - this.chiSquaredCDF(chiSquare, df);

        // Cramér's V (effect size)
        const minDim = Math.min(var1Values.length - 1, var2Values.length - 1);
        const cramersV = minDim === 0 ? 0 : Math.sqrt(chiSquare / (grandTotal * minDim));

        return {
            chiSquare,
            df,
            pValue,
            significant: pValue < 0.05,
            cramersV,
            effectSizeLabel: cramersV < 0.1 ? 'negligible' : cramersV < 0.3 ? 'small' : cramersV < 0.5 ? 'medium' : 'large',
            var1Values,
            var2Values,
            observed,
            expected,
            rowTotals,
            colTotals,
            grandTotal,
            conclusion: pValue < 0.05 ? 'Variables are associated' : 'Variables are independent'
        };
    },

    // Spearman Rank Correlation
    spearmanCorrelation(x, y) {
        if (x.length !== y.length || x.length < 3) {
            return { error: 'Samples must have equal length and at least 3 values' };
        }

        const n = x.length;

        // Rank both variables
        const xSorted = x.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
        const ySorted = y.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);

        const xRanks = new Array(n);
        const yRanks = new Array(n);

        const xRankVals = this.assignRanks(xSorted.map(s => s.v));
        const yRankVals = this.assignRanks(ySorted.map(s => s.v));

        xSorted.forEach((s, ri) => xRanks[s.i] = xRankVals[ri]);
        ySorted.forEach((s, ri) => yRanks[s.i] = yRankVals[ri]);

        // Calculate Spearman's rho using Pearson on ranks
        const meanXR = xRanks.reduce((s, r) => s + r, 0) / n;
        const meanYR = yRanks.reduce((s, r) => s + r, 0) / n;

        let num = 0, denX = 0, denY = 0;
        for (let i = 0; i < n; i++) {
            const dx = xRanks[i] - meanXR;
            const dy = yRanks[i] - meanYR;
            num += dx * dy;
            denX += dx * dx;
            denY += dy * dy;
        }

        const rho = (denX === 0 || denY === 0) ? 0 : num / Math.sqrt(denX * denY);

        // Test significance using t-distribution
        const t = rho * Math.sqrt((n - 2) / (1 - rho * rho));
        const pValue = 2 * (1 - this.tCDF(Math.abs(t), n - 2));

        return {
            n,
            rho,
            tStatistic: t,
            df: n - 2,
            pValue,
            significant: pValue < 0.05,
            strength: Math.abs(rho) < 0.1 ? 'negligible' : Math.abs(rho) < 0.3 ? 'weak' : Math.abs(rho) < 0.5 ? 'moderate' : Math.abs(rho) < 0.7 ? 'strong' : 'very strong',
            direction: rho > 0 ? 'positive' : rho < 0 ? 'negative' : 'none',
            conclusion: pValue < 0.05 ? 'Significant correlation' : 'No significant correlation'
        };
    },

    // ========================================
    // Regression Diagnostic Tests
    // ========================================

    // Chi-squared CDF approximation
    chiSquaredCDF(x, df) {
        if (x <= 0 || df <= 0) return 0;
        // Use incomplete gamma function approximation
        const k = df / 2;
        const theta = 2;
        return this.incompleteGamma(k, x / theta) / this.gamma(k);
    },

    // Incomplete Gamma function approximation (lower)
    incompleteGamma(a, x) {
        if (x <= 0) return 0;
        if (x < a + 1) {
            // Use series representation
            let sum = 1 / a;
            let term = 1 / a;
            for (let n = 1; n < 100; n++) {
                term *= x / (a + n);
                sum += term;
                if (Math.abs(term) < 1e-10) break;
            }
            return Math.exp(-x + a * Math.log(x) - this.logGamma(a)) * sum;
        } else {
            // Use continued fraction
            return this.gamma(a) - this.upperIncompleteGamma(a, x);
        }
    },

    // Upper incomplete gamma function
    upperIncompleteGamma(a, x) {
        // Continued fraction approximation
        let f = 1e-30;
        let c = 1e-30;
        let d = 0;
        for (let i = 1; i < 100; i++) {
            const an = -i * (i - a);
            const bn = x + 2 * i + 1 - a;
            d = bn + an * d;
            if (Math.abs(d) < 1e-30) d = 1e-30;
            c = bn + an / c;
            if (Math.abs(c) < 1e-30) c = 1e-30;
            d = 1 / d;
            const delta = c * d;
            f *= delta;
            if (Math.abs(delta - 1) < 1e-10) break;
        }
        return Math.exp(-x + a * Math.log(x) - this.logGamma(a)) * f;
    },

    // Gamma function
    gamma(n) {
        return Math.exp(this.logGamma(n));
    },

    // Jarque-Bera test for normality of residuals
    jarqueBera(residuals) {
        const n = residuals.length;
        if (n < 8) return { statistic: NaN, pValue: NaN, isNormal: true, message: 'Insufficient data' };

        const skew = this.skewness(residuals);
        const kurt = this.kurtosis(residuals); // This returns excess kurtosis

        // Jarque-Bera statistic: JB = n/6 * (S² + (K-3)²/4)
        // Since our kurtosis function returns excess kurtosis (K-3), we use it directly
        const jbStat = (n / 6) * (Math.pow(skew, 2) + Math.pow(kurt, 2) / 4);

        // Chi-squared distribution with 2 degrees of freedom
        const pValue = 1 - this.chiSquaredCDF(jbStat, 2);
        const isNormal = pValue > 0.05;

        return {
            statistic: jbStat,
            pValue: pValue,
            skewness: skew,
            kurtosis: kurt,
            isNormal: isNormal,
            conclusion: isNormal ? 'Normal' : 'Non-Normal'
        };
    },

    // Breusch-Godfrey test for serial correlation
    breuschGodfrey(residuals, X, lags = 1) {
        const n = residuals.length;
        if (n <= lags + X[0].length + 1) {
            return { statistic: NaN, pValue: NaN, hasSerialCorrelation: false, message: 'Insufficient data' };
        }

        // Create lagged residuals
        const laggedResiduals = [];
        for (let lag = 1; lag <= lags; lag++) {
            const lagged = new Array(lag).fill(0);
            for (let i = lag; i < n; i++) {
                lagged.push(residuals[i - lag]);
            }
            laggedResiduals.push(lagged);
        }

        // Build augmented regressor matrix [X, lagged residuals]
        const XAugmented = [];
        for (let i = 0; i < n; i++) {
            const row = [...X[i]];
            for (let j = 0; j < lags; j++) {
                row.push(laggedResiduals[j][i]);
            }
            XAugmented.push(row);
        }

        // Run auxiliary regression: e_t on X and lagged e
        const auxResult = this.multipleRegression(XAugmented, residuals);
        if (!auxResult) {
            return { statistic: NaN, pValue: NaN, hasSerialCorrelation: false, message: 'Regression failed' };
        }

        // LM statistic = n * R² from auxiliary regression
        const lmStat = n * auxResult.rSquared;

        // Chi-squared distribution with 'lags' degrees of freedom
        const pValue = 1 - this.chiSquaredCDF(lmStat, lags);
        const hasSerialCorrelation = pValue < 0.05;

        return {
            statistic: lmStat,
            pValue: pValue,
            lags: lags,
            auxRSquared: auxResult.rSquared,
            hasSerialCorrelation: hasSerialCorrelation,
            conclusion: hasSerialCorrelation ? 'Serial Correlation' : 'No Serial Correlation'
        };
    },

    // Breusch-Pagan test for heteroskedasticity
    breuschPagan(residuals, X) {
        const n = residuals.length;
        const k = X[0].length;
        if (n <= k + 1) {
            return { statistic: NaN, pValue: NaN, hasHeteroskedasticity: false, message: 'Insufficient data' };
        }

        // Square the residuals
        const residualsSq = residuals.map(r => r * r);

        // Regress squared residuals on X
        const auxResult = this.multipleRegression(X, residualsSq);
        if (!auxResult) {
            return { statistic: NaN, pValue: NaN, hasHeteroskedasticity: false, message: 'Regression failed' };
        }

        // BP statistic = n * R² from auxiliary regression (Koenker's studentized version)
        const bpStat = n * auxResult.rSquared;

        // Chi-squared distribution with k degrees of freedom
        const pValue = 1 - this.chiSquaredCDF(bpStat, k);
        const hasHeteroskedasticity = pValue < 0.05;

        return {
            statistic: bpStat,
            pValue: pValue,
            auxRSquared: auxResult.rSquared,
            hasHeteroskedasticity: hasHeteroskedasticity,
            conclusion: hasHeteroskedasticity ? 'Heteroskedasticity' : 'Homoskedasticity'
        };
    },

    // CUSUM Test for structural stability
    cusumTest(residuals, k) {
        const n = residuals.length;
        if (n < k + 3) {
            return { statistic: NaN, pValue: NaN, isStable: true, message: 'Insufficient data' };
        }

        // Calculate recursive residuals (simplified approach)
        // Standard recursive residuals require sequential OLS which is complex
        // Using standardized cumulative sum of residuals as approximation
        const sigma = Math.sqrt(residuals.reduce((sum, r) => sum + r * r, 0) / (n - k - 1));
        if (sigma === 0) {
            return { statistic: 0, pValue: 1, isStable: true, maxCusum: 0, criticalValue: 0 };
        }

        // Standardized residuals
        const stdResiduals = residuals.map(r => r / sigma);

        // Cumulative sum
        const cusum = [];
        let cumSum = 0;
        for (let t = 0; t < n; t++) {
            cumSum += stdResiduals[t];
            cusum.push(cumSum / Math.sqrt(n));
        }

        // Maximum absolute CUSUM
        const maxCusum = Math.max(...cusum.map(c => Math.abs(c)));

        // Critical value at 5% significance (Brownian bridge approximation)
        // Using simplified critical value: ±0.948 for standard CUSUM
        const criticalValue = 0.948 * Math.sqrt(n) / Math.sqrt(n);

        // Alternative: using boundaries a + b*t where a ≈ 0.948, b depends on n
        const boundaryCoef = 0.948;
        const isStable = maxCusum <= boundaryCoef * 1.36; // 5% significance bound

        return {
            statistic: maxCusum,
            criticalValue: boundaryCoef * 1.36,
            cusum: cusum,
            isStable: isStable,
            conclusion: isStable ? 'Stable' : 'Unstable (Structural Break)'
        };
    },

    // CUSUM of Squares Test
    cusumSqTest(residuals, k) {
        const n = residuals.length;
        if (n < k + 3) {
            return { statistic: NaN, pValue: NaN, isStable: true, message: 'Insufficient data' };
        }

        // Sum of squared residuals
        const totalSS = residuals.reduce((sum, r) => sum + r * r, 0);
        if (totalSS === 0) {
            return { statistic: 0, pValue: 1, isStable: true };
        }

        // Cumulative sum of squares
        const cusumSq = [];
        let cumSS = 0;
        for (let t = 0; t < n; t++) {
            cumSS += residuals[t] * residuals[t];
            cusumSq.push(cumSS / totalSS);
        }

        // Maximum deviation from diagonal (expected value is t/n)
        let maxDev = 0;
        for (let t = 0; t < n; t++) {
            const expected = (t + 1) / n;
            const dev = Math.abs(cusumSq[t] - expected);
            if (dev > maxDev) maxDev = dev;
        }

        // Critical value at 5% significance (approximately 0.1486 for large n)
        const criticalValue = 0.1486 + 0.1 / Math.sqrt(n);
        const isStable = maxDev <= criticalValue;

        return {
            statistic: maxDev,
            criticalValue: criticalValue,
            cusumSq: cusumSq,
            isStable: isStable,
            conclusion: isStable ? 'Stable' : 'Unstable (Variance Break)'
        };
    },

    // Ramsey RESET Test for functional form misspecification
    ramseyReset(y, X, residuals, powers = 2) {
        const n = y.length;
        const k = X[0].length;

        if (n <= k + powers + 1) {
            return { statistic: NaN, pValue: NaN, isCorrect: true, message: 'Insufficient data' };
        }

        // Calculate fitted values from original regression
        const originalResult = this.multipleRegression(X, y);
        if (!originalResult) {
            return { statistic: NaN, pValue: NaN, isCorrect: true, message: 'Original regression failed' };
        }

        const XwithIntercept = X.map(row => [1, ...row]);
        const allCoefs = [originalResult.intercept, ...originalResult.coefficients];
        const fitted = XwithIntercept.map(row =>
            row.reduce((sum, val, i) => sum + val * allCoefs[i], 0)
        );

        // Create augmented X matrix with powers of fitted values
        const XAugmented = X.map((row, i) => {
            const newRow = [...row];
            for (let p = 2; p <= powers + 1; p++) {
                newRow.push(Math.pow(fitted[i], p));
            }
            return newRow;
        });

        // Run augmented regression
        const augmentedResult = this.multipleRegression(XAugmented, y);
        if (!augmentedResult) {
            return { statistic: NaN, pValue: NaN, isCorrect: true, message: 'Augmented regression failed' };
        }

        // F-test for joint significance of added terms
        const ssrRestricted = originalResult.ssRes;
        const ssrUnrestricted = augmentedResult.ssRes;
        const q = powers; // Number of added terms
        const dfResidual = n - k - powers - 1;

        if (dfResidual <= 0 || ssrUnrestricted <= 0) {
            return { statistic: NaN, pValue: NaN, isCorrect: true, message: 'Invalid degrees of freedom' };
        }

        const fStat = ((ssrRestricted - ssrUnrestricted) / q) / (ssrUnrestricted / dfResidual);
        const pValue = 1 - this.fCDF(fStat, q, dfResidual);
        const isCorrect = pValue > 0.05;

        return {
            statistic: fStat,
            pValue: pValue,
            powers: powers,
            dfNumerator: q,
            dfDenominator: dfResidual,
            isCorrect: isCorrect,
            conclusion: isCorrect ? 'Correct Specification' : 'Misspecification'
        };
    },

    // ========================================
    // Advanced Regression Methods
    // ========================================

    // OLS - Ordinary Least Squares (same as multipleRegression)
    olsRegression(X, y) {
        return this.multipleRegression(X, y);
    },

    // GLS - Generalized Least Squares
    // Handles heteroscedasticity by using weighted regression
    glsRegression(X, y, weights = null) {
        const n = y.length;
        const k = X[0].length;

        // If no weights provided, estimate from OLS residuals (FGLS)
        if (!weights) {
            const olsResult = this.multipleRegression(X, y);
            if (!olsResult) return null;

            const XwithInt = X.map(row => [1, ...row]);
            const predicted = XwithInt.map(row =>
                row.reduce((sum, val, i) => sum + val * [olsResult.intercept, ...olsResult.coefficients][i], 0)
            );
            const residuals = y.map((yi, i) => yi - predicted[i]);
            const residualsSq = residuals.map(r => r * r);

            // Weight matrix as inverse of squared residuals
            weights = residualsSq.map(r => r > 1e-10 ? 1 / r : 1);
        }

        // Normalize weights
        const sumWeights = weights.reduce((a, b) => a + b, 0);
        const normWeights = weights.map(w => w * n / sumWeights);

        // Apply weights: transform data
        const sqrtW = normWeights.map(w => Math.sqrt(w));
        const Xw = X.map((row, i) => row.map(val => val * sqrtW[i]));
        const yw = y.map((yi, i) => yi * sqrtW[i]);

        // Run OLS on transformed data
        const result = this.multipleRegression(Xw, yw);
        if (!result) return null;

        return { ...result, method: 'GLS', weights: normWeights };
    },

    // 2SLS - Two-Stage Least Squares (Instrumental Variables)
    twoSLSRegression(X, y, Z) {
        // Z = instruments, X = endogenous variables
        // Stage 1: Regress X on Z to get fitted values
        // Stage 2: Regress y on fitted X values

        const n = y.length;
        if (!Z || Z.length !== n) {
            // If no instruments, fall back to OLS
            return { ...this.multipleRegression(X, y), method: '2SLS (no instruments, using OLS)' };
        }

        // Stage 1: Get fitted values for each X column
        const XFitted = [];
        for (let j = 0; j < X[0].length; j++) {
            const xCol = X.map(row => row[j]);
            const stage1 = this.multipleRegression(Z, xCol);
            if (!stage1) return null;

            const ZwithInt = Z.map(row => [1, ...row]);
            const fitted = ZwithInt.map(row =>
                row.reduce((sum, val, i) => sum + val * [stage1.intercept, ...stage1.coefficients][i], 0)
            );
            XFitted.push(fitted);
        }

        // Transpose to get rows
        const XHat = [];
        for (let i = 0; i < n; i++) {
            XHat.push(XFitted.map(col => col[i]));
        }

        // Stage 2: Regress y on fitted X
        const result = this.multipleRegression(XHat, y);
        if (!result) return null;

        return { ...result, method: '2SLS' };
    },

    // GMM - Generalized Method of Moments
    gmmRegression(X, y, Z = null) {
        const n = y.length;
        const k = X[0].length;

        // Use instruments if provided, otherwise use X
        const instruments = Z || X;
        const m = instruments[0].length;

        // Add intercept
        const XwithInt = X.map(row => [1, ...row]);
        const ZwithInt = instruments.map(row => [1, ...row]);

        // GMM estimator: β = (X'ZW Z'X)^(-1) X'ZW Z'y
        // where W is optimal weighting matrix

        // Initial estimate using 2SLS or OLS
        let beta;
        if (Z) {
            const initial = this.twoSLSRegression(X, y, Z);
            if (!initial) return null;
            beta = [initial.intercept, ...initial.coefficients];
        } else {
            const initial = this.multipleRegression(X, y);
            if (!initial) return null;
            beta = [initial.intercept, ...initial.coefficients];
        }

        // Calculate residuals
        const residuals = y.map((yi, i) =>
            yi - XwithInt[i].reduce((sum, val, j) => sum + val * beta[j], 0)
        );

        // Moment conditions: g_i = Z_i * e_i
        const moments = ZwithInt.map((row, i) => row.map(z => z * residuals[i]));

        // Optimal weighting matrix W = (1/n Σ g_i g_i')^(-1)
        const momentsCov = this.matMul(this.transpose(moments), moments).map(row => row.map(v => v / n));
        const W = this.matInverse(momentsCov);
        if (!W) return this.multipleRegression(X, y); // Fallback to OLS

        // GMM estimate
        const Zt = this.transpose(ZwithInt);
        const ZtX = this.matMul(Zt, XwithInt);
        const ZtXtW = this.matMul(this.transpose(ZtX), W);
        const ZtXtWZtX = this.matMul(ZtXtW, ZtX);
        const ZtXtWZtXinv = this.matInverse(ZtXtWZtX);
        if (!ZtXtWZtXinv) return this.multipleRegression(X, y);

        const Zty = this.matVecMul(Zt, y);
        const ZtXtWZty = this.matVecMul(ZtXtW, Zty);
        const gmmBeta = this.matVecMul(ZtXtWZtXinv, ZtXtWZty);

        // Calculate R-squared
        const predicted = XwithInt.map(row => row.reduce((sum, val, i) => sum + val * gmmBeta[i], 0));
        const meanY = this.mean(y);
        const ssRes = y.reduce((acc, yi, i) => acc + Math.pow(yi - predicted[i], 2), 0);
        const ssTot = y.reduce((acc, yi) => acc + Math.pow(yi - meanY, 2), 0);

        return {
            intercept: gmmBeta[0],
            coefficients: gmmBeta.slice(1),
            rSquared: ssTot === 0 ? 0 : 1 - ssRes / ssTot,
            n, k,
            method: 'GMM'
        };
    },

    // LIML - Limited Information Maximum Likelihood
    limlRegression(X, y, Z = null) {
        const n = y.length;
        const k = X[0].length;

        if (!Z) {
            // Without instruments, LIML = OLS
            return { ...this.multipleRegression(X, y), method: 'LIML (no instruments, using OLS)' };
        }

        // Add intercepts
        const XwithInt = X.map(row => [1, ...row]);
        const ZwithInt = Z.map(row => [1, ...row]);

        // Compute projection matrices
        const Zt = this.transpose(ZwithInt);
        const ZtZ = this.matMul(Zt, ZwithInt);
        const ZtZinv = this.matInverse(ZtZ);
        if (!ZtZinv) return this.multipleRegression(X, y);

        // Pz = Z(Z'Z)^(-1)Z' projection onto instrument space
        const ZZtZinv = this.matMul(ZwithInt, ZtZinv);
        const Pz = this.matMul(ZZtZinv, Zt);

        // Mz = I - Pz (residual maker)
        const I = Array(n).fill(0).map((_, i) => Array(n).fill(0).map((_, j) => i === j ? 1 : 0));
        const Mz = I.map((row, i) => row.map((val, j) => val - Pz[i][j]));

        // Y = [y, X] combined matrix
        const Y = y.map((yi, i) => [yi, ...X[i]]);
        const Yt = this.transpose(Y);

        // Compute Y'MzY and Y'PzY
        const YtMz = this.matMul(Yt, Mz);
        const YtMzY = this.matMul(YtMz, Y);
        const YtPz = this.matMul(Yt, Pz);
        const YtPzY = this.matMul(YtPz, Y);

        // Find smallest eigenvalue k of (Y'MzY)^(-1)(Y'PzY)
        // Simplified: use 2SLS as approximation for LIML
        // (Full eigenvalue computation is complex)
        const tsls = this.twoSLSRegression(X, y, Z);
        if (!tsls) return this.multipleRegression(X, y);

        // LIML adjustment factor (k)
        const predicted = XwithInt.map(row =>
            row.reduce((sum, val, i) => sum + val * [tsls.intercept, ...tsls.coefficients][i], 0)
        );
        const residuals = y.map((yi, i) => yi - predicted[i]);
        const ssRes = residuals.reduce((a, r) => a + r * r, 0);
        const ssTot = y.reduce((a, yi) => a + Math.pow(yi - this.mean(y), 2), 0);

        // LIML uses a bias-corrected estimator
        const limlK = 1 + (k / (n - Z[0].length - 1));

        return {
            intercept: tsls.intercept,
            coefficients: tsls.coefficients,
            rSquared: ssTot === 0 ? 0 : 1 - ssRes / ssTot,
            n, k,
            limlK,
            method: 'LIML'
        };
    },

    // Main advanced regression dispatcher
    advancedRegression(X, y, method = 'OLS', instruments = null) {
        switch (method.toUpperCase()) {
            case 'OLS':
                return { ...this.multipleRegression(X, y), method: 'OLS' };
            case 'GLS':
                return this.glsRegression(X, y);
            case '2SLS':
                return this.twoSLSRegression(X, y, instruments || X);
            case 'GMM':
                return this.gmmRegression(X, y, instruments);
            case 'LIML':
                return this.limlRegression(X, y, instruments);
            default:
                return { ...this.multipleRegression(X, y), method: 'OLS' };
        }
    },

    // ========================================
    // ARDL (Autoregressive Distributed Lag) Analysis
    // ========================================

    // Create lagged variables
    createLags(arr, maxLag) {
        const lags = [];
        for (let lag = 1; lag <= maxLag; lag++) {
            const lagged = [];
            for (let i = lag; i < arr.length; i++) {
                lagged.push(arr[i - lag]);
            }
            lags.push(lagged);
        }
        return lags;
    },

    // Calculate information criteria for lag selection
    informationCriteria(n, k, ssr) {
        const sigma2 = ssr / n;
        const logL = -n / 2 * (1 + Math.log(2 * Math.PI) + Math.log(sigma2));

        return {
            AIC: -2 * logL / n + 2 * k / n,
            BIC: -2 * logL / n + k * Math.log(n) / n,
            HQ: -2 * logL / n + 2 * k * Math.log(Math.log(n)) / n
        };
    },

    // ARDL Model Estimation
    ardlEstimate(y, X, pLag, qLags) {
        const n = y.length;
        const maxLag = Math.max(pLag, ...Object.values(qLags));

        // Create lagged dependent variable (AR terms)
        const yLags = this.createLags(y, pLag);

        // Create lagged independent variables
        const xLags = {};
        for (const [varName, lag] of Object.entries(qLags)) {
            if (X[varName]) {
                xLags[varName] = {
                    current: X[varName].slice(maxLag),
                    lags: this.createLags(X[varName], lag).map(l => l.slice(maxLag - lag))
                };
            }
        }

        // Align all data to same length
        const effectiveN = n - maxLag;
        const yTrimmed = y.slice(maxLag);

        // Build regressor matrix
        const regressors = [];
        const regNames = [];

        // Add lagged Y terms
        for (let i = 0; i < pLag; i++) {
            regressors.push(yLags[i].slice(maxLag - (i + 1)));
            regNames.push(`Y(-${i + 1})`);
        }

        // Add current and lagged X terms
        for (const [varName, data] of Object.entries(xLags)) {
            regressors.push(data.current);
            regNames.push(varName);

            for (let i = 0; i < data.lags.length; i++) {
                regressors.push(data.lags[i]);
                regNames.push(`${varName}(-${i + 1})`);
            }
        }

        // Convert to matrix format
        const XMatrix = [];
        for (let i = 0; i < effectiveN; i++) {
            XMatrix.push(regressors.map(reg => reg[i]));
        }

        // Run OLS
        const result = this.multipleRegression(XMatrix, yTrimmed);
        if (!result) return null;

        return {
            ...result,
            pLag,
            qLags,
            regNames,
            effectiveN,
            maxLag
        };
    },

    // ARDL Bounds Test (Pesaran et al., 2001)
    ardlBoundsTest(y, X, pLag, qLags, includeConstant = true, includeTrend = false) {
        const n = y.length;
        const maxLag = Math.max(pLag, ...Object.values(qLags));

        // Create first differences
        const dy = this.difference(y, 1);
        const dX = {};
        for (const [varName, data] of Object.entries(X)) {
            dX[varName] = this.difference(data, 1);
        }

        // Lagged levels for ECM
        const yLagged = y.slice(0, -1);
        const xLagged = {};
        for (const [varName, data] of Object.entries(X)) {
            xLagged[varName] = data.slice(0, -1);
        }

        // Create lagged differences
        const dyLags = this.createLags(dy, pLag - 1);
        const dxLags = {};
        for (const [varName, lag] of Object.entries(qLags)) {
            if (dX[varName]) {
                dxLags[varName] = this.createLags(dX[varName], lag);
            }
        }

        // Build ECM specification
        const effectiveStart = maxLag;
        const effectiveN = dy.length - maxLag;

        const regressors = [];
        const regNames = [];

        // Lagged level of Y (for ECM)
        regressors.push(yLagged.slice(effectiveStart - 1, effectiveStart - 1 + effectiveN));
        regNames.push('Y(-1) [level]');

        // Lagged levels of X (for long-run)
        for (const [varName, data] of Object.entries(xLagged)) {
            regressors.push(data.slice(effectiveStart - 1, effectiveStart - 1 + effectiveN));
            regNames.push(`${varName}(-1) [level]`);
        }

        // Lagged differences of Y
        for (let i = 0; i < dyLags.length; i++) {
            const lag = dyLags[i];
            if (lag.length >= effectiveN) {
                regressors.push(lag.slice(effectiveStart - (i + 1) - 1, effectiveStart - (i + 1) - 1 + effectiveN));
                regNames.push(`ΔY(-${i + 1})`);
            }
        }

        // Current and lagged differences of X
        for (const [varName, lags] of Object.entries(dxLags)) {
            // Current difference
            regressors.push(dX[varName].slice(effectiveStart, effectiveStart + effectiveN));
            regNames.push(`Δ${varName}`);

            // Lagged differences
            for (let i = 0; i < lags.length; i++) {
                const lag = lags[i];
                if (lag.length >= effectiveN) {
                    regressors.push(lag.slice(effectiveStart - (i + 1), effectiveStart - (i + 1) + effectiveN));
                    regNames.push(`Δ${varName}(-${i + 1})`);
                }
            }
        }

        // Dependent variable (first difference of Y)
        const dyTrimmed = dy.slice(effectiveStart, effectiveStart + effectiveN);

        // Convert to matrix
        const XMatrix = [];
        for (let i = 0; i < effectiveN; i++) {
            const row = regressors.map(reg => reg[i] || 0);
            if (includeTrend) row.push(i + 1);
            XMatrix.push(row);
        }

        if (includeTrend) regNames.push('Trend');

        // Run regression
        const result = this.multipleRegression(XMatrix, dyTrimmed);
        if (!result) return null;

        // Calculate F-statistic for bounds test
        // H0: coefficients on lagged levels = 0
        const numLevelVars = 1 + Object.keys(X).length; // Y(-1) + all X(-1)

        // F-test for joint significance of level terms
        // Unrestricted model already estimated above
        // Restricted model: remove level terms
        const restrictedRegressors = regressors.slice(numLevelVars);
        const restrictedNames = regNames.slice(numLevelVars);

        if (restrictedRegressors.length > 0) {
            const XRestricted = [];
            for (let i = 0; i < effectiveN; i++) {
                const row = restrictedRegressors.map(reg => reg[i] || 0);
                if (includeTrend) row.push(i + 1);
                XRestricted.push(row);
            }

            const restrictedResult = this.multipleRegression(XRestricted, dyTrimmed);

            if (restrictedResult) {
                const ssrU = result.ssRes;
                const ssrR = restrictedResult.ssRes;
                const q = numLevelVars; // Number of restrictions
                const dfResidual = result.dfResidual;

                const fStat = ((ssrR - ssrU) / q) / (ssrU / dfResidual);

                // Critical values (Pesaran bounds) - approximate for k=1 to 5
                const criticalValues = this.getPesaranCriticalValues(Object.keys(X).length, includeConstant, includeTrend);

                return {
                    fStatistic: fStat,
                    criticalValues,
                    conclusion: fStat > criticalValues.upper ? 'Cointegration exists' :
                        fStat < criticalValues.lower ? 'No cointegration' : 'Inconclusive',
                    numLevelVars,
                    result,
                    regNames
                };
            }
        }

        return {
            fStatistic: 0,
            criticalValues: { lower: 0, upper: 0 },
            conclusion: 'Unable to compute',
            result,
            regNames
        };
    },

    // Pesaran critical values (approximate)
    getPesaranCriticalValues(k, hasConstant, hasTrend) {
        // Approximate critical values at 5% significance
        // Case III (unrestricted intercept, no trend)
        const cv = {
            1: { lower: 4.94, upper: 5.73 },
            2: { lower: 3.62, upper: 4.16 },
            3: { lower: 3.23, upper: 3.79 },
            4: { lower: 2.86, upper: 3.49 },
            5: { lower: 2.62, upper: 3.24 }
        };
        return cv[Math.min(k, 5)] || cv[5];
    },

    // Calculate long-run coefficients from ARDL
    ardlLongRun(ardlResult) {
        if (!ardlResult || !ardlResult.coefficients) return null;

        const { intercept, coefficients, regNames, pLag } = ardlResult;

        // Sum of AR coefficients
        let arSum = 0;
        for (let i = 0; i < pLag; i++) {
            arSum += coefficients[i] || 0;
        }

        // Long-run multiplier = 1 / (1 - sum of AR coefficients)
        const longRunMultiplier = 1 - arSum !== 0 ? 1 / (1 - arSum) : 0;

        // Long-run intercept
        const longRunIntercept = intercept * longRunMultiplier;

        // Long-run coefficients for each X variable
        const longRunCoefs = {};
        let idx = pLag; // Start after AR terms

        // Group coefficients by variable
        const varGroups = {};
        for (let i = pLag; i < regNames.length; i++) {
            const name = regNames[i];
            const baseName = name.replace(/\(-\d+\)$/, '');
            if (!varGroups[baseName]) varGroups[baseName] = [];
            varGroups[baseName].push(coefficients[i]);
        }

        // Calculate long-run coefficient for each variable
        for (const [varName, coefs] of Object.entries(varGroups)) {
            const sum = coefs.reduce((a, b) => a + b, 0);
            longRunCoefs[varName] = sum * longRunMultiplier;
        }

        return {
            intercept: longRunIntercept,
            coefficients: longRunCoefs,
            multiplier: longRunMultiplier,
            arSum
        };
    },

    // Calculate short-run coefficients (ECM form)
    ardlShortRun(ardlResult) {
        if (!ardlResult || !ardlResult.coefficients) return null;

        const { intercept, coefficients, regNames, pLag, stdErrors, tStats, pValues } = ardlResult;

        // ECM coefficient (speed of adjustment)
        // This is derived from: ECM = -(1 - sum of AR coefficients)
        let arSum = 0;
        for (let i = 0; i < pLag; i++) {
            arSum += coefficients[i] || 0;
        }
        const ecm = -(1 - arSum);

        // Short-run coefficients
        const shortRunCoefs = [];
        for (let i = 0; i < regNames.length; i++) {
            shortRunCoefs.push({
                name: regNames[i],
                coefficient: coefficients[i],
                stdError: stdErrors ? stdErrors[i] : null,
                tStat: tStats ? tStats[i] : null,
                pValue: pValues ? pValues[i] : null
            });
        }

        return {
            intercept,
            ecm,
            ecmInterpretation: ecm < 0 && ecm > -1 ? 'Stable adjustment' :
                ecm < -1 ? 'Overshooting adjustment' : 'Unstable/Explosive',
            coefficients: shortRunCoefs
        };
    },

    // Full ARDL analysis
    ardlAnalysis(y, X, config) {
        const {
            pLag = 1,
            qLags = {},
            includeConstant = true,
            includeTrend = false
        } = config;

        // Set default qLags for all X variables if not specified
        const effectiveQLags = {};
        for (const varName of Object.keys(X)) {
            effectiveQLags[varName] = qLags[varName] || 1;
        }

        // Estimate ARDL model
        const model = this.ardlEstimate(y, X, pLag, effectiveQLags);
        if (!model) return null;

        // Bounds test
        const boundsTest = this.ardlBoundsTest(y, X, pLag, effectiveQLags, includeConstant, includeTrend);

        // Long-run coefficients
        const longRun = this.ardlLongRun(model);

        // Short-run coefficients (ECM)
        const shortRun = this.ardlShortRun(model);

        // Calculate residuals for diagnostic tests
        const maxLag = model.maxLag;
        const effectiveN = model.effectiveN;
        const yTrimmed = y.slice(maxLag);

        // Build regressor matrix (same as in ardlEstimate)
        const regressors = [];
        const yLags = this.createLags(y, pLag);
        for (let i = 0; i < pLag; i++) {
            regressors.push(yLags[i].slice(maxLag - (i + 1)));
        }
        for (const varName of Object.keys(X)) {
            const qLag = effectiveQLags[varName];
            regressors.push(X[varName].slice(maxLag)); // current
            const xLags = this.createLags(X[varName], qLag);
            for (let i = 0; i < xLags.length; i++) {
                regressors.push(xLags[i].slice(maxLag - (i + 1)));
            }
        }

        const XMatrix = [];
        for (let i = 0; i < effectiveN; i++) {
            XMatrix.push(regressors.map(reg => reg[i] || 0));
        }

        // Calculate residuals
        const XwithIntercept = XMatrix.map(row => [1, ...row]);
        const allCoefs = [model.intercept, ...model.coefficients];
        const predicted = XwithIntercept.map(row =>
            row.reduce((sum, val, i) => sum + val * (allCoefs[i] || 0), 0)
        );
        const residuals = yTrimmed.slice(0, effectiveN).map((yi, i) => yi - predicted[i]);
        const k = XMatrix[0]?.length || 0;

        // Run diagnostic tests
        const diagnostics = {
            // Basic fit statistics
            durbinWatson: model.durbinWatson,
            rSquared: model.rSquared,
            adjRSquared: model.adjRSquared,
            fStatistic: model.fStatistic,
            fPValue: model.fPValue,
            n: model.effectiveN,

            // Normality test (Jarque-Bera)
            jarqueBera: this.jarqueBera(residuals),

            // Serial correlation test (Breusch-Godfrey LM test)
            serialCorrelation: this.breuschGodfrey(residuals, XMatrix, 2),

            // Heteroskedasticity test (Breusch-Pagan)
            heteroskedasticity: this.breuschPagan(residuals, XMatrix),

            // Structural stability tests (CUSUM)
            cusum: this.cusumTest(residuals, k),
            cusumSq: this.cusumSqTest(residuals, k),

            // Functional form test (Ramsey RESET)
            ramseyReset: this.ramseyReset(yTrimmed.slice(0, effectiveN), XMatrix, residuals, 2)
        };

        return {
            model,
            boundsTest,
            longRun,
            shortRun,
            diagnostics,
            specification: `ARDL(${pLag}, ${Object.values(effectiveQLags).join(', ')})`
        };
    },

    // ========================================
    // VAR (Vector Autoregressive) Model
    // ========================================

    // Create lag matrix for VAR
    createVARLags(data, p) {
        // data: array of arrays [[y1_t, y2_t, ...], ...]
        // p: number of lags
        const n = data.length;
        const k = data[0].length;
        const lags = [];

        for (let lag = 1; lag <= p; lag++) {
            for (let j = 0; j < k; j++) {
                const lagged = [];
                for (let i = lag; i < n; i++) {
                    lagged.push(data[i - lag][j]);
                }
                lags.push(lagged);
            }
        }
        return lags;
    },

    // VAR Model Estimation
    varEstimate(data, p, includeConstant = true, includeTrend = false) {
        // data: object with variable names as keys and arrays as values
        const varNames = Object.keys(data);
        const k = varNames.length; // Number of endogenous variables
        const n = data[varNames[0]].length;

        if (n <= p + k) {
            return null; // Not enough observations
        }

        // Convert to matrix format
        const Y = [];
        for (let i = 0; i < n; i++) {
            Y.push(varNames.map(v => data[v][i]));
        }

        // Create lagged values
        const effectiveN = n - p;
        const YTrimmed = Y.slice(p);

        // Build regressor matrix (note: multipleRegression adds intercept automatically)
        const regressors = [];
        const regNames = [];

        // Add trend if specified (before lagged variables)
        if (includeTrend) {
            regressors.push(Array.from({ length: effectiveN }, (_, i) => i + 1));
            regNames.push('trend');
        }

        // Add lagged values for each variable
        for (let lag = 1; lag <= p; lag++) {
            for (let j = 0; j < k; j++) {
                const lagged = [];
                for (let i = p; i < n; i++) {
                    lagged.push(Y[i - lag][j]);
                }
                regressors.push(lagged);
                regNames.push(`${varNames[j]}(-${lag})`);
            }
        }

        // Convert to matrix format for regression
        const X = [];
        for (let i = 0; i < effectiveN; i++) {
            X.push(regressors.map(reg => reg[i]));
        }

        // Estimate each equation separately using OLS
        const equations = {};
        const residuals = [];

        for (let eq = 0; eq < k; eq++) {
            const y = YTrimmed.map(row => row[eq]);
            const result = this.multipleRegression(X, y);

            if (!result) return null;

            equations[varNames[eq]] = {
                ...result,
                regNames,
                dependent: varNames[eq]
            };

            // Calculate residuals for this equation
            const eqResiduals = [];
            for (let i = 0; i < effectiveN; i++) {
                let predicted = result.intercept;
                for (let j = 0; j < result.coefficients.length; j++) {
                    predicted += result.coefficients[j] * X[i][j];
                }
                eqResiduals.push(y[i] - predicted);
            }
            residuals.push(eqResiduals);
        }

        // Calculate residual covariance matrix (Sigma)
        const dfAdjust = effectiveN - p * k - 1 - (includeTrend ? 1 : 0); // -1 for constant (always included via multipleRegression)
        const sigma = [];
        for (let i = 0; i < k; i++) {
            sigma[i] = [];
            for (let j = 0; j < k; j++) {
                let sum = 0;
                for (let t = 0; t < effectiveN; t++) {
                    sum += residuals[i][t] * residuals[j][t];
                }
                sigma[i][j] = dfAdjust > 0 ? sum / dfAdjust : sum / effectiveN;
            }
        }

        // Log determinant of sigma for information criteria
        const detSigma = this.determinant(sigma);
        const logDetSigma = detSigma > 0 ? Math.log(detSigma) : 0;

        // Information criteria
        const numParams = k * (p * k + 1 + (includeTrend ? 1 : 0)); // +1 for constant
        const aic = logDetSigma + 2 * numParams / effectiveN;
        const bic = logDetSigma + numParams * Math.log(effectiveN) / effectiveN;
        const hq = logDetSigma + 2 * numParams * Math.log(Math.log(effectiveN)) / effectiveN;

        return {
            equations,
            varNames,
            p,
            k,
            n: effectiveN,
            sigma,
            residuals: this.transpose(residuals),
            regNames,
            informationCriteria: { AIC: aic, BIC: bic, HQ: hq },
            includeConstant: true, // Always true since multipleRegression adds it
            includeTrend,
            specification: `VAR(${p})`
        };
    },

    // Matrix determinant (for small matrices)
    determinant(matrix) {
        const n = matrix.length;
        if (n === 1) return matrix[0][0];
        if (n === 2) return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];

        let det = 0;
        for (let j = 0; j < n; j++) {
            const minor = [];
            for (let i = 1; i < n; i++) {
                minor.push([...matrix[i].slice(0, j), ...matrix[i].slice(j + 1)]);
            }
            det += Math.pow(-1, j) * matrix[0][j] * this.determinant(minor);
        }
        return det;
    },

    // Granger Causality Test within VAR framework
    grangerCausality(data, p, causingVar, affectedVar) {
        const varNames = Object.keys(data);

        // Unrestricted model (full VAR)
        const unrestricted = this.varEstimate(data, p, true, false);
        if (!unrestricted) return null;

        // Restricted model (exclude lags of causing variable in affected equation)
        const y = data[affectedVar];

        // Build unrestricted X
        const n = y.length;
        const effectiveN = n - p;
        const yTrimmed = y.slice(p);

        // Unrestricted regressors (multipleRegression adds intercept automatically)
        const unrestrictedX = [];
        for (let i = p; i < n; i++) {
            const row = [];
            for (let lag = 1; lag <= p; lag++) {
                for (const v of varNames) {
                    row.push(data[v][i - lag]);
                }
            }
            unrestrictedX.push(row);
        }

        // Restricted regressors (exclude causing variable lags)
        const restrictedX = [];
        for (let i = p; i < n; i++) {
            const row = [];
            for (let lag = 1; lag <= p; lag++) {
                for (const v of varNames) {
                    if (v !== causingVar) {
                        row.push(data[v][i - lag]);
                    }
                }
            }
            restrictedX.push(row);
        }

        const unResult = this.multipleRegression(unrestrictedX, yTrimmed);
        const resResult = this.multipleRegression(restrictedX, yTrimmed);

        if (!unResult || !resResult) return null;

        // F-test
        const ssrU = unResult.ssRes;
        const ssrR = resResult.ssRes;
        const q = p; // Number of restrictions (p lags of causing variable)
        const dfResidual = effectiveN - p * varNames.length - 1;

        if (dfResidual <= 0 || ssrU <= 0) return null;

        const fStat = ((ssrR - ssrU) / q) / (ssrU / dfResidual);
        const fPValue = fStat > 0 ? 1 - this.fCDF(fStat, q, dfResidual) : 1;

        return {
            causingVar,
            affectedVar,
            fStatistic: fStat,
            pValue: fPValue,
            significant: fPValue < 0.05,
            conclusion: fPValue < 0.05
                ? `${causingVar} Granger-causes ${affectedVar}`
                : `${causingVar} does not Granger-cause ${affectedVar}`
        };
    },

    // ========================================
    // Johansen Cointegration Test
    // ========================================

    // Power iteration method for largest eigenvalue
    powerIteration(matrix, maxIter = 100, tol = 1e-10) {
        const n = matrix.length;
        let v = Array(n).fill(1);
        let eigenvalue = 0;

        for (let iter = 0; iter < maxIter; iter++) {
            // Matrix-vector multiplication
            const Av = this.matVecMul(matrix, v);

            // Find the largest component
            let maxVal = 0;
            for (let i = 0; i < n; i++) {
                if (Math.abs(Av[i]) > Math.abs(maxVal)) {
                    maxVal = Av[i];
                }
            }

            const newEigenvalue = maxVal;

            // Normalize
            v = Av.map(x => x / maxVal);

            if (Math.abs(newEigenvalue - eigenvalue) < tol) {
                return { eigenvalue: newEigenvalue, eigenvector: v };
            }
            eigenvalue = newEigenvalue;
        }
        return { eigenvalue, eigenvector: v };
    },

    // Get all eigenvalues using deflation method
    getAllEigenvalues(matrix, maxIter = 100) {
        const n = matrix.length;
        let A = matrix.map(row => [...row]);
        const eigenvalues = [];
        const eigenvectors = [];

        for (let i = 0; i < n; i++) {
            const result = this.powerIteration(A, maxIter);
            eigenvalues.push(result.eigenvalue);
            eigenvectors.push(result.eigenvector);

            // Deflation
            const lambda = result.eigenvalue;
            const v = result.eigenvector;
            const vNorm = Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));
            const vNormalized = v.map(x => x / vNorm);

            for (let j = 0; j < n; j++) {
                for (let k = 0; k < n; k++) {
                    A[j][k] -= lambda * vNormalized[j] * vNormalized[k];
                }
            }
        }

        return { eigenvalues, eigenvectors };
    },

    // Johansen Cointegration Test
    johansenTest(data, p = 1, detTrend = 'const') {
        // data: object with variable names as keys
        // p: lag order
        // detTrend: 'none', 'const', 'trend'

        const varNames = Object.keys(data);
        const k = varNames.length;
        const n = data[varNames[0]].length;

        if (n <= p + k + 5) {
            return null; // Not enough observations
        }

        // Create first differences
        const dY = {};
        for (const v of varNames) {
            dY[v] = this.difference(data[v], 1);
        }

        // Create lagged levels
        const Ylag = {};
        for (const v of varNames) {
            Ylag[v] = data[v].slice(0, -1);
        }

        // Create lagged differences
        const dYlags = {};
        for (const v of varNames) {
            dYlags[v] = [];
            for (let lag = 1; lag <= p - 1; lag++) {
                dYlags[v].push(this.createLags(dY[v], lag)[0] || []);
            }
        }

        const effectiveN = n - p - 1;
        const effectiveStart = p;

        // Build Z matrices for Johansen procedure
        // Z0t = ΔYt, Z1t = Y(t-1), Z2t = [ΔY(t-1), ..., ΔY(t-p+1), deterministic]

        // Dependent: ΔY
        const Z0 = [];
        for (let t = 0; t < effectiveN; t++) {
            Z0.push(varNames.map(v => dY[v][effectiveStart + t]));
        }

        // Lagged levels: Y(t-1)
        const Z1 = [];
        for (let t = 0; t < effectiveN; t++) {
            Z1.push(varNames.map(v => Ylag[v][effectiveStart + t]));
        }

        // Lagged differences and deterministic terms
        const Z2 = [];
        for (let t = 0; t < effectiveN; t++) {
            const row = [];
            // Add lagged differences
            for (let lag = 1; lag <= p - 1; lag++) {
                for (const v of varNames) {
                    const idx = effectiveStart + t - lag;
                    if (idx >= 0 && idx < dY[v].length) {
                        row.push(dY[v][idx]);
                    } else {
                        row.push(0);
                    }
                }
            }
            // Add constant
            if (detTrend === 'const' || detTrend === 'trend') {
                row.push(1);
            }
            // Add trend
            if (detTrend === 'trend') {
                row.push(t + 1);
            }
            Z2.push(row);
        }

        // Concentrate out Z2 from Z0 and Z1
        let R0, R1;

        if (Z2[0].length > 0) {
            // OLS of Z0 on Z2
            const Z2t = this.transpose(Z2);
            const Z2tZ2 = this.matMul(Z2t, Z2);
            const Z2tZ2inv = this.matInverse(Z2tZ2);

            if (!Z2tZ2inv) return null;

            // Residuals R0 = Z0 - Z2(Z2'Z2)^-1 Z2'Z0
            const Z2tZ0 = this.matMul(Z2t, Z0);
            const proj0 = this.matMul(Z2, this.matMul(Z2tZ2inv, Z2tZ0));
            R0 = Z0.map((row, i) => row.map((val, j) => val - proj0[i][j]));

            // Residuals R1 = Z1 - Z2(Z2'Z2)^-1 Z2'Z1
            const Z2tZ1 = this.matMul(Z2t, Z1);
            const proj1 = this.matMul(Z2, this.matMul(Z2tZ2inv, Z2tZ1));
            R1 = Z1.map((row, i) => row.map((val, j) => val - proj1[i][j]));
        } else {
            R0 = Z0;
            R1 = Z1;
        }

        // Moment matrices
        const R0t = this.transpose(R0);
        const R1t = this.transpose(R1);

        const S00 = this.matMul(R0t, R0).map(row => row.map(v => v / effectiveN));
        const S11 = this.matMul(R1t, R1).map(row => row.map(v => v / effectiveN));
        const S01 = this.matMul(R0t, R1).map(row => row.map(v => v / effectiveN));
        const S10 = this.transpose(S01);

        // Solve eigenvalue problem: |λS11 - S10 S00^-1 S01| = 0
        const S00inv = this.matInverse(S00);
        if (!S00inv) return null;

        const S00invS01 = this.matMul(S00inv, S01);
        const S10S00invS01 = this.matMul(S10, S00invS01);

        const S11inv = this.matInverse(S11);
        if (!S11inv) return null;

        const M = this.matMul(S11inv, S10S00invS01);

        // Get eigenvalues
        const eigenResult = this.getAllEigenvalues(M);
        let eigenvalues = eigenResult.eigenvalues.sort((a, b) => b - a);

        // Ensure eigenvalues are in valid range [0, 1]
        eigenvalues = eigenvalues.map(e => Math.max(0, Math.min(1, e)));

        // Calculate test statistics
        // Trace statistic: -T Σ ln(1 - λi) for i = r+1 to k
        // Max statistic: -T ln(1 - λr+1)

        const traceStats = [];
        const maxStats = [];

        for (let r = 0; r < k; r++) {
            // Trace statistic for H0: rank <= r
            let trace = 0;
            for (let i = r; i < k; i++) {
                trace += Math.log(1 - eigenvalues[i]);
            }
            traceStats.push(-effectiveN * trace);

            // Max eigenvalue statistic
            maxStats.push(-effectiveN * Math.log(1 - eigenvalues[r]));
        }

        // Critical values (approximate for 5% significance)
        const traceCritical = this.getJohansenTraceCritical(k, detTrend);
        const maxCritical = this.getJohansenMaxCritical(k, detTrend);

        // Determine cointegrating rank
        let rank = 0;
        for (let r = 0; r < k; r++) {
            if (traceStats[r] > traceCritical[r]) {
                rank = r + 1;
            } else {
                break;
            }
        }

        return {
            eigenvalues,
            traceStatistics: traceStats,
            maxStatistics: maxStats,
            traceCriticalValues: traceCritical,
            maxCriticalValues: maxCritical,
            rank,
            k,
            n: effectiveN,
            varNames,
            detTrend,
            specification: `Johansen Test (p=${p}, ${detTrend})`
        };
    },

    // Johansen trace test critical values (5% level, approximate)
    getJohansenTraceCritical(k, detTrend) {
        // Approximate critical values
        const cv = {
            'none': {
                1: [6.50], 2: [15.41, 3.76], 3: [29.68, 15.41, 3.76],
                4: [47.21, 29.68, 15.41, 3.76], 5: [68.52, 47.21, 29.68, 15.41, 3.76]
            },
            'const': {
                1: [8.18], 2: [17.95, 8.18], 3: [31.52, 17.95, 8.18],
                4: [48.28, 31.52, 17.95, 8.18], 5: [70.60, 48.28, 31.52, 17.95, 8.18]
            },
            'trend': {
                1: [12.25], 2: [25.32, 12.25], 3: [42.44, 25.32, 12.25],
                4: [62.99, 42.44, 25.32, 12.25], 5: [87.31, 62.99, 42.44, 25.32, 12.25]
            }
        };
        return cv[detTrend]?.[Math.min(k, 5)] || cv['const'][5];
    },

    // Johansen max eigenvalue test critical values (5% level, approximate)
    getJohansenMaxCritical(k, detTrend) {
        const cv = {
            'none': {
                1: [6.50], 2: [11.65, 3.76], 3: [17.68, 11.65, 3.76],
                4: [23.52, 17.68, 11.65, 3.76], 5: [29.25, 23.52, 17.68, 11.65, 3.76]
            },
            'const': {
                1: [8.18], 2: [14.26, 8.18], 3: [21.13, 14.26, 8.18],
                4: [27.58, 21.13, 14.26, 8.18], 5: [33.87, 27.58, 21.13, 14.26, 8.18]
            },
            'trend': {
                1: [12.25], 2: [18.96, 12.25], 3: [25.54, 18.96, 12.25],
                4: [31.46, 25.54, 18.96, 12.25], 5: [37.52, 31.46, 25.54, 18.96, 12.25]
            }
        };
        return cv[detTrend]?.[Math.min(k, 5)] || cv['const'][5];
    },

    // ========================================
    // VECM (Vector Error Correction Model)
    // ========================================

    vecmEstimate(data, p, rank = 1, includeConstant = true, includeTrend = false) {
        // VECM: ΔY_t = αβ'Y_{t-1} + Γ_1 ΔY_{t-1} + ... + Γ_{p-1} ΔY_{t-p+1} + μ + εt

        const varNames = Object.keys(data);
        const k = varNames.length;
        const n = data[varNames[0]].length;

        if (rank > k || n <= p + k + 5) return null;

        // First run Johansen test to get cointegrating vectors
        const johansen = this.johansenTest(data, p, includeConstant ? (includeTrend ? 'trend' : 'const') : 'none');
        if (!johansen) return null;

        // Create first differences
        const dY = {};
        for (const v of varNames) {
            dY[v] = this.difference(data[v], 1);
        }

        // Create lagged levels for ECT
        const Ylag = {};
        for (const v of varNames) {
            Ylag[v] = data[v].slice(0, -1);
        }

        const effectiveN = n - p;
        const effectiveStart = p - 1;

        // Build regressor matrix for VECM
        // Note: multipleRegression adds intercept automatically
        const equations = {};
        const residuals = [];

        for (let eq = 0; eq < k; eq++) {
            const y = [];
            const X = [];
            const regNames = [];

            for (let t = effectiveStart; t < n - 1; t++) {
                y.push(dY[varNames[eq]][t]);

                const row = [];

                // Error correction term (simplified: use first variable as ECT proxy)
                // In full implementation, this would be β'Y_{t-1}
                row.push(Ylag[varNames[0]][t]);
                if (t === effectiveStart) regNames.push('ECT');

                // Lagged differences
                for (let lag = 1; lag <= p - 1; lag++) {
                    for (const v of varNames) {
                        const idx = t - lag;
                        if (idx >= 0 && idx < dY[v].length) {
                            row.push(dY[v][idx]);
                        } else {
                            row.push(0);
                        }
                        if (t === effectiveStart) regNames.push(`Δ${v}(-${lag})`);
                    }
                }

                // Trend (constant is added by multipleRegression automatically)
                if (includeTrend) {
                    row.push(t - effectiveStart + 1);
                    if (t === effectiveStart) regNames.push('trend');
                }

                X.push(row);
            }

            const result = this.multipleRegression(X, y);
            if (!result) return null;

            equations[varNames[eq]] = {
                ...result,
                dependent: varNames[eq],
                regNames
            };

            // Store residuals
            const eqResiduals = y.map((yi, i) => {
                let predicted = result.intercept;
                for (let j = 0; j < result.coefficients.length; j++) {
                    predicted += result.coefficients[j] * X[i][j];
                }
                return yi - predicted;
            });
            residuals.push(eqResiduals);
        }

        // Extract alpha (adjustment coefficients) - coefficient on ECT
        const alpha = {};
        for (const v of varNames) {
            alpha[v] = equations[v].coefficients[0]; // First coefficient is ECT
        }

        // Gamma matrices (short-run dynamics)
        const gamma = [];
        for (let lag = 1; lag <= p - 1; lag++) {
            const gammaLag = {};
            for (let i = 0; i < k; i++) {
                gammaLag[varNames[i]] = {};
                for (let j = 0; j < k; j++) {
                    const coefIdx = 1 + (lag - 1) * k + j; // Skip ECT
                    gammaLag[varNames[i]][varNames[j]] = equations[varNames[i]].coefficients[coefIdx] || 0;
                }
            }
            gamma.push(gammaLag);
        }

        return {
            equations,
            varNames,
            p,
            k,
            rank,
            alpha,
            gamma,
            johansen,
            n: effectiveN - p + 1,
            residuals: this.transpose(residuals),
            includeConstant: true, // Always true since multipleRegression adds it
            includeTrend,
            specification: `VECM(${p - 1}), r=${rank}`
        };
    },

    // Full VAR/VECM Analysis
    varAnalysis(data, config) {
        const {
            p = 1,
            includeConstant = true,
            includeTrend = false,
            testCointegration = true,
            vecmRank = 1
        } = config;

        // Apply transformations and differencing to data
        const transformedData = {};
        const varNames = Object.keys(data);

        for (const v of varNames) {
            let arr = [...data[v]];
            const transform = config.transforms?.[v] || 'none';
            const diff = config.diffs?.[v] || 0;

            if (transform !== 'none') {
                arr = this.transform(arr, transform);
            }
            if (diff > 0) {
                arr = this.difference(arr, diff);
            }
            transformedData[v] = arr.filter(x => !isNaN(x));
        }

        // Align lengths
        let minLen = Math.min(...varNames.map(v => transformedData[v].length));
        for (const v of varNames) {
            transformedData[v] = transformedData[v].slice(-minLen);
        }

        // VAR estimation
        const varResult = this.varEstimate(transformedData, p, includeConstant, includeTrend);
        if (!varResult) return null;

        // Johansen test if requested
        let johansenResult = null;
        if (testCointegration) {
            johansenResult = this.johansenTest(transformedData, p,
                includeConstant ? (includeTrend ? 'trend' : 'const') : 'none');
        }

        // VECM if cointegration exists
        let vecmResult = null;
        if (johansenResult && johansenResult.rank > 0) {
            vecmResult = this.vecmEstimate(transformedData, p,
                Math.min(vecmRank, johansenResult.rank), includeConstant, includeTrend);
        }

        // Granger causality tests
        const grangerTests = [];
        for (let i = 0; i < varNames.length; i++) {
            for (let j = 0; j < varNames.length; j++) {
                if (i !== j) {
                    const test = this.grangerCausality(transformedData, p, varNames[i], varNames[j]);
                    if (test) grangerTests.push(test);
                }
            }
        }

        return {
            var: varResult,
            johansen: johansenResult,
            vecm: vecmResult,
            grangerTests,
            config,
            transformedData,
            varNames
        };
    },

    // ========================================
    // Stationarity Tests (ADF, KPSS, PP)
    // ========================================

    // Augmented Dickey-Fuller (ADF) Test
    // H0: Unit root exists (non-stationary)
    // H1: No unit root (stationary)
    adfTest(series, maxLag = null, trend = 'c') {
        // trend: 'n' (none), 'c' (constant), 'ct' (constant + trend)
        const n = series.length;
        if (n < 10) return null;

        // Auto-select lag using AIC if not specified
        if (maxLag === null) {
            maxLag = Math.floor(Math.pow(n - 1, 1 / 3));
        }
        maxLag = Math.min(maxLag, Math.floor(n / 4));

        // Create first difference
        const dy = this.difference(series, 1);
        const yLag = series.slice(0, -1);

        // Find optimal lag using AIC
        let bestLag = 0;
        let bestAIC = Infinity;

        for (let lag = 0; lag <= maxLag; lag++) {
            const testResult = this._runADFRegression(series, dy, yLag, lag, trend);
            if (testResult && testResult.aic < bestAIC) {
                bestAIC = testResult.aic;
                bestLag = lag;
            }
        }

        // Run ADF with optimal lag
        const result = this._runADFRegression(series, dy, yLag, bestLag, trend);
        if (!result) return null;

        // Get critical values
        const criticalValues = this._getADFCriticalValues(n, trend);

        // Determine significance
        let significant = 'not stationary';
        if (result.tStat < criticalValues['1%']) {
            significant = 'stationary at 1%';
        } else if (result.tStat < criticalValues['5%']) {
            significant = 'stationary at 5%';
        } else if (result.tStat < criticalValues['10%']) {
            significant = 'stationary at 10%';
        }

        return {
            testName: 'Augmented Dickey-Fuller',
            tStatistic: result.tStat,
            pValue: result.pValue,
            usedLag: bestLag,
            criticalValues,
            significant,
            isStationary: result.tStat < criticalValues['5%'],
            trend,
            n,
            hypothesis: 'H0: Unit root exists (non-stationary)'
        };
    },

    _runADFRegression(series, dy, yLag, lag, trend) {
        const n = dy.length;
        const effectiveN = n - lag;
        if (effectiveN < 5) return null;

        // Build regressor matrix
        const X = [];
        const y = [];
        const regNames = [];

        for (let t = lag; t < n; t++) {
            const row = [];

            // Constant
            if (trend === 'c' || trend === 'ct') {
                row.push(1);
                if (t === lag) regNames.push('const');
            }

            // Trend
            if (trend === 'ct') {
                row.push(t + 1);
                if (t === lag) regNames.push('trend');
            }

            // Lagged level
            row.push(yLag[t]);
            if (t === lag) regNames.push('y(-1)');

            // Lagged differences
            for (let l = 1; l <= lag; l++) {
                row.push(dy[t - l]);
                if (t === lag) regNames.push(`Δy(-${l})`);
            }

            X.push(row);
            y.push(dy[t]);
        }

        if (X.length < 5 || X[0].length === 0) return null;

        // Run regression
        const result = this.multipleRegression(X, y);
        if (!result) return null;

        // t-statistic for the lagged level coefficient (gamma)
        const gammaIdx = (trend === 'c' ? 1 : trend === 'ct' ? 2 : 0);
        const tStat = result.tStats[gammaIdx];
        const pValue = this._adfPValue(tStat, trend);

        // AIC for lag selection
        const ssr = result.ssRes || y.reduce((sum, yi, i) => {
            let pred = result.intercept;
            for (let j = 0; j < result.coefficients.length; j++) {
                pred += result.coefficients[j] * X[i][j];
            }
            return sum + Math.pow(yi - pred, 2);
        }, 0);

        const k = X[0].length + 1;
        const aic = effectiveN * Math.log(ssr / effectiveN) + 2 * k;

        return { tStat, pValue, aic, regNames, result };
    },

    _getADFCriticalValues(n, trend) {
        // Approximate critical values (MacKinnon, 1994)
        if (trend === 'ct') {
            return { '1%': -4.04, '5%': -3.45, '10%': -3.15 };
        } else if (trend === 'c') {
            return { '1%': -3.51, '5%': -2.89, '10%': -2.58 };
        } else {
            return { '1%': -2.60, '5%': -1.95, '10%': -1.61 };
        }
    },

    _adfPValue(tStat, trend) {
        // Approximate p-value using critical value interpolation
        const cv = this._getADFCriticalValues(100, trend);
        if (tStat < cv['1%']) return 0.005;
        if (tStat < cv['5%']) return 0.025;
        if (tStat < cv['10%']) return 0.075;
        return Math.min(0.99, 0.5 + 0.1 * (tStat - cv['10%']));
    },

    // KPSS Test (Kwiatkowski-Phillips-Schmidt-Shin)
    // H0: Stationary
    // H1: Unit root exists (non-stationary)
    kpssTest(series, trend = 'c', bandwidth = null) {
        const n = series.length;
        if (n < 10) return null;

        // Default Newey-West bandwidth
        if (bandwidth === null) {
            bandwidth = Math.floor(4 * Math.pow(n / 100, 0.25));
        }

        // Detrend the series
        let residuals;
        if (trend === 'ct') {
            // Regress on constant and trend
            const X = Array.from({ length: n }, (_, i) => [1, i + 1]);
            const y = series;
            const reg = this.multipleRegression(X, y);
            if (!reg) return null;
            residuals = y.map((yi, i) => yi - reg.intercept - reg.coefficients[0] - reg.coefficients[1] * (i + 1));
        } else {
            // Demean
            const mean = this.mean(series);
            residuals = series.map(x => x - mean);
        }

        // Partial sums
        const S = [];
        let cumSum = 0;
        for (let i = 0; i < n; i++) {
            cumSum += residuals[i];
            S.push(cumSum);
        }

        // Estimate long-run variance using Bartlett kernel
        let s2 = 0;
        for (let j = -bandwidth; j <= bandwidth; j++) {
            const weight = 1 - Math.abs(j) / (bandwidth + 1);
            for (let t = j > 0 ? j : 0; t < n + Math.min(0, j); t++) {
                const idx1 = t;
                const idx2 = t - j;
                if (idx2 >= 0 && idx2 < n) {
                    s2 += weight * residuals[idx1] * residuals[idx2];
                }
            }
        }
        s2 /= n;

        // KPSS statistic
        let sumS2 = S.reduce((sum, s) => sum + s * s, 0);
        const eta = sumS2 / (n * n * s2);

        // Critical values
        const criticalValues = trend === 'ct'
            ? { '1%': 0.216, '5%': 0.146, '10%': 0.119 }
            : { '1%': 0.739, '5%': 0.463, '10%': 0.347 };

        // Determine significance
        let significant = 'stationary';
        if (eta > criticalValues['1%']) {
            significant = 'non-stationary at 1%';
        } else if (eta > criticalValues['5%']) {
            significant = 'non-stationary at 5%';
        } else if (eta > criticalValues['10%']) {
            significant = 'non-stationary at 10%';
        }

        return {
            testName: 'KPSS',
            statistic: eta,
            criticalValues,
            significant,
            isStationary: eta < criticalValues['5%'],
            trend,
            bandwidth,
            n,
            hypothesis: 'H0: Stationary'
        };
    },

    // Phillips-Perron Test
    // H0: Unit root exists (non-stationary)
    // H1: No unit root (stationary)
    ppTest(series, trend = 'c', bandwidth = null) {
        const n = series.length;
        if (n < 10) return null;

        // Default bandwidth
        if (bandwidth === null) {
            bandwidth = Math.floor(4 * Math.pow(n / 100, 0.25));
        }

        // First difference
        const dy = this.difference(series, 1);
        const yLag = series.slice(0, -1);
        const effectiveN = n - 1;

        // Build regression: Δy_t = α + ρ*y_{t-1} + ε_t (with optional trend)
        const X = [];
        for (let i = 0; i < effectiveN; i++) {
            const row = [];
            if (trend === 'c' || trend === 'ct') row.push(1);
            if (trend === 'ct') row.push(i + 1);
            row.push(yLag[i]);
            X.push(row);
        }

        const reg = this.multipleRegression(X, dy);
        if (!reg) return null;

        // Calculate residuals
        const residuals = dy.map((yi, i) => {
            let pred = reg.intercept;
            for (let j = 0; j < reg.coefficients.length; j++) {
                pred += reg.coefficients[j] * X[i][j];
            }
            return yi - pred;
        });

        // Estimate s^2 (residual variance)
        const s2 = residuals.reduce((sum, r) => sum + r * r, 0) / (effectiveN - X[0].length - 1);

        // Estimate long-run variance (lambda^2) using Bartlett kernel
        let lambda2 = s2;
        for (let j = 1; j <= bandwidth; j++) {
            const weight = 1 - j / (bandwidth + 1);
            let gamma = 0;
            for (let t = j; t < effectiveN; t++) {
                gamma += residuals[t] * residuals[t - j];
            }
            gamma /= effectiveN;
            lambda2 += 2 * weight * gamma;
        }

        // PP adjustment
        const rhoIdx = X[0].length - 1; // Last coefficient is rho
        const seRho = reg.stdErrors[rhoIdx];
        const tRho = reg.tStats[rhoIdx];

        // Variance of y_{t-1}
        const yLagMean = this.mean(yLag);
        const syy = yLag.reduce((sum, y) => sum + Math.pow(y - yLagMean, 2), 0);

        // PP t-statistic
        const correction = (lambda2 - s2) / (2 * lambda2);
        const ppStat = tRho * Math.sqrt(s2 / lambda2) -
            correction * Math.sqrt(syy) * Math.sqrt(lambda2) / seRho;

        // Critical values (same as ADF)
        const criticalValues = this._getADFCriticalValues(n, trend);

        // Determine significance
        let significant = 'not stationary';
        if (ppStat < criticalValues['1%']) {
            significant = 'stationary at 1%';
        } else if (ppStat < criticalValues['5%']) {
            significant = 'stationary at 5%';
        } else if (ppStat < criticalValues['10%']) {
            significant = 'stationary at 10%';
        }

        return {
            testName: 'Phillips-Perron',
            tStatistic: ppStat,
            criticalValues,
            significant,
            isStationary: ppStat < criticalValues['5%'],
            trend,
            bandwidth,
            n,
            hypothesis: 'H0: Unit root exists (non-stationary)'
        };
    },

    // Combined stationarity analysis
    stationarityAnalysis(series, config = {}) {
        const {
            transformation = 'none',
            differencing = 0,
            trend = 'c',
            maxLag = null
        } = config;

        // Apply transformation
        let transformed = [...series];
        if (transformation !== 'none') {
            transformed = this.transform(transformed, transformation);
        }

        // Apply differencing
        if (differencing > 0) {
            transformed = this.difference(transformed, differencing);
        }

        // Filter valid values
        transformed = transformed.filter(x => !isNaN(x) && isFinite(x));

        if (transformed.length < 10) {
            return { error: 'Not enough valid observations after transformation' };
        }

        // Run all tests
        const adf = this.adfTest(transformed, maxLag, trend);
        const kpss = this.kpssTest(transformed, trend);
        const pp = this.ppTest(transformed, trend);

        // Overall conclusion
        let conclusion = 'inconclusive';
        if (adf && kpss && pp) {
            const adfStationary = adf.isStationary;
            const kpssStationary = kpss.isStationary;
            const ppStationary = pp.isStationary;

            if (adfStationary && kpssStationary && ppStationary) {
                conclusion = 'stationary';
            } else if (!adfStationary && !kpssStationary && !ppStationary) {
                conclusion = 'non-stationary';
            } else if (adfStationary && ppStationary) {
                conclusion = 'likely stationary';
            } else if (!adfStationary && !ppStationary) {
                conclusion = 'likely non-stationary';
            }
        }


        return {
            adf,
            kpss,
            pp,
            conclusion,
            n: transformed.length,
            transformation,
            differencing,
            trend
        };
    },

    // ========================================
    // Panel Data Analysis (Fixed, Random, Pooled)
    // ========================================

    // Pooled OLS for Panel Data
    pooledOLS(data, config) {
        const { y, X, entityCol, timeCol } = this._preparePanelData(data, config);
        if (!y || !X || y.length < 5) return null;

        // Standard OLS
        const result = this.multipleRegression(X, y);
        if (!result) return null;

        return {
            ...result,
            method: 'Pooled OLS',
            nObs: y.length,
            nEntities: config.entities?.length || 0,
            nPeriods: config.periods?.length || 0
        };
    },

    // Fixed Effects (Within Estimator)
    fixedEffects(data, config) {
        const { y, X, entityCol, timeCol, entities, entityIndices } = this._preparePanelData(data, config);
        if (!y || !X || y.length < 5) return null;

        const n = y.length;
        const k = X[0].length;
        const numEntities = entities.length;

        // Calculate entity means
        const entityMeans = {};
        const entityCounts = {};

        entities.forEach(e => {
            entityMeans[e] = { y: 0, X: Array(k).fill(0) };
            entityCounts[e] = 0;
        });

        for (let i = 0; i < n; i++) {
            const entity = entityIndices[i];
            entityMeans[entity].y += y[i];
            for (let j = 0; j < k; j++) {
                entityMeans[entity].X[j] += X[i][j];
            }
            entityCounts[entity]++;
        }

        // Compute means
        entities.forEach(e => {
            const count = entityCounts[e];
            if (count > 0) {
                entityMeans[e].y /= count;
                entityMeans[e].X = entityMeans[e].X.map(v => v / count);
            }
        });

        // Demean data (within transformation)
        const yDemeaned = [];
        const XDemeaned = [];

        for (let i = 0; i < n; i++) {
            const entity = entityIndices[i];
            yDemeaned.push(y[i] - entityMeans[entity].y);
            const xRow = [];
            for (let j = 0; j < k; j++) {
                xRow.push(X[i][j] - entityMeans[entity].X[j]);
            }
            XDemeaned.push(xRow);
        }

        // Run OLS on demeaned data (no intercept needed)
        const result = this._olsNoIntercept(XDemeaned, yDemeaned);
        if (!result) return null;

        // Degrees of freedom adjustment for FE
        const dfResidual = n - numEntities - k;

        // Recalculate standard errors with correct df
        const ssr = result.ssRes;
        const s2 = dfResidual > 0 ? ssr / dfResidual : ssr / n;

        // Calculate entity fixed effects (alpha_i)
        const fixedEffectsValues = {};
        entities.forEach(e => {
            let alpha = entityMeans[e].y;
            for (let j = 0; j < k; j++) {
                alpha -= result.coefficients[j] * entityMeans[e].X[j];
            }
            fixedEffectsValues[e] = alpha;
        });

        // F-test for fixed effects (all alpha_i = 0)
        const pooled = this.pooledOLS(data, config);
        let fTestFE = null;
        if (pooled) {
            const ssrPooled = pooled.ssRes || 0;
            const ssrFE = ssr;
            const fStat = ((ssrPooled - ssrFE) / (numEntities - 1)) / s2;
            const fPValue = 1 - this.fCDF(fStat, numEntities - 1, dfResidual);
            fTestFE = {
                fStatistic: fStat,
                pValue: fPValue,
                significant: fPValue < 0.05
            };
        }

        return {
            ...result,
            method: 'Fixed Effects',
            s2,
            dfResidual,
            fixedEffects: fixedEffectsValues,
            fTestFE,
            nObs: n,
            nEntities: numEntities,
            nPeriods: config.periods?.length || 0
        };
    },

    // Random Effects (GLS Estimator)
    randomEffects(data, config) {
        const { y, X, entityCol, timeCol, entities, entityIndices } = this._preparePanelData(data, config);
        if (!y || !X || y.length < 5) return null;

        const n = y.length;
        const k = X[0].length;
        const numEntities = entities.length;

        // First run FE to get sigma_e^2
        const fe = this.fixedEffects(data, config);
        if (!fe) return null;

        const sigmaE2 = fe.s2;

        // Run between regression to get sigma_u^2
        const entityMeans = {};
        const entityCounts = {};

        entities.forEach(e => {
            entityMeans[e] = { y: 0, X: Array(k).fill(0) };
            entityCounts[e] = 0;
        });

        for (let i = 0; i < n; i++) {
            const entity = entityIndices[i];
            entityMeans[entity].y += y[i];
            for (let j = 0; j < k; j++) {
                entityMeans[entity].X[j] += X[i][j];
            }
            entityCounts[entity]++;
        }

        entities.forEach(e => {
            const count = entityCounts[e];
            if (count > 0) {
                entityMeans[e].y /= count;
                entityMeans[e].X = entityMeans[e].X.map(v => v / count);
            }
        });

        // Between estimator
        const yBetween = entities.map(e => entityMeans[e].y);
        const XBetween = entities.map(e => entityMeans[e].X);

        const betweenResult = this.multipleRegression(XBetween, yBetween);
        if (!betweenResult) return null;

        // Calculate sigma_u^2 (between variance)
        let ssrBetween = 0;
        for (let i = 0; i < entities.length; i++) {
            let pred = betweenResult.intercept;
            for (let j = 0; j < k; j++) {
                pred += betweenResult.coefficients[j] * XBetween[i][j];
            }
            ssrBetween += Math.pow(yBetween[i] - pred, 2);
        }

        const avgT = n / numEntities;
        const sigmaB2 = ssrBetween / (numEntities - k - 1);
        const sigmaU2 = Math.max(0, sigmaB2 - sigmaE2 / avgT);

        // Calculate theta for quasi-demeaning
        const theta = {};
        entities.forEach(e => {
            const Ti = entityCounts[e];
            theta[e] = 1 - Math.sqrt(sigmaE2 / (Ti * sigmaU2 + sigmaE2));
        });

        // Quasi-demean the data
        const yQD = [];
        const XQD = [];

        for (let i = 0; i < n; i++) {
            const entity = entityIndices[i];
            const th = theta[entity];
            yQD.push(y[i] - th * entityMeans[entity].y);
            const xRow = [1 - th]; // Quasi-demeaned constant
            for (let j = 0; j < k; j++) {
                xRow.push(X[i][j] - th * entityMeans[entity].X[j]);
            }
            XQD.push(xRow);
        }

        // GLS on quasi-demeaned data
        const result = this._olsNoIntercept(XQD, yQD);
        if (!result) return null;

        // Extract intercept (first coefficient)
        const intercept = result.coefficients[0];
        const coefficients = result.coefficients.slice(1);
        const stdErrors = result.stdErrors ? result.stdErrors.slice(1) : null;
        const tStats = result.tStats ? result.tStats.slice(1) : null;
        const pValues = result.pValues ? result.pValues.slice(1) : null;

        return {
            intercept,
            coefficients,
            stdErrors,
            tStats,
            pValues,
            rSquared: result.rSquared,
            adjRSquared: result.adjRSquared,
            ssRes: result.ssRes,
            method: 'Random Effects',
            sigmaE2,
            sigmaU2,
            theta: Object.values(theta)[0], // Average theta
            rho: sigmaU2 / (sigmaU2 + sigmaE2), // Fraction of variance due to u_i
            nObs: n,
            nEntities: numEntities,
            nPeriods: config.periods?.length || 0
        };
    },

    // Hausman Test (FE vs RE)
    hausmanTest(data, config) {
        const fe = this.fixedEffects(data, config);
        const re = this.randomEffects(data, config);

        if (!fe || !re) return null;

        const k = fe.coefficients.length;

        // Difference in coefficients
        const bDiff = [];
        for (let i = 0; i < k; i++) {
            bDiff.push(fe.coefficients[i] - re.coefficients[i]);
        }

        // Variance of difference (simplified - assumes diagonal)
        let varDiff = 0;
        for (let i = 0; i < k; i++) {
            const vFE = fe.stdErrors ? Math.pow(fe.stdErrors[i], 2) : 0;
            const vRE = re.stdErrors ? Math.pow(re.stdErrors[i], 2) : 0;
            varDiff += Math.pow(bDiff[i], 2) / Math.max(vFE - vRE, 0.0001);
        }

        const chi2Stat = varDiff;
        const df = k;

        // Chi-square p-value approximation
        const pValue = 1 - this._chi2CDF(chi2Stat, df);

        return {
            chi2Statistic: chi2Stat,
            df,
            pValue,
            significant: pValue < 0.05,
            recommendation: pValue < 0.05 ? 'Fixed Effects' : 'Random Effects',
            conclusion: pValue < 0.05
                ? 'Reject H0: Use Fixed Effects (correlation between u_i and X)'
                : 'Cannot reject H0: Random Effects is consistent and efficient'
        };
    },

    // Chi-square CDF approximation
    _chi2CDF(x, df) {
        if (x <= 0) return 0;
        // Use normal approximation for large df
        const z = Math.pow(x / df, 1 / 3) - (1 - 2 / (9 * df));
        const stdZ = Math.sqrt(2 / (9 * df));
        return this.normalCDF(z / stdZ);
    },

    // Prepare panel data
    _preparePanelData(data, config) {
        const {
            dependent,
            independents,
            entityColumn,
            timeColumn,
            dependentTransform = 'none',
            dependentDiff = 0,
            independentTransforms = {},
            independentDiffs = {}
        } = config;

        if (!data || !dependent || !independents?.length || !entityColumn) {
            return { y: null, X: null };
        }

        // Get unique entities and times
        const entities = [...new Set(data.map(row => row[entityColumn]))].filter(e => e !== undefined && e !== null);
        const periods = timeColumn
            ? [...new Set(data.map(row => row[timeColumn]))].filter(t => t !== undefined && t !== null).sort()
            : [];

        // Extract and transform data
        const y = [];
        const X = [];
        const entityIndices = [];

        for (const row of data) {
            const entity = row[entityColumn];
            if (!entities.includes(entity)) continue;

            // Dependent variable
            let yVal = parseFloat(row[dependent]);
            if (isNaN(yVal)) continue;

            if (dependentTransform !== 'none') {
                const transformed = this.transform([yVal], dependentTransform);
                yVal = transformed[0];
            }

            // Independent variables
            const xRow = [];
            let valid = true;

            for (const ind of independents) {
                let xVal = parseFloat(row[ind]);
                if (isNaN(xVal)) { valid = false; break; }

                const transform = independentTransforms[ind] || 'none';
                if (transform !== 'none') {
                    const transformed = this.transform([xVal], transform);
                    xVal = transformed[0];
                }
                xRow.push(xVal);
            }

            if (!valid || isNaN(yVal)) continue;

            y.push(yVal);
            X.push(xRow);
            entityIndices.push(entity);
        }

        return {
            y,
            X,
            entityCol: entityColumn,
            timeCol: timeColumn,
            entities,
            periods,
            entityIndices
        };
    },

    // OLS without intercept
    _olsNoIntercept(X, y) {
        const n = y.length;
        const k = X[0].length;

        if (n <= k) return null;

        // X'X
        const XtX = [];
        for (let i = 0; i < k; i++) {
            XtX[i] = [];
            for (let j = 0; j < k; j++) {
                let sum = 0;
                for (let t = 0; t < n; t++) {
                    sum += X[t][i] * X[t][j];
                }
                XtX[i][j] = sum;
            }
        }

        // X'y
        const Xty = [];
        for (let i = 0; i < k; i++) {
            let sum = 0;
            for (let t = 0; t < n; t++) {
                sum += X[t][i] * y[t];
            }
            Xty.push(sum);
        }

        // Invert X'X
        const XtXinv = this.matInverse(XtX);
        if (!XtXinv) return null;

        // Coefficients: (X'X)^-1 X'y
        const coefficients = [];
        for (let i = 0; i < k; i++) {
            let sum = 0;
            for (let j = 0; j < k; j++) {
                sum += XtXinv[i][j] * Xty[j];
            }
            coefficients.push(sum);
        }

        // Residuals and SSR
        let ssRes = 0;
        let ssTot = 0;
        const yMean = this.mean(y);

        for (let t = 0; t < n; t++) {
            let pred = 0;
            for (let j = 0; j < k; j++) {
                pred += coefficients[j] * X[t][j];
            }
            ssRes += Math.pow(y[t] - pred, 2);
            ssTot += Math.pow(y[t] - yMean, 2);
        }

        const rSquared = 1 - ssRes / ssTot;
        const adjRSquared = 1 - (1 - rSquared) * (n - 1) / (n - k);
        const s2 = ssRes / (n - k);

        // Standard errors
        const stdErrors = [];
        const tStats = [];
        const pValues = [];

        for (let i = 0; i < k; i++) {
            const se = Math.sqrt(s2 * XtXinv[i][i]);
            stdErrors.push(se);
            const tStat = coefficients[i] / se;
            tStats.push(tStat);
            pValues.push(2 * (1 - this.normalCDF(Math.abs(tStat))));
        }

        return {
            coefficients,
            stdErrors,
            tStats,
            pValues,
            rSquared,
            adjRSquared,
            ssRes,
            n,
            k
        };
    },

    // Full Panel Data Analysis
    panelAnalysis(data, config) {
        const {
            method = 'FE', // 'Pooled', 'FE', 'RE', 'All'
            runHausman = true
        } = config;

        const results = {};

        // Run Pooled OLS
        if (method === 'Pooled' || method === 'All') {
            results.pooled = this.pooledOLS(data, config);
        }

        // Run Fixed Effects
        if (method === 'FE' || method === 'All') {
            results.fe = this.fixedEffects(data, config);
        }

        // Run Random Effects
        if (method === 'RE' || method === 'All') {
            results.re = this.randomEffects(data, config);
        }

        // Hausman Test
        if (runHausman && (method === 'All' || (results.fe && results.re))) {
            results.hausman = this.hausmanTest(data, config);
        }

        // Determine best model
        let bestMethod = method;
        if (method === 'All' && results.hausman) {
            bestMethod = results.hausman.recommendation;
        }

        return {
            ...results,
            bestMethod,
            config
        };
    },

    // ========================================
    // Machine Learning Algorithms
    // ========================================

    // Train/Test Split
    trainTestSplit(data, trainRatio = 0.8) {
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        const splitIdx = Math.floor(shuffled.length * trainRatio);
        return {
            train: shuffled.slice(0, splitIdx),
            test: shuffled.slice(splitIdx)
        };
    },

    // Calculate classification metrics
    classificationMetrics(actual, predicted, classes) {
        const n = actual.length;
        let correct = 0;
        const confusionMatrix = {};

        classes.forEach(c => {
            confusionMatrix[c] = {};
            classes.forEach(c2 => confusionMatrix[c][c2] = 0);
        });

        for (let i = 0; i < n; i++) {
            if (actual[i] === predicted[i]) correct++;
            if (confusionMatrix[actual[i]]) {
                confusionMatrix[actual[i]][predicted[i]] = (confusionMatrix[actual[i]][predicted[i]] || 0) + 1;
            }
        }

        const accuracy = correct / n;

        // Per-class metrics
        const metrics = {};
        classes.forEach(cls => {
            const tp = confusionMatrix[cls]?.[cls] || 0;
            let fp = 0, fn = 0;
            classes.forEach(other => {
                if (other !== cls) {
                    fp += confusionMatrix[other]?.[cls] || 0;
                    fn += confusionMatrix[cls]?.[other] || 0;
                }
            });
            const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
            const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
            const f1 = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0;
            metrics[cls] = { precision, recall, f1, support: tp + fn };
        });

        return { accuracy, confusionMatrix, metrics, classes };
    },

    // Euclidean distance
    euclideanDistance(a, b) {
        return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - (b[i] || 0), 2), 0));
    },

    // K-Nearest Neighbors Classification
    knnClassify(data, config) {
        const { k = 5, target, features, trainRatio = 0.8 } = config;
        const { train, test } = this.trainTestSplit(data, trainRatio);

        // Get unique classes
        const classes = [...new Set(data.map(r => r[target]))].filter(c => c !== undefined);

        // Classify function
        const classify = (point, trainData) => {
            const distances = trainData.map(row => ({
                label: row[target],
                distance: this.euclideanDistance(
                    features.map(f => parseFloat(point[f]) || 0),
                    features.map(f => parseFloat(row[f]) || 0)
                )
            }));
            distances.sort((a, b) => a.distance - b.distance);
            const kNearest = distances.slice(0, k);

            // Vote
            const votes = {};
            kNearest.forEach(n => votes[n.label] = (votes[n.label] || 0) + 1);
            return Object.keys(votes).reduce((a, b) => votes[a] > votes[b] ? a : b);
        };

        // Evaluate on test set
        const predictions = test.map(row => classify(row, train));
        const actual = test.map(row => row[target]);

        const metrics = this.classificationMetrics(actual, predictions, classes);

        return {
            method: 'KNN',
            k,
            trainSize: train.length,
            testSize: test.length,
            ...metrics,
            model: { type: 'knn', k, features, target, trainData: train }
        };
    },

    // Decision Tree (Simple ID3-style)
    decisionTreeTrain(data, config) {
        const { target, features, maxDepth = 10, minSamples = 2, trainRatio = 0.8 } = config;
        const { train, test } = this.trainTestSplit(data, trainRatio);
        const classes = [...new Set(data.map(r => r[target]))].filter(c => c !== undefined);

        // Calculate entropy
        const entropy = (subset) => {
            const counts = {};
            subset.forEach(r => counts[r[target]] = (counts[r[target]] || 0) + 1);
            const total = subset.length;
            return -Object.values(counts).reduce((sum, count) => {
                const p = count / total;
                return sum + (p > 0 ? p * Math.log2(p) : 0);
            }, 0);
        };

        // Find best split
        const findBestSplit = (subset, depth) => {
            if (subset.length < minSamples || depth >= maxDepth) return null;
            const baseEntropy = entropy(subset);
            if (baseEntropy === 0) return null;

            let bestGain = 0, bestFeature = null, bestThreshold = null;

            features.forEach(feature => {
                const values = subset.map(r => parseFloat(r[feature])).filter(v => !isNaN(v)).sort((a, b) => a - b);
                const uniq = [...new Set(values)];

                for (let i = 0; i < uniq.length - 1; i++) {
                    const threshold = (uniq[i] + uniq[i + 1]) / 2;
                    const left = subset.filter(r => parseFloat(r[feature]) <= threshold);
                    const right = subset.filter(r => parseFloat(r[feature]) > threshold);

                    if (left.length === 0 || right.length === 0) continue;

                    const gain = baseEntropy -
                        (left.length / subset.length) * entropy(left) -
                        (right.length / subset.length) * entropy(right);

                    if (gain > bestGain) {
                        bestGain = gain;
                        bestFeature = feature;
                        bestThreshold = threshold;
                    }
                }
            });

            return bestGain > 0 ? { feature: bestFeature, threshold: bestThreshold } : null;
        };

        // Build tree recursively
        const buildTree = (subset, depth = 0) => {
            if (subset.length === 0) return { type: 'leaf', value: classes[0] };

            const counts = {};
            subset.forEach(r => counts[r[target]] = (counts[r[target]] || 0) + 1);
            const majorityClass = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);

            const split = findBestSplit(subset, depth);
            if (!split) return { type: 'leaf', value: majorityClass };

            const left = subset.filter(r => parseFloat(r[split.feature]) <= split.threshold);
            const right = subset.filter(r => parseFloat(r[split.feature]) > split.threshold);

            return {
                type: 'node',
                feature: split.feature,
                threshold: split.threshold,
                left: buildTree(left, depth + 1),
                right: buildTree(right, depth + 1)
            };
        };

        const tree = buildTree(train);

        // Predict function
        const predict = (row, node) => {
            if (node.type === 'leaf') return node.value;
            return parseFloat(row[node.feature]) <= node.threshold
                ? predict(row, node.left)
                : predict(row, node.right);
        };

        const predictions = test.map(row => predict(row, tree));
        const actual = test.map(row => row[target]);
        const metrics = this.classificationMetrics(actual, predictions, classes);

        return {
            method: 'Decision Tree',
            maxDepth,
            trainSize: train.length,
            testSize: test.length,
            ...metrics,
            model: { type: 'decisionTree', tree, features, target }
        };
    },

    // Random Forest
    randomForestTrain(data, config) {
        const { target, features, nTrees = 10, maxDepth = 10, trainRatio = 0.8 } = config;
        const { train, test } = this.trainTestSplit(data, trainRatio);
        const classes = [...new Set(data.map(r => r[target]))].filter(c => c !== undefined);

        // Build multiple trees with bootstrap samples
        const trees = [];
        for (let t = 0; t < nTrees; t++) {
            // Bootstrap sample
            const bootstrap = Array.from({ length: train.length }, () =>
                train[Math.floor(Math.random() * train.length)]
            );
            // Random feature subset
            const subFeatures = features.sort(() => Math.random() - 0.5)
                .slice(0, Math.max(2, Math.floor(Math.sqrt(features.length))));

            const result = this.decisionTreeTrain(bootstrap, {
                target, features: subFeatures, maxDepth, minSamples: 2, trainRatio: 1
            });
            if (result?.model) trees.push({ ...result.model, subFeatures });
        }

        // Predict with voting
        const predict = (row) => {
            const votes = {};
            trees.forEach(treeModel => {
                const pred = this._predictTree(row, treeModel.tree);
                votes[pred] = (votes[pred] || 0) + 1;
            });
            return Object.keys(votes).reduce((a, b) => votes[a] > votes[b] ? a : b);
        };

        const predictions = test.map(predict);
        const actual = test.map(row => row[target]);
        const metrics = this.classificationMetrics(actual, predictions, classes);

        return {
            method: 'Random Forest',
            nTrees,
            maxDepth,
            trainSize: train.length,
            testSize: test.length,
            ...metrics,
            model: { type: 'randomForest', trees, features, target }
        };
    },

    _predictTree(row, node) {
        if (node.type === 'leaf') return node.value;
        return parseFloat(row[node.feature]) <= node.threshold
            ? this._predictTree(row, node.left)
            : this._predictTree(row, node.right);
    },

    // Logistic Regression (Binary/Multiclass)
    logisticRegressionTrain(data, config) {
        const { target, features, learningRate = 0.1, epochs = 100, trainRatio = 0.8 } = config;
        const { train, test } = this.trainTestSplit(data, trainRatio);
        const classes = [...new Set(data.map(r => r[target]))].filter(c => c !== undefined);

        // One-vs-Rest for multiclass
        const classifiers = {};

        classes.forEach(cls => {
            // Binary labels
            const X = train.map(r => [1, ...features.map(f => parseFloat(r[f]) || 0)]);
            const y = train.map(r => r[target] === cls ? 1 : 0);

            // Initialize weights
            let weights = Array(X[0].length).fill(0);

            // Gradient descent
            for (let e = 0; e < epochs; e++) {
                const gradients = Array(weights.length).fill(0);
                for (let i = 0; i < X.length; i++) {
                    const z = X[i].reduce((sum, x, j) => sum + x * weights[j], 0);
                    const pred = 1 / (1 + Math.exp(-z));
                    const error = pred - y[i];
                    X[i].forEach((x, j) => gradients[j] += error * x);
                }
                weights = weights.map((w, j) => w - (learningRate * gradients[j] / X.length));
            }

            classifiers[cls] = weights;
        });

        // Predict function
        const predict = (row) => {
            const x = [1, ...features.map(f => parseFloat(row[f]) || 0)];
            let bestClass = classes[0], bestProb = -Infinity;
            classes.forEach(cls => {
                const z = x.reduce((sum, xi, j) => sum + xi * classifiers[cls][j], 0);
                const prob = 1 / (1 + Math.exp(-z));
                if (prob > bestProb) {
                    bestProb = prob;
                    bestClass = cls;
                }
            });
            return bestClass;
        };

        const predictions = test.map(predict);
        const actual = test.map(row => row[target]);
        const metrics = this.classificationMetrics(actual, predictions, classes);

        return {
            method: 'Logistic Regression',
            learningRate,
            epochs,
            trainSize: train.length,
            testSize: test.length,
            ...metrics,
            model: { type: 'logisticRegression', classifiers, features, target, classes }
        };
    },

    // K-Means Clustering
    kMeansCluster(data, config) {
        const { k = 3, features, maxIterations = 100 } = config;
        const X = data.map(row => features.map(f => parseFloat(row[f]) || 0)).filter(r => r.every(v => !isNaN(v)));

        if (X.length < k) return null;

        // Initialize centroids randomly
        let centroids = X.sort(() => Math.random() - 0.5).slice(0, k).map(c => [...c]);
        let labels = Array(X.length).fill(0);

        for (let iter = 0; iter < maxIterations; iter++) {
            // Assign points to nearest centroid
            const newLabels = X.map(point => {
                let minDist = Infinity, label = 0;
                centroids.forEach((c, i) => {
                    const dist = this.euclideanDistance(point, c);
                    if (dist < minDist) { minDist = dist; label = i; }
                });
                return label;
            });

            // Check convergence
            if (JSON.stringify(labels) === JSON.stringify(newLabels)) break;
            labels = newLabels;

            // Update centroids
            centroids = centroids.map((_, i) => {
                const cluster = X.filter((_, j) => labels[j] === i);
                if (cluster.length === 0) return centroids[i];
                return features.map((_, f) =>
                    cluster.reduce((sum, p) => sum + p[f], 0) / cluster.length
                );
            });
        }

        // Calculate inertia (sum of squared distances to centroids)
        let inertia = 0;
        X.forEach((point, i) => {
            inertia += Math.pow(this.euclideanDistance(point, centroids[labels[i]]), 2);
        });

        // Assign labels to original data
        const clusteredData = data.map((row, i) => ({
            ...row,
            cluster: labels[i] !== undefined ? labels[i] : -1
        }));

        return {
            method: 'K-Means',
            k,
            iterations: maxIterations,
            nPoints: X.length,
            centroids,
            inertia,
            clusterSizes: centroids.map((_, i) => labels.filter(l => l === i).length),
            data: clusteredData,
            columns: [...Object.keys(data[0] || {}), 'cluster']
        };
    },

    // Naive Bayes Classifier
    naiveBayesTrain(data, config) {
        const { target, features, laplace = 1, trainRatio = 0.8 } = config;
        const { train, test } = this.trainTestSplit(data, trainRatio);
        const classes = [...new Set(data.map(r => r[target]))].filter(c => c !== undefined);

        // Calculate class priors and feature likelihoods (Gaussian)
        const model = { priors: {}, means: {}, stds: {} };

        classes.forEach(cls => {
            const subset = train.filter(r => r[target] === cls);
            model.priors[cls] = (subset.length + laplace) / (train.length + laplace * classes.length);
            model.means[cls] = {};
            model.stds[cls] = {};

            features.forEach(f => {
                const values = subset.map(r => parseFloat(r[f])).filter(v => !isNaN(v));
                model.means[cls][f] = this.mean(values) || 0;
                model.stds[cls][f] = this.std(values) || 1;
            });
        });

        // Gaussian PDF
        const gaussianPdf = (x, mean, std) => {
            const variance = std * std + 1e-9;
            return Math.exp(-Math.pow(x - mean, 2) / (2 * variance)) / Math.sqrt(2 * Math.PI * variance);
        };

        // Predict function
        const predict = (row) => {
            let bestClass = classes[0], bestProb = -Infinity;
            classes.forEach(cls => {
                let logProb = Math.log(model.priors[cls]);
                features.forEach(f => {
                    const x = parseFloat(row[f]) || 0;
                    logProb += Math.log(gaussianPdf(x, model.means[cls][f], model.stds[cls][f]) + 1e-9);
                });
                if (logProb > bestProb) {
                    bestProb = logProb;
                    bestClass = cls;
                }
            });
            return bestClass;
        };

        const predictions = test.map(predict);
        const actual = test.map(row => row[target]);
        const metrics = this.classificationMetrics(actual, predictions, classes);

        return {
            method: 'Naive Bayes',
            laplace,
            trainSize: train.length,
            testSize: test.length,
            ...metrics,
            model: { type: 'naiveBayes', priors: model.priors, means: model.means, stds: model.stds, features, target, classes }
        };
    },

    // ========================================
    // Deep Learning - Simple Neural Network
    // ========================================

    neuralNetworkTrain(data, config) {
        const { target, features, hiddenLayers = '16,8', activation = 'relu',
            learningRate = 0.01, epochs = 100, trainRatio = 0.8 } = config;
        const { train, test } = this.trainTestSplit(data, trainRatio);
        const classes = [...new Set(data.map(r => r[target]))].filter(c => c !== undefined);

        const layers = hiddenLayers.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        const inputSize = features.length;
        const outputSize = classes.length;

        // Initialize weights
        const initWeight = () => (Math.random() - 0.5) * 0.5;
        const network = [];

        let prevSize = inputSize;
        [...layers, outputSize].forEach(size => {
            network.push({
                weights: Array.from({ length: prevSize }, () =>
                    Array.from({ length: size }, initWeight)
                ),
                biases: Array.from({ length: size }, initWeight)
            });
            prevSize = size;
        });

        // Activation functions
        const activations = {
            relu: x => Math.max(0, x),
            sigmoid: x => 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x)))),
            tanh: x => Math.tanh(x)
        };
        const activationDerivs = {
            relu: x => x > 0 ? 1 : 0,
            sigmoid: x => { const s = activations.sigmoid(x); return s * (1 - s); },
            tanh: x => 1 - Math.pow(Math.tanh(x), 2)
        };

        const activate = activations[activation] || activations.relu;
        const activateDeriv = activationDerivs[activation] || activationDerivs.relu;

        // Softmax for output
        const softmax = (arr) => {
            const max = Math.max(...arr);
            const exp = arr.map(x => Math.exp(x - max));
            const sum = exp.reduce((a, b) => a + b, 0);
            return exp.map(e => e / sum);
        };

        // Forward pass
        const forward = (input) => {
            const activationsArr = [input];
            let current = input;

            for (let l = 0; l < network.length; l++) {
                const layer = network[l];
                const output = layer.biases.map((b, j) => {
                    let sum = b;
                    for (let i = 0; i < current.length; i++) {
                        sum += current[i] * layer.weights[i][j];
                    }
                    return l === network.length - 1 ? sum : activate(sum);
                });
                activationsArr.push(output);
                current = l === network.length - 1 ? softmax(output) : output;
            }
            return { output: current, activations: activationsArr };
        };

        // Training
        const history = { loss: [], accuracy: [] };

        for (let e = 0; e < epochs; e++) {
            let totalLoss = 0;
            let correct = 0;

            train.forEach(row => {
                const x = features.map(f => parseFloat(row[f]) || 0);
                const yIdx = classes.indexOf(row[target]);
                if (yIdx < 0) return;
                const yTrue = classes.map((_, i) => i === yIdx ? 1 : 0);

                // Forward
                const { output, activations: acts } = forward(x);
                totalLoss -= Math.log(output[yIdx] + 1e-9);
                if (output.indexOf(Math.max(...output)) === yIdx) correct++;

                // Backward (simplified backprop)
                let delta = output.map((o, i) => o - yTrue[i]);

                for (let l = network.length - 1; l >= 0; l--) {
                    const layer = network[l];
                    const prevActs = acts[l];
                    const nextDelta = Array(prevActs.length).fill(0);

                    for (let j = 0; j < layer.biases.length; j++) {
                        layer.biases[j] -= learningRate * delta[j];
                        for (let i = 0; i < prevActs.length; i++) {
                            nextDelta[i] += layer.weights[i][j] * delta[j];
                            layer.weights[i][j] -= learningRate * delta[j] * prevActs[i];
                        }
                    }

                    if (l > 0) {
                        delta = nextDelta.map((d, i) => d * activateDeriv(acts[l][i]));
                    }
                }
            });

            history.loss.push(totalLoss / train.length);
            history.accuracy.push(correct / train.length);
        }

        // Evaluate on test set
        const predictions = test.map(row => {
            const x = features.map(f => parseFloat(row[f]) || 0);
            const { output } = forward(x);
            return classes[output.indexOf(Math.max(...output))];
        });
        const actual = test.map(row => row[target]);
        const metrics = this.classificationMetrics(actual, predictions, classes);

        return {
            method: 'Neural Network',
            architecture: [inputSize, ...layers, outputSize],
            activation,
            learningRate,
            epochs,
            trainSize: train.length,
            testSize: test.length,
            finalLoss: history.loss[history.loss.length - 1],
            trainAccuracy: history.accuracy[history.accuracy.length - 1],
            ...metrics,
            history,
            model: { type: 'neuralNetwork', network, features, target, classes, activation }
        };
    },

    // Model Prediction (for Model Predictor node)
    modelPredict(data, model) {
        if (!model || !model.type) return null;

        const predictions = data.map(row => {
            const x = model.features.map(f => parseFloat(row[f]) || 0);

            switch (model.type) {
                case 'knn':
                    const distances = model.trainData.map(trainRow => ({
                        label: trainRow[model.target],
                        distance: this.euclideanDistance(x, model.features.map(f => parseFloat(trainRow[f]) || 0))
                    }));
                    distances.sort((a, b) => a.distance - b.distance);
                    const votes = {};
                    distances.slice(0, model.k).forEach(n => votes[n.label] = (votes[n.label] || 0) + 1);
                    return Object.keys(votes).reduce((a, b) => votes[a] > votes[b] ? a : b);

                case 'decisionTree':
                    return this._predictTree(row, model.tree);

                case 'logisticRegression':
                    const xLR = [1, ...x];
                    let bestClass = model.classes[0], bestProb = -Infinity;
                    model.classes.forEach(cls => {
                        const z = xLR.reduce((sum, xi, j) => sum + xi * model.classifiers[cls][j], 0);
                        const prob = 1 / (1 + Math.exp(-z));
                        if (prob > bestProb) { bestProb = prob; bestClass = cls; }
                    });
                    return bestClass;

                default:
                    return null;
            }
        });

        return {
            predictions: predictions.map((pred, i) => ({ ...data[i], prediction: pred })),
            data: predictions.map((pred, i) => ({ ...data[i], prediction: pred })),
            columns: [...Object.keys(data[0] || {}), 'prediction']
        };
    },

    // ========================================
    // Advanced Machine Learning Algorithms
    // ========================================

    // Support Vector Machine (Simplified Linear SVM with SGD)
    svmTrain(data, config) {
        const { target, features, kernel = 'linear', C = 1.0, gamma = 0.1, trainRatio = 0.8 } = config;
        const { train, test } = this.trainTestSplit(data, trainRatio);
        const classes = [...new Set(data.map(r => r[target]))].filter(c => c !== undefined);

        // Prepare data
        const X_train = train.map(r => features.map(f => parseFloat(r[f]) || 0));
        const X_test = test.map(r => features.map(f => parseFloat(r[f]) || 0));

        // Normalize features
        const means = features.map((_, i) => this.mean(X_train.map(x => x[i])));
        const stds = features.map((_, i) => this.std(X_train.map(x => x[i])) || 1);
        const normalize = (X) => X.map(row => row.map((v, i) => (v - means[i]) / stds[i]));
        const X_train_norm = normalize(X_train);
        const X_test_norm = normalize(X_test);

        // One-vs-Rest SVM
        const classifiers = {};
        const probabilities = [];

        classes.forEach(cls => {
            const y = train.map(r => r[target] === cls ? 1 : -1);

            // Initialize weights and bias
            let w = Array(features.length).fill(0);
            let b = 0;
            const lr = 0.01;
            const epochs = 100;

            // SGD Training (Pegasos algorithm)
            for (let e = 0; e < epochs; e++) {
                for (let i = 0; i < X_train_norm.length; i++) {
                    const x = X_train_norm[i];
                    const margin = y[i] * (x.reduce((sum, xi, j) => sum + w[j] * xi, 0) + b);

                    if (margin < 1) {
                        // Misclassified or in margin
                        w = w.map((wj, j) => wj + lr * (C * y[i] * x[j] - wj / epochs));
                        b += lr * C * y[i];
                    } else {
                        // Correctly classified
                        w = w.map(wj => wj * (1 - lr / epochs));
                    }
                }
            }
            classifiers[cls] = { w, b };
        });

        // Prediction
        const predict = (x_norm) => {
            let bestClass = classes[0], bestScore = -Infinity;
            const scores = {};
            classes.forEach(cls => {
                const { w, b } = classifiers[cls];
                scores[cls] = x_norm.reduce((sum, xi, j) => sum + w[j] * xi, 0) + b;
                if (scores[cls] > bestScore) {
                    bestScore = scores[cls];
                    bestClass = cls;
                }
            });
            return { prediction: bestClass, scores };
        };

        // Evaluate
        const testResults = X_test_norm.map((x, i) => {
            const result = predict(x);
            probabilities.push({ actual: test[i][target], scores: result.scores });
            return result.prediction;
        });
        const actual = test.map(r => r[target]);
        const metrics = this.classificationMetrics(actual, testResults, classes);

        // Feature importance (weight magnitudes for linear SVM)
        const featureImportance = features.map((f, i) => {
            const avgWeight = classes.reduce((sum, cls) => sum + Math.abs(classifiers[cls].w[i]), 0) / classes.length;
            return { feature: f, importance: avgWeight };
        }).sort((a, b) => b.importance - a.importance);

        return {
            method: 'SVM',
            kernel,
            C,
            trainSize: train.length,
            testSize: test.length,
            ...metrics,
            featureImportance,
            probabilities,
            model: { type: 'svm', classifiers, features, target, classes, means, stds }
        };
    },

    // Gradient Boosting (Simple implementation with decision stumps)
    gradientBoostingTrain(data, config) {
        const { target, features, nEstimators = 50, learningRate = 0.1, maxDepth = 3, trainRatio = 0.8 } = config;
        const { train, test } = this.trainTestSplit(data, trainRatio);
        const classes = [...new Set(data.map(r => r[target]))].filter(c => c !== undefined);

        // For binary classification, use gradient boosting for logistic loss
        // For multiclass, use one-vs-rest
        const classifiers = {};
        const probabilities = [];

        classes.forEach(cls => {
            const y = train.map(r => r[target] === cls ? 1 : 0);
            const stumps = [];
            let F = Array(train.length).fill(0); // Current predictions

            for (let m = 0; m < nEstimators; m++) {
                // Compute pseudo-residuals (negative gradient of log loss)
                const p = F.map(f => 1 / (1 + Math.exp(-f)));
                const residuals = y.map((yi, i) => yi - p[i]);

                // Fit a simple decision stump to residuals
                let bestFeature = features[0], bestThreshold = 0, bestScore = -Infinity;

                features.forEach(feature => {
                    const values = train.map(r => parseFloat(r[feature])).filter(v => !isNaN(v)).sort((a, b) => a - b);
                    const thresholds = [...new Set(values)];

                    for (let t of thresholds.slice(0, 10)) { // Sample thresholds for speed
                        const leftIdx = [], rightIdx = [];
                        train.forEach((r, i) => {
                            if (parseFloat(r[feature]) <= t) leftIdx.push(i);
                            else rightIdx.push(i);
                        });

                        if (leftIdx.length === 0 || rightIdx.length === 0) continue;

                        const leftMean = leftIdx.reduce((s, i) => s + residuals[i], 0) / leftIdx.length;
                        const rightMean = rightIdx.reduce((s, i) => s + residuals[i], 0) / rightIdx.length;

                        // Variance reduction
                        const score = leftIdx.length * leftMean * leftMean + rightIdx.length * rightMean * rightMean;
                        if (score > bestScore) {
                            bestScore = score;
                            bestFeature = feature;
                            bestThreshold = t;
                        }
                    }
                });

                // Create stump
                const leftIdx = [], rightIdx = [];
                train.forEach((r, i) => {
                    if (parseFloat(r[bestFeature]) <= bestThreshold) leftIdx.push(i);
                    else rightIdx.push(i);
                });

                const leftValue = leftIdx.length > 0 ? leftIdx.reduce((s, i) => s + residuals[i], 0) / leftIdx.length : 0;
                const rightValue = rightIdx.length > 0 ? rightIdx.reduce((s, i) => s + residuals[i], 0) / rightIdx.length : 0;

                const stump = { feature: bestFeature, threshold: bestThreshold, leftValue, rightValue };
                stumps.push(stump);

                // Update F
                train.forEach((r, i) => {
                    const pred = parseFloat(r[bestFeature]) <= bestThreshold ? leftValue : rightValue;
                    F[i] += learningRate * pred;
                });
            }

            classifiers[cls] = { stumps };
        });

        // Prediction
        const predictProba = (row) => {
            const scores = {};
            classes.forEach(cls => {
                let F = 0;
                classifiers[cls].stumps.forEach(stump => {
                    const val = parseFloat(row[stump.feature]) <= stump.threshold ? stump.leftValue : stump.rightValue;
                    F += learningRate * val;
                });
                scores[cls] = 1 / (1 + Math.exp(-F));
            });
            return scores;
        };

        const predict = (row) => {
            const scores = predictProba(row);
            return Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
        };

        // Evaluate
        const predictions = test.map(row => {
            const scores = predictProba(row);
            probabilities.push({ actual: row[target], scores });
            return predict(row);
        });
        const actual = test.map(r => r[target]);
        const metrics = this.classificationMetrics(actual, predictions, classes);

        // Feature importance
        const featureCounts = {};
        features.forEach(f => featureCounts[f] = 0);
        classes.forEach(cls => {
            classifiers[cls].stumps.forEach(s => featureCounts[s.feature]++);
        });
        const total = classes.length * nEstimators;
        const featureImportance = features.map(f => ({
            feature: f,
            importance: featureCounts[f] / total
        })).sort((a, b) => b.importance - a.importance);

        return {
            method: 'Gradient Boosting',
            nEstimators,
            learningRate,
            maxDepth,
            trainSize: train.length,
            testSize: test.length,
            ...metrics,
            featureImportance,
            probabilities,
            model: { type: 'gradientBoosting', classifiers, features, target, classes }
        };
    },

    // AdaBoost
    adaBoostTrain(data, config) {
        const { target, features, nEstimators = 50, learningRate = 1.0, trainRatio = 0.8 } = config;
        const { train, test } = this.trainTestSplit(data, trainRatio);
        const classes = [...new Set(data.map(r => r[target]))].filter(c => c !== undefined);

        const classifiers = {};
        const probabilities = [];

        classes.forEach(cls => {
            const y = train.map(r => r[target] === cls ? 1 : -1);
            const n = train.length;
            let weights = Array(n).fill(1 / n);
            const stumps = [];
            const alphas = [];

            for (let m = 0; m < nEstimators; m++) {
                // Find best stump
                let bestFeature = features[0], bestThreshold = 0, bestError = Infinity;
                let bestPreds = [];

                features.forEach(feature => {
                    const values = train.map((r, i) => ({ val: parseFloat(r[feature]), idx: i }))
                        .filter(v => !isNaN(v.val))
                        .sort((a, b) => a.val - b.val);

                    for (let t = 0; t < values.length - 1; t++) {
                        const threshold = (values[t].val + values[t + 1].val) / 2;
                        const preds = train.map(r => parseFloat(r[feature]) <= threshold ? -1 : 1);
                        const error = preds.reduce((sum, p, i) => p !== y[i] ? sum + weights[i] : sum, 0);

                        if (error < bestError) {
                            bestError = error;
                            bestFeature = feature;
                            bestThreshold = threshold;
                            bestPreds = preds;
                        }
                        // Try flipped polarity
                        const predsFlip = preds.map(p => -p);
                        const errorFlip = predsFlip.reduce((sum, p, i) => p !== y[i] ? sum + weights[i] : sum, 0);
                        if (errorFlip < bestError) {
                            bestError = errorFlip;
                            bestFeature = feature;
                            bestThreshold = threshold;
                            bestPreds = predsFlip;
                        }
                    }
                });

                if (bestError >= 0.5) break;

                // Calculate alpha
                const alpha = learningRate * 0.5 * Math.log((1 - bestError) / (bestError + 1e-10));
                alphas.push(alpha);
                stumps.push({
                    feature: bestFeature,
                    threshold: bestThreshold,
                    polarity: bestPreds[0] === (parseFloat(train[0][bestFeature]) <= bestThreshold ? -1 : 1) ? 1 : -1
                });

                // Update weights
                const Z = weights.reduce((sum, w, i) => sum + w * Math.exp(-alpha * y[i] * bestPreds[i]), 0);
                weights = weights.map((w, i) => w * Math.exp(-alpha * y[i] * bestPreds[i]) / Z);
            }

            classifiers[cls] = { stumps, alphas };
        });

        // Prediction
        const predictProba = (row) => {
            const scores = {};
            classes.forEach(cls => {
                let score = 0;
                classifiers[cls].stumps.forEach((stump, i) => {
                    const pred = parseFloat(row[stump.feature]) <= stump.threshold ? -stump.polarity : stump.polarity;
                    score += classifiers[cls].alphas[i] * pred;
                });
                scores[cls] = 1 / (1 + Math.exp(-score)); // Convert to probability
            });
            return scores;
        };

        const predict = (row) => {
            const scores = predictProba(row);
            return Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
        };

        // Evaluate
        const predictions = test.map(row => {
            const scores = predictProba(row);
            probabilities.push({ actual: row[target], scores });
            return predict(row);
        });
        const actual = test.map(r => r[target]);
        const metrics = this.classificationMetrics(actual, predictions, classes);

        // Feature importance
        const featureCounts = {};
        features.forEach(f => featureCounts[f] = 0);
        classes.forEach(cls => {
            classifiers[cls].stumps.forEach((s, i) => {
                featureCounts[s.feature] += classifiers[cls].alphas[i];
            });
        });
        const totalAlpha = Object.values(featureCounts).reduce((a, b) => a + b, 0);
        const featureImportance = features.map(f => ({
            feature: f,
            importance: featureCounts[f] / (totalAlpha + 1e-10)
        })).sort((a, b) => b.importance - a.importance);

        return {
            method: 'AdaBoost',
            nEstimators,
            learningRate,
            trainSize: train.length,
            testSize: test.length,
            ...metrics,
            featureImportance,
            probabilities,
            model: { type: 'adaBoost', classifiers, features, target, classes }
        };
    },

    // Principal Component Analysis
    pcaAnalysis(data, config) {
        const { features, nComponents = 2 } = config;

        // Extract and center data
        const X = data.map(row => features.map(f => parseFloat(row[f]) || 0)).filter(r => r.every(v => !isNaN(v)));
        const n = X.length;
        if (n < 2) return null;

        // Calculate means
        const means = features.map((_, i) => this.mean(X.map(x => x[i])));

        // Center data
        const Xc = X.map(row => row.map((v, i) => v - means[i]));

        // Covariance matrix
        const d = features.length;
        const cov = [];
        for (let i = 0; i < d; i++) {
            cov[i] = [];
            for (let j = 0; j < d; j++) {
                let sum = 0;
                for (let k = 0; k < n; k++) {
                    sum += Xc[k][i] * Xc[k][j];
                }
                cov[i][j] = sum / (n - 1);
            }
        }

        // Power iteration to find principal components
        const components = [];
        const eigenvalues = [];
        let covTemp = cov.map(row => [...row]);

        for (let c = 0; c < Math.min(nComponents, d); c++) {
            // Power iteration for dominant eigenvalue
            let v = Array(d).fill(0).map(() => Math.random());
            let vNorm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
            v = v.map(x => x / vNorm);

            for (let iter = 0; iter < 100; iter++) {
                // v = covTemp * v
                const vNew = covTemp.map(row => row.reduce((s, val, j) => s + val * v[j], 0));
                vNorm = Math.sqrt(vNew.reduce((s, x) => s + x * x, 0));
                const vNormalized = vNew.map(x => x / (vNorm + 1e-10));

                // Check convergence
                const diff = v.reduce((s, x, i) => s + Math.abs(x - vNormalized[i]), 0);
                v = vNormalized;
                if (diff < 1e-8) break;
            }

            // Eigenvalue
            const Av = covTemp.map(row => row.reduce((s, val, j) => s + val * v[j], 0));
            const lambda = v.reduce((s, x, i) => s + x * Av[i], 0);

            components.push(v);
            eigenvalues.push(lambda);

            // Deflate
            for (let i = 0; i < d; i++) {
                for (let j = 0; j < d; j++) {
                    covTemp[i][j] -= lambda * v[i] * v[j];
                }
            }
        }

        // Transform data
        const transformed = Xc.map(row =>
            components.map(comp => row.reduce((s, v, i) => s + v * comp[i], 0))
        );

        // Explained variance
        const totalVar = eigenvalues.reduce((a, b) => a + Math.abs(b), 0) || 1;
        const explainedVarianceRatio = eigenvalues.map(e => Math.abs(e) / totalVar);
        const cumulativeVariance = explainedVarianceRatio.reduce((acc, v, i) => {
            const cumSum = (acc[i - 1] || 0) + v;
            acc.push(cumSum);
            return acc;
        }, []);

        // Add transformed data to original
        const transformedData = data.map((row, i) => {
            const newRow = { ...row };
            for (let c = 0; c < components.length; c++) {
                newRow[`PC${c + 1}`] = transformed[i] ? transformed[i][c] : 0;
            }
            return newRow;
        });

        return {
            method: 'PCA',
            nComponents: components.length,
            components: components.map((c, i) => ({
                name: `PC${i + 1}`,
                loadings: features.map((f, j) => ({ feature: f, loading: c[j] })),
                eigenvalue: eigenvalues[i],
                explainedVariance: explainedVarianceRatio[i]
            })),
            eigenvalues,
            explainedVarianceRatio,
            cumulativeVariance,
            data: transformedData,
            columns: [...Object.keys(data[0] || {}), ...components.map((_, i) => `PC${i + 1}`)]
        };
    },

    // ========================================
    // ML Visualization Helpers
    // ========================================

    // ROC Curve Calculation
    calculateROC(model) {
        if (!model.probabilities || !model.classes) return null;

        const positiveClass = model.classes[0];
        const results = model.probabilities.map(p => ({
            actual: p.actual === positiveClass ? 1 : 0,
            score: p.scores[positiveClass] || 0
        })).sort((a, b) => b.score - a.score);

        const n = results.length;
        const nPos = results.filter(r => r.actual === 1).length;
        const nNeg = n - nPos;

        const points = [{ fpr: 0, tpr: 0, threshold: 1 }];
        let tp = 0, fp = 0;

        for (const r of results) {
            if (r.actual === 1) tp++;
            else fp++;
            points.push({
                fpr: fp / nNeg,
                tpr: tp / nPos,
                threshold: r.score
            });
        }

        // Calculate AUC using trapezoidal rule
        let auc = 0;
        for (let i = 1; i < points.length; i++) {
            auc += (points[i].fpr - points[i - 1].fpr) * (points[i].tpr + points[i - 1].tpr) / 2;
        }

        return { points, auc, positiveClass };
    },

    // Precision-Recall Curve
    calculatePR(model) {
        if (!model.probabilities || !model.classes) return null;

        const positiveClass = model.classes[0];
        const results = model.probabilities.map(p => ({
            actual: p.actual === positiveClass ? 1 : 0,
            score: p.scores[positiveClass] || 0
        })).sort((a, b) => b.score - a.score);

        const n = results.length;
        const nPos = results.filter(r => r.actual === 1).length;

        const points = [];
        let tp = 0, fp = 0;

        for (const r of results) {
            if (r.actual === 1) tp++;
            else fp++;
            const precision = tp / (tp + fp);
            const recall = tp / nPos;
            points.push({ precision, recall, threshold: r.score });
        }

        // Calculate Average Precision
        let ap = 0, prevRecall = 0;
        for (const p of points) {
            ap += p.precision * (p.recall - prevRecall);
            prevRecall = p.recall;
        }

        return { points, averagePrecision: ap, positiveClass };
    },

    // Elbow Curve for K-Means
    calculateElbowCurve(data, config) {
        const { features, maxK = 10 } = config;
        const results = [];

        for (let k = 1; k <= maxK; k++) {
            const result = this.kMeansCluster(data, { k, features, maxIterations: 50 });
            if (result) {
                results.push({ k, inertia: result.inertia });
            }
        }

        return { points: results, features };
    },

    // ========================================
    // Data Preprocessing
    // ========================================

    // Standard Scaler - normalize to zero mean and unit variance
    standardScale(data, config) {
        const { features } = config;
        if (!features?.length) return null;

        // Calculate means and stds from data
        const stats = {};
        features.forEach(f => {
            const values = data.map(row => parseFloat(row[f])).filter(v => !isNaN(v));
            stats[f] = {
                mean: this.mean(values),
                std: this.std(values) || 1
            };
        });

        // Transform data
        const scaledData = data.map(row => {
            const newRow = { ...row };
            features.forEach(f => {
                const val = parseFloat(row[f]);
                if (!isNaN(val)) {
                    newRow[f] = (val - stats[f].mean) / stats[f].std;
                }
            });
            return newRow;
        });

        return {
            method: 'StandardScaler',
            features,
            stats,
            data: scaledData,
            columns: Object.keys(scaledData[0] || {})
        };
    },

    // Min-Max Scaler - scale to [0, 1] range
    minMaxScale(data, config) {
        const { features, minVal = 0, maxVal = 1 } = config;
        if (!features?.length) return null;

        // Calculate min and max from data
        const stats = {};
        features.forEach(f => {
            const values = data.map(row => parseFloat(row[f])).filter(v => !isNaN(v));
            stats[f] = {
                min: Math.min(...values),
                max: Math.max(...values)
            };
            stats[f].range = stats[f].max - stats[f].min || 1;
        });

        // Transform data
        const scaledData = data.map(row => {
            const newRow = { ...row };
            features.forEach(f => {
                const val = parseFloat(row[f]);
                if (!isNaN(val)) {
                    const scaled = (val - stats[f].min) / stats[f].range;
                    newRow[f] = scaled * (maxVal - minVal) + minVal;
                }
            });
            return newRow;
        });

        return {
            method: 'MinMaxScaler',
            features,
            stats,
            minVal,
            maxVal,
            data: scaledData,
            columns: Object.keys(scaledData[0] || {})
        };
    },

    // ========================================
    // Cross-Validation
    // ========================================

    // K-Fold Cross-Validation
    kFoldCV(data, config, trainFn) {
        const { k = 5, shuffle = true } = config;
        const n = data.length;

        // Shuffle data if requested
        let indices = Array.from({ length: n }, (_, i) => i);
        if (shuffle) {
            for (let i = n - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [indices[i], indices[j]] = [indices[j], indices[i]];
            }
        }

        const foldSize = Math.floor(n / k);
        const results = [];

        for (let fold = 0; fold < k; fold++) {
            // Split indices
            const testStart = fold * foldSize;
            const testEnd = fold === k - 1 ? n : (fold + 1) * foldSize;
            const testIndices = indices.slice(testStart, testEnd);
            const trainIndices = [...indices.slice(0, testStart), ...indices.slice(testEnd)];

            // Create train and test sets
            const trainData = trainIndices.map(i => data[i]);
            const testData = testIndices.map(i => data[i]);

            // Train model on this fold
            const result = trainFn(trainData, testData);
            if (result) {
                results.push({
                    fold: fold + 1,
                    trainSize: trainData.length,
                    testSize: testData.length,
                    ...result
                });
            }
        }

        // Aggregate results
        const accuracies = results.map(r => r.accuracy).filter(a => a !== undefined);
        const f1s = results.map(r => r.f1).filter(f => f !== undefined);

        return {
            method: 'K-Fold CV',
            k,
            folds: results,
            meanAccuracy: this.mean(accuracies),
            stdAccuracy: this.std(accuracies),
            meanF1: this.mean(f1s),
            stdF1: this.std(f1s)
        };
    },

    // Cross-validated training wrapper for any ML algorithm
    trainWithCV(data, config, algorithm) {
        const { cv = false, cvFolds = 5, trainRatio = 0.8 } = config;

        if (!cv) {
            // Regular train-test split
            return algorithm(data, config);
        }

        // K-Fold CV
        const trainFn = (trainData, testData) => {
            // Temporarily set trainRatio to 1 since we already split
            const cvConfig = { ...config, trainRatio: 1 };
            const combined = [...trainData];
            const result = algorithm(combined, cvConfig);

            if (!result || !result.model) return null;

            // Evaluate on test data
            const target = config.target;
            const classes = result.model.classes || result.classes || [];
            const features = config.features;

            const predictions = testData.map(row => {
                // Generic prediction based on model type
                if (result.model.type === 'knn') {
                    const x = features.map(f => parseFloat(row[f]) || 0);
                    const distances = trainData.map(trainRow => ({
                        label: trainRow[target],
                        distance: this.euclideanDistance(x, features.map(f => parseFloat(trainRow[f]) || 0))
                    }));
                    distances.sort((a, b) => a.distance - b.distance);
                    const votes = {};
                    distances.slice(0, config.k || 5).forEach(n => votes[n.label] = (votes[n.label] || 0) + 1);
                    return Object.keys(votes).reduce((a, b) => votes[a] > votes[b] ? a : b);
                }
                // Add more model types as needed
                return result.model.predict ? result.model.predict(row) : null;
            });

            const actual = testData.map(row => row[target]);
            const metrics = this.classificationMetrics(actual, predictions, classes);

            return metrics;
        };

        return this.kFoldCV(data, { k: cvFolds }, trainFn);
    },

    // ========================================
    // Model Comparison
    // ========================================

    // Compare multiple models on the same dataset
    compareModels(data, configs) {
        const results = [];

        configs.forEach(config => {
            const { name, algorithm, params } = config;
            try {
                const result = algorithm(data, params);
                if (result) {
                    results.push({
                        name,
                        accuracy: result.accuracy || 0,
                        precision: result.precision || 0,
                        recall: result.recall || 0,
                        f1: result.f1 || 0,
                        trainSize: result.trainSize || 0,
                        testSize: result.testSize || 0
                    });
                }
            } catch (e) {
                results.push({
                    name,
                    error: e.message,
                    accuracy: 0,
                    precision: 0,
                    recall: 0,
                    f1: 0
                });
            }
        });

        // Find best model
        const bestIdx = results.reduce((best, r, i) =>
            r.accuracy > results[best].accuracy ? i : best, 0);

        return {
            method: 'Model Comparison',
            models: results,
            best: results[bestIdx]?.name,
            bestAccuracy: results[bestIdx]?.accuracy
        };
    },

    // Calculate silhouette score for clustering
    silhouetteScore(data, labels, features) {
        const n = data.length;
        if (n < 2) return 0;

        const X = data.map(row => features.map(f => parseFloat(row[f]) || 0));
        const clusters = [...new Set(labels)];

        let totalScore = 0;
        let count = 0;

        for (let i = 0; i < n; i++) {
            const myCluster = labels[i];

            // a(i) = average distance to points in same cluster
            const sameCluster = [];
            for (let j = 0; j < n; j++) {
                if (i !== j && labels[j] === myCluster) {
                    sameCluster.push(this.euclideanDistance(X[i], X[j]));
                }
            }
            const a = sameCluster.length > 0 ? this.mean(sameCluster) : 0;

            // b(i) = min average distance to points in other clusters
            let b = Infinity;
            clusters.forEach(cls => {
                if (cls !== myCluster) {
                    const otherCluster = [];
                    for (let j = 0; j < n; j++) {
                        if (labels[j] === cls) {
                            otherCluster.push(this.euclideanDistance(X[i], X[j]));
                        }
                    }
                    if (otherCluster.length > 0) {
                        const avgDist = this.mean(otherCluster);
                        if (avgDist < b) b = avgDist;
                    }
                }
            });

            if (b === Infinity) b = 0;

            // Silhouette = (b - a) / max(a, b)
            const maxAB = Math.max(a, b);
            if (maxAB > 0) {
                totalScore += (b - a) / maxAB;
                count++;
            }
        }

        return count > 0 ? totalScore / count : 0;
    },

    // ========================================
    // Non-Parametric Tests
    // ========================================

    // Mann-Whitney U Test (Wilcoxon Rank-Sum Test)
    mannWhitneyU(sample1, sample2) {
        const n1 = sample1.length;
        const n2 = sample2.length;

        if (n1 < 2 || n2 < 2) {
            return { error: 'Each sample must have at least 2 observations' };
        }

        // Combine and rank
        const combined = [
            ...sample1.map((v, i) => ({ value: v, group: 1, index: i })),
            ...sample2.map((v, i) => ({ value: v, group: 2, index: i }))
        ];
        combined.sort((a, b) => a.value - b.value);

        // Assign ranks with tie handling
        const ranks = this.assignRanks(combined.map(c => c.value));
        combined.forEach((item, i) => item.rank = ranks[i]);

        // Sum of ranks for each group
        const R1 = combined.filter(c => c.group === 1).reduce((sum, c) => sum + c.rank, 0);
        const R2 = combined.filter(c => c.group === 2).reduce((sum, c) => sum + c.rank, 0);

        // U statistics
        const U1 = n1 * n2 + (n1 * (n1 + 1)) / 2 - R1;
        const U2 = n1 * n2 + (n2 * (n2 + 1)) / 2 - R2;
        const U = Math.min(U1, U2);

        // Z approximation for large samples
        const meanU = (n1 * n2) / 2;
        const stdU = Math.sqrt((n1 * n2 * (n1 + n2 + 1)) / 12);
        const z = stdU > 0 ? (U - meanU) / stdU : 0;
        const pValue = 2 * (1 - this.normalCDF(Math.abs(z)));

        // Effect size: r = Z / sqrt(N)
        const effectSizeR = Math.abs(z) / Math.sqrt(n1 + n2);

        return {
            U1, U2, U,
            R1, R2,
            z,
            pValue,
            significant: pValue < 0.05,
            n1, n2,
            mean1: this.mean(sample1),
            mean2: this.mean(sample2),
            median1: this.median(sample1),
            median2: this.median(sample2),
            effectSize: effectSizeR,
            effectInterpretation: effectSizeR < 0.1 ? 'negligible' : effectSizeR < 0.3 ? 'small' : effectSizeR < 0.5 ? 'medium' : 'large',
            conclusion: pValue < 0.05 ? 'Significant difference between groups' : 'No significant difference'
        };
    },

    // Wilcoxon Signed-Rank Test (for paired samples)
    wilcoxonSignedRank(sample1, sample2) {
        if (sample1.length !== sample2.length) {
            return { error: 'Samples must have equal length' };
        }

        const n = sample1.length;
        if (n < 5) {
            return { error: 'Minimum 5 pairs required' };
        }

        // Calculate differences
        const differences = [];
        for (let i = 0; i < n; i++) {
            const diff = sample1[i] - sample2[i];
            if (diff !== 0) {
                differences.push({ diff, absDiff: Math.abs(diff), sign: diff > 0 ? 1 : -1 });
            }
        }

        const nNonZero = differences.length;
        if (nNonZero < 5) {
            return { error: 'Minimum 5 non-zero differences required' };
        }

        // Sort by absolute difference and assign ranks
        differences.sort((a, b) => a.absDiff - b.absDiff);
        const absValues = differences.map(d => d.absDiff);
        const ranks = this.assignRanks(absValues);
        differences.forEach((d, i) => d.rank = ranks[i]);

        // Calculate signed ranks
        const Wplus = differences.filter(d => d.sign === 1).reduce((sum, d) => sum + d.rank, 0);
        const Wminus = differences.filter(d => d.sign === -1).reduce((sum, d) => sum + d.rank, 0);
        const W = Math.min(Wplus, Wminus);

        // Z approximation
        const meanW = (nNonZero * (nNonZero + 1)) / 4;
        const stdW = Math.sqrt((nNonZero * (nNonZero + 1) * (2 * nNonZero + 1)) / 24);
        const z = stdW > 0 ? (W - meanW) / stdW : 0;
        const pValue = 2 * (1 - this.normalCDF(Math.abs(z)));

        // Effect size
        const effectSizeR = Math.abs(z) / Math.sqrt(nNonZero);

        return {
            W, Wplus, Wminus,
            z,
            pValue,
            significant: pValue < 0.05,
            nPairs: n,
            nNonZero,
            meanDiff: this.mean(sample1.map((v, i) => v - sample2[i])),
            medianDiff: this.median(sample1.map((v, i) => v - sample2[i])),
            effectSize: effectSizeR,
            effectInterpretation: effectSizeR < 0.1 ? 'negligible' : effectSizeR < 0.3 ? 'small' : effectSizeR < 0.5 ? 'medium' : 'large',
            conclusion: pValue < 0.05 ? 'Significant difference between paired samples' : 'No significant difference'
        };
    },

    // Kruskal-Wallis H Test (non-parametric ANOVA)
    kruskalWallis(data, groupColumn, valueColumn) {
        // Group the data
        const groups = {};
        data.forEach(row => {
            const g = row[groupColumn];
            const v = parseFloat(row[valueColumn]);
            if (g != null && !isNaN(v)) {
                if (!groups[g]) groups[g] = [];
                groups[g].push(v);
            }
        });

        const groupNames = Object.keys(groups);
        const k = groupNames.length;

        if (k < 2) {
            return { error: 'At least 2 groups required' };
        }

        // Check sample sizes
        for (const g of groupNames) {
            if (groups[g].length < 2) {
                return { error: `Group "${g}" must have at least 2 observations` };
            }
        }

        // Combine all values and rank
        const combined = [];
        groupNames.forEach(g => {
            groups[g].forEach(v => combined.push({ value: v, group: g }));
        });
        combined.sort((a, b) => a.value - b.value);

        const ranks = this.assignRanks(combined.map(c => c.value));
        combined.forEach((item, i) => item.rank = ranks[i]);

        // Calculate rank sums and group stats
        const N = combined.length;
        const groupStats = {};
        let sumRankSqOverN = 0;

        groupNames.forEach(g => {
            const groupRanks = combined.filter(c => c.group === g).map(c => c.rank);
            const ni = groupRanks.length;
            const Ri = groupRanks.reduce((a, b) => a + b, 0);
            sumRankSqOverN += (Ri * Ri) / ni;
            groupStats[g] = {
                n: ni,
                rankSum: Ri,
                meanRank: Ri / ni,
                median: this.median(groups[g]),
                mean: this.mean(groups[g])
            };
        });

        // H statistic
        const H = ((12 / (N * (N + 1))) * sumRankSqOverN) - 3 * (N + 1);
        const df = k - 1;

        // P-value using chi-square approximation
        const pValue = 1 - this.chiSquareCDF(H, df);

        // Effect size: eta-squared
        const etaSquared = (H - k + 1) / (N - k);

        return {
            H,
            df,
            pValue,
            significant: pValue < 0.05,
            k,
            N,
            groupStats,
            etaSquared: Math.max(0, etaSquared),
            effectInterpretation: etaSquared < 0.01 ? 'negligible' : etaSquared < 0.06 ? 'small' : etaSquared < 0.14 ? 'medium' : 'large',
            conclusion: pValue < 0.05 ? 'Significant difference between groups' : 'No significant difference'
        };
    },

    // Friedman Test (non-parametric repeated measures ANOVA)
    friedmanTest(data, subjectColumn, conditionColumn, valueColumn) {
        // Organize data by subject and condition
        const subjects = {};
        data.forEach(row => {
            const subj = row[subjectColumn];
            const cond = row[conditionColumn];
            const val = parseFloat(row[valueColumn]);
            if (subj != null && cond != null && !isNaN(val)) {
                if (!subjects[subj]) subjects[subj] = {};
                subjects[subj][cond] = val;
            }
        });

        const subjectIds = Object.keys(subjects);
        const conditions = [...new Set(data.map(d => d[conditionColumn]).filter(c => c != null))];
        const n = subjectIds.length;
        const k = conditions.length;

        if (n < 2) return { error: 'At least 2 subjects required' };
        if (k < 2) return { error: 'At least 2 conditions required' };

        // Verify complete data
        for (const subj of subjectIds) {
            if (Object.keys(subjects[subj]).length !== k) {
                return { error: `Incomplete data for subject "${subj}"` };
            }
        }

        // Rank within each subject
        const rankSums = {};
        conditions.forEach(c => rankSums[c] = 0);

        subjectIds.forEach(subj => {
            const values = conditions.map(c => ({ cond: c, value: subjects[subj][c] }));
            values.sort((a, b) => a.value - b.value);
            const ranks = this.assignRanks(values.map(v => v.value));
            values.forEach((v, i) => {
                rankSums[v.cond] += ranks[i];
            });
        });

        // Calculate chi-square statistic
        let sumRankSq = 0;
        conditions.forEach(c => {
            sumRankSq += Math.pow(rankSums[c], 2);
        });

        const chiSquare = (12 / (n * k * (k + 1))) * sumRankSq - 3 * n * (k + 1);
        const df = k - 1;
        const pValue = 1 - this.chiSquareCDF(chiSquare, df);

        // Kendall's W (coefficient of concordance)
        const W = chiSquare / (n * (k - 1));

        // Condition statistics
        const conditionStats = {};
        conditions.forEach(c => {
            const vals = subjectIds.map(s => subjects[s][c]);
            conditionStats[c] = {
                n: vals.length,
                rankSum: rankSums[c],
                meanRank: rankSums[c] / n,
                median: this.median(vals),
                mean: this.mean(vals)
            };
        });

        return {
            chiSquare,
            df,
            pValue,
            significant: pValue < 0.05,
            kendallW: W,
            nSubjects: n,
            nConditions: k,
            conditionStats,
            conclusion: pValue < 0.05 ? 'Significant difference between conditions' : 'No significant difference'
        };
    },

    // Chi-Square Test for Independence
    chiSquareTest(data, var1Column, var2Column) {
        // Build contingency table
        const contingency = {};
        const rowTotals = {};
        const colTotals = {};
        let grandTotal = 0;

        data.forEach(row => {
            const r = String(row[var1Column]);
            const c = String(row[var2Column]);
            if (r && c && r !== 'undefined' && c !== 'undefined') {
                if (!contingency[r]) contingency[r] = {};
                if (!contingency[r][c]) contingency[r][c] = 0;
                contingency[r][c]++;

                if (!rowTotals[r]) rowTotals[r] = 0;
                rowTotals[r]++;

                if (!colTotals[c]) colTotals[c] = 0;
                colTotals[c]++;

                grandTotal++;
            }
        });

        const rows = Object.keys(contingency);
        const cols = Object.keys(colTotals);
        const nRows = rows.length;
        const nCols = cols.length;

        if (nRows < 2 || nCols < 2) {
            return { error: 'Each variable must have at least 2 categories' };
        }

        // Calculate expected frequencies and chi-square
        let chiSquare = 0;
        const expectedTable = {};
        const observedTable = {};

        rows.forEach(r => {
            expectedTable[r] = {};
            observedTable[r] = {};
            cols.forEach(c => {
                const observed = contingency[r]?.[c] || 0;
                const expected = (rowTotals[r] * colTotals[c]) / grandTotal;
                expectedTable[r][c] = expected;
                observedTable[r][c] = observed;
                if (expected > 0) {
                    chiSquare += Math.pow(observed - expected, 2) / expected;
                }
            });
        });

        const df = (nRows - 1) * (nCols - 1);
        const pValue = 1 - this.chiSquareCDF(chiSquare, df);

        // Effect sizes
        const phi = Math.sqrt(chiSquare / grandTotal);
        const cramersV = Math.sqrt(chiSquare / (grandTotal * (Math.min(nRows, nCols) - 1)));

        return {
            chiSquare,
            df,
            pValue,
            significant: pValue < 0.05,
            nRows, nCols,
            N: grandTotal,
            phi,
            cramersV,
            effectInterpretation: cramersV < 0.1 ? 'negligible' : cramersV < 0.3 ? 'small' : cramersV < 0.5 ? 'medium' : 'large',
            observedTable,
            expectedTable,
            rowTotals,
            colTotals,
            rowLabels: rows,
            colLabels: cols,
            conclusion: pValue < 0.05 ? 'Significant association between variables' : 'No significant association'
        };
    },

    // Spearman's Rank Correlation
    spearmanCorrelation(x, y) {
        const n = Math.min(x.length, y.length);

        if (n < 3) {
            return { error: 'Minimum 3 data points required' };
        }

        // Create paired data and rank each variable
        const xRanks = this.assignRanks(x.slice(0, n));
        const yRanks = this.assignRanks(y.slice(0, n));

        // Calculate Spearman's rho using Pearson on ranks
        let sumD2 = 0;
        for (let i = 0; i < n; i++) {
            sumD2 += Math.pow(xRanks[i] - yRanks[i], 2);
        }

        // If no ties, use simplified formula
        const rho = 1 - (6 * sumD2) / (n * (n * n - 1));

        // T-test for significance
        const t = rho * Math.sqrt((n - 2) / (1 - rho * rho));
        const df = n - 2;
        const pValue = 2 * (1 - this.tCDF(Math.abs(t), df));

        return {
            rho,
            n,
            t,
            df,
            pValue,
            significant: pValue < 0.05,
            interpretation: Math.abs(rho) < 0.1 ? 'negligible' :
                Math.abs(rho) < 0.3 ? 'weak' :
                    Math.abs(rho) < 0.5 ? 'moderate' :
                        Math.abs(rho) < 0.7 ? 'strong' : 'very strong',
            direction: rho > 0 ? 'positive' : rho < 0 ? 'negative' : 'none',
            conclusion: pValue < 0.05 ?
                `Significant ${rho > 0 ? 'positive' : 'negative'} correlation` :
                'No significant correlation'
        };
    },

    // Helper: Assign ranks with tie handling (average rank method)
    assignRanks(values) {
        const indexed = values.map((v, i) => ({ value: v, index: i }));
        indexed.sort((a, b) => a.value - b.value);

        const ranks = new Array(values.length);
        let i = 0;
        while (i < indexed.length) {
            let j = i;
            // Find ties
            while (j < indexed.length && indexed[j].value === indexed[i].value) {
                j++;
            }
            // Average rank for ties
            const avgRank = (i + j + 1) / 2;
            for (let k = i; k < j; k++) {
                ranks[indexed[k].index] = avgRank;
            }
            i = j;
        }
        return ranks;
    },

    // Chi-Square CDF approximation
    chiSquareCDF(x, df) {
        if (x <= 0 || df <= 0) return 0;
        return this.gammaCDF(x / 2, df / 2);
    },

    // Gamma CDF (lower incomplete gamma function / gamma function)
    gammaCDF(x, a) {
        if (x <= 0) return 0;
        if (a <= 0) return 0;

        // Use series expansion for small x
        const EPSILON = 1e-10;
        const MAX_ITER = 100;

        let sum = 0;
        let term = 1 / a;
        sum = term;

        for (let n = 1; n < MAX_ITER; n++) {
            term *= x / (a + n);
            sum += term;
            if (Math.abs(term) < EPSILON) break;
        }

        return sum * Math.exp(-x + a * Math.log(x) - this.logGamma(a));
    }
};
