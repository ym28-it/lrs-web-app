
export function extractFace(u, v, rot, edgeFns, opts = {}) {
    const face = trackVertices(u, v, rot.nextLeft);
    edgeFns.markCycleUsed(face);
    return face;
}

function trackVertices(u, v, nextLeft) {
    const face = [u, v];
    function track(now, previous){
        const w = nextLeft(now, previous);
        if (face[0] === w) return face;
        face.push(w);
        return track(w, now)
    }
    track(v, u);
    return face;
}