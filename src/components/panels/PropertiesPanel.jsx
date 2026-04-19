import { useEditorStore } from '../../store/editorStore'
import { useActiveObject } from '../../hooks/useActiveObject'
import TextProperties from './TextProperties'
import ShapeProperties from './ShapeProperties'

const TYPE_LABEL = {
    'i-text': 'Text',
    'textbox': 'Text',
    'rect': 'Rectangle',
    'circle': 'Circle',
    'ellipse': 'Ellipse',
    'group': 'Arrow',
    'image': 'Image',
}

export default function PropertiesPanel() {
    const fabricRef = useEditorStore((s) => s.fabricRef)
    const { activeObject } = useActiveObject(fabricRef)
    const canvas = fabricRef?.current

    const isText = ['i-text', 'textbox'].includes(activeObject?.type)
    const isShape = ['rect', 'circle', 'ellipse', 'group'].includes(activeObject?.type)

    return (
        <aside className="w-60 bg-[#16213e] border-l border-white/10
                      flex flex-col p-4 gap-4 shrink-0 overflow-y-auto">

            {/* Header */}
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                    Properties
                </p>
                {activeObject && (
                    <span className="text-xs bg-violet-600/30 text-violet-300
                           px-2 py-0.5 rounded-full">
                        {TYPE_LABEL[activeObject.type] ?? activeObject.type}
                    </span>
                )}
            </div>

            {/* Empty state */}
            {!activeObject && (
                <div className="flex flex-col items-center justify-center gap-2 py-8">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                        <svg className="w-5 h-5 text-slate-500" fill="none"
                            viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
                        </svg>
                    </div>
                    <p className="text-xs text-slate-500 text-center">
                        Select an object to edit its properties
                    </p>
                </div>
            )}

            {/* Text properties */}
            {isText && (
                <TextProperties obj={activeObject} canvas={canvas} />
            )}

            {/* Shape properties */}
            {isShape && (
                <ShapeProperties obj={activeObject} canvas={canvas} />
            )}

        </aside>
    )
}