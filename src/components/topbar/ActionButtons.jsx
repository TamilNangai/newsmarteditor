import { Trash2, Copy } from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'
import { useActiveObject } from '../../hooks/useActiveObject'
import { deleteActive, duplicateActive } from '../../utils/fabricHelpers'

export default function ActionButtons() {
    const fabricRef = useEditorStore((s) => s.fabricRef)
    const { activeObject } = useActiveObject(fabricRef)

    const canvas = fabricRef?.current
    const hasSelection = !!activeObject && activeObject.data?.role !== 'background'

    async function handleDelete() {
        if (!canvas || !hasSelection) return
        deleteActive(canvas)
    }

    async function handleDuplicate() {
        if (!canvas || !hasSelection) return
        await duplicateActive(canvas)
    }

    return (
        <>
            <button
                onClick={handleDuplicate}
                disabled={!hasSelection}
                title="Duplicate (Ctrl+D)"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
                    transition-colors
          ${hasSelection
                        ? 'bg-white/5 text-slate-300 hover:bg-white/10'
                        : 'bg-white/5 text-slate-600 cursor-not-allowed'}`}
            >
                <Copy size={14} />
                Duplicate
            </button>

            <button
                onClick={handleDelete}
                disabled={!hasSelection}
                title="Delete (Del)"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
                    transition-colors
          ${hasSelection
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        : 'bg-white/5 text-slate-600 cursor-not-allowed'}`}
            >
                <Trash2 size={14} />
                Delete
            </button>
        </>
    )
}