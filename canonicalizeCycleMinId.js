// =============== 3) 回転正規化（最小ID開始＋辞書順） ==========
/**
 * 同じ巡回でも開始位置が違うだけの差を吸収し、キーとして一意な配列にする。
 * ルール: 最小IDが現れる位置のうち、辞書順で最小になる回転を採用。
 */
export function canonicalizeCycleMinId(face) {
    const m = face.length;
    if (m === 0) return [];
    // 最小値を探す
    let minVal = Infinity;
    for (let i=0; i<m; i++) if (face[i] < minVal) minVal = face[i];
    // 最小値が現れる全位置を列挙
    const candidates = [];
    for (let i=0; i<m; i++) if (face[i] === minVal) candidates.push(i);

    // 回転ごとに辞書順比較
    let bestStart = candidates[0];

    const lexLessAt = (aStart, bStart) => {
        // face をそれぞれ aStart, bStart から回転した配列を辞書順比較
        for (let k=0; k<m; k++) {
        const av = face[(aStart + k) % m];
        const bv = face[(bStart + k) % m];
        if (av < bv) return true;
        if (av > bv) return false;
        }
        return false; // 同一
    };

    for (let i=1; i<candidates.length; i++) {
        const s = candidates[i];
        if (lexLessAt(s, bestStart)) bestStart = s;
    }

  // bestStart から回転した配列を返す
    const out = new Array(m);
    for (let k=0; k<m; k++) out[k] = face[(bestStart + k) % m];
    return out;
}