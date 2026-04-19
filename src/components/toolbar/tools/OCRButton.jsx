import { useState } from 'react'
import { ScanText } from 'lucide-react'
import { useEditorStore } from '../../../store/editorStore'
import { useOCR } from '../../../hooks/useOCR'

export default function OCRButton({ imageFile }) {
    const fabricRef = useEditorStore((s) => s.fabricRef)
    const { extractAndOverlay } = useOCR(fabricRef)

    const [status, setStatus] = useState('idle')  // idle | running | done | error
    const [progress, setProgress] = useState(0)

    async function handleOCR() {
        if (!imageFile) {
            alert('Upload an image first')
            return
        }

        try {
            setStatus('running')
            setProgress(0)

            const count = await extractAndOverlay(imageFile, (pct) => {
                setProgress(pct)
            })

            setStatus('done')
            console.log(`OCR complete — ${count} words overlaid`)

            // Reset status after 3s
            setTimeout(() => setStatus('idle'), 3000)

        } catch (err) {
            console.error('OCR failed:', err)
            setStatus('error')
            setTimeout(() => setStatus('idle'), 3000)
        }
    }

    return (
        <div className="flex flex-col items-center gap-1">
            <button
                onClick={handleOCR}
                disabled={status === 'running'}
                title="Detect text from image (OCR)"
                className={`w-10 h-10 rounded-xl transition-all duration-150
                    flex items-center justify-center relative
          ${status === 'running'
                        ? 'bg-amber-500/20 text-amber-400 cursor-wait'
                        : status === 'done'
                            ? 'bg-green-500/20 text-green-400'
                            : status === 'error'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-white/5 text-slate-400 hover:bg-violet-600/20 hover:text-violet-300'
                    }`}
            >
                <ScanText size={17} />

                {/* Progress ring overlay when running */}
                {status === 'running' && (
                    <svg className="absolute inset-0 w-full h-full -rotate-90"
                        viewBox="0 0 40 40">
                        <circle
                            cx="20" cy="20" r="18"
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="2"
                            strokeDasharray={`${progress * 1.13} 113`}
                            strokeLinecap="round"
                        />
                    </svg>
                )}
            </button>

            {/* Progress label */}
            {status === 'running' && (
                <span className="text-[10px] text-amber-400">{progress}%</span>
            )}
            {status === 'done' && (
                <span className="text-[10px] text-green-400">Done</span>
            )}
            {status === 'error' && (
                <span className="text-[10px] text-red-400">Error</span>
            )}
        </div>
    )
}