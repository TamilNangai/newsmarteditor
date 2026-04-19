// import { useRef, useEffect, useCallback, useState } from 'react'
// import { useCanvas } from '../../hooks/useCanvas'
// import { useActiveObject } from '../../hooks/useActiveObject'
// import { useEditorStore } from '../../store/editorStore'
// import { useImageUpload } from '../../hooks/useImageUpload'
// import { applyCheckerboard } from '../../utils/fabricHelpers'

// export default function CanvasBoard() {
//     const containerRef = useRef(null)
//     const { canvasRef, fabricRef } = useCanvas(containerRef)
//     const { activeObject } = useActiveObject(fabricRef)
//     const setFabricRef = useEditorStore((s) => s.setFabricRef)
//     const { loadImageToCanvas } = useImageUpload(fabricRef)
//     const [hasImage, setHasImage] = useState(false)

//     // Push fabricRef into Zustand so Toolbar can access it
//     useEffect(() => {
//         if (!fabricRef.current) return
//         setFabricRef(fabricRef)
//     }, [fabricRef.current])

//     // Checkerboard
//     useEffect(() => {
//         if (containerRef.current) applyCheckerboard(containerRef.current)
//     }, [])

//     // Track background image
//     useEffect(() => {
//         const canvas = fabricRef.current
//         if (!canvas) return

//         function checkImage() {
//             const bg = canvas.getObjects().find(o => o.data?.role === 'background')
//             setHasImage(!!bg)
//         }

//         canvas.on('object:added', checkImage)
//         canvas.on('object:removed', checkImage)
//         return () => {
//             canvas.off('object:added', checkImage)
//             canvas.off('object:removed', checkImage)
//         }
//     }, [fabricRef.current])

//     const handleDragOver = useCallback((e) => {
//         e.preventDefault()
//         e.dataTransfer.dropEffect = 'copy'
//     }, [])

//     const handleDrop = useCallback((e) => {
//         e.preventDefault()
//         const file = e.dataTransfer.files?.[0]
//         if (file?.type.startsWith('image/')) loadImageToCanvas(file)
//     }, [loadImageToCanvas])

//     return (
//         <main className="flex-1 flex items-center justify-center bg-[#0f0e17] overflow-hidden p-6">
//             <div
//                 ref={containerRef}
//                 onDragOver={handleDragOver}
//                 onDrop={handleDrop}
//                 className="relative rounded-xl overflow-hidden shadow-2xl"
//                 style={{ width: '800px', height: '550px' }}
//             >
//                 {/* Add absolute + w-full + h-full here */}
//                 <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />

//                 {!hasImage && (
//                     <div className="absolute inset-0 flex flex-col items-center
//                         justify-center pointer-events-none select-none gap-3">
//                         <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
//                             <svg className="w-8 h-8 text-slate-500" fill="none"
//                                 viewBox="0 0 24 24" stroke="currentColor">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
//                                     d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828
//                    0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
//                             </svg>
//                         </div>
//                         <p className="text-slate-500 text-sm">
//                             Drop an image here or use the upload button
//                         </p>
//                     </div>
//                 )}
//             </div>
//         </main>
//     )
// }



import { useRef, useEffect, useCallback, useState } from 'react'
import { useCanvas } from '../../hooks/useCanvas'
import { useEditorStore } from '../../store/editorStore'
import { useImageUpload } from '../../hooks/useImageUpload'
import { useHistory } from '../../hooks/useHistory'
import { applyCheckerboard } from '../../utils/fabricHelpers'

export default function CanvasBoard() {
    const containerRef = useRef(null)
    const { canvasRef, fabricRef } = useCanvas(containerRef)
    const setFabricRef = useEditorStore((s) => s.setFabricRef)
    const setHistoryActions = useEditorStore((s) => s.setHistoryActions)
    const { loadImageToCanvas } = useImageUpload(fabricRef)
    const { save, undo, redo } = useHistory(fabricRef)
    const [showPlaceholder, setShowPlaceholder] = useState(true)

    // Share fabricRef globally
    useEffect(() => {
        if (!fabricRef.current) return
        setFabricRef(fabricRef)
    }, [fabricRef.current])

    // Share history actions globally so TopBar can call them
    useEffect(() => {
        setHistoryActions({ onUndo: undo, onRedo: redo, onSave: save })
    }, [undo, redo, save])

    // Checkerboard
    useEffect(() => {
        if (containerRef.current) applyCheckerboard(containerRef.current)
    }, [])

    // Wire canvas change events → save history snapshot
    useEffect(() => {
        const canvas = fabricRef.current
        if (!canvas) return

        // Save on any meaningful change
        const events = [
            'object:added',
            'object:removed',
            'object:modified',
            'object:skewing',
        ]
        events.forEach(e => canvas.on(e, save))

        // Save initial empty state
        save()

        return () => {
            events.forEach(e => canvas.off(e, save))
        }
    }, [fabricRef.current, save])

    // Placeholder should appear only when canvas is empty
    useEffect(() => {
        const canvas = fabricRef.current
        if (!canvas) return

        function syncPlaceholder() {
            const hasObjects = canvas.getObjects().length > 0
            setShowPlaceholder(!hasObjects)
        }

        syncPlaceholder()
        canvas.on('object:added', syncPlaceholder)
        canvas.on('object:removed', syncPlaceholder)
        canvas.on('canvas:cleared', syncPlaceholder)
        canvas.on('history:restored', syncPlaceholder)
        canvas.on('after:render', syncPlaceholder)

        return () => {
            canvas.off('object:added', syncPlaceholder)
            canvas.off('object:removed', syncPlaceholder)
            canvas.off('canvas:cleared', syncPlaceholder)
            canvas.off('history:restored', syncPlaceholder)
            canvas.off('after:render', syncPlaceholder)
        }
    }, [fabricRef.current])

    const handleDragOver = useCallback((e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'copy'
    }, [])

    const handleDrop = useCallback((e) => {
        e.preventDefault()
        const file = e.dataTransfer.files?.[0]
        if (file?.type.startsWith('image/')) loadImageToCanvas(file)
    }, [loadImageToCanvas])

    return (
        <main className="flex-1 flex items-center justify-center bg-[#0f0e17] overflow-hidden p-6">
            <div
                ref={containerRef}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                style={{
                    position: 'relative',
                    width: '800px',
                    height: '550px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
                }}
            >
                <canvas ref={canvasRef} />

                {showPlaceholder && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none',
                        userSelect: 'none',
                        gap: '12px',
                        zIndex: 10,
                    }}>
                        <div style={{
                            width: 64, height: 64,
                            borderRadius: 16,
                            background: 'rgba(255,255,255,0.05)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <svg width="32" height="32" fill="none" viewBox="0 0 24 24"
                                stroke="#64748b" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round"
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828
                     0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                            </svg>
                        </div>
                        <p style={{ color: '#64748b', fontSize: '14px' }}>
                            Drop an image here or use the upload button
                        </p>
                    </div>
                )}
            </div>
        </main>
    )
}