document.addEventListener('DOMContentLoaded', () => {
    // === DOM要素の取得 ===
    const gridContainer = document.getElementById('grid-container');
    const resultsGridContainer = document.getElementById('results-grid-container');
    const runAllBtn = document.getElementById('run-all-btn');
    const resetBtn = document.getElementById('reset-btn');
    const wellSelector = document.getElementById('well-selector');
    const conditionForm = document.getElementById('condition-form');
    const setConditionBtn = document.getElementById('set-condition-btn');
    const selectedWellLabel = document.getElementById('selected-well-label');
    const inputs = { ligand: document.getElementById('ligand'), base: document.getElementById('base') };

    // === Supporting Figure 3 の収率データ ===
    const yieldData = {
        "L1":  { "NaOtBu": 21, "Cs2CO3": 23, "KHMDS": 6,  "DBU": 0 },
        "L2":  { "NaOtBu": 71, "Cs2CO3": 83, "KHMDS": 29, "DBU": 2 },
        "L3":  { "NaOtBu": 59, "Cs2CO3": 67, "KHMDS": 21, "DBU": 5 },
        "L4":  { "NaOtBu": 18, "Cs2CO3": 14, "KHMDS": 0,  "DBU": 0 },
        "L5":  { "NaOtBu": 11, "Cs2CO3": 17, "KHMDS": 4,  "DBU": 0 },
        "L6":  { "NaOtBu": 65, "Cs2CO3": 69, "KHMDS": 18, "DBU": 7 },
        "L7":  { "NaOtBu": 68, "Cs2CO3": 73, "KHMDS": 37, "DBU": 3 },
        "L8":  { "NaOtBu": 64, "Cs2CO3": 71, "KHMDS": 20, "DBU": 4 },
        "L9":  { "NaOtBu": 17, "Cs2CO3": 13, "KHMDS": 0,  "DBU": 0 },
        "L10": { "NaOtBu": 31, "Cs2CO3": 33, "KHMDS": 4,  "DBU": 0 },
        "L11": { "NaOtBu": 18, "Cs2CO3": 27, "KHMDS": 8,  "DBU": 0 },
        "L12": { "NaOtBu": 4,  "Cs2CO3": 6,  "KHMDS": 0,  "DBU": 0 }
    };

    const STORAGE_KEY = 'autosyn_history_v1';
    let runHistory = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

    let wells = [];
    let selectedWell = null;
    let filledResultsCount = 0;

    // === グリッドのセットアップ ===
    function setupGrids() {
        gridContainer.innerHTML = '';
        wells = [];
        const labels = ['A', 'B', 'C'];
        for (let i = 0; i < 9; i++) {
            const wellId = `${labels[Math.floor(i/3)]}${i%3 + 1}`;
            
            // シミュレーショングリッドの作成
            const wellElement = document.createElement('div');
            wellElement.className = 'grid-item';
            wellElement.innerHTML = `
                <div class="well-label">${wellId}</div>
                <div class="well-status">未設定</div>
                <div class="result-overlay"></div>
            `;
            const wellData = { id: wellId, element: wellElement, params: {}, isSet: false };
            wellElement.addEventListener('click', () => selectWell(wellData));
            wells.push(wellData);
            gridContainer.appendChild(wellElement);
        }
    }
    
    // === マスの選択と条件設定 ===
    function selectWell(wellData) {
        if (wellData.isSet) {
             alert(`マス ${wellData.id} は既に設定済みです。`);
             return;
        }
        wells.forEach(w => w.element.classList.remove('selected'));
        wellData.element.classList.add('selected');
        selectedWell = wellData;
        Object.keys(inputs).forEach(key => { inputs[key].value = inputs[key].options[0].value; });
        wellSelector.classList.add('hidden');
        conditionForm.classList.remove('hidden');
        selectedWellLabel.textContent = `マス ${wellData.id} の条件設定`;
    }

    setConditionBtn.addEventListener('click', () => {
        if (!selectedWell) return;
        selectedWell.params = { ligand: inputs.ligand.value, base: inputs.base.value };
        selectedWell.isSet = true;
        selectedWell.element.querySelector('.well-status').textContent = '設定済';
        selectedWell.element.classList.add('set');
        selectedWell.element.classList.remove('selected');
        conditionForm.classList.add('hidden');
        wellSelector.classList.remove('hidden');
        selectedWell = null;
    });

    // === 一斉実行と結果表示 ===
    runAllBtn.addEventListener('click', async () => {
        const unsetWells = wells.filter(w => !w.isSet);
        if (unsetWells.length > 0) {
            alert('すべてのマスに条件を設定してください。');
            return;
        }
        runAllBtn.disabled = true;

        // 収率を計算し、結果を表示
        wells.forEach((well, index) => {
            const yieldValue = yieldData[well.params.ligand]?.[well.params.base] ?? 0;
            const category = getYieldCategory(yieldValue);
            
            const overlay = well.element.querySelector('.result-overlay');
            overlay.innerHTML = `${category.text}<br>${yieldValue}%`;
            overlay.style.backgroundColor = category.color;
            overlay.style.display = 'flex';
            
        });

        filledResultsCount += wells.filter(w => w.isSet).length;
        if (filledResultsCount >= 9) {
            resetBtn.disabled = false;
        }

        // === 今回実行分を履歴化 & “結果の記録” グリッドへカード追加 ===
        const thisRunItems = wells.map(well => {
            const yieldValue = yieldData[well.params.ligand]?.[well.params.base] ?? 0;
            return { id: well.id, ligand: well.params.ligand, base: well.params.base, yield: yieldValue };
        });
        
        // === 履歴保存 ===
        const runRecord = {
            timestamp: Date.now(),
            results: wells.map((well, idx) => {
                const yieldValue = yieldData[well.params.ligand]?.[well.params.base] ?? 0;
                return {
                    id: well.id,
                    ligand: well.params.ligand,
                    base: well.params.base,
                    yield: yieldValue
                };
            })
        };
        
        
        // 画面へ追加（今回の9枚を append）
        const host = document.getElementById('results-grid-container');
        thisRunItems.forEach(item => {
            const category = getYieldCategory(item.yield);
            const card = createHistoryCard(item, category);
            host.appendChild(card);    // 直近を上にしたければ host.prepend(card);
        });
                
        // 3秒後にシミュレーショングリッドをリセット
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        wells.forEach(well => resetWell(well));
        runAllBtn.disabled = false;
    });

    // === リセット処理 ===
    resetBtn.addEventListener('click', () => {
        filledResultsCount = 0;
        setupGrids();     // ← 履歴は残す。resultsGridContainer は触らない。
        resetBtn.disabled = true;
    });

    // === ヘルパー関数 ===
    function getYieldCategory(yieldValue) {
        if (yieldValue > 70) return { text: '高収率', color: '#4caf50', className: 'yield-high' };
        if (yieldValue > 35) return { text: '中程度の収率', color: '#fcbf49', className: 'yield-medium' };
        if (yieldValue > 0) return { text: '低収率', color: '#f77f00', className: 'yield-low' };
        return { text: '失敗', color: '#6c757d', className: 'yield-fail' };
    }

    function createHistoryCard(item, category) {
        // item: { id, ligand, base, yield }
        // category: getYieldCategory(item.yield) の戻り値 { text, color, className }
    
        const card = document.createElement('div');
        card.className = `result-item ${category.className}`;
    
        const header = document.createElement('div');
        header.className = 'header';
        header.textContent = `${item.id}｜${item.ligand} × ${item.base}`;
    
        const state = document.createElement('div');
        state.className = 'state';
        state.textContent = category.text;
    
        const yieldDiv = document.createElement('div');
        yieldDiv.className = 'yield';
        yieldDiv.textContent = `${item.yield}%`;
    
        const actions = document.createElement('div');
        actions.className = 'actions';
        const btn = document.createElement('button');
        btn.textContent = '条件を復元';
        btn.addEventListener('click', () => {
            if (inputs.ligand) inputs.ligand.value = item.ligand;
            if (inputs.base) inputs.base.value = item.base;
            conditionForm.classList.remove('hidden');
            wellSelector.classList.add('hidden');
            selectedWellLabel.textContent = '復元条件（クリックで任意マスに設定可）';
        });
        actions.appendChild(btn);
    
        card.appendChild(header);
        card.appendChild(state);
        card.appendChild(yieldDiv);
        card.appendChild(actions);
    
        return card;
    }

    function resetWell(well) {
        well.isSet = false;
        well.params = {};
        well.element.classList.remove('set');
        well.element.querySelector('.well-status').textContent = '未設定';
        well.element.querySelector('.result-overlay').style.display = 'none';
    }

    // === 初期化 ===
    setupGrids();
    
    // === 保存済み履歴をカードで復元表示 ===
    (function restoreHistoryCards() {
        const host = document.getElementById('results-grid-container');
        runHistory.forEach(run => {
            run.results.forEach(item => {
                const category = getYieldCategory(item.yield);
                const card = createHistoryCard(item, category);
                host.appendChild(card);
            });
        });
    })();

});
