// =============== 1) Newell 法線 & 面重心 ======================
/**
 * Newell法でポリゴン法線を計算（向きは頂点列に依存）
 * face: 頂点ID配列 [v0, v1, ..., vm-1]
 */
export function newellNormal(positions, face) {
    let nx=0, ny=0, nz=0;
    const m = face.length;
    for (let i=0; i<m; i++) {
        const p = positions[face[i]];
        const q = positions[face[(i+1)%m]];
        nx += (p[1] - q[1]) * (p[2] + q[2]);
        ny += (p[2] - q[2]) * (p[0] + q[0]);
        nz += (p[0] - q[0]) * (p[1] + q[1]);
    }
    const n = [nx, ny, nz];
    const L = vNorm(n);
    return L > 0 ? [nx/L, ny/L, nz/L] : [0,0,0];
}

/** 面重心（単純平均でOK） */
export function faceCentroid(positions, face) {
    let cx=0, cy=0, cz=0;
    const m = face.length;
    for (let i=0; i<m; i++) {
        const p = positions[face[i]];
        cx += p[0]; cy += p[1]; cz += p[2];
    }
    return [cx/m, cy/m, cz/m];
}