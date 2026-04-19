import { Type, Square, Circle, Minus, MousePointer } from 'lucide-react'
import ImageUploader from './tools/ImageUploader'
import OCRButton from './tools/OCRButton'
import { useEditorStore } from '../../store/editorStore'
import { useImageUpload } from '../../hooks/useImageUpload'
import { addText, addRect, addCircle, addArrow } from '../../utils/fabricHelpers'

const TOOLS = [
    { id: 'select', icon: MousePointer, title: 'Select (V)' },
    { id: 'text', icon: Type, title: 'Text (T)' },
    { id: 'rect', icon: Square, title: 'Rectangle (R)' },
    { id: 'circle', icon: Circle, title: 'Circle (C)' },
    { id: 'arrow', icon: Minus, title: 'Arrow (A)' },
]

export default function Toolbar() {
    const { activeTool, setActiveTool, fabricRef, imageFile } = useEditorStore()
    const { loadImageToCanvas } = useImageUpload(fabricRef)

    function handleToolClick(id) {
        setActiveTool(id)
        const canvas = fabricRef?.current
        if (!canvas) return
        if (id === 'text') addText(canvas)
        if (id === 'rect') addRect(canvas)
        if (id === 'circle') addCircle(canvas)
        if (id === 'arrow') addArrow(canvas)
    }

    return (
        <aside className="w-16 bg-[#16213e] border-r border-white/10
                      flex flex-col items-center py-4 gap-2 shrink-0">

            {/* Upload */}
            <div className="mb-1">
                <ImageUploader onFileSelect={loadImageToCanvas} />
            </div>

            <div className="w-8 border-t border-white/10 my-1" />

            {/* OCR Button */}
            <OCRButton imageFile={imageFile} />

            <div className="w-8 border-t border-white/10 my-1" />

            {/* Tool buttons */}
            {TOOLS.map(({ id, icon: Icon, title }) => (
                <button
                    key={id}
                    title={title}
                    onClick={() => handleToolClick(id)}
                    className={`relative w-10 h-10 rounded-xl transition-all duration-150
                      flex items-center justify-center
            ${activeTool === id
                            ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                            : 'bg-white/5 text-slate-400 hover:bg-violet-600/20 hover:text-violet-300'
                        }`}
                >
                    <Icon size={17} />
                    {activeTool === id && (
                        <span className="absolute -right-1 -top-1 w-2 h-2
                             bg-violet-300 rounded-full" />
                    )}
                </button>
            ))}

            <div className="flex-1" />
            <div className="text-[10px] text-slate-600 text-center leading-tight px-1">
                T R C A
            </div>
        </aside>
    )
}