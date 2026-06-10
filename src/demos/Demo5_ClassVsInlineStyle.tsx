/**
 * Demo 5: class 切換 vs 逐項 style
 *
 * 對應優化條目：減少逐項更改樣式 → class 一次切換
 * 講解重點：
 *   - 逐項設 inline style 觸發多次 style recalculation
 *   - 加一個 class 一次套用所有屬性，瀏覽器只 recalc 一次
 * 預期數據：差距較不戲劇化（現代瀏覽器有 batch 機制），但 BEFORE 仍會略慢
 *           典型差距 1.5~3x
 *
 * 實作策略：
 * - 1000 個元素
 * - BEFORE: forEach 設 5 個 inline style 屬性
 * - AFTER: forEach 加一個 class（CSS 內定義同樣 5 屬性）
 */
import { useRef, useState } from 'react';
import { DemoLayout, type DemoMeta } from '../components/DemoLayout';
import { measureSync } from '../utils/measure';

const ELEMENT_COUNT = 5000;

export const meta: DemoMeta = {
  title: 'Demo 5：class 切換 vs 逐項 style',
  optimizationItem: '減少逐項更改樣式 → class 一次切換',
  takeaway: '樣式變動用 class 一次套，不要逐項改 inline style。',
  devtoolsTip: (
    <ul>
      <li>Performance panel 觀察 'Recalculate Style' 事件次數</li>
      <li>BEFORE 會觸發更多 style recalc，AFTER 一次搞定</li>
    </ul>
  ),
  cpuThrottleTip: '⚠️ 差距較小，建議開 CPU 6x slowdown 才會明顯',
  expectedData: 'BEFORE / AFTER 差距約 1.5~3x（不如 demo 3 戲劇化）',
};

export function Demo5() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [beforeMs, setBeforeMs] = useState<number | null>(null);
  const [afterMs, setAfterMs] = useState<number | null>(null);

  /**
   * 重置所有元素樣式，確保兩次測試起點一致
   */
  const reset = () => {
    const container = containerRef.current;
    if (!container) return [];
    const elements = Array.from(container.children) as HTMLElement[];
    elements.forEach((el) => {
      el.removeAttribute('style');
      el.className = 'demo5-cell';
    });
    // 強制 reflow，確保起點乾淨
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    container.offsetHeight;
    return elements;
  };

  /**
   * ❌ BEFORE: 逐項設 5 個 inline style
   * 每個 element 設 5 次 style，N 個元素就是 N×5 次屬性寫入
   */
  const runBefore = () => {
    const elements = reset();
    const ms = measureSync(() => {
      elements.forEach((el) => {
        // ← 逐項寫，每次都標記 style 變動
        el.style.width = '40px';
        el.style.height = '40px';
        el.style.backgroundColor = '#aa3bff';
        el.style.borderRadius = '8px';
        el.style.opacity = '0.8';
      });
    });
    setBeforeMs(ms);
  };

  /**
   * ✅ AFTER: 加一個 class，CSS 內定義 5 屬性
   * 瀏覽器只需 match 一次 class，套用整批屬性
   */
  const runAfter = () => {
    const elements = reset();
    const ms = measureSync(() => {
      elements.forEach((el) => {
        // ← 一次切 class，瀏覽器 match 一次套全部屬性
        el.classList.add('demo5-cell-styled');
      });
    });
    setAfterMs(ms);
  };

  const speedup =
    beforeMs !== null && afterMs !== null && afterMs > 0
      ? (beforeMs / afterMs).toFixed(1)
      : null;

  return (
    <DemoLayout meta={meta}>
      <div className="demo-controls-row">
        <button type="button" className="run-btn run-btn-bad" onClick={runBefore}>
          ❌ 跑 BEFORE（5 個 inline style）
        </button>
        <button type="button" className="run-btn run-btn-good" onClick={runAfter}>
          ✅ 跑 AFTER（一個 class）
        </button>
        <p className="hint">{ELEMENT_COUNT} 個元素，每次跑都會重置樣式</p>
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

      <div ref={containerRef} className="demo5-grid">
        {Array.from({ length: ELEMENT_COUNT }).map((_, i) => (
          <div key={i} className="demo5-cell" />
        ))}
      </div>
    </DemoLayout>
  );
}
