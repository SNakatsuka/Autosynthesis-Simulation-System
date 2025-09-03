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
        ligand: document.getElementById('ligand'),
        base: document.getElementById('base')
    };

    // 論文の最高収率に基づく正解の条件
    const CORRECT_ANSWER = {
        ligand: "L2",
        base: "Cs2CO3"
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
            ligand: inputs.ligand.value,
            base: inputs.base.value,
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
            if (well.params.ligand === CORRECT_ANSWER.ligand) score++;
            if (well.params.base === CORRECT_ANSWER.base) score++;

            const liquid = well.element.querySelector('.liquid');
            const overlay = well.element.querySelector('.result-overlay');
            let resultText = '';
            let color = '';

            switch (score) {
                case 2:
                    resultText = '🎯<br>大成功!';
                    color = '#9ef01a'; // 鮮やかな緑
                    break;
                case 1:
                    resultText = '成功';
                    color = '#4ade80'; // 緑
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
