

/**
 * Build position array from V-representation (homogeneous coordinates).
 * Keeps only rows whose first entry is 1, drops the first entry, pads to 3D if needed.
 * @param {number[][]} VRep
 * @param {{padTo3?: boolean}=} opts
 * @returns {number[][]}
 */
function buildPositionFromV(VRep, { padTo3 = true } = {}) {
    if (!Array.isArray(VRep)) return [];
    const out = [];
    for (const row of VRep) {
        if (!Array.isArray(row) || row.length < 2) continue;
        // if (row[0] !== 1) continue;
        // インデックス0が0の場合、半直線がその頂点から出ていると判断
        // スキップせずにそのまま頂点として記録して、別データで半直線ように識別できるようにしておく
        // 半直線は辺の描画時に判断
        let spatial = row.slice(1);
        if (spatial.length === 2 && padTo3) {
            spatial = [spatial[0], spatial[1], 0];
        }
        out.push(spatial);
    }
    return out;
}

function spatialNormal(coeffs) {
    return Array.isArray(coeffs) ? coeffs.slice(1) : [];
}


function rankOf(A, tol = 1e-10) {
    const m = A.length;
    if (m === 0) return 0;
    const n = A[0].length;
    const M = A.map(r => r.slice());
    let r = 0, lead = 0;
    for (let i = 0; i < m && lead < n; i++) {
        // pivot
        let piv = i;
        for (let j = i; j < m; j++) {
            if (Math.abs(M[j][lead]) > Math.abs(M[piv][lead])) piv = j;
        }
        if (Math.abs(M[piv][lead]) <= tol) {
            lead++;
            i--;
            continue;
        }
        // swap
        [M[i], M[piv]] = [M[piv], M[i]];
        // normalize
        const div = M[i][lead];
        for (let k = lead; k < n; k++) M[i][k] /= div;
        // eliminate
        for (let j = 0; j < m; j++) {
            if (j === i) continue;
            const factor = M[j][lead];
            if (Math.abs(factor) > tol) {
                for (let k = lead; k < n; k++) {
                    M[j][k] -= factor * M[i][k];
                }
            }
        }
        r++;
        lead++;
    }
    return r;
}


function addUndirectedEdge(graph, u, v) {
    if (u === v) return;
    const gu = graph[u], gv = graph[v];
    if (!gu.includes(v)) gu.push(v);
    if (!gv.includes(u)) gv.push(u);
}


/**
 * Build graph (adjacency list) from incidence + H + V + dimension.
 * - incidence が raw 行（{kind:'facet'|'vertex', ...}）なら kind で自動分岐
 * - incidence が number[][]（facet→vertex 配列）なら V 由来として扱う
 * @param {any[]|number[][]} incidence
 * @param {number[][]} H
 * @param {number[][]} V
 * @param {number} d
 * @returns {number[][]}
 */
function buildGraph(incidence, H, V, d) {
    const nVertices = Array.isArray(V) ? V.length : 0;
    const graph = Array.from({ length: nVertices }, () => []);
    if (!Array.isArray(incidence) || incidence.length === 0) return graph;

    const first = incidence[0];

    // 1) raw 行（parseDataDetailed の IncidenceRow）が来た場合
    if (first && typeof first === 'object' && ('kind' in first)) {
        const hasFacet = incidence.some(r => r && r.kind === 'facet');
        const hasVertex = incidence.some(r => r && r.kind === 'vertex');
        if (hasFacet) {
            return buildGraphFromVIncidence(incidence.filter(r => r.kind === 'facet'), H, V, d);
        } else if (hasVertex) {
            return buildGraphFromHIncidence(incidence.filter(r => r.kind === 'vertex'), H, V, d);
        }
        return graph;
    }

    // 2) すでに facet→頂点の number[][] な簡易形式（V 由来）として与えられた場合
    if (Array.isArray(first)) {
        const rows = incidence.map((arr, idx) => ({
            kind: 'facet', id: idx, cobasis: arr, basis: [], starred: new Set()
        }));
        return buildGraphFromVIncidence(rows, H, V, d);
    }

    return graph;
}


