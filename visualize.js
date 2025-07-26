

export function getVHData() {
    const outputArea = document.getElementById('outputArea');
    const inputArea = document.getElementById('inputArea');

    const output = outputArea.value;
    const input = inputArea.value;

    let HData;
    let VData;

    if (output.includes("H-representation") && input.includes("V-representation")) {
        HData = output;
        VData = input;
    } else if (output.includes("V-representation") && input.includes("H-representation")) {
        HData = input;
        VData = output;
    }

    const H = parseData(HData);
    const V = parseData(VData);

    return { H, V };

}

function parseData(data) {
    const begin = data.lastIndexOf("begin") + 6;
    const end = data.lastIndexOf("end") - 1;
    
    let result = data.substring(begin, end).split("\n");
    for (let i=0; i<result.length; i++) {
        let line = result[i];

        if (i===0) {
            
        }

        line = line.split(" ").filter((word) => word.length > 0);
        if (line[0] === "*****") {
            line[0] = result.length-1
        }
        result[i] = line;
    }

    return result;
}