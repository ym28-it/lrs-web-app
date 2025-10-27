export { vecSub, vecAdd, vecDot, vecCross, vecNorm, vecScale, normalize, projectPlane, anyPerp }


const vecSub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const vecAdd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const vecDot = (a, b) => [a[0] * b[0] + a[1] * b[1] + a[2] * b[2]];
const vecCross = (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
];
const vecNorm = (a) => Math.hypot(a[0], a[1], a[2]);
const vecScale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const normalize = (a) => {
    const n = vecNorm(a);
    return n > 1e-12 ? [a[0] / n, a[1] / n, a[2] / n] : [0, 0, 0];
};
const projectPlane = (v, n) => {
    const c = vecDot(v, n);
    return [v[0]-c*n[0], v[1]-c*n[1], v[2]-c*n[2]];
};
const anyPerp = (n) => {
    const ax = Math.abs(n[0]) < 0.9 ? [1,0,0] : (Math.abs(n[1]) < 0.9 ? [0,1,0] : [0,0,1]);
    let e1 = projectPlane(ax, n);
    e1 = normalize(e1);
    if (vecNorm(e1) < 1e-12) e1 = [1,0,0];
    return e1;
};