/**
 * H 由来 incidence（頂点行）→ 無向グラフ
 * rows: [{kind:'vertex', id, cobasis:[], basis:[], ...}, ...]
 */
function buildGraphFromHIncidence(rows, H, V, d) {
    const nVertices = Array.isArray(V) ? V.length : 0;
    const graph = Array.from({ length: nVertices }, () => []);

    // 1) 頂点ごとの tight 不等式集合 T[i]
    /** @type {Map<number, Set<number>>} */
    const tightSets = new Map();
    for (const r of rows) {
        const i = r.id;
        if (i < 0 || i >= nVertices) continue; // V と index を揃える
        const set = tightSets.get(i) ?? new Set();
        for (const j of (r.cobasis || [])) set.add(j);
        for (const j of (r.basis || [])) set.add(j);
        // 星印は parse 前に除外されている前提（混じっていたら外す）
        if (r.starred && r.starred.size) {
            for (const s of r.starred) set.delete(s);
        }
        tightSets.set(i, set);
    }

    // 2) 逆引き：不等式 j → その上にある頂点リスト
    const mIneq = Array.isArray(H) ? H.length : 0;
    const verticesOfIneq = Array.from({ length: mIneq }, () => []);
    for (const [vtx, set] of tightSets.entries()) {
        for (const j of set) {
            if (j >= 0 && j < mIneq) verticesOfIneq[j].push(vtx);
        }
    }

    // 3) 候補ペアの共起カウント（共通本数 >= d−1 を候補に）
    /** @type {Map<string, number>} */
    const pairCount = new Map();
    function bump(u, v) {
        const a = Math.min(u, v), b = Math.max(u, v);
        const key = a + "," + b;
        pairCount.set(key, (pairCount.get(key) ?? 0) + 1);
    }
    for (const vs of verticesOfIneq) {
        for (let a = 0; a < vs.length; a++) {
            for (let b = a + 1; b < vs.length; b++) bump(vs[a], vs[b]);
        }
    }

    // 4) ランク判定で確定
    for (const [key, co] of pairCount.entries()) {
        if (co < d - 1) continue; // まずは粗い足切り
        const [u, v] = key.split(',').map(Number);
        const Tu = tightSets.get(u) || new Set();
        const Tv = tightSets.get(v) || new Set();
        const common = [];
        for (const j of Tu) if (Tv.has(j)) common.push(j);
        if (common.length < d - 1) continue;

        const normals = [];
        for (const j of common) {
            const row = H[j];
            if (Array.isArray(row)) normals.push(spatialNormal(row));
        }
        if (normals.length < d - 1) continue;

        const r = rankOf(normals);
        if (r === d - 1) addUndirectedEdge(graph, u, v);
    }

    return graph;
}

/**
 * V 由来 incidence（ファセット行）→ 無向グラフ
 * rows: [{kind:'facet', id, cobasis:[], basis:[], starred:Set, ...}, ...]
 */
