import TopBar from './components/topbar/TopBar'
import Toolbar from './components/toolbar/Toolbar'
import CanvasBoard from './components/canvas/CanvasBoard'
import PropertiesPanel from './components/panels/PropertiesPanel'
import { useEditorStore } from './store/editorStore'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

function EditorShortcuts() {
  const fabricRef = useEditorStore((s) => s.fabricRef)
  const onUndo = useEditorStore((s) => s.onUndo)
  const onRedo = useEditorStore((s) => s.onRedo)
  const setActiveTool = useEditorStore((s) => s.setActiveTool)
  useKeyboardShortcuts(fabricRef, onUndo, onRedo, setActiveTool)
  return null
}

export default function App() {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#1a1a2e]">
      <EditorShortcuts />
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Toolbar />
        <CanvasBoard />
        <PropertiesPanel />
      </div>
    </div>
  )
}