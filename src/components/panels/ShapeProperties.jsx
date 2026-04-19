import { useState, useEffect } from 'react'

function rgbToHex(color) {
    if (color.startsWith('#')) return color
    const match = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)$/)
    if (!match) return '#000000'
    const r = parseInt(match[1])
    const g = parseInt(match[2])
    const b = parseInt(match[3])
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

export default function ShapeProperties({ obj, canvas }) {
    const [fill, setFill] = useState('#7c3aed')
    const [stroke, setStroke] = useState('#ffffff')
    const [strokeWidth, setStrokeWidth] = useState(2)
    const [opacity, setOpacity] = useState(1)
    const [rx, setRx] = useState(0)
    const [dimensions, setDimensions] = useState({ w: 0, h: 0 })

    // Sync state when selection changes
    useEffect(() => {
        if (!obj) return
        setFill(obj.fill ?? '#7c3aed')
        setStroke(obj.stroke ?? '#ffffff')
        setStrokeWidth(obj.strokeWidth ?? 2)
        setOpacity(obj.opacity ?? 1)
        setRx(obj.rx ?? 0)

        const updateDimensions = () => setDimensions({
            w: obj.getScaledWidth ? Math.round(obj.getScaledWidth()) : 0,
            h: obj.getScaledHeight ? Math.round(obj.getScaledHeight()) : 0
        })
        updateDimensions()

        const onModified = (e) => {
            if (e.target === obj) updateDimensions()
        }
        canvas.on('object:modified', onModified)
        return () => canvas.off('object:modified', onModified)
    }, [obj, canvas])

    if (!obj) return null

    // Only show for shapes — not text, not background, not groups (arrows)
    const isShape = ['rect', 'circle', 'ellipse'].includes(obj.type)
    if (!isShape) return null

    function update(props) {
        obj.set(props)
        canvas.requestRenderAll()
    }

    function handleFill(val) {
        setFill(val)
        update({ fill: val })
    }

    function handleStroke(val) {
        setStroke(val)
        update({ stroke: val })
    }

    function handleStrokeWidth(val) {
        const n = Number(val)
        setStrokeWidth(n)
        update({ strokeWidth: n })
    }

    function handleOpacity(val) {
        const n = Number(val)
        setOpacity(n)
        update({ opacity: n })
    }

    function handleRx(val) {
        const n = Number(val)
        setRx(n)
        update({ rx: n, ry: n })
    }

    return (
        <div className="flex flex-col gap-4">

            {/* Fill color */}
            <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">Fill</label>
                <div className="flex items-center gap-2">
                    <input
                        type="color"
                        value={rgbToHex(fill)}
                        onChange={e => handleFill(e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer bg-transparent
                       border border-white/10"
                    />
                    <input
                        type="text"
                        value={fill}
                        onChange={e => handleFill(e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg
                       px-3 py-2 text-xs text-slate-200 font-mono
                       focus:outline-none focus:border-violet-500"
                    />
                </div>

                {/* Fill opacity quick buttons */}
                <div className="flex gap-1 mt-1">
                    {[
                        { label: 'None', val: 'transparent' },
                        { label: '50%', val: 'rgba(124,58,237,0.5)' },
                        { label: 'Solid', val: '#7c3aed' },
                    ].map(({ label, val }) => (
                        <button
                            key={label}
                            onClick={() => handleFill(val)}
                            className="flex-1 py-1 rounded text-xs bg-white/5 text-slate-400
                         hover:bg-white/10 transition-colors"
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stroke color */}
            <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">Stroke color</label>
                <div className="flex items-center gap-2">
                    <input
                        type="color"
                        value={rgbToHex(stroke)}
                        onChange={e => handleStroke(e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer bg-transparent
                       border border-white/10"
                    />
                    <input
                        type="text"
                        value={stroke}
                        onChange={e => handleStroke(e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg
                       px-3 py-2 text-xs text-slate-200 font-mono
                       focus:outline-none focus:border-violet-500"
                    />
                </div>
            </div>

            {/* Stroke width */}
            <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">
                    Stroke width — <span className="text-violet-400">{strokeWidth}px</span>
                </label>
                <div className="flex items-center gap-2">
                    <input
                        type="range"
                        min={0} max={20} step={1}
                        value={strokeWidth}
                        onChange={e => handleStrokeWidth(e.target.value)}
                        className="flex-1 accent-violet-500"
                    />
                    <input
                        type="number"
                        min={0} max={20}
                        value={strokeWidth}
                        onChange={e => handleStrokeWidth(e.target.value)}
                        className="w-14 bg-white/5 border border-white/10 rounded-lg
                       px-2 py-1 text-xs text-slate-200 text-center
                       focus:outline-none focus:border-violet-500"
                    />
                </div>
            </div>

            {/* Corner radius — only for rect */}
            {obj.type === 'rect' && (
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-slate-400">
                        Corner radius — <span className="text-violet-400">{rx}px</span>
                    </label>
                    <input
                        type="range"
                        min={0} max={80} step={1}
                        value={rx}
                        onChange={e => handleRx(e.target.value)}
                        className="accent-violet-500"
                    />
                </div>
            )}

            {/* Opacity */}
            <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">
                    Opacity — <span className="text-violet-400">{Math.round(opacity * 100)}%</span>
                </label>
                <input
                    type="range"
                    min={0} max={1} step={0.01}
                    value={opacity}
                    onChange={e => handleOpacity(e.target.value)}
                    className="accent-violet-500"
                />
            </div>

            {/* Dimensions readout */}
            <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">Dimensions</label>
                <div className="flex gap-2">
                    <div className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-xs text-slate-400 text-center">
                        W: {dimensions.w}px
                    </div>
                    <div className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-xs text-slate-400 text-center">
                        H: {dimensions.h}px
                    </div>
                </div>
            </div>

        </div>
    )
}
