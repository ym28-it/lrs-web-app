

export function addIncidenceInInput() {
    const inputArea = document.getElementById('inputArea');

    if (!inputArea.value.includes("incidence")) {
        console.log('add incidence');
        inputArea.value += '\nincidence\n';
        return true;
    }
    return false;
}