// App.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';

function App({ mode }) {
  const title = mode === "safe" ? "LRS LONG 64bit: overflow checking ON" : "LRS LONG 64bit: overflow checking OFF";
  const switchTo = mode === "safe" ? "unsafe" : "safe";
  const switchHref = `lrs-long64-${switchTo}.html`;
  const switchLabel = `Switch to ${switchTo[0].toUpperCase() + switchTo.slice(1)} Mode`;

  return (
    <>
      <header className="header">
        <a href="../index.html"><h1>LRS by JavaScript</h1></a>
        <h3>{title}</h3>
        <div>
          <a href="https://github.com/ym28-it/lrs-web-app.git" target="_blank" title="View on GitHub">
            <img src="../images/github-mark/github-mark.png" alt="GitHub" style={{ width: 30, height: 30 }} />
          </a>
        </div>
      </header>

      <main className="main">
        <button onClick={() => window.location.href = switchHref}>{switchLabel}</button>
        {/* 以下は従来のままでOK。main.js が操作します */}
        <h2>Upload File:</h2>
        <input type="file" id="fileInput" />
        <h2>Input:</h2>
        <textarea id="inputArea" rows="10" cols="50"></textarea><br />
        <button id="runProgram">
          Submit
          <span className="tooltip">Ctrl+Enter or Cmd+Enter</span>
        </button>
        <h2>Output:</h2>
        <textarea id="outputArea" rows="10" cols="50" readOnly></textarea>
        <label htmlFor="outputFileName">Output File Name:</label>
        <input type="text" id="outputFileName" placeholder="output.txt" /><br />
        <button id="downloadOutput">Download Output</button>
      </main>
    </>
  );
}

// ページのクエリまたはdata属性でmodeを渡す
const mode = document.body.dataset.mode; // safe もしくは unsafe
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App mode={mode} />);