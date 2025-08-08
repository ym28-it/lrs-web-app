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
    let graph = {};

    if (input.includes("H-representation")) {
        HtoV = true;
        let parsedInput = parseData(input, HtoV, VtoH);
        let parsedOutput = parseData(output, HtoV, VtoH);
        H = parsedInput.result;
        V = parsedOutput.result;
        incidence = parsedOutput.incidence;
        console.log('H:\n', H)
        console.log('V:\n', V)
        console.log('incidence:\n', incidence);

        const edges = parseHtoVIncidence(V.slice(1), incidence);
        graph = parseIncidence(edges);

    } else if (input.includes("V-representation")) {
        VtoH = true;
        let parsedInput = parseData(input, HtoV, VtoH);
        let parsedOutput = parseData(output, HtoV, VtoH);
        V = parsedInput.result;
        H = parsedOutput.result;
        incidence = parsedOutput.incidence;

        graph = parseIncidence(incidence);

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
                dimension = parseInt(line[1]);
                result.push(line);
                continue;
            }
        }

        if (line.length > dimension) {
            console.log('incidence');
            if (HtoV) {
                const start = line.indexOf("facets") + 1;
                const end = start + dimension -1;
                line = line.slice(start, end);
            } else if (VtoH) {
                const start = line.indexOf("vertices/rays") + 1;
                const end = start + dimension;
                line = line.slice(start, end);
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


function parseHtoVIncidence(V, incidence) {
    // H: inequalities
    // V: vertices
    
    console.log('V in parseHtoVIncidence:\n', V);
    console.log('incidence in parseHtoVIncidence:\n', incidence);
    let edges = Array.from({length: V.length}, () => []);
    for (let i = 0; i < incidence.length; i++) {
        for (let edge of incidence[i]) {
            const index = parseInt(edge) -1;
            edges[index].push(i+1);
        }
    }

    console.log('edges\n', edges);
    return edges;
}


function parseIncidence(incidence) {
    // H: inequalities
    // V: vertices

    let graph = Array.from({length: incidence.length}, () => []);
    for (let i = 0; i < incidence.length; i++) {
        const vertices = incidence[i]
            .filter(item => !/^\d+\*$/.test(item))
            .map(item => parseInt(item)-1);
        
        console.log('vertices in parseIncidence\n', vertices);
        for (let vertex of vertices) {
            const others = vertices.filter((item) => item !== vertex);
            graph[vertex] = graph[vertex].concat(others);
        }
    }

    console.log('graph:\n', graph);
    return graph;
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
        0, 0,  0, // v0
        500, 0,  0, // v1
        500,  0,  500, // v2
        0,  0,  500, // v3
    ] );

    const indices = [
        0, 1, 2,
        2, 0, 3,
    ];


    geometry.setIndex( indices );
    geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );

    const material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
    // const material = new THREE.MeshStandardMaterial({color: 0x0000FF});

    const box = new THREE.Mesh(geometry, material);
    scene.add(box);

    // control light
    const light = new THREE.DirectionalLight(0xFFFFFF);
    light.intensity = 2;
    light.position.set(1, 1, 1);
    scene.add(light);

    // // render box
    // renderer.render(scene, camera);

    tick();
    
    function tick() {
        requestAnimationFrame(tick);

        box.rotation.x += 0.01;
        box.rotation.y += 0.01;

        renderer.render(scene, camera);
    }

}