/**
 * Demo 6: Layer 濫用（私房 demo，不公開展示）
 *
 * 對應優化條目：避免濫用 position fixed/absolute、will-change（layer 過多）
 * 講解重點：
 *   - 每個 will-change: transform 元素會被 promote 為獨立 GPU layer
 *   - 過多 layer → GPU memory 爆炸 → 反而拖累
 * 預期數據：JS 拿不到 GPU memory，需開 DevTools Layers panel 肉眼比較
 *
 * 實作策略：
 * - 滑桿選 0~500 個 will-change 元素
 * - 純展示，不做量測
 * - 提示去開 Cmd+Shift+P → Show Layers
 *
 * ⚠️ 此 demo 為自學用，分享時不展示，用 Layers panel 截圖代替
 */
import { useState } from 'react';
import { DemoLayout, type DemoMeta } from '../components/DemoLayout';

const MAX_LAYERS = 500;

export const meta: DemoMeta = {
  title: 'Demo 6：Layer 濫用（私房 demo）',
  optimizationItem: '避免濫用 position fixed/absolute（layer 過多，記憶體炸）',
  takeaway: '只給真正會頻繁變動的元素 will-change。其他元素留在主 layer。',
  privateNote: '此 demo 為自學用，分享時不展示。用 Layers panel 截圖 + 30 秒口頭代替',
  devtoolsTip: (
    <ul>
      <li>
        <strong>Cmd+Shift+P → 「Show Layers」</strong> 開 Layers panel
        <ul>
          <li>滑桿改變 will-change 元素數量，觀察 layer 數量變化</li>
        </ul>
      </li>
      <li>
        <strong>Memory tab</strong>：拍 heap snapshot 比較記憶體
      </li>
      <li>
        <strong>chrome://gpu</strong>：查看 GPU process 狀態
      </li>
      <li>建議用 Chrome 而非 Safari（Layers panel 比較完整）</li>
    </ul>
  ),
  expectedData: 'JS 無法取得 GPU memory 數據，需 DevTools 肉眼比較 layer 數量',
};

export function Demo6() {
  const [count, setCount] = useState(50);

  return (
    <DemoLayout meta={meta}>
      <div className="demo-controls-row demo6-controls">
        <label className="demo6-slider-label">
          Will-change 元素數量：<strong>{count}</strong>
        </label>
        <input
          type="range"
          min={0}
          max={MAX_LAYERS}
          step={10}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="demo6-slider"
        />
        <p className="hint">
          每個元素都加 <code>will-change: transform</code>，會被 promote 為獨立 GPU layer
        </p>
      </div>

      <div className="demo6-stage">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="demo6-layer-item"
            // ← 直接 inline style 設 will-change，每個都會 promote layer
            style={{
              willChange: 'transform',
              transform: `translate(${(i % 25) * 24}px, ${Math.floor(i / 25) * 24}px)`,
            }}
          />
        ))}
      </div>

      <div className="demo6-note">
        <p>
          <strong>觀察方式</strong>：開 Cmd+Shift+P → 「Show Layers」，拖動滑桿時 layer 數量會即時變化
        </p>
        <p>
          <strong>實驗</strong>：滑桿從 0 → {MAX_LAYERS}，觀察 GPU memory 增長（chrome://gpu 或活動監視器）
        </p>
      </div>
    </DemoLayout>
  );
}
