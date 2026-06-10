/**
 * Demo 4: setState vs ref + rAF 動畫
 *
 * 對應優化條目：
 *   ① requestAnimationFrame 代替 setTimeout
 *   ② 高頻動畫繞過 React → ref + rAF 直接操作 DOM
 *
 * 講解重點：
 *   - setState 高頻 (60次/秒) → 觸發 React reconcile + commit → 排程開銷大
 *   - ref + rAF → 直接寫 DOM，繞過 reconciler，跟 frame 對齊
 * 預期數據：BEFORE 30~45 fps（明顯卡頓） vs AFTER 穩定 60 fps
 *
 * 實作策略：
 * - 100 個元素同時動畫
 * - 用 toggle 切換誰在跑（同時跑會互相干擾 FPS）
 * - useFps hook 即時顯示當前 FPS
 */
import { useEffect, useRef, useState } from 'react';
import { DemoLayout, type DemoMeta } from '../components/DemoLayout';
import { useFps } from '../utils/measure';

const PARTICLE_COUNT = 100;

export const meta: DemoMeta = {
  title: 'Demo 4：setState vs ref + rAF 動畫',
  optimizationItem: '① rAF 代替 setTimeout　② 高頻動畫繞過 React',
  takeaway: '高頻動畫繞過 React，直接碰 ref。React 排程有成本。',
  devtoolsTip: (
    <ul>
      <li>畫面右上有即時 FPS 顯示</li>
      <li>
        <strong>Rendering panel</strong>：Cmd+Shift+P → 「Show frames per second
        meter」開啟 DevTools 內建 FPS meter 對照
      </li>
      <li>切換 BEFORE / AFTER 觀察 FPS 差異</li>
      <li>Performance panel 看 BEFORE 版有大量 React commit 事件</li>
    </ul>
  ),
  cpuThrottleTip: '⚠️ 電腦快可能 BEFORE 也跑滿 60 fps，建議 CPU 4x slowdown',
  expectedData: 'BEFORE 30~45 fps（卡頓） / AFTER 穩定 60 fps',
};

/**
 * ❌ BEFORE: setInterval + setState
 * 每 16ms setState → React reconcile → 100 個元素全部 re-render → commit
 */
function BeforeAnimation() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      // ← setState 高頻，每次都讓 React 重新跑整棵 component tree
      setTick((t) => t + 1);
    }, 16);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="anim-field">
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
        const phase = (i / PARTICLE_COUNT) * Math.PI * 2;
        const x = Math.cos(tick * 0.05 + phase) * 60 + 80;
        const y = Math.sin(tick * 0.05 + phase) * 60 + 80;
        return (
          <div
            key={i}
            className="anim-particle anim-particle-bad"
            // ← 每幀都觸發 React render → 寫 inline style
            style={{ transform: `translate(${x}px, ${y}px)` }}
          />
        );
      })}
    </div>
  );
}

/**
 * ✅ AFTER: useRef + requestAnimationFrame
 * 完全繞過 React，直接寫 ref.current.style，跟 frame 對齊
 */
function AfterAnimation() {
  const refs = useRef<HTMLDivElement[]>([]);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      frame += 1;
      for (let i = 0; i < refs.current.length; i++) {
        const el = refs.current[i];
        if (!el) continue;
        const phase = (i / PARTICLE_COUNT) * Math.PI * 2;
        const x = Math.cos(frame * 0.05 + phase) * 60 + 80;
        const y = Math.sin(frame * 0.05 + phase) * 60 + 80;
        // ← 直接寫 DOM，不經過 React
        el.style.transform = `translate(${x}px, ${y}px)`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="anim-field">
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            if (el) refs.current[i] = el;
          }}
          className="anim-particle anim-particle-good"
        />
      ))}
    </div>
  );
}

export function Demo4() {
  const [mode, setMode] = useState<'before' | 'after' | null>(null);
  const fps = useFps();

  return (
    <DemoLayout meta={meta}>
      <div className="demo-controls-row">
        <button
          type="button"
          className={`run-btn ${mode === 'before' ? 'run-btn-active' : ''}`}
          onClick={() => setMode('before')}
        >
          ❌ 跑 BEFORE（setState）
        </button>
        <button
          type="button"
          className={`run-btn ${mode === 'after' ? 'run-btn-active' : ''}`}
          onClick={() => setMode('after')}
        >
          ✅ 跑 AFTER（ref + rAF）
        </button>
        <button type="button" className="run-btn" onClick={() => setMode(null)}>
          ⏸ 停止
        </button>
        <p className="hint">兩版分開跑避免互相干擾 FPS</p>
      </div>

      <div className="fps-display">
        <span className="fps-label">即時 FPS：</span>
        <span
          className={`fps-value ${
            fps >= 55 ? 'fps-good' : fps >= 30 ? 'fps-mid' : 'fps-bad'
          }`}
        >
          {fps}
        </span>
      </div>

      <div className="anim-stage">
        {mode === 'before' && <BeforeAnimation />}
        {mode === 'after' && <AfterAnimation />}
        {mode === null && <div className="anim-empty">點上方按鈕開始動畫</div>}
      </div>
    </DemoLayout>
  );
}