function buildGraphFromVIncidence(rows, H, V, d) {
    const nVertices = Array.isArray(V) ? V.length : 0;
    const graph = Array.from({ length: nVertices }, () => []);

    // V の行のうち「先頭が 1（= 頂点）」のみ有効（ray を除外）
    function isFiniteVertex(idx) {
        return idx >= 0 && idx < nVertices && Array.isArray(V[idx]) && V[idx][0] === 1;
    }

    // 1) 頂点→所属ファセット集合 F[i]
    /** @type {Map<number, Set<number>>} */
    const vertexToFacets = new Map();
    for (const r of rows) {
        const f = r.id;
        const starred = r.starred || new Set();
        const vs = new Set([...(r.cobasis || []), ...(r.basis || [])]);
        for (const s of starred) vs.delete(s); // 星付きはこの面には“不在”
        for (const v of vs) {
            if (!isFiniteVertex(v)) continue; // ray や欠損を除外
            const set = vertexToFacets.get(v) ?? new Set();
            set.add(f);
            vertexToFacets.set(v, set);
        }
    }

    // 2) 共起で候補ペア抽出（各ファセットで全頂点ペアに +1）
    /** @type {Map<string, number>} */
    const pairCount = new Map();
    function bump(u, v) {
        const a = Math.min(u, v), b = Math.max(u, v);
        const key = a + "," + b;
        pairCount.set(key, (pairCount.get(key) ?? 0) + 1);
    }
    for (const r of rows) {
        const starred = r.starred || new Set();
        const vsArr = [...new Set([...(r.cobasis || []), ...(r.basis || [])])]
            .filter(v => !starred.has(v))
            .filter(isFiniteVertex);
        for (let i = 0; i < vsArr.length; i++) {
            for (let j = i + 1; j < vsArr.length; j++) bump(vsArr[i], vsArr[j]);
        }
    }

    // 3) ランク判定で確定
    for (const [key, co] of pairCount.entries()) {
        if (co < d - 1) continue;
        const [u, v] = key.split(',').map(Number);
        const Fu = vertexToFacets.get(u) || new Set();
        const Fv = vertexToFacets.get(v) || new Set();

        const commonFacets = [];
        for (const f of Fu) if (Fv.has(f)) commonFacets.push(f);
        if (commonFacets.length < d - 1) continue;

        const normals = [];
        for (const f of commonFacets) {
            const row = H[f];
            if (Array.isArray(row)) normals.push(spatialNormal(row));
        }
        if (normals.length < d - 1) continue;

        const r = rankOf(normals);
        if (r === d - 1) addUndirectedEdge(graph, u, v);
    }

    return graph;
}


import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
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
    let dimension;

    if (input.includes("H-representation")) {
        // let parsedInput = parseDataCompat(input, false, true);
        let parsedInput = _extractBeginEndLines(input);
        let parsedOutput = parseDataCompat(output, true, false);
        HRep = [];
        for (const line of parsedInput) {
            if (_isNumericRow(line)) {
                const nums = _parseNumericRow(line);
                if (nums.length > 0) {
                    HRep.push(nums);
                }
            }
        }
        VRep = parsedOutput.result;
        incidence = parsedOutput.incidenceRows;
        
        dimension = parsedOutput.dimension;
        position = buildPositionFromV(VRep, { padTo3: dimension === 2 ? true : false });
        console.log('H:\n', HRep);
        console.log('V:\n', VRep);
        console.log('incidence:\n', incidence);
        console.log('position:\n', position);
        console.log('dimension:\n', dimension);

    } else if (input.includes("V-representation")) {
        // let parsedInput = parseDataCompat(input, true, false);
        let parsedInput = _extractBeginEndLines(input);
        let parsedOutput = parseDataCompat(output, false, true);
        VRep = [];
        for (const line of parsedInput) {
            if (_isNumericRow(line)) {
                const nums = _parseNumericRow(line);
                if (nums.length > 0) {
                    VRep.push(nums);
                }
            }
        }

        HRep = parsedOutput.result;
        incidence = parsedOutput.incidenceRows;
        dimension = parsedOutput.dimension;
        position = buildPositionFromV(VRep, { padTo3: dimension === 2 ? true : false });
        console.log('H:\n', HRep);
        console.log('V:\n', VRep);
        console.log('incidence:\n', incidence);
        console.log('position:\n', position);
        console.log('dimension:\n', dimension);

    } else {
        console.error("Invalid input/output format in visualize.js");
        return false;
    }

    graph = buildGraph(incidence, HRep, VRep, dimension);

    // position is already padded to 3D by parseDataCompat/buildPositionFromParseDataDetailed

    // buildHalfEdge
    const edgeFns = buildHalfEdges(graph);

    const p_in = getPointInPolytope(position);
    console.log('p_in:\n', p_in);

    // buildRadialOrders
    const rot = buildRadialOrders(position, graph, p_in);

    // buildAllFacesAndTriangles
    const { faces, triangles } = buildAllFacesAndTriangles(position, p_in, graph, rot, edgeFns);
    console.log('faces:\n', faces);
    console.log('triangles:\n', triangles);
    console.log('graph:\n', graph);

    executeVisualization(position, triangles, p_in, edgeFns.edges);

    // console.log('H:\n', H);
    // console.log('V:\n', V);
    // console.log('incidence:\n', incidence);

    const resultH = listToString(HRep);
    const resultV = listToString(VRep);

    // console.log('resultH:\n', resultH);
    // console.log('resultV:\n', resultV);

    return { resultH, resultV, incidence };

}


