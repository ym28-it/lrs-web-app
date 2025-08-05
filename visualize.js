import * as THREE from 'three';

export function getVHData(output) {
    const inputArea = document.getElementById('inputArea');
    const input = inputArea.value;
    // console.log('inputs:\n', input);

    let H;
    let V;
    let incidence;
    let HtoV = false;
    let VtoH = false;

    if (input.includes("H-representation")) {
        HtoV = true;
        let parsedInput = parseData(input, HtoV, VtoH);
        let parsedOutput = parseData(output, HtoV, VtoH);
        H = parsedInput.result;
        V = parsedOutput.result;
        incidence = parsedOutput.incidence;

        // const facetsData = parseHtoVIncidence(H, V, incidence);

    } else if (input.includes("V-representation")) {
        VtoH = true;
        let parsedInput = parseData(input, HtoV, VtoH);
        let parsedOutput = parseData(output, HtoV, VtoH);
        V = parsedInput.result;
        H = parsedOutput.result;
        incidence = parsedOutput.incidence;

        // const facetsData = parseVtoHIncidence(H, V, incidence);

    } else {
        console.error("Invalid input/output format in visualize.js");
        return false;
    }

    executeVisualization();

    // console.log('H:\n', H);
    // console.log('V:\n', V);
    // console.log('incidence:\n', incidence);

    const resultH = listToString(H);
    const resultV = listToString(V);

    // console.log('resultH:\n', resultH);
    // console.log('resultV:\n', resultV);

    return { resultH, resultV, incidence };

}

function parseData(data, HtoV, VtoH) {
    const begin = data.lastIndexOf("begin") + 6;
    const end = data.lastIndexOf("end") - 1;
    
    let input = data.substring(begin, end).split("\n");
    let incidence = [];
    let result = [];
    let dimension = 1;

    // console.log('input in parseData', input);

    for (let i = 0; i < input.length; i++) {
        // line = input[i];
        let line = input[i].split(" ").filter((word) => word.length > 0);
        // console.log('line in parseData:\n', line);

        if (i===0) {
            if (line[1] > 4) {
                console.log("this polytope is over 3 dimensional");
                return false;
            } else {
                dimension = line[1];
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

    // console.log('result', result);
    // console.log('incidence', incidence);
    return {result, incidence};
}


function listToString(list) {
    let str = '';
    for (let i = 0; i < list.length; i++) {
        if (i === 0) {
            str += list[i].join(" ") + '\n';
            continue;
        } else if (i === list.length-1) {
            str += ' ' + list[i].join("  ");
            continue;
        }

        str += ' ' + list[i].join("  ") + '\n';
    }
    return str;
}


function parseHtoVIncidence(H, V, incidence) {
    // H: inequalities
    // V: summits
    
    // 1: lines in incidence is pairs of inequalities
    // 2: necessary  inequalities list  elems is 
    for (let i; i < incidence.length; i++) {
        const line = incidence[i];

    }
}


function parseVtoHIncidence(H, V, incidence) {
    // H: inequalities
    // V: summits

}


function whetherWebGLSupported() {

}


function executeVisualization() {
    const renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector("#myCanvas")
    });

    const width = 960;
    const height = 540;
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
        45,
        width / height,
        1,
        10000
    );

    camera.position.set(0, 0, 1000);

    // generate geometry
    // const geometry = new THREE.BoxGeometry(500, 500, 500);
    const geometry = new THREE.BufferGeometry();

    const vertices = new Float32Array( [
        -1.0, -1.0,  1.0, // v0
        1.0, -1.0,  1.0, // v1
        1.0,  1.0,  1.0, // v2
        -1.0,  1.0,  1.0, // v3
    ] );

    const indices = [
        0, 1, 2,
        2, 3, 0,
    ];

    geometry.setIndex( indices );
    geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );

    const material = new THREE.MeshStandardMaterial({
        color: 0xff0000
    });

    const box = new THREE.Mesh(geometry, material);
    scene.add(box);

    // control light
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.intensity = 2;
    light.position.set(1, 1, 1);
    scene.add(light);

    // render box
    renderer.render(scene, camera);

}