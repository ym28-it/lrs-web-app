import { processFacePipeline } from './processFacePipeline.js';


// =============== 6) 全面の抽出と三角形化 =======================
/**
 * 全有向辺を起点に走査し、面と三角形を収集。
 * 返: { faces: number[][], triangles: number[][] }
 */
export function buildAllFacesAndTriangles(positions, p_in, graph, rot, edgeFns) {
    const N = graph.length;
    const faces = [];
    const triangles = [];

    const faceSeen = new Set(); // 回転正規化キーで重複抑止

    for (let u=0; u<N; u++) {
        const nbrs = graph[u];
        for (let i=0; i<nbrs.length; i++) {
        const v = nbrs[i];

        // extractFace 側でも used チェックするが、ここでも軽く弾いて早期 continue してOK
        if (edgeFns.isUsed(u, v)) {
            console.log(`u=${u} v=${v} is already used`);
            continue;
        }

        const res = processFacePipeline(u, v, positions, p_in, graph, rot, edgeFns, faceSeen);
        if (!res) continue;

        faces.push(res.face);
        triangles.push(...res.triangles);

        // すでに extractFace 内で setUsed してあるので、
        // 同じ面の他の有向辺を起点にしても isUsed で即スキップされるはず。
        }
    }

    return { faces, triangles };
}