/** -------------------------
 *  Detailed incidence parser (example implementation)
 *  - Keeps basis/cobasis separated
 *  - Normalizes indices to 0-based
 *  - Pairs incidence rows with the following numeric row via (kind,id)
 *  - Safe for both H-input (vertices/rays incidence) and V-input (facets incidence)
 *  NOTE: This is an example implementation and is NOT wired into getVHData().
 *        You can try it by calling parseDataDetailed(data, {isV:..., isH:...}).
 * ------------------------- */

/** @typedef {{ kind:'vertex'|'ray'|'facet', id:number, cobasis:number[], basis:number[], starred:Set<number>, I:number|null, rawLine:string }} IncidenceRow */
/** @typedef {{ kind:'vertex'|'facet', id:number, values:number[], rawLine:string }} ValueRow */

/** Extract lines inside begin...end (trimmed, empty lines removed) */
function _extractBeginEndLines(data) {
    const begin = data.lastIndexOf("begin");
    const end = data.lastIndexOf("end");
    if (begin === -1 || end === -1 || end <= begin) return [];
    const body = data.slice(begin + "begin".length, end).split("\n");
    return body.map(s => s.trim()).filter(s => s.length > 0);
}

/** Header: ***** &lt;homDim&gt; rational  -> returns spatial dimension d = homDim - 1 */
function _parseHeaderDimension(line) {
  // e.g., "***** 3 rational"
    const m = line.match(/^\*+\s+(\d+)\s+rational/i);
    if (!m) return null;
    const homDim = parseInt(m[1], 10);
    if (!Number.isFinite(homDim)) return null;
    return homDim - 1;
}

