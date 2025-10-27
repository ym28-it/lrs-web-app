

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
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
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
        // if (i === 0) {
        //     str += list[i].join(" ") + '\n';
        //     continue;
        // } else 
        if (i === list.length-1) {
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

    // --- CSS2D renderer for tooltips (labels) ---
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(width, height);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.left = '0';
    labelRenderer.domElement.style.pointerEvents = 'none';
    // Overlay the CSS2D canvas on top of WebGL canvas
    (renderer.domElement.parentElement || document.body).appendChild(labelRenderer.domElement);

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

    // --- Common bounds for camera fit and picking thresholds ---
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

    // lineSegments
    const edgeGeometry = new THREE.BufferGeometry();
    edgeGeometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
    edgeGeometry.setIndex(new THREE.BufferAttribute( new Uint16Array(edges), 1 ));
    const lines = new THREE.LineSegments( edgeGeometry, new THREE.LineBasicMaterial({ color: 0x000000 }));
    // --- Points for vertex visualization & picking (non-indexed Points) ---
    const pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    const pointsMaterial = new THREE.PointsMaterial({ size: Math.max(radius * 0.015, 1.0), sizeAttenuation: true, color: 0x2266ff });
    const points = new THREE.Points(pointsGeometry, pointsMaterial);
    scene.add(points);

    // --- Invisible, non-indexed LineSegments for robust edge picking ---
    // Build a position array that lists each segment's two endpoints explicitly (non-indexed)
    const segCount = Math.floor(edges.length / 2);
    const ePickPos = new Float32Array(segCount * 2 * 3);
    for (let k = 0; k < segCount; k++) {
      const i1 = edges[2 * k];
      const i2 = edges[2 * k + 1];
      ePickPos.set(vertices.subarray(i1 * 3, i1 * 3 + 3), (k * 2) * 3);
      ePickPos.set(vertices.subarray(i2 * 3, i2 * 3 + 3), (k * 2 + 1) * 3);
    }
    const eIds = new Uint32Array(segCount * 2);
    for (let k = 0; k < segCount; k++) {
      eIds[k * 2] = k;
      eIds[k * 2 + 1] = k;
    }
    const pickEdgeGeometry = new THREE.BufferGeometry();
    pickEdgeGeometry.setAttribute('position', new THREE.BufferAttribute(ePickPos, 3));
    pickEdgeGeometry.setAttribute('edgeIdInt', new THREE.Uint32BufferAttribute(eIds, 1));
    const pickEdges = new THREE.LineSegments(pickEdgeGeometry, new THREE.LineBasicMaterial({ color: 0x000000 }));
    pickEdges.visible = false; // helper for picking only
    scene.add(pickEdges);

    // --- Highlight object for a single hovered edge (thin line in a distinct color) ---
    const edgeHLGeom = new THREE.BufferGeometry();
    edgeHLGeom.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(6), 3));
    const edgeHL = new THREE.LineSegments(edgeHLGeom, new THREE.LineBasicMaterial({ color: 0xff5533 }));
    edgeHL.visible = false;
    scene.add(edgeHL);

    // // axis gizmo
    // renderer.autoClear = false;
    const axisHelper = new THREE.AxesHelper( 500 );
    // const axisScene = new THREE.Scene();
    // const axisCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 10);
    // axisCamera.position.set(0, 0, 3);
    // const axisHelperMini = new THREE.AxesHelper(1.2);
    // axisScene.add(axisHelperMini);

    // function renderAxisGizmo() {
    //     axisCamera.quaternion.copy(camera.quaternion);

    //     const size = Math.floor(Math.min(renderer.domElement.width, renderer.domElement.height) * 0.18);
    //     const m = 10; // merging
    //     const rect = renderer.domElement.getBoundingClientRect();
    //     const w = rect.width, h = rect.height;

    //     renderer.clearDepth();
    //     renderer.setScissor(true);
    //     renderer.setViewport(m, h - size - m, size, size);
    //     renderer.setScissor(m, h - size - m, size, size);
    //     renderer.render(axisScene, axisCamera);

    //     renderer.setScissorTest(false);
    // }


    // local Axes
    // geometry.computeBoundingSphere();
    const localAxesCenter = geometry.boundingSphere?.center || new THREE.Vector3();
    const localAxesRadius = geometry.boundingSphere?.radius || 1;

    const AX_LOCAL = Math.max(5, localAxesRadius * 0.5);
    const axesLocal = new THREE.AxesHelper(AX_LOCAL);
    axesLocal.position.copy(localAxesCenter);
    axesLocal.renderOrder = 999;
    axesLocal.traverse(o => {
        if (o.material && 'depthTest' in o.material) o.material.depthTest = false;
    });
    scene.add(axesLocal);



    scene.add(box);
    scene.add(lines);
    scene.add(axisHelper);

    // control light
    const light = new THREE.DirectionalLight(0xffffff);
    light.intensity = 2;
    light.position.set(1, 1, 1);
    scene.add(light);

    // --- Raycaster & tooltip label setup ---
    const raycaster = new THREE.Raycaster();
    const pickThreshold = Math.max(radius * 0.02, 2.0); // world-space threshold
    raycaster.params.Points.threshold = pickThreshold;
    raycaster.params.Line.threshold = pickThreshold;

    const mouseNDC = new THREE.Vector2();
    let needsPick = false;

    // CSS2D tooltip (single DOM reused)
    const tipEl = document.createElement('div');
    tipEl.style.padding = '4px 8px';
    tipEl.style.borderRadius = '6px';
    tipEl.style.background = 'rgba(0,0,0,0.75)';
    tipEl.style.color = '#fff';
    tipEl.style.font = '12px/1.2 system-ui, sans-serif';
    tipEl.style.whiteSpace = 'pre';
    tipEl.style.pointerEvents = 'none';
    const tipObj = new CSS2DObject(tipEl);
    tipObj.visible = false;
    scene.add(tipObj);

    // Convert mouse to NDC using the renderer's canvas rect
    function updateMouseFromEvent(e) {
        const rect = renderer.domElement.getBoundingClientRect();
        const x = ( (e.clientX - rect.left) / rect.width ) * 2 - 1;
        const y = -( (e.clientY - rect.top) / rect.height ) * 2 + 1;
        mouseNDC.set(x, y);
    }

    renderer.domElement.addEventListener('mousemove', (e) => {
        updateMouseFromEvent(e);
        needsPick = true;
    });

    // Highlight helpers
    const defaultPointSize = pointsMaterial.size;
    function clearHighlight() {
        // restore point size
        pointsMaterial.size = defaultPointSize;
        pointsMaterial.needsUpdate = true;
        // hide edge highlight
        edgeHL.visible = false;
        tipObj.visible = false;
    }

    // Pick priority: vertex > edge
    function pickOnce() {
        raycaster.setFromCamera(mouseNDC, camera);
        const hits = raycaster.intersectObjects([points, pickEdges], false);
        if (!hits.length) {
            clearHighlight();
            return;
        }
        // Prefer Points first
        let best = null;
        for (const h of hits) {
            if (h.object === points) { best = h; break; }
            if (!best && h.object === pickEdges) { best = h; }
        }
        if (!best) {
            clearHighlight();
            return;
        }

        if (best.object === points) {
            const i = best.index; // vertex index
            // enlarge point temporarily
            pointsMaterial.size = defaultPointSize * 1.6;
            pointsMaterial.needsUpdate = true;

            // exact vertex position
            const pa = points.geometry.getAttribute('position');
            const vx = pa.getX(i), vy = pa.getY(i), vz = pa.getZ(i);

            tipObj.position.set(vx, vy, vz);
            tipObj.element.textContent = `Vertex #${i}\n(${vx.toFixed(3)}, ${vy.toFixed(3)}, ${vz.toFixed(3)})`;
            tipObj.visible = true;

            edgeHL.visible = false;
            return;
        }

        if (best.object === pickEdges) {
            const segIndex = Math.floor(best.index / 2);
            // build highlight segment from original vertex buffer using the edge index pair
            const i1 = edges[2 * segIndex];
            const i2 = edges[2 * segIndex + 1];
            const pa = geometry.getAttribute('position');
            const p1x = pa.getX(i1), p1y = pa.getY(i1), p1z = pa.getZ(i1);
            const p2x = pa.getX(i2), p2y = pa.getY(i2), p2z = pa.getZ(i2);

            const hlPos = edgeHL.geometry.getAttribute('position');
            hlPos.setXYZ(0, p1x, p1y, p1z);
            hlPos.setXYZ(1, p2x, p2y, p2z);
            hlPos.needsUpdate = true;
            edgeHL.visible = true;

            tipObj.position.copy(best.point);
            tipObj.element.textContent = `Edge #${segIndex}\n(v${i1} – v${i2})`;
            tipObj.visible = true;

            // restore point size if previously enlarged
            pointsMaterial.size = defaultPointSize;
            pointsMaterial.needsUpdate = true;
        }
    }

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
        if (needsPick) {
            pickOnce();
            needsPick = false;
        }
        renderer.render(scene, camera);
        labelRenderer.render(scene, camera);
        // renderAxisGizmo();
    }
    // Keep CSS2D size in sync with WebGL canvas size when the window resizes
    window.addEventListener('resize', () => {
        const rect = renderer.domElement.getBoundingClientRect();
        labelRenderer.setSize(rect.width, rect.height);
    });
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