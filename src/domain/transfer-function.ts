/**
 * カーブアルゴリズムの種類
 */
export type CurveType = 'power' | 'sigmoid' | 'sine' | 'step';

/**
 * 伝達関数の設定データ
 */
export interface TransferFunctionConfig {
    p0: number;        // 開始点 (x=0) の出力値 [-1.0, 1.0]
    p1: number;        // 終了点 (x=1) の出力値 [-1.0, 1.0]
    p2: number;        // 曲線のバイアス/強度 [-1.0, 1.0]
    type: CurveType;   // 適用するアルゴリズムの識別子
}

/**
 * 値を一定の範囲内に制限する
 */
function clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
}

/**
 * 伝達関数を適用して入力値を変換する
 * 
 * @param v 入力値
 * @param inMin 入力最小値
 * @param inMax 入力最大値
 * @param config 伝達関数の設定
 * @returns 変換後の値
 */
export function calculateTransferFunction(
    v: number,
    inMin: number,
    inMax: number,
    config: TransferFunctionConfig
): number {
    const { p0, p1, p2, type } = config;

    // ステップ1：入力の正規化
    const t = clamp((v - inMin) / (inMax - inMin), 0.0, 1.0);

    // ステップ2：カーブ変換
    let t_prime = t;
    switch (type) {
        case 'power':
            t_prime = Math.pow(t, Math.pow(2, p2 * 5));
            break;
        case 'sigmoid': {
            const k = p2 * 10;
            if (Math.abs(k) < 0.0001) {
                t_prime = t; // k=0の時は線形に近いが、計算上の安定性のために
            } else {
                t_prime = 1 / (1 + Math.exp(-k * (t - 0.5)));
                // 0.0-1.0の範囲に再スケーリング（シグモイドは完全に0,1にならないため）
                const s0 = 1 / (1 + Math.exp(-k * (0 - 0.5)));
                const s1 = 1 / (1 + Math.exp(-k * (1 - 0.5)));
                t_prime = (t_prime - s0) / (s1 - s0);
            }
            break;
        }
        case 'sine': {
            const f = 1 + Math.abs(p2) * 2;
            t_prime = 0.5 * (1 + Math.sin(Math.PI * (t * f - 0.5)));
            break;
        }
        case 'step': {
            const steps = Math.floor(Math.abs(p2) * 10) + 1;
            t_prime = Math.floor(t * steps) / steps;
            break;
        }
    }

    // ステップ3：線形補間 (Lerp)
    return p0 + (p1 - p0) * t_prime;
}
