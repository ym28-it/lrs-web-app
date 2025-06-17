


export function setupInputSelector(selectElem, inputArea) {
  selectElem.addEventListener("change", e => {
    const path = e.target.value;
    if (!path) return;
    fetch(path)
      .then(res => res.text())
      .then(text => {
        inputArea.value = text;
      });
  });
}
