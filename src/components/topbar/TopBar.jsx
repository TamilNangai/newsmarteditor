import { useState, useEffect } from 'react'
import { Undo2, Redo2, Download, ChevronDown } from 'lucide-react'
import ActionButtons from './ActionButtons'
import { useEditorStore } from '../../store/editorStore'
import { downloadCanvas, downloadCanvasHD } from '../../utils/downloadCanvas'

export default function TopBar() {
    const onUndo = useEditorStore((s) => s.onUndo)
    const onRedo = useEditorStore((s) => s.onRedo)
    const fabricRef = useEditorStore((s) => s.fabricRef)

    const [showDownloadMenu, setShowDownloadMenu] = useState(false)


    // Add at the top of TopBar component, after useState
    useEffect(() => {
        function handleClickOutside(e) {
            if (!e.target.closest('.download-menu-container')) {
                setShowDownloadMenu(false)
            }
        }
        if (showDownloadMenu) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [showDownloadMenu])

    function handleDownload(hd = false) {
        if (hd) {
            downloadCanvasHD(fabricRef)
        } else {
            downloadCanvas(fabricRef)
        }
        setShowDownloadMenu(false)
    }

    return (
        <header className="h-14 bg-[#16213e] border-b border-white/10
                       flex items-center px-5 gap-3 shrink-0 z-50">

            {/* Brand */}
            <span className="text-lg font-semibold text-violet-400 tracking-tight mr-4">
                SmartEditor
            </span>

            {/* Undo */}
            <button
                onClick={() => onUndo?.()}
                title="Undo (Ctrl+Z)"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
                   bg-white/5 text-slate-300 hover:bg-white/10 transition-colors"
            >
                <Undo2 size={14} />
                Undo
            </button>

            {/* Redo */}
            <button
                onClick={() => onRedo?.()}
                title="Redo (Ctrl+Y)"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
                   bg-white/5 text-slate-300 hover:bg-white/10 transition-colors"
            >
                <Redo2 size={14} />
                Redo
            </button>

            <div className="w-px h-6 bg-white/10 mx-1" />

            {/* Delete + Duplicate */}
            <ActionButtons />

            {/* Spacer */}
            <div className="flex-1" />

            {/* Download button with dropdown */}
            <div className="relative download-menu-container">
                <div className="flex items-center">
                    {/* Main download button */}
                    <button
                        onClick={() => handleDownload(false)}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-l-lg text-sm
                       bg-violet-600 hover:bg-violet-500 text-white transition-colors"
                    >
                        <Download size={14} />
                        Download
                    </button>

                    {/* Dropdown toggle */}
                    <button
                        onClick={() => setShowDownloadMenu(v => !v)}
                        className="px-2 py-1.5 rounded-r-lg text-sm bg-violet-700
                       hover:bg-violet-600 text-white transition-colors
                       border-l border-violet-500"
                    >
                        <ChevronDown size={14} />
                    </button>
                </div>

                {/* Dropdown menu */}
                {showDownloadMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48
                          bg-[#1e2d4a] border border-white/10 rounded-xl
                          shadow-2xl overflow-hidden z-50">
                        <button
                            onClick={() => handleDownload(false)}
                            className="w-full px-4 py-3 text-sm text-slate-200 text-left
                         hover:bg-white/5 transition-colors flex flex-col gap-0.5"
                        >
                            <span className="font-medium">PNG — Standard</span>
                            <span className="text-xs text-slate-500">800 × 550px</span>
                        </button>
                        <div className="border-t border-white/5" />
                        <button
                            onClick={() => handleDownload(true)}
                            className="w-full px-4 py-3 text-sm text-slate-200 text-left
                         hover:bg-white/5 transition-colors flex flex-col gap-0.5"
                        >
                            <span className="font-medium">PNG — HD</span>
                            <span className="text-xs text-slate-500">1600 × 1100px (2×)</span>
                        </button>
                    </div>
                )}
            </div>
        </header>
    )
}