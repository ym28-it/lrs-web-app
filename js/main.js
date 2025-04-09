const fileInput = document.getElementById('fileInput');
const inputArea = document.getElementById('inputArea');
const outputArea = document.getElementById('outputArea');
const outputFileNameInput = document.getElementById('outputFileName');
const runProgramButton = document.getElementById('runProgram');

// File upload functionality
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

// Function to run the program
function runProgram() {
    const inputFileName = "input.txt";
    const outputFileName = "output.txt";
    const inputText = inputArea.value;

    // Create virtual input file
    FS.writeFile(`/${inputFileName}`, inputText);

    // Create virtual output file
    FS.writeFile(`/${outputFileName}`, '');

    // Execute Wasm programs
    Module.callMain([`/${inputFileName}`, `/${outputFileName}`]);

    // Reading output
    const outputText = FS.readFile(`/${outputFileName}`, { encoding: 'utf8' });

    // Result
    outputArea.value = outputText;
}

// Submit button event listener
runProgramButton.addEventListener('click', runProgram);

// Add keyboard shortcut: Ctrl+Enter or Cmd+Enter
document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        runProgram();
    }
});

// File download functionality
document.getElementById('downloadOutput').addEventListener('click', () => {
    const outputText = outputArea.value;
    const outputFileName = outputFileNameInput.value.trim() || 'output.txt';
    const blob = new Blob([outputText], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = outputFileName;
    a.click();
    URL.revokeObjectURL(a.href);
});