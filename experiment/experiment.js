// experiment.js

document.addEventListener('DOMContentLoaded', async () => {
    const fileInput = document.getElementById('fileInput');
    const inputArea = document.getElementById('inputArea');
    const outputArea = document.getElementById('outputArea');
    const outputFileNameInput = document.getElementById('outputFileName');
    const resultArea = document.getElementById('resultArea');
    const resultFileNameInput = document.getElementById('resultFileName');
    const runProgramButton = document.getElementById('runProgram');


    // ファイルアップロード
    if(fileInput){
        fileInput.addEventListener('change', (event) => {
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
    function runProgram() {

        if (currentWorker !== null) {
            console.log('Terminate current Worker');
            currentWorker.terminate();
            currentWorker = null;
        }

        showLoading();
        outputArea.value = '';

        const inputText = inputArea.value;

        const moduleParams = ['hybrid.js', 'lrs64.js', 'lrs64-safe.js', 'lrs128-safe.js'];

        // モジュールごとにWorkerを作って逐次実行する
        // 実行時間計測はWorkerで行い、その結果を受け取る
        moduleParams.forEach(moduleParam => {
            const workerUrl = `../lrs-worker.js?module=${moduleParam}`;

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
                    console.log('Worker is ready. Sending input data from test-common.js .');
                    currentWorker.postMessage({ input: inputText });

                } else if (e.data.error) {
                    outputArea.value += "エラー: " + e.data.error;
                    resultArea.value += "エラー:" + e.data.error;

                } else if (e.data.elapsedTime) {
                    console.log(`elapsedTime: ${e.data.elapsedTime}`);
                    resultArea.value += `${moduleParam}: \n`;
                    resultArea.value += `${e.data.elapsedTime} ms\n`;

                } else if (e.data.result) {
                    console.log('get output data');
                    outputArea.value += e.data.result;
                    outputArea.value += '####################################################\n';
                    hideLoading(); // 結果受信後にローディング非表示
                    console.log('hide Loading');
                    currentWorker.terminate(); // Workerの終了（リソース解放）
                }
            };

            // Worker内でエラーが発生した場合の処理
            currentWorker.onerror = function (err) {
                console.error("Workerエラー: ", err);
                outputArea.value += "Workerエラー: " + err.message;
                resultArea.value += "Workerエラー:" + err.message;
                hideLoading();
                currentWorker.terminate();
            };
        });
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
});
