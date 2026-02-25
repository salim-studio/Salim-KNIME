/* Salim-KNIME - i18n */
const i18n = {
    ar: {
        newWorkflow: 'جديد', open: 'فتح', save: 'حفظ', executeAll: 'تنفيذ الكل',
        nodePalette: 'لوحة العقد', search: 'بحث...',
        ioNodes: 'الإدخال/الإخراج', processingNodes: 'معالجة البيانات',
        statisticsNodes: 'التحليل الإحصائي', visualizationNodes: 'التصور البياني',
        excelReader: 'قارئ Excel', csvReader: 'قارئ CSV', tableView: 'عرض الجدول', excelWriter: 'كاتب Excel',
        columnFilter: 'تصفية الأعمدة', rowFilter: 'تصفية الصفوف', sorter: 'الترتيب', missingValue: 'القيم المفقودة',
        descriptiveStats: 'الإحصاء الوصفي', correlation: 'الارتباط', linearRegression: 'الانحدار الخطي', tTest: 'اختبار T',
        multipleRegression: 'الانحدار المتعدد', instruments: 'المتغيرات الآلية', estimationMethod: 'طريقة التقدير',
        methodOLS: 'المربعات الصغرى العادية (OLS)', methodGLS: 'المربعات الصغرى المعممة (GLS)',
        method2SLS: 'المربعات الصغرى ذات المرحلتين (2SLS)', methodGMM: 'طريقة العزوم المعممة (GMM)', methodLIML: 'الإمكانية العظمى المحدودة (LIML)',
        scatterPlot: 'مخطط التشتت', lineChart: 'المخطط الخطي', barChart: 'المخطط الشريطي', histogram: 'المدرج التكراري', pieChart: 'المخطط الدائري',
        properties: 'الخصائص', selectNode: 'حدد عقدة لعرض خصائصها', nodeSettings: 'إعدادات العقدة', nodeName: 'اسم العقدة',
        welcomeTitle: 'مرحباً بك في Salim-KNIME', welcomeMessage: 'اسحب العقد من اللوحة الجانبية لبدء بناء سير العمل',
        execute: 'تنفيذ', configure: 'تكوين', delete: 'حذف', export: 'تصدير',
        notExecuted: 'غير منفذ', executing: 'جاري التنفيذ...', executed: 'تم التنفيذ', error: 'خطأ',
        selectFile: 'اختر ملف', noFileSelected: 'لم يتم اختيار ملف',
        count: 'العدد', mean: 'المتوسط', median: 'الوسيط', mode: 'المنوال', std: 'الانحراف المعياري',
        variance: 'التباين', min: 'الحد الأدنى', max: 'الحد الأقصى', range: 'المدى', sum: 'المجموع',
        coefficient: 'المعامل', intercept: 'الثابت', rSquared: 'R²', pValue: 'القيمة P',
        confirmDelete: 'هل تريد حذف هذه العقدة؟', workflowSaved: 'تم الحفظ', noData: 'لا توجد بيانات',
        selectColumns: 'اختر الأعمدة', dependentVar: 'المتغير التابع', independentVars: 'المتغيرات المستقلة',
        xAxis: 'المحور X', yAxis: 'المحور Y',
        // Diagnostics
        durbinWatson: 'داربن واتسون', fStatistic: 'إحصائية F', adjRSquared: 'R² المعدل',
        modelSignificant: 'النموذج معنوي', yes: 'نعم', no: 'لا',
        stdError: 'الخطأ المعياري', tStat: 'إحصائية t', significant: 'معنوي',
        equation: 'معادلة الانحدار',
        // Model Diagnostics
        modelDiagnostics: 'تشخيص النموذج', test: 'الاختبار',
        jarqueBera: 'جارك-بيرا', normalResiduals: 'البواقي طبيعية', nonNormalResiduals: 'البواقي غير طبيعية',
        serialCorrelation: 'الارتباط التسلسلي', hasSerialCorrelation: 'يوجد ارتباط تسلسلي', noSerialCorrelation: 'لا يوجد ارتباط تسلسلي',
        heteroskedasticity: 'عدم تجانس التباين', hasHeteroskedasticity: 'يوجد عدم تجانس', homoskedastic: 'التباين متجانس',
        diagnosticTests: 'اختبارات التشخيص',
        cusumTest: 'اختبار CUSUM', cusumStable: 'مستقر', cusumUnstable: 'غير مستقر (كسر هيكلي)',
        ramseyReset: 'اختبار رامسي', correctSpecification: 'الشكل صحيح', misspecification: 'خطأ في الشكل',
        // Transformations
        transformation: 'التحويل', differencing: 'الفروقات', arOrder: 'رتبة AR', maOrder: 'رتبة MA',
        transformNone: 'بدون', transformLog: 'لوغاريتم طبيعي', transformLog10: 'لوغاريتم 10',
        transformSqrt: 'الجذر التربيعي', transformSquare: 'التربيع', transformInverse: 'المقلوب',
        transformExp: 'الأسي', transformCube: 'التكعيب', transformCbrt: 'الجذر التكعيبي',
        diff0: 'بدون', diff1: 'فرق أول', diff2: 'فرق ثاني',
        // ARDL
        ardl: 'تحليل ARDL', boundsTest: 'اختبار الحدود', longRunCoef: 'معاملات المدى الطويل',
        shortRunCoef: 'معاملات المدى القصير', ecm: 'معامل تصحيح الخطأ', speedOfAdjustment: 'سرعة التعديل',
        maxLag: 'أقصى تأخير', lagOrder: 'رتبة التأخير', yLag: 'تأخير Y', xLag: 'تأخير X',
        criterion: 'معيار الاختيار', includeConstant: 'تضمين الثابت', includeTrend: 'تضمين الاتجاه',
        criticalValues: 'القيم الحرجة', lowerBound: 'الحد الأدنى', upperBound: 'الحد الأعلى',
        cointegration: 'التكامل المشترك', cointegrationExists: 'يوجد تكامل مشترك',
        noCointegration: 'لا يوجد تكامل مشترك', inconclusive: 'غير حاسم',
        stableAdjustment: 'تعديل مستقر', unstableAdjustment: 'تعديل غير مستقر',
        // VAR/VECM
        varVecm: 'تحليل VAR/VECM', var: 'نموذج VAR', vecm: 'نموذج VECM',
        johansenTest: 'اختبار جوهانسن', grangerCausality: 'سببية غرانجر',
        endogenousVars: 'المتغيرات الداخلية', traceTest: 'اختبار الأثر', maxEigenTest: 'اختبار القيمة الذاتية العظمى',
        eigenvalues: 'القيم الذاتية', cointegrationRank: 'رتبة التكامل المشترك',
        adjustmentCoef: 'معاملات التعديل', varEquation: 'معادلة VAR',
        informationCriteria: 'معايير المعلومات', residualCovariance: 'مصفوفة تباين البواقي',
        causesGranger: 'يسبب بحسب غرانجر', doesNotCauseGranger: 'لا يسبب بحسب غرانجر',
        // Stationarity Test
        stationarityTest: 'اختبار الاستقرارية', adfTest: 'اختبار ديكي-فولر الموسع', kpssTest: 'اختبار KPSS',
        ppTest: 'اختبار فيليبس-بيرون', unitRoot: 'جذر الوحدة', stationary: 'مستقر',
        nonStationary: 'غير مستقر', trendOption: 'خيار الاتجاه', trendNone: 'بدون', trendConstant: 'ثابت فقط',
        trendConstantTrend: 'ثابت واتجاه', criticalValue: 'القيمة الحرجة', testStatistic: 'إحصائية الاختبار',
        usedLag: 'التأخير المستخدم', hypothesis: 'الفرضية', selectVariable: 'اختر المتغير',
        conclusion: 'الاستنتاج', likelyStationary: 'غالباً مستقر', likelyNonStationary: 'غالباً غير مستقر', inconclusive: 'غير حاسم',
        // Panel Data
        panelData: 'تحليل بانل', fixedEffects: 'الآثار الثابتة', randomEffects: 'الآثار العشوائية', pooledOLS: 'OLS المجمع',
        entityColumn: 'عمود الوحدات', timeColumn: 'عمود الزمن', hausmanTest: 'اختبار هاوسمان',
        runAllModels: 'تشغيل جميع النماذج', bestModel: 'أفضل نموذج', withinEstimator: 'مقدر داخل الوحدات',
        betweenEstimator: 'مقدر بين الوحدات', rho: 'نسبة التباين', theta: 'ثيتا',
        nObs: 'عدد المشاهدات', nEntities: 'عدد الوحدات', nPeriods: 'عدد الفترات',
        // Machine Learning
        mlNodes: 'تعلم الآلة', dlNodes: 'التعلم العميق',
        knn: 'K-أقرب جيران', decisionTree: 'شجرة القرار', randomForest: 'الغابة العشوائية',
        logisticRegression: 'الانحدار اللوجستي', kMeans: 'تجميع K-Means', naiveBayes: 'بايز البسيط',
        neuralNetwork: 'الشبكة العصبية', modelPredictor: 'المتنبئ',
        kNeighbors: 'عدد الجيران (K)', targetColumn: 'عمود الهدف', featureColumns: 'أعمدة المميزات',
        trainRatio: 'نسبة التدريب', maxDepth: 'أقصى عمق', minSamples: 'أقل عينات للتقسيم',
        nTrees: 'عدد الأشجار', nClusters: 'عدد المجموعات', maxIterations: 'أقصى تكرارات',
        learningRate: 'معدل التعلم', epochs: 'عدد الدورات', hiddenLayers: 'الطبقات المخفية',
        activation: 'دالة التنشيط', accuracy: 'الدقة', precision: 'الضبط', recall: 'الاستدعاء',
        f1Score: 'F1 درجة', confusionMatrix: 'مصفوفة الارتباك', trainModel: 'تدريب النموذج',
        testAccuracy: 'دقة الاختبار', trainAccuracy: 'دقة التدريب', clusterCenters: 'مراكز المجموعات',
        inertia: 'الجمود', silhouetteScore: 'معامل الصورة الظلية', predictedLabel: 'التصنيف المتوقع',
        trainingHistory: 'سجل التدريب', lossFunction: 'دالة الخسارة', optimizer: 'المحسن',
        // Advanced ML Nodes
        svm: 'آلة المتجه الداعم', gradientBoosting: 'التعزيز التدريجي', adaBoost: 'أدابوست', pca: 'تحليل المكونات الرئيسية',
        kernel: 'النواة', regularization: 'التنظيم', gamma: 'جاما', nEstimators: 'عدد المقدرات', nComponents: 'عدد المكونات',
        // ML Visualization Nodes
        mlVizNodes: 'رسوم تعلم الآلة', rocCurve: 'منحنى ROC', prCurve: 'منحنى الدقة-الاستدعاء',
        learningCurve: 'منحنى التعلم', featureImportance: 'أهمية المميزات', elbowCurve: 'منحنى الكوع',
        confusionHeatmap: 'خريطة حرارية للارتباك', maxK: 'أقصى K', connectModelToVisualize: 'اربط نموذج للتصور',
        pcaComponents: 'مكونات PCA', component: 'المكون', eigenvalue: 'القيمة الذاتية',
        explainedVariance: 'التباين المفسر', cumulative: 'التراكمي', featureLoadings: 'تحميلات المميزات',
        feature: 'المميز', importance: 'الأهمية', actual: 'الفعلي', predicted: 'المتوقع', components: 'مكونات',
        // Data Preprocessing
        standardScaler: 'التوحيد القياسي', minMaxScaler: 'تحجيم Min-Max', selectFeaturesToScale: 'اختر المميزات للتحجيم',
        scalingStats: 'إحصائيات التحجيم', originalMean: 'المتوسط الأصلي', originalStd: 'الانحراف المعياري الأصلي',
        originalMin: 'الحد الأدنى الأصلي', originalMax: 'الحد الأقصى الأصلي', minValue: 'القيمة الصغرى', maxValue: 'القيمة الكبرى',
        crossValidation: 'التحقق المتقاطع', cvFolds: 'عدد الطيات', useCrossValidation: 'استخدام التحقق المتقاطع',
        meanCVAccuracy: 'متوسط دقة CV', stdCVAccuracy: 'انحراف دقة CV',
        // Views Nodes
        viewsNodes: 'العروض', imageView: 'عرض الصور', textView: 'عرض النص', statisticsView: 'عرض الإحصائيات',
        tileView: 'عرض البلاط', boxPlot: 'مخطط الصندوق', heatmap: 'الخريطة الحرارية', areaChart: 'مخطط المساحة', radarChart: 'مخطط الرادار',
        imageColumn: 'عمود الصور', textColumn: 'عمود النص', titleColumn: 'عمود العنوان', valueColumn: 'عمود القيمة', valueColumns: 'أعمدة القيم',
        maxWidth: 'أقصى عرض', maxHeight: 'أقصى ارتفاع', fontSize: 'حجم الخط', maxLines: 'أقصى سطور', maxTiles: 'أقصى بلاطات', maxRows: 'أقصى صفوف',
        tileColor: 'لون البلاط', colorScheme: 'نظام الألوان', redBlue: 'أحمر-أزرق', greenRed: 'أخضر-أحمر', yellowPurple: 'أصفر-بنفسجي',
        fill: 'تعبئة', stacked: 'مكدس', multiple: 'متعدد', stdDev: 'الانحراف المعياري',
        noImages: 'لا توجد صور', noText: 'لا يوجد نص', noStats: 'لا توجد إحصائيات', labelColumn: 'عمود التسميات',
        // Statistical Tests (T-Tests, ANOVA, ANCOVA)
        independentTTest: 'اختبار T للعينات المستقلة', pairedTTest: 'اختبار T للعينات المزدوجة',
        twoWayAnova: 'تحليل التباين الثنائي', ancova: 'تحليل التباين المشترك',
        groupColumn: 'عمود المجموعات', equalVariances: 'افتراض تجانس التباين', unequalVariances: 'تباين غير متجانس',
        sample1: 'العينة الأولى', sample2: 'العينة الثانية', factor1: 'العامل الأول', factor2: 'العامل الثاني',
        covariate: 'المتغير المصاحب',
        independentTTestInfo: 'مقارنة متوسطات مجموعتين مستقلتين', pairedTTestInfo: 'مقارنة متوسطات نفس العينة في وقتين مختلفين',
        twoWayAnovaInfo: 'تحليل تأثير عاملين على المتغير التابع', ancovaInfo: 'تحليل التباين مع ضبط متغير مصاحب',
        testType: 'نوع الاختبار', studentTTest: 'اختبار ستودنت', welchTTest: 'اختبار ويلش',
        groupStatistics: 'إحصائيات المجموعات', testResults: 'نتائج الاختبار',
        meanDifference: 'فرق المتوسطات', degreesOfFreedom: 'درجات الحرية', standardError: 'الخطأ المعياري',
        cohensD: 'حجم الأثر (d)', ci95: 'فاصل الثقة 95%', levenesTest: 'اختبار ليفين',
        sampleStatistics: 'إحصائيات العينات', pairedDifferences: 'الفروقات المزدوجة', pairs: 'الأزواج',
        anovaTable: 'جدول ANOVA', ancovaTable: 'جدول ANCOVA', source: 'المصدر', interaction: 'التفاعل',
        grandMean: 'المتوسط العام', significanceTest: 'اختبار المعنوية', notSignificant: 'غير معنوي',
        adjustedMeans: 'المتوسطات المعدلة', observedMean: 'المتوسط الملاحظ', adjustedMean: 'المتوسط المعدل',
        covariateSlope: 'ميل المتغير المصاحب', conclusions: 'الاستنتاجات',
        groupEffect: 'تأثير المجموعات', covariateEffect: 'تأثير المتغير المصاحب',
        negligible: 'مهمل', small: 'صغير', medium: 'متوسط', large: 'كبير',
        statistic: 'الإحصائية', value: 'القيمة', group: 'المجموعة', sample: 'العينة',
        total: 'الإجمالي', correlation: 'الارتباط',
        // Non-Parametric Tests
        nonParametricTests: 'الاختبارات اللامعلمية', dataEntry: 'إدخال البيانات',
        mannWhitneyU: 'اختبار مان-ويتني U', wilcoxonSignedRank: 'اختبار ويلكوكسون',
        kruskalWallis: 'اختبار كروسكال-واليس', friedmanTest: 'اختبار فريدمان',
        chiSquareTest: 'اختبار كاي تربيع', spearmanCorrelation: 'ارتباط سبيرمان',
        uStatistic: 'إحصائية U', zScore: 'قيمة Z', rankSum: 'مجموع الرتب', effectSize: 'حجم الأثر',
        wStatistic: 'إحصائية W', wPlus: 'W+', wMinus: 'W-', nonZeroPairs: 'أزواج غير صفرية',
        hStatistic: 'إحصائية H', chiSquareStatistic: 'إحصائية كاي تربيع', meanRank: 'متوسط الرتب',
        kendallW: 'معامل كيندال W', nSubjects: 'عدد الأفراد', nConditions: 'عدد الحالات',
        phi: 'معامل فاي', cramersV: "معامل كرامر V", contingencyTable: 'جدول التوافق',
        observedFreq: 'التكرارات الملاحظة', expectedFreq: 'التكرارات المتوقعة',
        rho: 'معامل رو', spearmanRho: 'سبيرمان رو', rankCorrelation: 'ارتباط الرتب',
        mannWhitneyInfo: 'بديل لامعلمي لاختبار T للعينات المستقلة',
        wilcoxonInfo: 'بديل لامعلمي لاختبار T للعينات المزدوجة',
        kruskalWallisInfo: 'بديل لامعلمي لتحليل التباين الأحادي',
        friedmanInfo: 'بديل لامعلمي لتحليل التباين للقياسات المتكررة',
        chiSquareInfo: 'اختبار الاستقلال بين المتغيرات التصنيفية',
        spearmanInfo: 'معامل ارتباط الرتب اللامعلمي',
        subjectColumn: 'عمود الأفراد', conditionColumn: 'عمود الحالات',
        variable1: 'المتغير الأول', variable2: 'المتغير الثاني',
        editData: 'تحرير البيانات', separateByComma: 'افصل الأعمدة بفاصلة',
        positive: 'موجب', negative: 'سالب', weak: 'ضعيف', moderate: 'متوسط', strong: 'قوي', veryStrong: 'قوي جداً',
        importFile: 'استيراد ملف', addColumn: 'إضافة عمود', addRow: 'إضافة صف', clearAll: 'مسح الكل',
        maxRows: 'الصفوف'
    },
    en: {
        newWorkflow: 'New', open: 'Open', save: 'Save', executeAll: 'Execute All',
        nodePalette: 'Node Palette', search: 'Search...',
        ioNodes: 'I/O', processingNodes: 'Data Processing', statisticsNodes: 'Statistics', visualizationNodes: 'Visualization',
        excelReader: 'Excel Reader', csvReader: 'CSV Reader', tableView: 'Table View', excelWriter: 'Excel Writer',
        columnFilter: 'Column Filter', rowFilter: 'Row Filter', sorter: 'Sorter', missingValue: 'Missing Value',
        descriptiveStats: 'Descriptive Stats', correlation: 'Correlation', linearRegression: 'Linear Regression', tTest: 'T-Test',
        multipleRegression: 'Multiple Regression', instruments: 'Instruments', estimationMethod: 'Estimation Method',
        methodOLS: 'Ordinary Least Squares (OLS)', methodGLS: 'Generalized Least Squares (GLS)',
        method2SLS: 'Two-Stage Least Squares (2SLS)', methodGMM: 'Generalized Method of Moments (GMM)', methodLIML: 'Limited Info Maximum Likelihood (LIML)',
        scatterPlot: 'Scatter Plot', lineChart: 'Line Chart', barChart: 'Bar Chart', histogram: 'Histogram', pieChart: 'Pie Chart',
        properties: 'Properties', selectNode: 'Select a node', nodeSettings: 'Node Settings', nodeName: 'Node Name',
        welcomeTitle: 'Welcome to Salim-KNIME', welcomeMessage: 'Drag nodes from sidebar to build workflow',
        execute: 'Execute', configure: 'Configure', delete: 'Delete', export: 'Export',
        notExecuted: 'Not Executed', executing: 'Executing...', executed: 'Executed', error: 'Error',
        selectFile: 'Select File', noFileSelected: 'No file selected',
        count: 'Count', mean: 'Mean', median: 'Median', mode: 'Mode', std: 'Std. Dev.',
        variance: 'Variance', min: 'Min', max: 'Max', range: 'Range', sum: 'Sum',
        coefficient: 'Coefficient', intercept: 'Intercept', rSquared: 'R²', pValue: 'P-Value',
        confirmDelete: 'Delete this node?', workflowSaved: 'Saved', noData: 'No data',
        selectColumns: 'Select Columns', dependentVar: 'Dependent Variable', independentVars: 'Independent Variables',
        xAxis: 'X-Axis', yAxis: 'Y-Axis',
        // Diagnostics
        durbinWatson: 'Durbin-Watson', fStatistic: 'F-Statistic', adjRSquared: 'Adj. R²',
        modelSignificant: 'Model Significant', yes: 'Yes', no: 'No',
        stdError: 'Std. Error', tStat: 't-Stat', significant: 'Significant',
        equation: 'Regression Equation',
        // Model Diagnostics
        modelDiagnostics: 'Model Diagnostics', test: 'Test',
        jarqueBera: 'Jarque-Bera', normalResiduals: 'Normal Residuals', nonNormalResiduals: 'Non-Normal Residuals',
        serialCorrelation: 'Serial Correlation', hasSerialCorrelation: 'Serial Correlation Detected', noSerialCorrelation: 'No Serial Correlation',
        heteroskedasticity: 'Heteroskedasticity', hasHeteroskedasticity: 'Heteroskedasticity Detected', homoskedastic: 'Homoskedastic',
        diagnosticTests: 'Diagnostic Tests',
        cusumTest: 'CUSUM Test', cusumStable: 'Stable', cusumUnstable: 'Unstable (Structural Break)',
        ramseyReset: 'Ramsey RESET', correctSpecification: 'Correct Specification', misspecification: 'Misspecification',
        // Transformations
        transformation: 'Transformation', differencing: 'Differencing', arOrder: 'AR Order', maOrder: 'MA Order',
        transformNone: 'None', transformLog: 'Natural Log', transformLog10: 'Log₁₀',
        transformSqrt: 'Square Root', transformSquare: 'Square', transformInverse: 'Inverse',
        transformExp: 'Exponential', transformCube: 'Cube', transformCbrt: 'Cube Root',
        diff0: 'None', diff1: '1st Diff', diff2: '2nd Diff',
        // ARDL
        ardl: 'ARDL Analysis', boundsTest: 'Bounds Test', longRunCoef: 'Long-Run Coefficients',
        shortRunCoef: 'Short-Run Coefficients', ecm: 'Error Correction Term', speedOfAdjustment: 'Speed of Adjustment',
        maxLag: 'Max Lag', lagOrder: 'Lag Order', yLag: 'Y Lag', xLag: 'X Lag',
        criterion: 'Selection Criterion', includeConstant: 'Include Constant', includeTrend: 'Include Trend',
        criticalValues: 'Critical Values', lowerBound: 'Lower Bound', upperBound: 'Upper Bound',
        cointegration: 'Cointegration', cointegrationExists: 'Cointegration Exists',
        noCointegration: 'No Cointegration', inconclusive: 'Inconclusive',
        stableAdjustment: 'Stable Adjustment', unstableAdjustment: 'Unstable Adjustment',
        // VAR/VECM
        varVecm: 'VAR/VECM Analysis', var: 'VAR Model', vecm: 'VECM Model',
        johansenTest: 'Johansen Test', grangerCausality: 'Granger Causality',
        endogenousVars: 'Endogenous Variables', traceTest: 'Trace Test', maxEigenTest: 'Max Eigenvalue Test',
        eigenvalues: 'Eigenvalues', cointegrationRank: 'Cointegration Rank',
        adjustmentCoef: 'Adjustment Coefficients', varEquation: 'VAR Equation',
        informationCriteria: 'Information Criteria', residualCovariance: 'Residual Covariance Matrix',
        causesGranger: 'Granger-causes', doesNotCauseGranger: 'does not Granger-cause',
        // Stationarity Test
        stationarityTest: 'Stationarity Test', adfTest: 'Augmented Dickey-Fuller', kpssTest: 'KPSS Test',
        ppTest: 'Phillips-Perron Test', unitRoot: 'Unit Root', stationary: 'Stationary',
        nonStationary: 'Non-Stationary', trendOption: 'Trend Option', trendNone: 'None', trendConstant: 'Constant Only',
        trendConstantTrend: 'Constant + Trend', criticalValue: 'Critical Value', testStatistic: 'Test Statistic',
        usedLag: 'Used Lag', hypothesis: 'Hypothesis', selectVariable: 'Select Variable',
        conclusion: 'Conclusion', likelyStationary: 'Likely Stationary', likelyNonStationary: 'Likely Non-Stationary', inconclusive: 'Inconclusive',
        // Panel Data
        panelData: 'Panel Data', fixedEffects: 'Fixed Effects', randomEffects: 'Random Effects', pooledOLS: 'Pooled OLS',
        entityColumn: 'Entity Column', timeColumn: 'Time Column', hausmanTest: 'Hausman Test',
        runAllModels: 'Run All Models', bestModel: 'Best Model', withinEstimator: 'Within Estimator',
        betweenEstimator: 'Between Estimator', rho: 'Variance Ratio', theta: 'Theta',
        nObs: 'Observations', nEntities: 'Entities', nPeriods: 'Periods',
        // Machine Learning
        mlNodes: 'Machine Learning', dlNodes: 'Deep Learning',
        knn: 'K-Nearest Neighbors', decisionTree: 'Decision Tree', randomForest: 'Random Forest',
        logisticRegression: 'Logistic Regression', kMeans: 'K-Means Clustering', naiveBayes: 'Naive Bayes',
        neuralNetwork: 'Neural Network', modelPredictor: 'Model Predictor',
        kNeighbors: 'Number of Neighbors (K)', targetColumn: 'Target Column', featureColumns: 'Feature Columns',
        trainRatio: 'Train Ratio', maxDepth: 'Max Depth', minSamples: 'Min Samples to Split',
        nTrees: 'Number of Trees', nClusters: 'Number of Clusters', maxIterations: 'Max Iterations',
        learningRate: 'Learning Rate', epochs: 'Epochs', hiddenLayers: 'Hidden Layers',
        activation: 'Activation Function', accuracy: 'Accuracy', precision: 'Precision', recall: 'Recall',
        f1Score: 'F1 Score', confusionMatrix: 'Confusion Matrix', trainModel: 'Train Model',
        testAccuracy: 'Test Accuracy', trainAccuracy: 'Train Accuracy', clusterCenters: 'Cluster Centers',
        inertia: 'Inertia', silhouetteScore: 'Silhouette Score', predictedLabel: 'Predicted Label',
        trainingHistory: 'Training History', lossFunction: 'Loss Function', optimizer: 'Optimizer',
        // Advanced ML Nodes
        svm: 'Support Vector Machine', gradientBoosting: 'Gradient Boosting', adaBoost: 'AdaBoost', pca: 'Principal Component Analysis',
        kernel: 'Kernel', regularization: 'Regularization', gamma: 'Gamma', nEstimators: 'Number of Estimators', nComponents: 'Number of Components',
        // ML Visualization Nodes
        mlVizNodes: 'ML Visualization', rocCurve: 'ROC Curve', prCurve: 'Precision-Recall Curve',
        learningCurve: 'Learning Curve', featureImportance: 'Feature Importance', elbowCurve: 'Elbow Curve',
        confusionHeatmap: 'Confusion Heatmap', maxK: 'Max K', connectModelToVisualize: 'Connect a model to visualize',
        pcaComponents: 'PCA Components', component: 'Component', eigenvalue: 'Eigenvalue',
        explainedVariance: 'Explained Variance', cumulative: 'Cumulative', featureLoadings: 'Feature Loadings',
        feature: 'Feature', importance: 'Importance', actual: 'Actual', predicted: 'Predicted', components: 'Components',
        // Data Preprocessing
        standardScaler: 'Standard Scaler', minMaxScaler: 'Min-Max Scaler', selectFeaturesToScale: 'Select Features to Scale',
        scalingStats: 'Scaling Statistics', originalMean: 'Original Mean', originalStd: 'Original Std',
        originalMin: 'Original Min', originalMax: 'Original Max', minValue: 'Min Value', maxValue: 'Max Value',
        crossValidation: 'Cross-Validation', cvFolds: 'CV Folds', useCrossValidation: 'Use Cross-Validation',
        meanCVAccuracy: 'Mean CV Accuracy', stdCVAccuracy: 'CV Accuracy Std',
        // Views Nodes
        viewsNodes: 'Views', imageView: 'Image View', textView: 'Text View', statisticsView: 'Statistics View',
        tileView: 'Tile View', boxPlot: 'Box Plot', heatmap: 'Heatmap', areaChart: 'Area Chart', radarChart: 'Radar Chart',
        imageColumn: 'Image Column', textColumn: 'Text Column', titleColumn: 'Title Column', valueColumn: 'Value Column', valueColumns: 'Value Columns',
        maxWidth: 'Max Width', maxHeight: 'Max Height', fontSize: 'Font Size', maxLines: 'Max Lines', maxTiles: 'Max Tiles', maxRows: 'Max Rows',
        tileColor: 'Tile Color', colorScheme: 'Color Scheme', redBlue: 'Red-Blue', greenRed: 'Green-Red', yellowPurple: 'Yellow-Purple',
        fill: 'Fill', stacked: 'Stacked', multiple: 'Multiple', stdDev: 'Std. Deviation',
        noImages: 'No images found', noText: 'No text found', noStats: 'No statistics found', labelColumn: 'Label Column',
        // Statistical Tests (T-Tests, ANOVA, ANCOVA)
        independentTTest: 'Independent Samples T-Test', pairedTTest: 'Paired Samples T-Test',
        twoWayAnova: 'Two-Way ANOVA', ancova: 'ANCOVA',
        groupColumn: 'Group Column', equalVariances: 'Assume Equal Variances', unequalVariances: 'Unequal Variances',
        sample1: 'Sample 1', sample2: 'Sample 2', factor1: 'Factor 1', factor2: 'Factor 2',
        covariate: 'Covariate',
        independentTTestInfo: 'Compare means of two independent groups', pairedTTestInfo: 'Compare means of same sample at two different times',
        twoWayAnovaInfo: 'Analyze effect of two factors on dependent variable', ancovaInfo: 'Analysis of variance with covariate adjustment',
        testType: 'Test Type', studentTTest: "Student's T-Test", welchTTest: "Welch's T-Test",
        groupStatistics: 'Group Statistics', testResults: 'Test Results',
        meanDifference: 'Mean Difference', degreesOfFreedom: 'Degrees of Freedom', standardError: 'Standard Error',
        cohensD: "Cohen's d", ci95: '95% Confidence Interval', levenesTest: "Levene's Test",
        sampleStatistics: 'Sample Statistics', pairedDifferences: 'Paired Differences', pairs: 'Pairs',
        anovaTable: 'ANOVA Table', ancovaTable: 'ANCOVA Table', source: 'Source', interaction: 'Interaction',
        grandMean: 'Grand Mean', significanceTest: 'Significance Test', notSignificant: 'Not Significant',
        adjustedMeans: 'Adjusted Means', observedMean: 'Observed Mean', adjustedMean: 'Adjusted Mean',
        covariateSlope: 'Covariate Slope', conclusions: 'Conclusions',
        groupEffect: 'Group Effect', covariateEffect: 'Covariate Effect',
        negligible: 'Negligible', small: 'Small', medium: 'Medium', large: 'Large',
        statistic: 'Statistic', value: 'Value', group: 'Group', sample: 'Sample',
        total: 'Total', correlation: 'Correlation',
        // Non-Parametric Tests
        nonParametricTests: 'Non-Parametric Tests', dataEntry: 'Data Entry',
        mannWhitneyU: 'Mann-Whitney U Test', wilcoxonSignedRank: 'Wilcoxon Signed-Rank',
        kruskalWallis: 'Kruskal-Wallis Test', friedmanTest: 'Friedman Test',
        chiSquareTest: 'Chi-Square Test', spearmanCorrelation: 'Spearman Correlation',
        uStatistic: 'U Statistic', zScore: 'Z Score', rankSum: 'Rank Sum', effectSize: 'Effect Size',
        wStatistic: 'W Statistic', wPlus: 'W+', wMinus: 'W-', nonZeroPairs: 'Non-Zero Pairs',
        hStatistic: 'H Statistic', chiSquareStatistic: 'Chi-Square', meanRank: 'Mean Rank',
        kendallW: "Kendall's W", nSubjects: 'N Subjects', nConditions: 'N Conditions',
        phi: 'Phi', cramersV: "Cramer's V", contingencyTable: 'Contingency Table',
        observedFreq: 'Observed Frequencies', expectedFreq: 'Expected Frequencies',
        rho: 'Rho', spearmanRho: "Spearman's Rho", rankCorrelation: 'Rank Correlation',
        mannWhitneyInfo: 'Non-parametric alternative to independent t-test',
        wilcoxonInfo: 'Non-parametric alternative to paired t-test',
        kruskalWallisInfo: 'Non-parametric alternative to one-way ANOVA',
        friedmanInfo: 'Non-parametric alternative to repeated measures ANOVA',
        chiSquareInfo: 'Test for independence between categorical variables',
        spearmanInfo: 'Non-parametric rank correlation coefficient',
        subjectColumn: 'Subject Column', conditionColumn: 'Condition Column',
        variable1: 'Variable 1', variable2: 'Variable 2',
        editData: 'Edit Data', separateByComma: 'Separate columns with commas',
        positive: 'Positive', negative: 'Negative', weak: 'Weak', moderate: 'Moderate', strong: 'Strong', veryStrong: 'Very Strong',
        importFile: 'Import File', addColumn: 'Add Column', addRow: 'Add Row', clearAll: 'Clear All',
        maxRows: 'Rows'
    }
};

let currentLang = 'ar';
function t(key) { return i18n[currentLang][key] || key; }

function updateUILanguage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (i18n[currentLang][key]) el.textContent = i18n[currentLang][key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (i18n[currentLang][key]) el.placeholder = i18n[currentLang][key];
    });
}

function switchLanguage() {
    currentLang = currentLang === 'ar' ? 'en' : 'ar';
    document.documentElement.lang = currentLang;
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    const langIndicator = document.querySelector('.lang-indicator');
    if (langIndicator) langIndicator.textContent = currentLang === 'ar' ? 'EN' : 'عربي';
    updateUILanguage();
    localStorage.setItem('salim-knime-lang', currentLang);
}

function initLanguage() {
    const storedLang = localStorage.getItem('salim-knime-lang');
    if (storedLang && (storedLang === 'ar' || storedLang === 'en')) {
        currentLang = storedLang;
        document.documentElement.lang = currentLang;
        document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
        const langIndicator = document.querySelector('.lang-indicator');
        if (langIndicator) langIndicator.textContent = currentLang === 'ar' ? 'EN' : 'عربي';
        updateUILanguage();
    }
}
