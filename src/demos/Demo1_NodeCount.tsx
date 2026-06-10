/**
 * Demo 1: DOM 節點數 vs CRP 時間
 *
 * 對應優化條目：（動機 demo，不對應任何單一優化條目）
 * 講解重點：Reflow 成本 ∝ DOM 節點數，所以才需要優化
 * 預期數據：節點數遞增時，layout 時間呈線性上升（不同機器絕對值差異大）
 *
 * 用途：作為整場分享的開場動機 demo。讓觀眾相信「節點越多越慢」。
 *
 * 實作策略：
 * - 不透過 React 渲染（避免 React reconcile 成本影響量測）
 * - 直接 document.createElement + appendChild
 * - 用 measureWithReflow 包住，強制讀 offsetHeight 觸發 layout
 * - 跑 5 次取中位數去抖動
 */
import { useRef, useState } from "react";
import { DemoLayout, type DemoMeta } from "../components/DemoLayout";
import { measureWithReflow, median } from "../utils/measure";

const NODE_COUNTS = [100, 1000, 5000, 10000] as const;

interface MeasureResult {
  count: number;
  ms: number;
}

export const meta: DemoMeta = {
  title: "Demo 1：DOM 節點數 vs CRP 時間",
  optimizationItem: "（動機 demo）為何要優化 reflow / repaint",
  takeaway: "Reflow 成本 ∝ DOM 節點數。所以後面所有優化才有意義。",
  devtoolsTip: (
    <ul>
      <li>開 Performance panel → 錄製 → 點任一節點數按鈕 → 停止錄製</li>
      <li>觀察 Layout 事件的 duration，節點越多越長</li>
      <li>火焰圖中紫色塊（Layout）會明顯變胖</li>
    </ul>
  ),
  cpuThrottleTip: "電腦快可開 CPU 4x slowdown，數據放大會更戲劇化",
  expectedData: "線性上升趨勢，大約 100 → 0.5ms、10000 → 30~80ms（M 系列 Mac）",
};

export function Demo1() {
  const sandboxRef = useRef<HTMLDivElement>(null);
  const [results, setResults] = useState<MeasureResult[]>([]);
  const [running, setRunning] = useState(false);

  /**
   * 量測單一節點數的 layout 時間
   * 跑 5 次取中位數
   */
  const runMeasure = (count: number) => {
    const sandbox = sandboxRef.current;
    if (!sandbox) return 0;

    const samples: number[] = [];
    for (let trial = 0; trial < 5; trial++) {
      // 清空 sandbox
      sandbox.textContent = "";
      // 量測：建立 N 個 div + 強制 reflow
      const ms = measureWithReflow(() => {
        // ← 用 document.createElement 而非 React，避免 reconcile 干擾
        for (let i = 0; i < count; i++) {
          const div = document.createElement("div");
          div.className = "demo1-node";
          div.textContent = String(i);
          sandbox.appendChild(div);
        }
        // ← measureWithReflow 內會強制讀 offsetHeight 觸發 layout
      });
      samples.push(ms);
    }
    // 跑完清空，避免影響下次
    sandbox.textContent = "";
    return median(samples);
  };

  const handleRunAll = async () => {
    setRunning(true);
    setResults([]);
    const newResults: MeasureResult[] = [];
    for (const count of NODE_COUNTS) {
      // ← 觀眾應該看：每個節點數測完後 results 表格逐步更新
      const ms = runMeasure(count);
      newResults.push({ count, ms });
      setResults([...newResults]);
      // 給瀏覽器一點時間繪製，避免量測互相干擾
      await new Promise((r) => setTimeout(r, 100));
    }
    setRunning(false);
  };

  // 計算 bar chart 用的最大值
  const maxMs = results.length > 0 ? Math.max(...results.map((r) => r.ms)) : 1;

  return (
    <DemoLayout meta={meta}>
      <div className="demo1-controls">
        <button
          type="button"
          onClick={handleRunAll}
          disabled={running}
          className="run-btn"
        >
          {running ? "量測中..." : "🚀 跑全部（100 → 10000）"}
        </button>
        <p className="hint">每個節點數量會跑 5 次取中位數</p>
      </div>

      {results.length > 0 && (
        <div className="demo1-results">
          <h4>結果</h4>
          <table className="result-table">
            <thead>
              <tr>
                <th>節點數</th>
                <th>Layout 時間 (ms)</th>
                <th>視覺化</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.count}>
                  <td>{r.count.toLocaleString()}</td>
                  <td>{r.ms.toFixed(2)}</td>
                  <td className="bar-cell">
                    <div
                      className="bar"
                      style={{ width: `${(r.ms / maxMs) * 100}%` }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* sandbox：實際渲染 N 個 div 的區域，量測完即清空 */}
      <div ref={sandboxRef} className="demo1-sandbox" aria-hidden="true" />
    </DemoLayout>
  );
}