/** Returns {kind, id} if the line is an incidence header, else null */
function _matchIncidenceKindId(line) {
  // V#n / R#m / F#k at start
    const m = line.match(/^(V|R|F)#\s*(\d+)/);
    if (!m) return null;
    const tag = m[1];
    const id1 = parseInt(m[2], 10);
    if (!Number.isFinite(id1)) return null;
    const id = id1 - 1; // normalize to 0-based
    const kind = tag === 'V' ? 'vertex' : (tag === 'R' ? 'ray' : 'facet');
    return { kind, id };
}

/** Extract the middle "incidence payload" ... tokens between 'facets' or 'vertices/rays' and 'I#' */
function _extractIncidencePayload(line) {
    // Find anchor 'facets' or 'vertices/rays'
    const anchor = line.includes("facets") ? "facets" : (line.includes("vertices/rays") ? "vertices/rays" : null);
    if (!anchor) return { payload: "", I: null };

    // Slice from anchor to I# or end
    const after = line.slice(line.indexOf(anchor) + anchor.length).trim();
    const iPos = after.search(/\bI#\s*\d+/);
    const core = iPos >= 0 ? after.slice(0, iPos).trim() : after;

    // I# value
    let I = null;
    const Im = line.match(/\bI#\s*(\d+)/);
    if (Im) I = parseInt(Im[1], 10);

    return { payload: core, I };
}

/** Parse left:right sides, collecting starred tokens into Set and excluding from arrays */
function _parseBasisCobasis(payload) {
    const parts = payload.split(":");
    const left = (parts[0] || "").trim();
    const right = (parts[1] || "").trim();

    function parseSide(s) {
        if (!s) return { arr: [], starred: [] };
        const tokens = s.split(/\s+/).filter(Boolean);
        const arr = [];
        const starred = [];
        for (const t of tokens) {
            const m = t.match(/^(\d+)(\*)?$/);
            if (!m) continue;
            const idx0 = parseInt(m[1], 10) - 1; // normalize to 0-based
            if (m[2] === "*") {
                starred.push(idx0);
            } else {
                arr.push(idx0);
            }
        }
        return { arr, starred };
    }

    const leftP = parseSide(left);
    const rightP = parseSide(right);

    // If there was no ":", the single side is conceptually cobasis in lrs docs.
    if (parts.length === 1) {
        return {
        cobasis: leftP.arr,
        basis: [],
        starred: new Set(leftP.starred)
        };
    }

    return {
        cobasis: leftP.arr,
        basis: rightP.arr,
        starred: new Set([...leftP.starred, ...rightP.starred])
    };
}

/** Numeric-only row (usual value row right after an incidence line) */
function _isNumericRow(line) {
    // allow spaces and numbers, optional signs & decimals, but reject words
    return /^[\s\+\-0-9.eE]+$/.test(line);
}

/** Parse a numeric row into number[] */
    function _parseNumericRow(line) {
    return line.trim().split(/\s+/).filter(Boolean).map(Number);
}

/**
 * Example parser that returns:
 *   {
 *     dimension: d,
 *     incidence: IncidenceRow[],
 *     values: ValueRow[],
 *     H: number[][], // homogeneous, only filled when kind === 'facet'
 *     V: number[][]  // homogeneous, only filled when kind === 'vertex'
 *   }
 * This does not modify existing getVHData flow; it's provided as a ready-to-use example.
 */
function parseDataDetailed(data, { isV = false, isH = false } = {}) {
    const lines = _extractBeginEndLines(data);
    if (lines.length === 0) return { dimension: null, incidence: [], values: [], H: [], V: [] };

    // First non-empty should be header; if not, attempt best-effort
    let dim = _parseHeaderDimension(lines[0]);
    let i = (dim !== null) ? 1 : 0;

    // Fallback: if header missing, try to infer from first numeric value row later
    const incidence = /** @type {IncidenceRow[]} */([]);
    const values = /** @type {ValueRow[]} */([]);
    const H = [];
    const V = [];

    let pending = null; // last parsed incidence {kind,id} awaiting numeric row

    for (; i < lines.length; i++) {
        const line = lines[i];

        // Try to match an incidence header row
        const head = _matchIncidenceKindId(line);
        if (head) {
            const { payload, I } = _extractIncidencePayload(line);
            const { cobasis, basis, starred } = _parseBasisCobasis(payload);
            const row = {
                kind: head.kind,
                id: head.id,
                cobasis,
                basis,
                starred,
                I: (I ?? null),
                rawLine: line
            };
            incidence.push(row);
            pending = { kind: head.kind, id: head.id };
            continue;
        }

    // If numeric, pair with the last incidence (if any)
        if (_isNumericRow(line)) {
            const nums = _parseNumericRow(line);
            if (dim === null && nums.length > 0) {
                // infer spatial dim from homogeneous length
                dim = nums.length - 1;
            }
            if (pending) {
                const val = { kind: pending.kind === 'ray' ? 'vertex' : pending.kind, id: pending.id, values: nums, rawLine: line };
                values.push(val);
                // Also populate H/V buckets
                if (pending.kind === 'facet') {
                    H[pending.id] = nums;
                } else if (pending.kind === 'vertex') {
                    V[pending.id] = nums;
                } else if (pending.kind === 'ray') {
                // rays are not vertices but we store their numeric row if needed later
                // (do nothing special here)
                }
                pending = null;
                continue;
            }
        }

        // Other lines (e.g., comments like det=, z= already consumed in header rows) -> ignore
    }

    return { dimension: dim, incidence, values, H, V };
}

/** Small demo of how to use parseDataDetailed (not executed):
 *
 *   const parsed = parseDataDetailed(outputText, { isV: true, isH: false });
 *   // parsed.incidence -> array of {cobasis, basis, starred, kind, id, I}
 *   // parsed.values    -> pair rows with same (kind,id)
 *   // parsed.V / parsed.H -> homogeneous rows by id
 *   // parsed.dimension -> spatial dimension
 */


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


function getPointInPolytope(position) {

    let p_in = Array.from({ length: position[0].length }, () => 0);
    for ( let vertex of position) {
        for (let i = 0; i < vertex.length; i++) {
            p_in[i] += vertex[i];
        }
    }

    p_in = p_in.map(x => x / position.length);
    return p_in;
}


function executeVisualization(position, indices, p_in, edges) {
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
        0.01,
        100000
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

    console.log('position:\n', position);
    
    const vertices = new Float32Array(position.length * 3);
    for (let i = 0; i < position.length; i++) {
        vertices[i * 3] = position[i][0];
        vertices[i * 3 + 1] = position[i][1];
        vertices[i * 3 + 2] = position[i][2];
    }
    console.log('vertices:\n', vertices);

    geometry.setIndex( indices );
    geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );

    geometry.computeBoundingSphere();
    const bs = geometry.boundingSphere;
    const radius = bs ? bs.radius : 1;
    const center = bs ? bs.center : new THREE.Vector3(0, 0, 0);


    const vFOV = THREE.MathUtils.degToRad(camera.fov);
    const fitMargin = 1.3;
    let dist = (radius * fitMargin) / Math.sin(vFOV / 2);
    if (!Number.isFinite(dist) || dist <= 0) dist = 1000;
    // camera.position.set(0, 0, dist);
    // camera.lookAt(0, 0, 0);

    camera.position.copy(center).add(new THREE.Vector3(0, 0, dist));
    camera.lookAt(center);
    camera.updateProjectionMatrix();

    const material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
    // const material = new THREE.MeshStandardMaterial({color: 0x0000FF});

    const box = new THREE.Mesh(geometry, material);

    // if (Array.isArray(p_in) && p_in.length >= 3) {
    //     box.position.set(-p_in[0], -p_in[1], -p_in[2]);
    // }

    const edgeGeometry = new THREE.BufferGeometry();
    edgeGeometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
    edgeGeometry.setIndex(new THREE.BufferAttribute( new Uint16Array(edges), 1 ));
    const lines = new THREE.LineSegments( edgeGeometry, new THREE.LineBasicMaterial({ color: 0xffffff }));


    const axesHelper = new THREE.AxesHelper( 500 );


    scene.add(box);
    scene.add(lines);
    scene.add(axesHelper);

    // control light
    const light = new THREE.DirectionalLight(0xFFFFFF);
    light.intensity = 2;
    light.position.set(1, 1, 1);
    scene.add(light);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    // controls.target.set(0, 0, 0);
    controls.dampingFactor = 0.08;
    controls.target.copy(center);
    controls.update();
    tick();
    
    function tick() {
        requestAnimationFrame(tick);

        controls.update();

        renderer.render(scene, camera);
    }
}

// --- Final override: compat wrapper that mirrors original parseData shape ---
function parseDataCompat(data, V, H) {
    const parsed = parseDataDetailed(data, { isV: V, isH: H });
    if (!parsed) return { result: [], incidence: [], position: [], dimension: 0, incidenceRows: [] };
    console.log('parsed:\n', parsed);

    const result = (Array.isArray(parsed.V) && parsed.V.length) ? parsed.V : parsed.H || [];
    const position = buildPositionFromV(result, { padTo3: true });
    const dimension = parsed.dimension ?? (position[0] ? position[0].length : 0);

    // ここは従来どおり「facet → 頂点配列」に簡約（V由来の時に効く）
    const incidence = Array.isArray(parsed.incidence)
        ? parsed.incidence
            .filter(row => row && row.kind === 'facet')
            .map(row => {
                const set = new Set([...(row.cobasis || []), ...(row.basis || [])]);
                if (row.starred && row.starred.size) {
                    for (const s of row.starred) set.delete(s);
                }
                return Array.from(set).sort((a, b) => a - b);
            })
        : [];

    const incidenceRows = parsed.incidence || []; // ★ 生の行（kind='vertex' も保持）

    return { result, incidence, position, dimension, incidenceRows };
}