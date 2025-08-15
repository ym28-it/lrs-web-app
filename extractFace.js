import { vecSub, vecAdd, vecCross, vecDot, vecNorm, vecScale, normalize } from "./vectorFuncs.js";

export function extractFace(u, v, position, graph, rot, edgeFns, opts = {}) {
    const { orders, idxMap } = rot;
    const { isUsed, setUsed } = edgeFns;

    console.log(`extractFace orders: ${orders}`);
    console.log(`extractFace idxMap: ${idxMap}`);

    const eps = opts.eps ?? 1e-7;
    const scale = opts.scale ?? estimateScale(position);
    const maxHops = opts.maxHops ?? graph.length * 10;
    const tiny = 1e-12;

    if (isUsed(u, v)) {
        console.log(`extractFace check: u=${u} v=${v} is already used`);
        return null;
    }

    const face = [];

    let n = null;
    let a0 = u;

    let a = u, b = v;
    let hops = 0;

    while (true) {
        face.push(b);

        setUsed(a, b);

        const list = orders[b];
        if (!list || list.length === 0) return null;

        const idx = idxMap[b].get(a);
        if (idx === undefined) return null;

        let c = undefined;

        for (let k = 1; k <= list.length; k++) {
            const cand = list[(idx + k) % list.length];

            const ab = vecSub(position[b], position[a]);
            const bc = vecSub(position[cand], position[b]);
            let nTmp = vecCross(ab, bc);
            const len = vecNorm(nTmp);

            if (len < tiny) continue;

            nTmp = vecScale(nTmp, 1 / len);

            if (n === null) {
                n = nTmp;
                a0 = a;
            } else {
                if (vecDot(nTmp, n) < 0) nTmp = vecScale(nTmp, -1);
                n = normalize(vecAdd(n, nTmp));
            }

            const dist = Math.abs(vecDot(n, vecSub(position[cand], position[a0])));
            if (dist <= eps * scale) {
                c = cand;
                break;
            }
        }

        if (c === undefined) {
            return null;
        }

        const next_u = b;
        const next_v = c;

        if (next_u === u && next_v === v) break;

        a = next_u;
        b = next_v;

        if (++hops > maxHops) return null;
    }

    return face;
}

function estimateScale(pos) {
    let minx = Infinity, miny = Infinity, minz = Infinity;
    let maxx = -Infinity, maxy = -Infinity, maxz = -Infinity;
    for (const p of pos) {
        if (p[0] < minx) minx = p[0]; if (p[0] > maxx) maxx = p[0];
        if (p[1] < miny) miny = p[1]; if (p[1] > maxy) maxy = p[1];
        if (p[2] < minz) minz = p[2]; if (p[2] > maxz) maxz = p[2];
    }
    const dx = maxx - minx;
    const dy = maxy - miny;
    const dz = maxz - minz;
    return Math.hypot(dx, dy, dz) || 1.0;
}