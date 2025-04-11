// common.js

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const inputArea = document.getElementById('inputArea');
    const outputArea = document.getElementById('outputArea');
    const outputFileNameInput = document.getElementById('outputFileName');
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

    // プログラム実行用の関数
    function runProgram() {

        showLoading();
        outputArea.value = '';

        const inputText = inputArea.value;
        // Workerの作成 (worker.js が実際の処理を担当)
        const worker = new Worker('worker.js');

        // メインスレッドからWorkerへ入力データを送信
        console.log('post Input data in common.js');
        worker.postMessage({ input: inputText });

        // Workerからのメッセージ受信時の処理
        worker.onmessage = function (e) {
            // "ready" メッセージを受け取ったら、入力データを送信する
            if (e.data.ready) {
                console.log('Worker is ready. Sending input data.');
                worker.postMessage({ input: inputText });

            } else if (e.data.error) {
                outputArea.value = "エラー: " + e.data.error;

            } else if (e.data.result) {
                console.log('get output data');
                outputArea.value = e.data.result;
                hideLoading(); // 結果受信後にローディング非表示
                console.log('hide Loading');
                worker.terminate(); // Workerの終了（リソース解放）
            }
        };

        // Worker内でエラーが発生した場合の処理
        worker.onerror = function (err) {
            console.error("Workerエラー: ", err);
            outputArea.value = "Workerエラー: " + err.message;
            hideLoading();
            worker.terminate();
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
});
