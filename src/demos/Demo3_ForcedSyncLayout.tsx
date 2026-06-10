/**
 * Demo 3: Forced Synchronous Layout
 *
 * 對應優化條目：避免強制同步佈局 (Forced Synchronous Layout)
 * 講解重點：DOM 讀寫分離，不要交錯。讀（offsetHeight 等）會強制觸發 layout 計算
 * 預期數據：bad ~150~300ms vs good ~3~10ms（30~50x 差距）
 *
 * 實作策略：
 * - 1000 個元素，渲染後執行 before / after 邏輯
 * - 量 performance.now() 顯示 ms 對比
 * - DevTools Performance panel 會看到紅色三角警告 'Forced reflow'
 */
import { useRef, useState } from 'react';
import { DemoLayout, type DemoMeta } from '../components/DemoLayout';
import { measureSync } from '../utils/measure';

const ELEMENT_COUNT = 1000;

export const meta: DemoMeta = {
  title: 'Demo 3：Forced Synchronous Layout',
  optimizationItem: '避免強制同步佈局（DOM 讀寫分離）',
  takeaway: 'DOM 讀寫分離，不要交錯。先全讀，再全寫。',
  devtoolsTip: (
    <ul>
      <li>開 Performance panel → 錄製 → 點 BEFORE 按鈕 → 停止</li>
      <li>
        <strong>觀察紅色三角警告</strong>：「Forced reflow is a likely performance bottleneck」
      </li>
      <li>BEFORE 版會看到 1000 個小 layout 事件，AFTER 版只有 1~2 個</li>
    </ul>
  ),
  cpuThrottleTip: '不需要 throttle 也會看到明顯差異（30~50x）',
  expectedData: 'BEFORE: ~150~300ms / AFTER: ~3~10ms（差距 30~50 倍）',
};

export function Demo3() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [beforeMs, setBeforeMs] = useState<number | null>(null);
  const [afterMs, setAfterMs] = useState<number | null>(null);

  /**
   * 取得所有元素，重置 height 後回傳 NodeList
   * 避免兩次測試之間 height 互相污染
   */
  const getAndResetElements = (): HTMLElement[] => {
    const container = containerRef.current;
    if (!container) return [];
    const elements = Array.from(container.children) as HTMLElement[];
    // 重置高度，避免上次測試影響
    elements.forEach((el) => {
      el.style.height = '';
    });
    // 強制觸發一次 reflow，確保起點乾淨
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    container.offsetHeight;
    return elements;
  };

  /**
   * ❌ BEFORE: 讀寫交錯
   * 每次寫 style.height 後，下一個 iteration 讀 offsetHeight 都會強制 layout
   */
  const runBefore = () => {
    const elements = getAndResetElements();
    const ms = measureSync(() => {
      elements.forEach((el) => {
        const h = el.offsetHeight;       // ← 讀：觸發強制同步 layout
        el.style.height = `${h * 2}px`;  // ← 寫：invalidate layout
      });
    });
    setBeforeMs(ms);
  };

  /**
   * ✅ AFTER: 讀寫分離
   * 第一階段全讀（只觸發 1 次 layout），第二階段全寫（最後 commit 統一 reflow）
   */
  const runAfter = () => {
    const elements = getAndResetElements();
    const ms = measureSync(() => {
      // 第一階段：全部讀完
      const heights = elements.map((el) => el.offsetHeight);
      // 第二階段：全部寫完
      elements.forEach((el, i) => {
        el.style.height = `${heights[i] * 2}px`;
      });
    });
    setAfterMs(ms);
  };

  // 計算放大倍數
  const speedup =
    beforeMs !== null && afterMs !== null && afterMs > 0
      ? (beforeMs / afterMs).toFixed(1)
      : null;

  return (
    <DemoLayout meta={meta}>
      <div className="demo-controls-row">
        <button type="button" className="run-btn run-btn-bad" onClick={runBefore}>
          ❌ 跑 BEFORE（讀寫交錯）
        </button>
        <button type="button" className="run-btn run-btn-good" onClick={runAfter}>
          ✅ 跑 AFTER（讀寫分離）
        </button>
        <p className="hint">{ELEMENT_COUNT} 個元素，每次跑都會重置高度</p>
      </div>

      <div className="result-row">
        <div className="result-card result-bad">
          <span className="result-label">BEFORE</span>
          <span className="result-value">
            {beforeMs !== null ? `${beforeMs.toFixed(2)} ms` : '—'}
          </span>
        </div>
        <div className="result-card result-good">
          <span className="result-label">AFTER</span>
          <span className="result-value">
            {afterMs !== null ? `${afterMs.toFixed(2)} ms` : '—'}
          </span>
        </div>
        {speedup !== null && (
          <div className="result-card result-speedup">
            <span className="result-label">放大倍數</span>
            <span className="result-value">{speedup}x</span>
          </div>
        )}
      </div>

      {/* 1000 個元素的 sandbox */}
      <div ref={containerRef} className="demo3-grid">
        {Array.from({ length: ELEMENT_COUNT }).map((_, i) => (
          <div key={i} className="demo3-cell">
            {i}
          </div>
        ))}
      </div>
    </DemoLayout>
  );
}
