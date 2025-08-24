// =============== 3) 回転正規化（最小ID開始＋辞書順） ==========
/**
 * 同じ巡回でも開始位置が違うだけの差を吸収し、キーとして一意な配列にする。
 * ルール: 最小IDが現れる位置のうち、辞書順で最小になる回転を採用。
 */

export function canonicalizeCycleMinId(face) {
    const m = face.length;
    let k = 0;
    for (let i=1; i<m; i++) if (face[i] < face[k]) k = i;
    const out = new Array(m)
    for (let i = 0; i < m; i++) out[i] = face[(k + i) % m];
    return out;
}