# 伝達関数 UI 定義仕様書

## 1. 概要

本仕様書は、入力値を特定のアルゴリズムに基づいて変換し、出力値を得るための伝達関数UIのデータ構造およびロジックを定義する。ユーザーは3つの制御点（p0, p1, p2）を操作し、変換カーブを直感的にカスタマイズできる。

## 2. データ構造定義 (TypeScript)

UIの状態管理および外部出力に使用する型定義。

```typescript
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

```

---

## 3. 計算ロジック (マッピング処理)

入力値 `v` を出力値 `y` に変換するプロセスは以下の3ステップで行う。

### ステップ1：入力の正規化

入力範囲 `[inMin, inMax]` における `v` の位置を比率 `t` (0.0 ～ 1.0) に変換する。

```text
t = clamp((v - inMin) / (inMax - inMin), 0.0, 1.0)

```

### ステップ2：カーブ変換

選択された `type` とパラメータ `p2` を用いて、比率 `t` を `t_prime` へ変換する。

| アルゴリズム (`type`) | 特徴 | 計算式 (JavaScript/TypeScriptイメージ) |
| --- | --- | --- |
| **power** (Default) | 指数的な重み付け | `t_prime = Math.pow(t, Math.pow(2, p2 * 5))` |
| **sigmoid** | S字/逆S字カーブ | `k = p2 * 10; t_prime = 1 / (1 + Math.exp(-k * (t - 0.5)))` |
| **sine** | 正弦波による歪み | `f = 1 + Math.abs(p2) * 2; t_prime = 0.5 * (1 + Math.sin(Math.PI * (t * f - 0.5)))` |
| **step** | 階段状の離散化 | `steps = Math.floor(Math.abs(p2) * 10) + 1; t_prime = Math.floor(t * steps) / steps` |

### ステップ3：線形補間 (Lerp)

変換された比率 `t_prime` を `p0` と `p1` の範囲にマッピングする。

```text
y = p0 + (p1 - p0) * t_prime

```

---

## 4. UI/UX 仕様

### パラメータの挙動

* **p0**: グラフの左端（入力最小値時）の垂直位置を制御。
* **p1**: グラフの右端（入力最大値時）の垂直位置を制御。
* **p2**: 中央付近での曲線の「たわみ（歪み）」を制御。
* `p2 = 0` の時は、原則として p0 と p1 を結ぶ直線となる。



### Vue コンポーネント設計方針

* **Props**: `modelValue (TransferFunctionConfig)`
* **Emits**: `update:modelValue`
* **描画**: p5.js を使用し、設定値に基づいたプレビュー曲線をリアルタイムに描画する。
