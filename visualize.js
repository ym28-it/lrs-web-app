

export function getVHData(hasAddedIncidence) {
    const outputArea = document.getElementById('outputArea');
    const inputArea = document.getElementById('inputArea');

    const output = outputArea.value;
    const input = inputArea.value;

    let H;
    let V;
    let incidence;
    let HtoV = false;
    let VtoH = false;

    if (input.includes("H-representation")) {
        HtoV = true;
        H, incidence = parseData(input, HtoV, VtoH);
        V, incidence = parseData(output, HtoV, VtoH);
    } else if (input.includes("V-representation")) {
        VtoH = true;
        V, incidence = parseData(input, HtoV, VtoH);
        H, incidence = parseData(output, HtoV, VtoH);
    } else {
        console.error("Invalid input/output format");
        return false;
    }


    return { H, V, incidence };

}

function parseData(data, HtoV, VtoH) {
    const begin = data.lastIndexOf("begin") + 6;
    const end = data.lastIndexOf("end") - 1;
    
    let input = data.substring(begin, end).split("\n");
    let incidence = [];
    let result = [];
    let dimension = 1;

    for (let i; i < input.length; i++) {
        line = input[i];
        line = line.split(" ").filter((word) => word.length > 0);

        if (i===0) {
            if (line[1] > 4) {
                console.log("this polytope is over 3 dimensional");
                return false
            } else {
                dimension = line[1]
                result.push(line);
                continue;
            }
        }

        if (line.length > dimension) {
            console.log('incidence');
            if (HtoV) {
                const facets = line.indexOf("facets");
                line = line.slice(facets+1, facets + dimension);
            } else if (VtoH) {
                const verticesRays = line.indexOf("vertices/rays");
                line = line.slice(verticesRays+1, verticesRays + dimension + 1);
            } else {
                console.error("Invalid data format");
                return false;
            }
            incidence.push(line);
        } else {
            console.log('result');
            result.push(line);
        }
    }

    console.log('result', result);
    console.log('incidence', incidence);
    return result, incidence;
}


function parseHtoVIncidence(H, V, incidence) {
    // H: inequalities
    // V: summits
    
    for (let i; i < incidence.length; i++) {
        const line = incidence[i];

    }
}