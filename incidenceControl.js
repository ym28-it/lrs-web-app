

export function addIncidenceInInput() {
    const inputArea = document.getElementById('inputArea');

    if (!inputArea.value.includes("incidence")) {
        console.log('add incidence');
        // inputArea.value += '\nincidence\n';
        return true;
    }
    return false;
}


export function parseCorrectOutput(output, V, H) {
    const inputArea = document.getElementById('inputArea');
    const begin = output.lastIndexOf("begin") + 6;
    const end = output.lastIndexOf("end") - 1;

    let correctOutput;
    if (inputArea.value.includes('H-representation')) {
        correctOutput = output.slice(0, begin) + V + output.slice(end);
    } else if (inputArea.value.includes('V-representation')) {
        correctOutput = output.slice(0, begin) + H + output.slice(end);
    }

    correctOutput = correctOutput.replace('*incidence\n', '');

    return correctOutput;

}