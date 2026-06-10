/**
 * 共用量測工具
 *
 * - measureSync: 量同步 code 執行時間 (ms)
 * - measureWithReflow: 量同步 code + 強制觸發 reflow 的時間
 * - useFps: React hook，即時顯示 FPS
 * - median: 取中位數，多次量測去抖動用
 */
import { useEffect, useRef, useState } from 'react';

/**
 * 量同步 code 執行時間，回傳毫秒數
 */
export function measureSync(fn: () => void): number {
  const t0 = performance.now();
  fn();
  return performance.now() - t0;
}

/**
 * 量同步 code 並強制觸發一次 reflow（讀 offsetHeight）
 * 用於確保我們量到的是「JS + reflow」整段時間
 */
export function measureWithReflow(fn: () => void): number {
  const t0 = performance.now();
  fn();
  // 強制觸發 reflow，確保前面的 DOM 操作真的算到 layout
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  document.body.offsetHeight;
  return performance.now() - t0;
}

/**
 * 取中位數。多次量測去抖動，避免單次值受 GC / 背景任務干擾
 */
export function median(nums: number[]): number {
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * useFps hook
 *
 * 用 requestAnimationFrame 累積 frame 數，每秒結算一次當前 FPS
 * 觀眾應該看：動畫卡頓時這個數字會明顯下降
 */
export function useFps(): number {
  const [fps, setFps] = useState(0);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => {
      frameCountRef.current += 1;
      const now = performance.now();
      const elapsed = now - lastTimeRef.current;

      // 每秒結算一次
      if (elapsed >= 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / elapsed));
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return fps;
}
