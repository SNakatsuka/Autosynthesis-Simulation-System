document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.getElementById('grid-container');
    const runAllBtn = document.getElementById('run-all-btn');
    const resetBtn = document.getElementById('reset-btn');
    const logOutput = document.getElementById('log-output');
    const selectedWellInfo = document.getElementById('selected-well-info');

    // 正解の条件
    const CORRECT_ANSWER = { reagentA: 50, temperature: 80 };

    let wells = [];
    let selectedWell = null;

    // 便利な関数
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    const updateLog = (message) => {
        logOutput.innerHTML += `${message}<br>`;
        logOutput.scrollTop = logOutput.scrollHeight;
    };

    // グリッドを初期化・生成する関数
    function setupGrid() {
        gridContainer.innerHTML = '';
        wells = [];
        const labels = ['A', 'B', 'C'];
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const wellId = `${labels[i]}${j + 1}`;
                const wellData = {
                    id: wellId,
                    element: null,
                    params: { reagentA: 0, temperature: 0 },
                    isSet: false
                };

                const wellElement = document.createElement('div');
                wellElement.className = 'grid-item';
                wellElement.innerHTML = `
                    <div class="liquid"></div>
                    <div class="well-label">${wellId}</div>
                    <div class="well-params">未設定</div>
                    <div class="result-overlay"></div>
                `;
                
                wellElement.addEventListener('click', () => selectWell(wellData));
                
                wellData.element = wellElement;
                wells.push(wellData);
                gridContainer.appendChild(wellElement);
            }
        }
        updateLog('グリッドを初期化しました。各マスをクリックして条件を設定してください。');
    }

    // マスを選択したときの処理
    function selectWell(wellData) {
        // 他の選択を解除
        wells.forEach(w => w.element.classList.remove('selected'));
        // 現在のマスを選択
        wellData.element.classList.add('selected');
        selectedWell = wellData;
        updateSelectedWellInfo();

        const reagentA = prompt(`マス ${wellData.id} の試薬Aの量(mg)を入力 (例: 10-100)`, wellData.params.reagentA || '');
        const temperature = prompt(`マス ${wellData.id} の温度(℃)を入力 (例: 20-100)`, wellData.params.temperature || '');
        
        if (reagentA !== null && temperature !== null && !isNaN(reagentA) && !isNaN(temperature)) {
            wellData.params.reagentA = parseInt(reagentA);
            wellData.params.temperature = parseInt(temperature);
            wellData.isSet = true;
            updateWellDisplay(wellData);
            updateSelectedWellInfo();
        }
    }
    
    // マスの表示を更新
    function updateWellDisplay(wellData) {
        const paramsDiv = wellData.element.querySelector('.well-params');
        if(wellData.isSet) {
             paramsDiv.innerHTML = `${wellData.params.reagentA}mg / ${wellData.params.temperature}℃`;
        } else {
             paramsDiv.innerHTML = '未設定';
        }
    }

    // 選択中マスの情報を表示
    function updateSelectedWellInfo() {
        if(selectedWell && selectedWell.isSet) {
            selectedWellInfo.innerHTML = `
                <h3>選択中のマス: ${selectedWell.id}</h3>
                <p>試薬A: ${selectedWell.params.reagentA} mg</p>
                <p>温度: ${selectedWell.params.temperature} ℃</p>
            `;
        } else if (selectedWell) {
            selectedWellInfo.innerHTML = `<h3>選択中のマス: ${selectedWell.id}</h3><p>未設定です</p>`;
        }
         else {
            selectedWellInfo.innerHTML = `<p>マスを選択していません</p>`;
        }
    }

    // 一斉実行の処理
    runAllBtn.addEventListener('click', async () => {
        if (wells.some(w => !w.isSet)) {
            alert('すべてのマスに条件を設定してください。');
            return;
        }

        runAllBtn.disabled = true;
        updateLog('>>> 全ての実験を開始します...');
        
        // 全てのマスの色を「反応中」に変える
        wells.forEach(well => {
            const liquid = well.element.querySelector('.liquid');
            liquid.style.backgroundColor = '#fca311'; // オレンジ色
            liquid.style.transform = 'scale(1.05)';
        });

        await sleep(2000); // 2秒待つ

        updateLog('結果を評価中...');
        await sleep(1000);

        showResults();
        updateLog('>>> 実験終了');
    });

    // 結果を表示する処理
    function showResults() {
        let bestWell = null;
        let minDiff = Infinity;

        // 最も正解に近いマスを探す
        wells.forEach(well => {
            const diff = Math.abs(well.params.reagentA - CORRECT_ANSWER.reagentA) + 
                         Math.abs(well.params.temperature - CORRECT_ANSWER.temperature);
            if (diff < minDiff) {
                minDiff = diff;
                bestWell = well;
            }
        });

        // 各マスの結果を判定して表示
        wells.forEach(well => {
            const liquid = well.element.querySelector('.liquid');
            const overlay = well.element.querySelector('.result-overlay');
            
            const diff = Math.abs(well.params.reagentA - CORRECT_ANSWER.reagentA) + 
                         Math.abs(well.params.temperature - CORRECT_ANSWER.temperature);

            let resultText = '';
            if (well === bestWell) {
                liquid.style.backgroundColor = '#9ef01a'; // 鮮やかな緑
                resultText = '🎯<br>大成功!';
            } else if (diff <= 20) { // 誤差が20以内なら成功
                liquid.style.backgroundColor = '#4ade80'; // 緑
                resultText = '成功';
            } else if (diff <= 50) { // 誤差が50以内ならまあまあ
                liquid.style.backgroundColor = '#facc15'; // 黄色
                resultText = 'まあまあ';
            } else { // それ以上は失敗
                liquid.style.backgroundColor = '#7209b7'; // 紫
                resultText = '失敗';
            }
            overlay.innerHTML = resultText;
            overlay.style.display = 'flex';
        });
    }

    // リセット処理
    resetBtn.addEventListener('click', () => {
        wells.forEach(well => {
            well.params = { reagentA: 0, temperature: 0 };
            well.isSet = false;
            updateWellDisplay(well);
            well.element.querySelector('.liquid').style.backgroundColor = 'rgba(189, 224, 254, 0.5)';
            well.element.querySelector('.liquid').style.transform = 'scale(1)';
            well.element.querySelector('.result-overlay').style.display = 'none';
        });
        runAllBtn.disabled = false;
        selectedWell = null;
        updateSelectedWellInfo();
        logOutput.innerHTML = '';
        updateLog('リセットしました。');
    });

    // 初期化
    setupGrid();
});
