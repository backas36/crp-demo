/**
 * 共用 Tab 切換器
 * 不用 router，純 state 切換
 */
import type { ReactNode } from "react";

export interface TabItem {
  id: string;
  label: string;
  badge?: string;
}

interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  children: ReactNode;
}

export function Tabs({ items, activeId, onChange, children }: TabsProps) {
  return (
    <div className="tabs-wrap">
      <nav className="tabs-nav">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`tab-btn ${activeId === item.id ? "tab-btn-active" : ""}`}
            onClick={() => onChange(item.id)}
          >
            <span>{item.label}</span>
            {item.badge && <span className="tab-badge">{item.badge}</span>}
          </button>
        ))}
      </nav>
      <main className="tabs-content">{children}</main>
    </div>
  );
}
