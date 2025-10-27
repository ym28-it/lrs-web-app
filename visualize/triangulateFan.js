// =============== 4) 扇分割（三角形化） =========================
/**
 * 扇分割。face は CCW であることが前提。
 * 返り値: [[i,j,k], ...]（全てCCW）
 */
export function triangulateFan(face) {
    const m = face.length;
    if (m < 3) return [];
    const anchor = face[0];
    const tris = [];
    for (let i=1; i<m-1; i++) {
        // tris.push([anchor, face[i], face[i+1]]);
        tris.push(anchor);
        tris.push(face[i]);
        tris.push(face[i+1]);
    }
    return tris;
}