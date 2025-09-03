document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const gridContainer = document.getElementById('grid-container');
    const runAllBtn = document.getElementById('run-all-btn');
    const resetBtn = document.getElementById('reset-btn');
    const wellSelector = document.getElementById('well-selector');
    const conditionForm = document.getElementById('condition-form');
    const setConditionBtn = document.getElementById('set-condition-btn');
    const selectedWellLabel = document.getElementById('selected-well-label');
    
    // フォームの入力要素
    const inputs = {
        lewisAcid: document.getElementById('lewis-acid'),
        additive: document.getElementById('additive'),
        solvent: document.getElementById('solvent'),
        temperature: document.getElementById('temperature'),
        time: document.getElementById('time')
    };

    // 論文のEntry 17に基づく正解の条件
    const CORRECT_ANSWER = {
        lewisAcid: "B(C6F5)3",
        additive: "CSA",
        solvent: "Toluene",
        temperature: "100",
        time: "5"
    };

    let wells = [];
    let selectedWell = null;

    // グリッドを初期化・生成
    function setupGrid() {
        gridContainer.innerHTML = '';
        wells = [];
        const labels = ['A', 'B', 'C'];
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const wellId = `${labels[i]}${j + 1}`;
                const wellElement = document.createElement('div');
                wellElement.className = 'grid-item';
                wellElement.innerHTML = `
                    <div class="liquid"></div>
                    <div class="well-label">${wellId}</div>
                    <div class="well-status">未設定</div>
                    <div class="result-overlay"></div>`;
                
                const wellData = {
                    id: wellId,
                    element: wellElement,
                    params: {},
                    isSet: false
                };
                
                wellElement.addEventListener('click', () => selectWell(wellData));
                wells.push(wellData);
                gridContainer.appendChild(wellElement);
            }
        }
    }

    // マスを選択したときの処理
    function selectWell(wellData) {
        wells.forEach(w => w.element.classList.remove('selected'));
        wellData.element.classList.add('selected');
        selectedWell = wellData;

        // フォームに現在の設定値を反映
        Object.keys(inputs).forEach(key => {
            inputs[key].value = wellData.params[key] || inputs[key].options[0].value;
        });

        wellSelector.classList.add('hidden');
        conditionForm.classList.remove('hidden');
        selectedWellLabel.textContent = `マス ${wellData.id} の条件設定`;
    }
    
    // 「条件を設定」ボタンの処理
    setConditionBtn.addEventListener('click', () => {
        if (!selectedWell) return;

        selectedWell.params = {
            lewisAcid: inputs.lewisAcid.value,
            additive: inputs.additive.value,
            solvent: inputs.solvent.value,
            temperature: inputs.temperature.value,
            time: inputs.time.value
        };
        selectedWell.isSet = true;
        
        const statusDiv = selectedWell.element.querySelector('.well-status');
        statusDiv.textContent = '設定済';
        selectedWell.element.classList.add('set');
        selectedWell.element.classList.remove('selected');
        
        conditionForm.classList.add('hidden');
        wellSelector.classList.remove('hidden');
        selectedWell = null;
    });

    // 一斉実行の処理
    runAllBtn.addEventListener('click', async () => {
        if (wells.some(w => !w.isSet)) {
            alert('すべてのマスに条件を設定してください。');
            return;
        }
        runAllBtn.disabled = true;

        // 反応開始のアニメーション
        wells.forEach(well => {
            well.element.querySelector('.liquid').style.backgroundColor = '#fca311'; // 反応中の色
        });
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 結果表示
        showResults();
    });
    
    // 結果を計算して表示する処理
    function showResults() {
        wells.forEach(well => {
            let score = 0;
            if (well.params.lewisAcid === CORRECT_ANSWER.lewisAcid) score++;
            if (well.params.additive === CORRECT_ANSWER.additive) score++;
            if (well.params.solvent === CORRECT_ANSWER.solvent) score++;
            if (well.params.temperature === CORRECT_ANSWER.temperature) score++;
            if (well.params.time === CORRECT_ANSWER.time) score++;

            const liquid = well.element.querySelector('.liquid');
            const overlay = well.element.querySelector('.result-overlay');
            let resultText = '';
            let color = '';

            switch (score) {
                case 5:
                    resultText = '🎯<br>大成功!';
                    color = '#9ef01a'; // 鮮やかな緑
                    break;
                case 4:
                case 3:
                    resultText = '成功';
                    color = '#4ade80'; // 緑
                    break;
                case 2:
                case 1:
                    resultText = 'まあまあ';
                    color = '#facc15'; // 黄色
                    break;
                default:
                    resultText = '失敗';
                    color = '#7209b7'; // 紫
            }
            liquid.style.backgroundColor = color;
            overlay.innerHTML = resultText;
            overlay.style.display = 'flex';
        });
    }

    // リセット処理
    resetBtn.addEventListener('click', () => {
        setupGrid();
        runAllBtn.disabled = false;
        selectedWell = null;
        conditionForm.classList.add('hidden');
        wellSelector.classList.remove('hidden');
    });

    // 初期化
    setupGrid();
});
