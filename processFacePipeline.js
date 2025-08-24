import { extractFace } from './extractFace.js';
import { ensureOutwardCCW } from './exsureOutwardCCW.js';
import { canonicalizeCycleMinId } from './canonicalizeCycleMinId.js';
import { triangulateFan } from './triangulateFan.js';


// =============== 5) パイプライン（1面処理） ====================
/**
 * extractFace(u,v,...) で輪郭を取り、
 *   外向きCCW化 → 回転正規化 → 三角形化
 * までを実行。重複面は faceSeen で抑止。
 */
export function processFacePipeline(u, v, positions, p_in, rot, edgeFns, faceSeen) {
    // ① 面輪郭を1周
    const raw = extractFace(u, v, rot, edgeFns, { eps:1e-7 });

    if (!raw) {
        console.log(`extractFace(${u}, ${v}) failed`);
        return null;
    }

    console.log('raw:\n', raw);

    // ② 外向きCCW化
    const ccw = ensureOutwardCCW(positions, p_in, raw);

    console.log('ccw:\n', ccw);

    // ③ 回転正規化（開始位置を一意化）
    const canon = canonicalizeCycleMinId(ccw);

    console.log('canon:\n', canon);

    // ④ 重複面の抑止（辞書キー化）
    const faceKey = canon.join(",");
    if (faceSeen.has(faceKey)) {
        return null; // 既出
    }
    faceSeen.add(faceKey);

    // ⑤ 扇分割（対角線はグローバルには登録しない：面ローカル）
    const triangles = triangulateFan(canon);

    return { face: canon, triangles: triangles };
}