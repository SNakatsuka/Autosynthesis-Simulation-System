// DOM要素の取得
const reagentSelect = document.getElementById('reagent-select');
const actionSelect = document.getElementById('action-select');
const addStepBtn = document.getElementById('add-step-btn');
const recipeList = document.getElementById('recipe-list');
const runBtn = document.getElementById('run-btn');
const resetBtn = document.getElementById('reset-btn');
const logOutput = document.getElementById('log-output');
const robotArm = document.getElementById('robot-arm');
const liquid = document.getElementById('liquid');

// レシピを保存する配列
let recipe = [];

// 正解のレシピ（雰囲気です）
const correctRecipe = [
    "サリチル酸を追加",
    "無水酢酸を追加",
    "加熱(5秒)",
    "冷却(5秒)"
];

// 便利な関数：指定時間待つ
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// ログを更新する関数
function updateLog(message) {
    logOutput.innerHTML += `${message}<br>`;
    logOutput.scrollTop = logOutput.scrollHeight; // 自動スクロール
}

// レシピリストの表示を更新する関数
function updateRecipeList() {
    recipeList.innerHTML = '';
    recipe.forEach(step => {
        const li = document.createElement('li');
        li.textContent = step;
        recipeList.appendChild(li);
    });
}

// ステップ追加ボタンの処理
addStepBtn.addEventListener('click', () => {
    const reagent = reagentSelect.value;
    const action = actionSelect.value;
    
    // 操作が「追加」の時だけ試薬名も入れる
    const stepText = action === '追加' ? `${reagent}を${action}` : action;
    
    recipe.push(stepText);
    updateRecipeList();
});

// リセットボタンの処理
resetBtn.addEventListener('click', () => {
    recipe = [];
    updateRecipeList();
    updateLog('リセットしました。');
    liquid.style.height = '10%';
    liquid.style.backgroundColor = '#bde0fe';
    runBtn.disabled = false;
});

// 実行ボタンの処理
runBtn.addEventListener('click', async () => {
    runBtn.disabled = true; // 連続クリック防止
    logOutput.innerHTML = '';
    updateLog('>>> シミュレーション開始...');

    // 各ステップを順番に実行
    for (const step of recipe) {
        updateLog(`実行中: ${step}`);

        // 簡単なアニメーション
        robotArm.style.transform = 'translateX(150px) rotate(30deg)';
        await sleep(1000);
        
        if (step.includes('追加')) {
            const currentHeight = parseInt(liquid.style.height) || 10;
            liquid.style.height = `${currentHeight + 15}%`;
        } else if (step.includes('加熱')) {
            liquid.style.backgroundColor = '#ff6b6b'; // 赤色に
            await sleep(5000);
            liquid.style.backgroundColor = '#bde0fe'; // 元の色に
        } else if (step.includes('攪拌')) {
            // ここに攪拌アニメーションを追加できる
            await sleep(10000);
        } else if (step.includes('冷却')) {
            liquid.style.backgroundColor = '#48cae4'; // 青色に
            await sleep(5000);
            liquid.style.backgroundColor = '#bde0fe'; // 元の色に
        }

        robotArm.style.transform = 'translateX(0) rotate(0)';
        await sleep(500);
    }
    
    // 結果判定
    const isSuccess = JSON.stringify(recipe) === JSON.stringify(correctRecipe);
    if (isSuccess) {
        updateLog('🎉 合成成功！ アスピリンができました！');
        liquid.style.backgroundColor = '#9ef01a'; // 成功の色
    } else {
        updateLog('💥 合成失敗... レシピが違うようです。');
        liquid.style.backgroundColor = '#7209b7'; // 失敗の色
    }
    
    updateLog('>>> シミュレーション終了');
    runBtn.disabled = false;
});
