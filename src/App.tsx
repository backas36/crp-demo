/**
 * CRP Demo 主入口
 * 6 個 tab 切換 6 個 demo
 */
import { useState } from "react";
import { type TabItem, Tabs } from "./components/Tabs";
import { Demo1 } from "./demos/Demo1_NodeCount";
import { Demo2 } from "./demos/Demo2_TransformVsTopLeft";
import { Demo3 } from "./demos/Demo3_ForcedSyncLayout";
import { Demo4 } from "./demos/Demo4_AnimationFps";
import { Demo5 } from "./demos/Demo5_ClassVsInlineStyle";
import { Demo6 } from "./demos/Demo6_LayerAbuse";

const TABS: TabItem[] = [
  { id: "demo1", label: "1. 節點數 vs CRP" },
  { id: "demo2", label: "2. transform vs top/left" },
  { id: "demo3", label: "3. Forced Sync Layout" },
  { id: "demo4", label: "4. setState vs ref+rAF" },
  { id: "demo5", label: "5. class vs style" },
  { id: "demo6", label: "6. Layer 濫用", badge: "私房" },
];

function renderActiveDemo(activeId: string) {
  switch (activeId) {
    case "demo1":
      return <Demo1 />;
    case "demo2":
      return <Demo2 />;
    case "demo3":
      return <Demo3 />;
    case "demo4":
      return <Demo4 />;
    case "demo5":
      return <Demo5 />;
    case "demo6":
      return <Demo6 />;
    default:
      return null;
  }
}

function App() {
  const [activeId, setActiveId] = useState<string>("demo1");

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="app-title">CRP Demo</h1>
        <p className="app-subtitle">Critical Rendering Path</p>
      </header>

      <Tabs items={TABS} activeId={activeId} onChange={setActiveId}>
        {renderActiveDemo(activeId)}
      </Tabs>
    </div>
  );
}

export default App;
