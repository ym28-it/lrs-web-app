import { vecSub, vecAdd, vecCross, vecDot, vecNorm, vecScale, normalize, projectPlane, anyPerp } from "./vectorFuncs.js";

export function buildRadialOrders(position, graph, p_in) {
    const N = graph.length;
    const orders = Array.from({length:N}, ()=>[]);
    const idxMap = Array.from({length:N}, ()=>new Map());

    for (let v = 0; v < N; v++) {
        const o = normalize(vecSub(position[v], p_in));
        const e1 = anyPerp(o);
        const e2 = vecCross(o, e1);

        const arr = [];
        for (const w of graph[v]) {
            const d = normalize(vecSub(position[w], position[v]));
            let dp = projectPlane(d, o);
            const L = vecNorm(dp);
            const theta = L < 1e-12 ? +Infinity : Math.atan2((e2, dp)/L, vecDot(e1, dp)/L);
            arr.push({w, theta});
        }
        arr.sort((a, b) => a.theta - b.theta);
        orders[v] = arr.map(o=>o.w);
        const m = idxMap[v];
        for (let i = 0; i < orders[v].length; i++) m.set(orders[v][i], i);
    }

    const nextLeft = (v, a) => {
        const list = orders[v];
        const idx = idxMap[v].get(a);
        return list[(idx + 1) % list.length];
    };

    return { orders, idxMap, nextLeft};
}