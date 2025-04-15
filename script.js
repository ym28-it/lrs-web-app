// script.js

function navigateMode(button) {
    const mode = button.getAttribute('data-mode');

    const targetUrl = `./lrs-common.html?mode=${encodeURIComponent(mode)}`;
    window.location.href = targetUrl;
}

function goExperiment(button) {
    const targetUrl = './experiment/experiment.html';

    window.location.href = targetUrl;
}