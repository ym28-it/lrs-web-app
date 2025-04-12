// worker.js
// Wasmモジュール（lrs64.js）をimportScriptsで読み込む

const urlParams = new URLSearchParams(self.location.search);
const wasmModule = urlParams.get('module') || 'lrsmp64.js';
const wasmModuleDir = urlParams.get('moduleDir') || 'test-modules';

const wasmModulePath = `./${wasmModuleDir}/${wasmModule}`;

var Module = {
    locateFile: function(path) {
        return `./test-modules/${path}`;
    }
}

importScripts(wasmModulePath);
console.log('Worker created, waiting for Wasm initialization.');

// Wasmモジュールの初期化完了を待つ
Module.onRuntimeInitialized = function() {
    console.log('Wasm module initialized in worker.');
    // Wasm初期化完了をメインスレッドに通知
    self.postMessage({ ready: true });

    // 初期化完了後にメインスレッドからのメッセージを受け付ける
    self.onmessage = function(e) {
        const input = e.data.input;
        console.log('Received input in worker:', input);

        try {
        let results = heavyWasmProcessing(input);
        // 結果をメインスレッドに返送
        self.postMessage({ result: results });
        } catch (err) {
        self.postMessage({ error: err.toString() });
        }
    };
};

// 重い処理を実行する関数（本来はWasmの呼び出し）
function heavyWasmProcessing(input) {
    const inputFileName = "input.txt";
    const outputFileName = "output.txt";
    // Worker内のFSに対してファイルを作成
    FS.writeFile(`/${inputFileName}`, input);
    FS.writeFile(`/${outputFileName}`, '');
    console.log('Files written in virtual FS in worker.');

    // 仮想ファイルシステム上のファイルパスを引数としてWasmプログラムを実行
    Module.callMain([`/${inputFileName}`, `/${outputFileName}`]);
    console.log('Module.callMain executed in worker.');

    // 出力ファイルを読み込む
    const outputText = FS.readFile(`/${outputFileName}`, { encoding: 'utf8' });
    console.log('output data', outputText);
    return outputText;
}
