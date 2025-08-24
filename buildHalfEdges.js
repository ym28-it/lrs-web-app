

export function buildHalfEdges(graph) {
    const N = graph.length;
    let M = 0;
    for (let u = 0; u < N; u++) M += graph[u].length;

    const U = new Uint32Array(M);
    const V = new Uint32Array(M);
    const used = new Uint8Array(M);

    const edgeToId = Array.from({ length: N }, () => new Map());

    let eid = 0;
    for (let u = 0; u < N; u++) {
        const neighbors = graph[u];
        for (let i = 0; i < neighbors.length; i++) {
            const v = neighbors[i];
            edgeToId[u].set(v, eid);
            U[eid] = u;
            V[eid] = v;
            eid++;
        }
    }

    const getId = (u, v) => edgeToId[u].get(v);
    const isUsed = (u, v) => {
        const id = getId(u, v);
        return id !== undefined && used[id] === 1;
    };
    const setUsed = (u, v) => {
        const id = getId(u, v);
        if (id == undefined) throw new Error(`No directed edge ${u}->${v}`);
        used[id] = 1;
    };

    const markCycleUsed = (cycle) => {
        for (let i = 0; i < cycle.length; i++) {
            const a = cycle[i], b = cycle[(i + 1) % cycle.length];
            setUsed(a, b);
        }
    };

    console.log('U in buildHalfEdges:\n', U);
    console.log('V in buildHalfEdges:\n', V);

    return { U, V, used, getId, isUsed, setUsed, markCycleUsed }

}
