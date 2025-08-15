import * as THREE from 'three';
import { buildHalfEdges } from './buildHalfEdges.js';
import { buildRadialOrders } from './buildRadialOrders.js';
import { buildAllFacesAndTriangles } from './buildAllFacesAndTriangles.js';

export function getVHData(output) {
    const inputArea = document.getElementById('inputArea');
    const input = inputArea.value;
    // console.log('inputs:\n', input);

    let HRep;
    let VRep;
    let incidence;
    let graph = [];
    let position = [];

    if (input.includes("H-representation")) {
        let parsedInput = parseData(input, false, true);
        let parsedOutput = parseData(output, true, false);
        HRep = parsedInput.result;
        VRep = parsedOutput.result;
        incidence = parsedOutput.incidence;
        position = parsedOutput.position;
        console.log('H:\n', HRep);
        console.log('V:\n', VRep);
        console.log('incidence:\n', incidence);
        console.log('position:\n', position);

        const edges = parseHtoVIncidence(VRep.slice(1), incidence);
        graph = parseIncidence(edges);

    } else if (input.includes("V-representation")) {
        let parsedInput = parseData(input, true, false);
        let parsedOutput = parseData(output, false, true);
        VRep = parsedInput.result;
        HRep = parsedOutput.result;
        incidence = parsedOutput.incidence;
        position = parsedInput.position;
        console.log('H:\n', HRep);
        console.log('V:\n', VRep);
        console.log('incidence:\n', incidence);
        console.log('position:\n', position);

        graph = parseIncidence(incidence);

    } else {
        console.error("Invalid input/output format in visualize.js");
        return false;
    }

    // buildHalfEdge
    const halfEdge = buildHalfEdges(graph);
    const edgeFns = {
        isUsed: halfEdge.isUsed,
        setUsed: halfEdge.setUsed,
    }

    const p_in = getPointInPolytope(VRep.slice(1));

    // buildRadialOrders
    const radialOrders = buildRadialOrders(position, graph, p_in);
    const rot = {orders: radialOrders.orders, idxMap: radialOrders.idxMap}

    // buildAllFacesAndTriangles
    const { faces, triangles } = buildAllFacesAndTriangles(position, p_in, graph, rot, edgeFns);
    console.log('faces:\n', faces);
    console.log('triangles:\n', triangles);


    executeVisualization(position, faces);

    // console.log('H:\n', H);
    // console.log('V:\n', V);
    // console.log('incidence:\n', incidence);

    const resultH = listToString(HRep);
    const resultV = listToString(VRep);

    // console.log('resultH:\n', resultH);
    // console.log('resultV:\n', resultV);

    return { resultH, resultV, incidence };

}

function parseData(data, V, H) {
    const begin = data.lastIndexOf("begin") + 6;
    const end = data.lastIndexOf("end") - 1;
    
    let input = data.substring(begin, end).split("\n");
    let incidence = [];
    let result = [];
    let dimension = 1;
    let position = [];

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
            if (V) {
                const start = line.indexOf("facets") + 1;
                const end = start + dimension -1;
                line = line.slice(start, end);
            } else if (H) {
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
            if (V) {
                position.push(line.slice(1));
            }
        }
    }

    // console.log('result', result);
    // console.log('incidence', incidence);
    return {result, incidence, position};
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


function generateIndices(V, graph) {
    if (!V) {
        console.error("Vertices not provided for sorting.");
        return;
    }
    if (!graph) {
        console.error("Graph not provided for sorting.");
        return;
    }
    const vertices = V.slice(1);
    const p_in = getPointInPolytope(vertices);
    const {isUsed, setUsed} = generateUsedEdgeFuncs(graph);

}


function getPointInPolytope(vertices) {
    let sumArray = Array.from({length: vertices[0].length - 1}, () => 0);
    for (let vertex of vertices) {
        if (vertex[0] === 1) {
            for (let i=1; i < V.length; i++) {
                sumArray[i-1] += vertex[i];
            }
        }
    }

    sumArray = sumArray.map((x) => x / vertices.length);

    return sumArray;
}



function getFaceCenter(vertices) {
    let sumArray = Array.from({length: vertices[0].length}, () => 0);
    for (let vertex of vertices) {
        for (let i=0; i < V.length; i++) {
            sumArray[i] += vertex[i];
        }
    }

    sumArray = sumArray.map((x) => x / vertices.length);

    return sumArray;
}


function getVector(base, target) {
    if (base.length !== target.length) {
        console.log('base and target length are not same');
        return;
    }

    const vector = [];
    for (let i = 0; i < base.length; i++) {
        vector[i] = target[i] - base[i];
    }

    return vector;
}


function executeVisualization(position, indices) {
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

    // const vertices = new Float32Array( [
    //     0, 0,  0, // v0
    //     500, 0,  0, // v1
    //     500,  0,  500, // v2
    //     0,  0,  500, // v3
    // ] );

    // const indices = [
    //     0, 1, 2,
    //     2, 0, 3,
    // ];

    const vertices = new Float32Array(position.length * 3);
    for (let i = 0; i < position.length; i++) {
        vertices[i * 3] = position[i][0];
        vertices[i * 3 + 1] = position[i][1];
        vertices[i * 3 + 2] = position[i][2];
    }

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