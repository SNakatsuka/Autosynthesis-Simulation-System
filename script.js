document.addEventListener('DOMContentLoaded', () => {

    // === DOM取得 ===
    const gridContainer = document.getElementById('grid-container');
    const resultsGridContainer = document.getElementById('results-grid-container');
    const runAllBtn = document.getElementById('run-all-btn');
    const resetBtn = document.getElementById('reset-btn');
    const wellSelector = document.getElementById('well-selector');
    const conditionForm = document.getElementById('condition-form');
    const setConditionBtn = document.getElementById('set-condition-btn');
    const selectedWellLabel = document.getElementById('selected-well-label');
    const inputs = { ligand: document.getElementById('ligand'), base: document.getElementById('base') };

    const STORAGE_KEY = 'autosyn_history_v2';
    let runHistory = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    let wells = [];
    let selectedWell = null;
    let filledResultsCount = 0;

    // === ORDデータとreaction管理 ===
    let yieldData = {}; // reaction_id -> ligand -> base -> yield

    const REACTIONS = {
        "buchwald_hartwig_amination_v1": {
            name: "Buchwald–Hartwig Amination",
            schemeImage: "images/RXN1.jpg"
        }
        // 将来複数反応追加可能
    };

    let CURRENT_REACTION_ID = "buchwald_hartwig_amination_v1";

    async function loadORDYieldData() {
        const res = await fetch('./ord_yields.json');
        const records = await res.json();
        const map = {};
        records.forEach(r => {
            if (!map[r.reaction_id]) map[r.reaction_id] = {};
            if (!map[r.reaction_id][r.ligand]) map[r.reaction_id][r.ligand] = {};
            map[r.reaction_id][r.ligand][r.base] = r.yield;
        });
        yieldData = map;
    }

    function getYield(ligand, base) {
        return yieldData[CURRENT_REACTION_ID]?.[ligand]?.[base] ?? 0;
    }

    // === グリッドセットアップ ===
    function setupGrids() {
        gridContainer.innerHTML = '';
        wells = [];
        const labels = ['A','B','C'];
        for(let i=0;i<9;i++){
            const wellId = `${labels[Math.floor(i/3)]}${i%3+1}`;
            const wellElement = document.createElement('div');
            wellElement.className = 'grid-item';
            wellElement.innerHTML = `
                <div class="well-label">${wellId}</div>
                <div class="well-status">未設定</div>
                <div class="result-overlay"></div>
            `;
            const wellData = {id:wellId, element:wellElement, params:{}, isSet:false};
            wellElement.addEventListener('click',()=>selectWell(wellData));
            wells.push(wellData);
            gridContainer.appendChild(wellElement);
        }
        // 画像切替
        document.querySelector('.reaction-scheme img').src = REACTIONS[CURRENT_REACTION_ID].schemeImage;
    }

    function selectWell(wellData){
        if(wellData.isSet){
            alert(`マス ${wellData.id} は既に設定済みです。`);
            return;
        }
        wells.forEach(w=>w.element.classList.remove('selected'));
        wellData.element.classList.add('selected');
        selectedWell = wellData;
        Object.keys(inputs).forEach(key=>{inputs[key].value = inputs[key].options[0].value;});
        wellSelector.classList.add('hidden');
        conditionForm.classList.remove('hidden');
        selectedWellLabel.textContent = `マス ${wellData.id} の条件設定`;
    }

    setConditionBtn.addEventListener('click',()=>{
        if(!selectedWell) return;
        selectedWell.params = {ligand: inputs.ligand.value, base: inputs.base.value};
        selectedWell.isSet = true;
        selectedWell.element.querySelector('.well-status').textContent = '設定済';
        selectedWell.element.classList.add('set');
        selectedWell.element.classList.remove('selected');
        conditionForm.classList.add('hidden');
        wellSelector.classList.remove('hidden');
        selectedWell = null;
    });

    runAllBtn.addEventListener('click', async()=>{
        const unsetWells = wells.filter(w=>!w.isSet);
        if(unsetWells.length>0){alert('すべてのマスに条件を設定してください。');return;}
        runAllBtn.disabled = true;

        wells.forEach((well,index)=>{
            const yieldValue = getYield(well.params.ligand, well.params.base);
            const category = getYieldCategory(yieldValue);
            const overlay = well.element.querySelector('.result-overlay');
            overlay.innerHTML = `${category.text}<br>${yieldValue}%`;
            overlay.style.backgroundColor = category.color;
            overlay.style.display = 'flex';
        });

        filledResultsCount += wells.filter(w=>w.isSet).length;

        const thisRunItems = wells.map(well=>{
            const yieldValue = getYield(well.params.ligand, well.params.base);
            return {id:well.id, ligand:well.params.ligand, base:well.params.base, yield:yieldValue};
        });

        const runRecord = {
            timestamp: Date.now(),
            results: thisRunItems
        };
        runHistory.push(runRecord);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(runHistory));

        // 結果カード
        thisRunItems.forEach(item=>{
            const category = getYieldCategory(item.yield);
            const card = createHistoryCard(item, category);
            resultsGridContainer.appendChild(card);
        });

        await new Promise(resolve=>setTimeout(resolve,3000));
        wells.forEach(well=>resetWell(well));
        runAllBtn.disabled = false;
    });

    resetBtn.addEventListener('click',()=>{
        filledResultsCount = 0;
        setupGrids();
        resetBtn.disabled = true;
    });

    function getYieldCategory(y){
        if(y>70) return {text:'高収率',color:'#4caf50',className:'yield-high'};
        if(y>35) return {text:'中程度の収率',color:'#fcbf49',className:'yield-medium'};
        if(y>0) return {text:'低収率',color:'#f77f00',className:'yield-low'};
        return {text:'失敗',color:'#6c757d',className:'yield-fail'};
    }

    function createHistoryCard(item, category){
        const card = document.createElement('div');
        card.className = `result-item ${category.className}`;
        const header = document.createElement('div');
        header.className='header';
        header.textContent=`${item.id}｜${item.ligand} × ${item.base}`;
        const state = document.createElement('div');
        state.className='state';
        state.textContent=category.text;
        const yieldDiv=document.createElement('div');
        yieldDiv.className='yield';
        yieldDiv.textContent=`${item.yield}%`;
        card.appendChild(header);
        card.appendChild(state);
        card.appendChild(yieldDiv);
        return card;
    }

    function resetWell(well){
        well.isSet=false;
        well.params={};
        well.element.classList.remove('set');
        well.element.querySelector('.well-status').textContent='未設定';
        well.element.querySelector('.result-overlay').style.display='none';
    }

    // === 初期化 ===
    (async function init(){
        await loadORDYieldData();
        setupGrids();

        // 保存済み履歴復元
        runHistory.forEach(run=>{
            run.results.forEach(item=>{
                const category = getYieldCategory(item.yield);
                const card = createHistoryCard(item, category);
                resultsGridContainer.appendChild(card);
            });
        });
    })();

});
