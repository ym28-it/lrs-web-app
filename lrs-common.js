// lrs-common.js
let runProgram;

document.addEventListener('DOMContentLoaded', async () => {
    const fileInput = document.getElementById('fileInput');
    const inputArea = document.getElementById('inputArea');
    const outputArea = document.getElementById('outputArea');
    const elapsedTime = document.getElementById('elapsedTime');
    const outputFileNameInput = document.getElementById('outputFileName');
    const runProgramButton = document.getElementById('runProgram');


    // mode-config.jsonの適用
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode') || 'default';
    const version = urlParams.get('version') || 'v7.3';

    const configFilePath = "./mode-config.json";

    let config;
    try {
        const response = await fetch(configFilePath);
        config = await response.json();
        console.log('fetch config file');
    } catch (error) {
        console.error('config file reading error:', error);
        return;
    }

    const modeConfig = config.modes[mode];
    console.log('modeConfig:', modeConfig);

    document.title = modeConfig.title;

    const headerH3 = document.querySelector('header h3');
    if (headerH3) {
        headerH3.textContent = modeConfig.headerH3;
        headerH3.textContent += ` based on ${version}`;
    }

    // safe-unsafeボタンは一旦放置（必要な場合実装、いらないかも）

    // ファイルアップロード
    if(fileInput){
        fileInput.addEventListener('change', (event) => {
            outputArea.value = '';
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
            inputArea.value = e.target.result;
            };
            if (file) {
            reader.readAsText(file);
            }
        });
    }

    function showLoading() {
        const loader = document.getElementById('loadingIndicator');
        if (loader) {
            loader.style.display = 'block';
        }
    }
    
    function hideLoading() {
        const loader = document.getElementById('loadingIndicator');
        if (loader) {
            loader.style.display = 'none';
        }
    }

    let currentWorker = null;

    // プログラム実行用の関数
    runProgram = function() {

        if (currentWorker !== null) {
            console.log('Terminate current Worker');
            currentWorker.terminate();
            currentWorker = null;
        }

        showLoading();
        outputArea.value = '';

        const inputText = inputArea.value;

        const moduleParam = encodeURIComponent(modeConfig.wasmModule);

        const workerUrl = `./lrs-worker.js?module=${moduleParam}&version=${version}`;

        try {
            // Workerの作成 (worker.js が実際の処理を担当)
            currentWorker = new Worker(workerUrl);
            console.log('create Worker', workerUrl);
        } catch (err) {
            console.log('create Worker error:', err);
        }

        // Workerからのメッセージ受信時の処理
        currentWorker.onmessage = function (e) {
            // "ready" メッセージを受け取ったら、入力データを送信する
            if (e.data.ready) {
                console.log('Worker is ready. Sending input data from lrs-common.js .');
                currentWorker.postMessage({ input: inputText });

            } else if (e.data.error) {
                outputArea.value = "エラー: " + e.data.error;

            }else if (e.data.elapsedTime) {
                console.log(`elapsedTime: ${e.data.elapsedTime}`);
                elapsedTime.textContent = `${e.data.elapsedTime} ms`;

            } else if (e.data.result) {
                console.log('get output data');
                outputArea.value = e.data.result;
                outputArea.value += `\n*** Based on lrs ${version} ***\n`;
                hideLoading(); // 結果受信後にローディング非表示
                console.log('hide Loading');
                currentWorker.terminate(); // Workerの終了（リソース解放）
            }
        };

        // Worker内でエラーが発生した場合の処理
        currentWorker.onerror = function (err) {
            console.error("Workerエラー: ", err);
            outputArea.value = "Workerエラー: " + err.message;
            hideLoading();
            currentWorker.terminate();
        };
    }

    if(runProgramButton){
        runProgramButton.addEventListener('click', runProgram);

        // ショートカットキー (Ctrl+Enter / Cmd+Enter)
        document.addEventListener('keydown', (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            runProgram();
            }
        });
    }

    // ダウンロード機能
    const downloadBtn = document.getElementById('downloadOutput');
    if(downloadBtn){
        downloadBtn.addEventListener('click', () => {
            const outputText = outputArea.value;
            const outputFileName = outputFileNameInput.value.trim() || 'output.txt';
            const blob = new Blob([outputText], { type: 'text/plain' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = outputFileName;
            a.click();
            URL.revokeObjectURL(a.href);
        });
    }

    const testFile = urlParams.get('test');
    console.log('testFile', testFile);
    if (testFile) {
        console.log("Excursion");
        fetch(`./tests/${testFile}`)
            .then(res => res.text())
            .then(text => {
                inputArea.value = text;
                runProgram(); // Auto Execute
            })
            .catch(err => {
                console.error("Test file load error:", err);
            });
    }

});
