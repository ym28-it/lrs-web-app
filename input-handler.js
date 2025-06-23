


export function setupInputSelector(selectElem, inputArea) {
  console.log('call setupInputSelector');
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
