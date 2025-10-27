// lrs-worker.js
// WasmモジュールをimportScriptsで読み込む

const urlParams = new URLSearchParams(self.location.search);
const wasmModule = urlParams.get('module') || 'lrs64.js';
const version = urlParams.get('version') || 'v7.3';
console.log('wasmModule', wasmModule);
console.log('Version', version);

var Module = {
    locateFile: function(path) {
        return `./modules/${version}/${path}`;
    }
}

try {
    importScripts(`./modules/${version}/${wasmModule}`);
    console.log('Worker created, waiting for Wasm initialization.');
    console.log(`./modules/${version}/${wasmModule}`);
} catch (err) {
    console.error('ImportScript error:', err);
    self.postMessage({error: err.toString() });
}


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
            const start = performance.now();
            let results = heavyWasmProcessing(input);
            const end = performance.now();
            // 結果をメインスレッドに返送
            self.postMessage({ elapsedTime: end-start });
            self.postMessage({ result: results });
        } catch (err) {
            console.log("Error in onRuntimeInitialized:\n", err);
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
