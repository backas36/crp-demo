/**
 * Demo 2: transform/opacity vs top/left
 *
 * 對應優化條目：使用 transform / opacity 代替 top/left
 * 講解重點：top/left 觸發 Layout + Paint + Composite，transform 只觸發 Composite
 * 預期數據：兩版肉眼可能看不出差異（電腦快），但 DevTools Performance panel
 *           火焰圖差異明顯：top/left 版有紫色（Layout）+ 綠色（Paint），transform 版只有黃色（Composite）
 *
 * 實作策略：
 * - 兩版都用 useRef + requestAnimationFrame 跑動畫 loop（消除 React render 影響）
 * - 唯一差異：style.left/top vs style.transform
 * - 100 個元素同時動畫（壓力測試）
 */
import { useEffect, useRef, useState } from 'react';
import { DemoLayout, CompareGrid, type DemoMeta } from '../components/DemoLayout';

const PARTICLE_COUNT = 100;

export const meta: DemoMeta = {
  title: 'Demo 2：transform/opacity vs top/left',
  optimizationItem: '使用 transform / opacity 代替 top/left',
  takeaway: '動畫只動 transform / opacity，繞過 layout/paint，讓瀏覽器 GPU 處理。',
  devtoolsTip: (
    <ul>
      <li>
        <strong>Performance panel</strong>：錄製 5 秒，比較兩邊火焰圖
        <ul>
          <li>BEFORE：每幀有紫色（Layout）+ 綠色（Paint）+ 黃色（Composite）</li>
          <li>AFTER：每幀只有黃色（Composite）</li>
        </ul>
      </li>
      <li>
        <strong>Layers panel</strong>：Cmd+Shift+P → 「Show Layers」
        <ul>
          <li>AFTER 版的元素會被 promote 為獨立 GPU layer</li>
        </ul>
      </li>
    </ul>
  ),
  cpuThrottleTip: '⚠️ 電腦太快肉眼看不出差異，請務必開 CPU 4x slowdown 才有感',
  expectedData: 'BEFORE 每幀觸發 Layout + Paint，AFTER 只觸發 Composite（事件數量差異）',
};

interface ParticleProps {
  useTransform: boolean;
}

/**
 * 100 個粒子做圓周運動
 * 兩版差異：style.left/top vs style.transform
 */
function ParticleField({ useTransform }: ParticleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const refs = useRef<HTMLDivElement[]>([]);
  const rafRef = useRef<number | null>(null);

  // ← 動畫 loop：兩版唯一差異是 style 寫法
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      frame += 1;
      const angle = frame * 0.02;

      for (let i = 0; i < refs.current.length; i++) {
        const el = refs.current[i];
        if (!el) continue;
        // 圓周運動，每個粒子相位差
        const phase = (i / PARTICLE_COUNT) * Math.PI * 2;
        const x = Math.cos(angle + phase) * 80 + 100;
        const y = Math.sin(angle + phase) * 80 + 100;

        if (useTransform) {
          // ✅ AFTER: transform → 只觸發 Composite (GPU)
          el.style.transform = `translate(${x}px, ${y}px)`;
        } else {
          // ❌ BEFORE: left/top → 觸發 Layout + Paint + Composite
          el.style.left = `${x}px`;
          el.style.top = `${y}px`;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [useTransform]);

  return (
    <div ref={containerRef} className="particle-field">
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            if (el) refs.current[i] = el;
          }}
          className={useTransform ? 'particle particle-transform' : 'particle particle-position'}
        />
      ))}
    </div>
  );
}

export function Demo2() {
  // 分開控制 BEFORE / AFTER，方便獨立錄 trace 比較
  const [runningBefore, setRunningBefore] = useState(true);
  const [runningAfter, setRunningAfter] = useState(true);

  return (
    <DemoLayout meta={meta}>
      <div className="demo-controls-row">
        <button
          type="button"
          onClick={() => setRunningBefore((r) => !r)}
          className="run-btn"
        >
          {runningBefore ? '⏸ 停 BEFORE' : '▶️ 跑 BEFORE'}
        </button>
        <button
          type="button"
          onClick={() => setRunningAfter((r) => !r)}
          className="run-btn"
        >
          {runningAfter ? '⏸ 停 AFTER' : '▶️ 跑 AFTER'}
        </button>
        <p className="hint">分開控制可獨立錄 trace 比較單側成本</p>
      </div>

      <CompareGrid
        beforeLabel="❌ BEFORE: style.left / top"
        afterLabel="✅ AFTER: style.transform"
        before={
          runningBefore ? (
            <ParticleField useTransform={false} />
          ) : (
            <div className="particle-field particle-field-paused">已暫停</div>
          )
        }
        after={
          runningAfter ? (
            <ParticleField useTransform={true} />
          ) : (
            <div className="particle-field particle-field-paused">已暫停</div>
          )
        }
      />
    </DemoLayout>
  );
}
