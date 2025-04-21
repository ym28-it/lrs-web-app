// experiment3.js
import { drawExecutionTimeChart } from "./chart.js";

document.addEventListener('DOMContentLoaded', async () => {
    const fileInput = document.getElementById('fileInput');
    const inputArea = document.getElementById('inputArea'); //input files list area
    // const outputArea = document.getElementById('outputArea');
    // const outputFileNameInput = document.getElementById('outputFileName');
    const resultArea = document.getElementById('resultArea');
    const resultFileNameInput = document.getElementById('resultFileName');
    const runProgramButton = document.getElementById('runProgram');
    const executionTimes = [];

    // readFileAsync
    function readFileAsync(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }
    // end: readFileAsync func

    // ファイルアップロード
    let inputFileList = [];

    if(fileInput){
        fileInput.addEventListener('change', async (event) => {
            const files = event.target.files;
            inputFileList = Array.from(files)

            inputArea.value = '[Waiting List]\n';
            inputFileList.forEach(f => {
                inputArea.value += `・${f.name}\n`;
            });
        });
    }
    // end: file upload func

    // animation controller
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
    // end: animation controller

    // detect env
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
        resultArea.value += "[Execution Environment]\n";
        resultArea.value += `OS: ${os}\n`;
        resultArea.value += `Browser: ${browser}\n`;
        resultArea.value += `UserAgent: ${navigator.userAgent}\n`;
    }
    // end: detect env

    // worker controller
    let currentWorker = null;

    function runWorker(moduleParam, inputText) {
        return new Promise((resolve, reject) => {
            const workerUrl = `../lrs-worker.js?module=${moduleParam}`;
            const worker = new Worker(workerUrl);
            console.log('create Worker', workerUrl);

            let elapsed = null;
            worker.onmessage = function (e) {
                if (e.data.ready) {
                    console.log('Worker is ready. Sending input data.');
                    worker.postMessage({ input: inputText });
                } else if (e.data.error) {
                    outputArea.value += "Error: " + e.data.error;
                    resultArea.value += "Error:" + e.data.error;
                    worker.terminate();
                    reject(e.data.error);
                } else if (e.data.elapsedTime) {
                    console.log(`elapsedTime: ${e.data.elapsedTime}`);
                    elapsed = e.data.elapsedTime;
                    resultArea.value += `${moduleParam}: \n${e.data.elapsedTime} ms\n`;
                } else if (e.data.result) {
                    console.log('get output data');
                    worker.terminate();
                    resolve({ result: e.data.result, elapsedTime: elapsed});
                }
            };

            worker.onerror = function (err) {
                console.error("Worker Error: ", err);
                outputArea.value += "Worker Error: " + err.message;
                resultArea.value += "Worker Error:" + err.message;
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
        resultArea.value += "\n=== Start Experiment ===\n";

        // const inputText = inputArea.value;
        const moduleParams = ['hybrid.js', 'lrs-mp64.js', 'lrs-long64-safe.js', 'lrs-long64-unsafe.js','lrs-long128-safe.js', 'lrs-long128-unsafe.js'];

        for (const file of inputFileList) {
            const inputText = await readFileAsync(file);
            resultArea.value += `\nIn Process ${file.name}\n`;

            let timeRecord = { filename: file.name };
            let combinedOutput = "";

            for (const moduleParam of moduleParams) {
                const { result, elapsedTime } = await runWorker(moduleParam, inputText);

                timeRecord[moduleParam] = elapsedTime;
                combinedOutput += combinedOutput += `----- ${moduleParam} -----\n${result}\n\n`;
            }

            executionTimes.push(timeRecord);

            // 自動ダウンロード（ファイル出力）
            const blob = new Blob([combinedOutput], { type: 'text/plain' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `${file.name}_output.txt`;
            a.click();
            URL.revokeObjectURL(a.href);

            // 処理済み以外を次のinputFileListに残す
            resultArea.value += `[Completion] ${file.name}\n`;
            // 処理済みとして除外（この例では除外しない方がわかりやすい）
        }

        // draw chart
        const labels = executionTimes.map(e => e.filename);
        drawExecutionTimeChart(executionTimes, moduleParams, labels);

        inputFileList = [];
        inputArea.value = 'Completed \n';

        resultArea.value += "\n=== Termination ===\n";
        hideLoading();
    }

    // runProgram shortcut controller
    if(runProgramButton){
        runProgramButton.addEventListener('click', runProgram);

        // ショートカットキー (Ctrl+Enter / Cmd+Enter)
        document.addEventListener('keydown', (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            runProgram();
            }
        });
    }
    // end: runProgram shortcut controller

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
    // end: download func
});
