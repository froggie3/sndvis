# メモリリーク修正レポート

## 🔍 発見した問題

### 原因
ヒープスナップショット分析により、**p5.js Color オブジェクトの大量生成**が原因であることが判明しました。

- **問題の文字列**: `"rgb(39.216% 0.81419% 100%)"`
- **発生箇所**: `p.fill(hue, sat, bri)` が毎フレーム呼ばれるたび
- **影響規模**: 
  - 512ノード × 9ステージ = 4,608回/フレーム
  - 60FPS × 4,608 = **約276,000個のColorオブジェクト/秒**
  - 3分で **約5,000万個** のオブジェクトが作成され、GCが追いつかない

---

## ✅ 実施した修正

### 1. ComplexArray のオブジェクト再利用（前回の修正）

**ファイル**: `src/domain/fft-processor.ts`

```typescript
// ❌ 修正前: 毎フレーム新しいオブジェクトを作成
nextBuffer[evenIdx] = { re: ..., im: ... };

// ✅ 修正後: 既存オブジェクトのプロパティを更新
nextBuffer[evenIdx].re = evenVal.re + tRe;
nextBuffer[evenIdx].im = evenVal.im + tIm;
```

**効果**: Complex オブジェクトの作成が **0個** に削減

---

### 2. Color オブジェクトのキャッシュと再利用（今回の修正）

**ファイル**: `src/visualizer/strategies/ConcreteStrategies.ts`

#### 変更内容

各ColorStrategyクラスに以下を追加：

1. **Colorオブジェクトのキャッシュフィールド**
   ```typescript
   private cachedColor: p5.Color | null = null;
   ```

2. **setup()でColorオブジェクトを1回だけ作成**
   ```typescript
   setup(p: p5, config: ButterflyVisualizerConfig): void {
       p.colorMode(p.HSB, 360, 100, 100, 100);
       this.cachedColor = p.color(0, 0, 0); // ✅ 1回だけ作成
   }
   ```

3. **apply()でキャッシュされたColorの値を更新**
   ```typescript
   apply(p: p5, context: ColorContext, config: ButterflyVisualizerConfig): void {
       // 色の計算
       const hue = ...;
       const sat = ...;
       const bri = ...;
       
       // ✅ 既存のColorオブジェクトの値を更新
       if (this.cachedColor) {
           (this.cachedColor as any)._array[0] = hue;
           (this.cachedColor as any)._array[1] = sat;
           (this.cachedColor as any)._array[2] = bri;
           (this.cachedColor as any)._array[3] = 100; // Alpha
           p.fill(this.cachedColor);
       }
   }
   ```

**対象ストラテジー**:
- `BrightnessMapStrategy` (RGB mode)
- `PhaseHueStrategy` (HSB mode)
- `FreqGradientStrategy` (HSB mode)

---

### 3. ButterflyVisualizerの初期化修正

**ファイル**: `src/visualizer/ButterflyVisualizer.ts`

#### 変更1: p5インスタンスの保存
```typescript
private p5Instance: p5 | null = null;

setup(p: p5, width: number, height: number): void {
    this.p5Instance = p; // ✅ 保存
    this.colorStrategy.setup(p, this.config); // ✅ Colorキャッシュを初期化
}
```

#### 変更2: ストラテジー切り替え時の再初期化
```typescript
importSettings(settings: ButterflyVisualizerConfig): void {
    this.config = { ...settings };
    this.colorStrategy = ColorStrategyFactory.getStrategy(this.config.colorMode);
    
    // ✅ 新しいストラテジーのColorキャッシュを初期化
    if (this.p5Instance) {
        this.colorStrategy.setup(this.p5Instance, this.config);
    }
}
```

#### 変更3: draw()内の不要なsetup()削除
```typescript
// ❌ 削除: 毎フレームsetup()を呼ぶのは不要
// this.colorStrategy.setup(p, this.config);
```

---

## 📊 期待される改善効果

| 項目 | 修正前 | 修正後 |
|------|--------|--------|
| **Colorオブジェクト作成数/秒** | ~276,000個 | **3個** (ストラテジーごとに1個) |
| **Complexオブジェクト作成数/秒** | ~245,000個 | **0個** |
| **合計オブジェクト作成数/秒** | ~521,000個 | **3個** |
| **メモリ使用量** | 指数的に増加 | **安定** |
| **RAF処理時間** | 50ms → 2348ms | **~5-10ms** |
| **動作時間** | 3分でクラッシュ | **無制限** |

---

## 🧪 検証方法

### 1. メモリプロファイル（Chrome DevTools）
1. F12 → Memory タブ
2. Heap snapshot を以下のタイミングで取得：
   - 起動直後
   - 30秒後
   - 60秒後
3. "Comparison" モードでスナップショットを比較
4. **確認**: `String` の増加が大幅に減少しているか

### 2. パフォーマンス監視（コンソールログ）
```
📊 Memory Diagnostics: {
  heap: "85.23 MB / 180.00 MB"  // ✅ 安定している
  fps: "60.0"                   // ✅ 安定している
}
```

### 3. 長時間稼働テスト
- **以前**: 3分でクラッシュ
- **修正後**: 5分以上安定動作すること

---

## 🎯 技術的なポイント

### p5.js Color オブジェクトの内部構造

p5.jsのColorオブジェクトは内部的に `_array` プロパティを持ち、色成分を配列で管理しています：

```typescript
// HSB mode: _array = [hue, saturation, brightness, alpha]
// RGB mode: _array = [red, green, blue, alpha]
```

`setRed()`, `setGreen()`, `setBlue()` メソッドはRGBモードで使用でき、HSBモードでは `_array` を直接操作する必要があります。

### なぜ毎回 new Color を作成していたのか

`p.fill(h, s, b)` は、内部で以下のように動作します：

```javascript
// p5.js internal
fill(v1, v2, v3) {
  const color = this.color(v1, v2, v3); // ← 毎回新しいColorオブジェクトを作成
  this._renderer.fill(color);
}
```

このため、事前に作成したColorオブジェクトを渡すことで、新しいオブジェクトの作成を回避できます。

---

## 📝 今後の注意点

1. **新しいColorStrategyを追加する場合**
   - 必ず `cachedColor` フィールドを追加
   - `setup()` でキャッシュを初期化
   - `apply()` でキャッシュを再利用

2. **draw()内でstrategy.setup()を呼ばない**
   - setup()は最初に1回だけ呼ぶこと
   - 毎フレーム呼ぶとキャッシュが再作成される

3. **メモリ診断ツールの継続利用**
   - `MemoryDiagnostics` で異常を早期発見
   - 本番環境では削除またはコメントアウト可能
