// lrs-common.js
import { renderFileSelector } from "./filelist-ui.js";

let runProgram;

document.addEventListener('DOMContentLoaded', async () => {
    const fileInput = document.getElementById('fileInput');
    const inputArea = document.getElementById('inputArea');
    const outputArea = document.getElementById('outputArea');
    const elapsedTime = document.getElementById('elapsedTime');
    const outputFileNameInput = document.getElementById('outputFileName');
    const runProgramButton = document.getElementById('runProgram');
    const selectElem = document.getElementById('server-file');
    

    const fileList = await fetch('./fileList.json').then(res => res.json());

    const openFileDialogButton = document.getElementById('server-file');
    openFileDialogButton.textContent = 'Select File';
    openFileDialogButton.addEventListener('click', () => {
        // create modal container
        const tempContainer = document.createElement('div');
        tempContainer.style.maxHeight = '400px';
        tempContainer.style.overflowY = 'auto';
        renderFileSelector(fileList, tempContainer);

        Swal.fire({
            title: 'Select File',
            html: tempContainer,
            showCancelButton: true,
            showConfirmButton: false
        });
    });
    console.log('fileList', fileList);


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
    let currentWorker = null;

    // ファイルアップロード
    if(fileInput){
        fileInput.addEventListener('change', (event) => {
            outputArea.value = '';
            if (currentWorker !== null) {
                console.log('Terminate current Worker');
                currentWorker.terminate();
                currentWorker = null;
            }
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
            inputArea.value = e.target.result;
            };
            if (file) {
            reader.readAsText(file);
            const baseName = file.name;  // 拡張子除去
            outputFileNameInput.placeholder = `${baseName}.out`;
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


    function getTimeInProcess(start) {
        const timeInProcess = setInterval(() => {
            const end = performance.now();
            const elapsed = (end - start) / 1000;
            elapsedTime.textContent = `${elapsed.toFixed(2)} s`;
            // console.log(`Processing time: ${elapsed.toFixed(2)} s`);
            // Workerに経過時間を送信
        }, 50);

        return timeInProcess;
    }

    // プログラム実行用の関数
    runProgram = function() {

        if (currentWorker !== null) {
            console.log('Terminate current Worker');
            currentWorker.terminate();
            currentWorker = null;
        }

        showLoading();
        outputArea.value = '';

        elapsedTime.textContent = '0.00 s'; // 初期化
        const start = performance.now();
        const timeInProcess = getTimeInProcess(start);
        console.log('start processing');


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
                hideLoading();
                currentWorker.terminate();
                console.error("Workerエラー: ", e.data.error);
                clearInterval(timeInProcess); // タイマーをクリア

            } else if (e.data.elapsedTime) {
                console.log(`elapsedTime: ${e.data.elapsedTime / 1000} s`);
                // Workerからの処理時間を受け取った場合
                clearInterval(timeInProcess); // タイマーをクリア
                // elapsedTimeを更新
                console.log('update elapsedTime');
                elapsedTime.textContent = `${(e.data.elapsedTime / 1000).toFixed(2)} s`;

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
        console.log("Upload input file");
        fetch(`./tests/${testFile}`)
            .then(res => res.text())
            .then(text => {
                inputArea.value = text;
                // // runProgram(); // Auto Execute
                const baseName = testFile;
                outputFileNameInput.placeholder = `${baseName}.out`;
            })
            .catch(err => {
                console.error("Test file load error:", err);
            });
    }

});
