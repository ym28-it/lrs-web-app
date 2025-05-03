// test-index.js

function navigateMode(button) {
    const mode = button.getAttribute('data-mode');

    const targetUrl = `./test-common.html?mode=${encodeURIComponent(mode)}`;
    window.location.href = targetUrl;
}