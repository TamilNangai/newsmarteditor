import { useRef } from 'react'
import { ImageIcon } from 'lucide-react'

export default function ImageUploader({ onFileSelect }) {
    const inputRef = useRef(null)

    function handleChange(e) {
        const file = e.target.files?.[0]
        if (file) onFileSelect(file)
        // Reset so same file can be re-uploaded
        e.target.value = ''
    }

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleChange}
            />
            <button
                onClick={() => inputRef.current?.click()}
                title="Upload Image"
                className="w-10 h-10 rounded-lg bg-white/5 hover:bg-violet-600/30
                   text-slate-400 hover:text-violet-300 transition-colors
                   flex items-center justify-center"
            >
                <ImageIcon size={18} />
            </button>
        </>
    )
}