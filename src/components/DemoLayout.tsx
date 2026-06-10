/**
 * Demo 統一外框
 *
 * 渲染標題列（標題 + 對應優化條目 + DevTools 提示 + Takeaway）
 * 內容區用 children slot，每個 demo 自己決定 before/after 怎麼擺
 */
import type { ReactNode } from 'react';

export interface DemoMeta {
  title: string;
  optimizationItem: string;
  takeaway: string;
  devtoolsTip: ReactNode;
  cpuThrottleTip?: string;
  expectedData?: string;
  privateNote?: string; // demo 6 私房 demo 的提醒
}

interface DemoLayoutProps {
  meta: DemoMeta;
  children: ReactNode;
}

export function DemoLayout({ meta, children }: DemoLayoutProps) {
  return (
    <article className="demo">
      <header className="demo-header">
        <h2 className="demo-title">{meta.title}</h2>
        <div className="demo-meta-row">
          <span className="demo-meta-label">對應優化條目</span>
          <span className="demo-meta-value">{meta.optimizationItem}</span>
        </div>
        {meta.privateNote && <div className="demo-private-note">⚠️ {meta.privateNote}</div>}
      </header>

      <section className="demo-body">{children}</section>

      <footer className="demo-footer">
        <div className="demo-tip-block">
          <h3>🔧 DevTools 操作</h3>
          <div>{meta.devtoolsTip}</div>
        </div>
        {meta.cpuThrottleTip && (
          <div className="demo-tip-block">
            <h3>🐢 CPU Throttle</h3>
            <div>{meta.cpuThrottleTip}</div>
          </div>
        )}
        {meta.expectedData && (
          <div className="demo-tip-block">
            <h3>📊 預期數據</h3>
            <div>{meta.expectedData}</div>
          </div>
        )}
        <div className="demo-takeaway">
          <strong>💡 Takeaway：</strong>
          {meta.takeaway}
        </div>
      </footer>
    </article>
  );
}

/**
 * before / after 並排容器
 * 給有明顯對照組的 demo 使用（demo 1, 2, 3, 4, 5）
 * demo 6 不對照，可不使用此元件
 */
interface CompareGridProps {
  before: ReactNode;
  after: ReactNode;
  beforeLabel?: string;
  afterLabel?: string;
}

export function CompareGrid({
  before,
  after,
  beforeLabel = '❌ BEFORE',
  afterLabel = '✅ AFTER',
}: CompareGridProps) {
  return (
    <div className="compare-grid">
      <div className="compare-col compare-before">
        <h3 className="compare-label">{beforeLabel}</h3>
        {before}
      </div>
      <div className="compare-col compare-after">
        <h3 className="compare-label">{afterLabel}</h3>
        {after}
      </div>
    </div>
  );
}
