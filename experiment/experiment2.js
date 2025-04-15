// experiment2.js

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

    function detectOS() {
        const ua = navigator.userAgent;
    
        if (ua.includes("Windows NT")) return "Windows";
        if (ua.includes("Mac OS X")) return "macOS";
        if (ua.includes("Linux")) return "Linux";
        if (ua.includes("Android")) return "Android";
        if (ua.includes("like Mac OS X")) return "iOS";
    
        return "Unknown";
    }

    function detectBrowser() {
        const ua = navigator.userAgent;

        if (ua.includes("Edg/")) return "Microsoft Edge";
        if (ua.includes("Chrome/") && ua.includes("Safari/")) return "Google Chrome";
        if (ua.includes("Firefox/")) return "Mozilla Firefox";
        if (ua.includes("Safari/") && !ua.includes("Chrome/")) return "Safari";

        return "Unknown Browser";
    }

    const logEnvInfo = () => {
        const os = detectOS();
        const browser = detectBrowser();

        resultArea.value = '';
        resultArea.value += "[実行環境ログ]\n";
        resultArea.value += `OS: ${os}\n`;
        resultArea.value += `Browser: ${browser}\n`;
        resultArea.value += `UserAgent: ${navigator.userAgent}\n`;
    }

    let currentWorker = null;

    function runWorker(moduleParam, inputText) {
        return new Promise((resolve, reject) => {
            const workerUrl = `../lrs-worker.js?module=${moduleParam}`;
            const worker = new Worker(workerUrl);
            console.log('create Worker', workerUrl);

            worker.onmessage = function (e) {
                if (e.data.ready) {
                    console.log('Worker is ready. Sending input data.');
                    worker.postMessage({ input: inputText });
                } else if (e.data.error) {
                    outputArea.value += "エラー: " + e.data.error;
                    resultArea.value += "エラー:" + e.data.error;
                    worker.terminate();
                    reject(e.data.error);
                } else if (e.data.elapsedTime) {
                    console.log(`elapsedTime: ${e.data.elapsedTime}`);
                    resultArea.value += `${moduleParam}: \n${e.data.elapsedTime} ms\n`;
                } else if (e.data.result) {
                    console.log('get output data');
                    outputArea.value += e.data.result;
                    outputArea.value += '\n####################################################\n';
                    worker.terminate();
                    resolve();
                }
            };

            worker.onerror = function (err) {
                console.error("Workerエラー: ", err);
                outputArea.value += "Workerエラー: " + err.message;
                resultArea.value += "Workerエラー:" + err.message;
                worker.terminate();
                reject(err);
            };
        });
    }

    // プログラム実行用の関数
    async function runProgram() {
        logEnvInfo();

        if (currentWorker !== null) {
            console.log('Terminate current Worker');
            currentWorker.terminate();
            currentWorker = null;
        }

        showLoading();
        outputArea.value = '';

        const inputText = inputArea.value;
        const moduleParams = ['hybrid.js', 'lrs64.js', 'lrs64-safe.js', 'lrs64-unsafe.js','lrs128-safe.js', 'lrs128-unsafe.js'];

        for (const moduleParam of moduleParams) {
            await runWorker(moduleParam, inputText);
        }

        hideLoading();
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

    const resultDownloadBtn = document.getElementById('downloadResult');
    if(resultDownloadBtn){
        downloadBtn.addEventListener('click', () => {
            const outputText = outputArea.value;
            const resultFileName = resultFileNameInput.value.trim() || 'output.txt';
            const blob = new Blob([outputText], { type: 'text/plain' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = resultFileName;
            a.click();
            URL.revokeObjectURL(a.href);
        });
    }
});
