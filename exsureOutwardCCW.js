// =============== 2) 外向きCCWの保証 ===========================
/**
 * 外向きCCWへ並び替え。
 * ポリトープ重心 p_in から面重心 c_face へのベクトルと Newell 法線 n の内積で向きを判定。
 * 内積 < 0 なら反転（=向きが内向きだった）
 */
export function ensureOutwardCCW(positions, p_in, face) {
    if (!face || face.length < 3) return face;
    const n = newellNormal(positions, face);
    const c = faceCentroid(positions, face);
    const outwardHint = vSub(c, p_in); // 内点→面重心（外向きヒント）
    const sign = vDot(n, outwardHint);
    if (sign < 0) {
        // 反転して外向きCCWに揃える
        const rev = [...face].reverse();
        return rev;
    }
    return face;
}