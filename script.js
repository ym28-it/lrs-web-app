// script.js

function navigateMode(button) {
    const mode = button.getAttribute('data-mode');
    const version = button.getAttribute('version');

    const targetUrl = `./lrs-common.html?mode=${encodeURIComponent(mode)}&version=${encodeURIComponent(version)}`;
    window.location.href = targetUrl;
}

// 削除可能
// function goExperiment(button) {
//     const targetUrl = './experiment/experiment.html';

//     window.location.href = targetUrl;
// }