import { useEffect, useState } from 'react'
import { Shadow } from 'fabric'
import { FONTS } from '../../utils/constants'

function Section({ title, open, onToggle, children }) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-lg">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between px-3 py-2 text-left"
            >
                <span className="text-xs text-slate-300 font-semibold">{title}</span>
                <span className="text-xs text-slate-500">{open ? '−' : '+'}</span>
            </button>
            {open && <div className="px-3 pb-3 flex flex-col gap-3">{children}</div>}
        </div>
    )
}

const BTN_BASE = 'px-2 py-1.5 rounded-md text-xs border border-white/10 transition-colors'

export default function TextProperties({ obj, canvas }) {
    const [open, setOpen] = useState({
        font: true,
        typography: true,
        style: true,
        alignment: false,
        transform: false,
        effects: false,
        layers: false,
        redaction: false,
    })
    const [customFonts, setCustomFonts] = useState([])

    const [fontFamily, setFontFamily] = useState('Arial')
    const [fontSize, setFontSize] = useState(32)
    const [fontWeight, setFontWeight] = useState(400)
    const [charSpacing, setCharSpacing] = useState(0)
    const [fill, setFill] = useState('#ffffff')
    const [opacity, setOpacity] = useState(1)
    const [fontStyle, setFontStyle] = useState('normal')
    const [underline, setUnderline] = useState(false)
    const [linethrough, setLinethrough] = useState(false)
    const [textAlign, setTextAlign] = useState('left')
    const [left, setLeft] = useState(0)
    const [top, setTop] = useState(0)
    const [angle, setAngle] = useState(0)
    const [skewX, setSkewX] = useState(0)
    const [flipX, setFlipX] = useState(false)
    const [flipY, setFlipY] = useState(false)

    const [shadowEnabled, setShadowEnabled] = useState(false)
    const [shadowColor, setShadowColor] = useState('#000000')
    const [shadowBlur, setShadowBlur] = useState(8)
    const [shadowOffsetX, setShadowOffsetX] = useState(4)
    const [shadowOffsetY, setShadowOffsetY] = useState(4)

    const [stroke, setStroke] = useState('#000000')
    const [strokeWidth, setStrokeWidth] = useState(0)
    const [reflectionEnabled, setReflectionEnabled] = useState(false)
    const [reflectionOpacity, setReflectionOpacity] = useState(0.35)
    const [reflectionOffsetY, setReflectionOffsetY] = useState(24)
    const [redactionEnabled, setRedactionEnabled] = useState(false)

    const allFonts = [...FONTS, ...customFonts]

    useEffect(() => {
        if (!obj) return
        setFontFamily(obj.fontFamily ?? 'Arial')
        setFontSize(obj.fontSize ?? 32)
        const weight = Number(obj.fontWeight)
        setFontWeight(Number.isFinite(weight) ? weight : (obj.fontWeight === 'bold' ? 700 : 400))
        setCharSpacing(obj.charSpacing ?? 0)
        setFill(obj.fill ?? '#ffffff')
        setOpacity(obj.opacity ?? 1)
        setFontStyle(obj.fontStyle ?? 'normal')
        setUnderline(!!obj.underline)
        setLinethrough(!!obj.linethrough)
        setTextAlign(obj.textAlign ?? 'left')
        setLeft(Math.round(obj.left ?? 0))
        setTop(Math.round(obj.top ?? 0))
        setAngle(Math.round(obj.angle ?? 0))
        setSkewX(Math.round(obj.skewX ?? 0))
        setFlipX(!!obj.flipX)
        setFlipY(!!obj.flipY)

        const textShadow = obj.shadow
        setShadowEnabled(!!textShadow)
        setShadowColor(textShadow?.color ?? '#000000')
        setShadowBlur(textShadow?.blur ?? 8)
        setShadowOffsetX(textShadow?.offsetX ?? 4)
        setShadowOffsetY(textShadow?.offsetY ?? 4)

        setStroke(obj.stroke ?? '#000000')
        setStrokeWidth(obj.strokeWidth ?? 0)

        const reflectionObj = findReflectionObject(obj)
        setReflectionEnabled(!!reflectionObj)
        setReflectionOpacity(reflectionObj?.opacity ?? 0.35)
        setReflectionOffsetY(Math.round((reflectionObj?.top ?? obj.top ?? 0) - (obj.top ?? 0)) || 24)

        setRedactionEnabled(!!obj?.data?.redaction?.enabled)
    }, [obj])

    if (!obj || !canvas || !['i-text', 'textbox'].includes(obj.type)) return null

    function toggleSection(key) {
        setOpen(prev => ({ ...prev, [key]: !prev[key] }))
    }

    function ensureTextId(target) {
        if (!target.data) target.data = {}
        if (!target.data.textId) {
            target.data.textId = `txt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        }
        return target.data.textId
    }

    function findReflectionObject(target) {
        const sourceId = ensureTextId(target)
        return canvas.getObjects().find((o) => o?.data?.reflectionOf === sourceId) ?? null
    }

    function syncReflection(target) {
        const reflectionObj = findReflectionObject(target)
        if (!reflectionObj) return
        reflectionObj.set({
            text: target.text,
            fontFamily: target.fontFamily,
            fontSize: target.fontSize,
            fontWeight: target.fontWeight,
            fontStyle: target.fontStyle,
            underline: target.underline,
            linethrough: target.linethrough,
            charSpacing: target.charSpacing,
            fill: target.fill,
            stroke: target.stroke,
            strokeWidth: target.strokeWidth,
            left: target.left,
            top: (target.top ?? 0) + reflectionOffsetY,
            angle: target.angle,
            skewX: target.skewX,
            scaleX: target.scaleX,
            scaleY: target.scaleY,
            flipX: target.flipX,
            flipY: target.flipY,
            opacity: reflectionOpacity,
            selectable: false,
            evented: false,
            hasControls: false,
            hasBorders: false,
            excludeFromExport: true,
        })
    }

    function update(props) {
        obj.set(props)
        syncReflection(obj)
        canvas.renderAll()
    }

    function applyShadow(next) {
        setShadowEnabled(next.enabled)
        setShadowColor(next.color)
        setShadowBlur(next.blur)
        setShadowOffsetX(next.offsetX)
        setShadowOffsetY(next.offsetY)
        update({
            shadow: next.enabled
                ? new Shadow({ color: next.color, blur: next.blur, offsetX: next.offsetX, offsetY: next.offsetY })
                : null,
        })
    }

    function applyReflection(enabled, nextOpacity = reflectionOpacity, nextOffsetY = reflectionOffsetY) {
        setReflectionEnabled(enabled)
        setReflectionOpacity(nextOpacity)
        setReflectionOffsetY(nextOffsetY)
        const existing = findReflectionObject(obj)

        if (!enabled) {
            if (existing) canvas.remove(existing)
            canvas.renderAll()
            return
        }

        if (existing) {
            syncReflection(obj)
            canvas.renderAll()
            return
        }

        const ReflectionClass = obj.constructor
        const clone = new ReflectionClass(obj.text ?? '', obj.toObject())
        clone.set({ data: { reflectionOf: ensureTextId(obj), role: 'text-reflection' } })
        canvas.add(clone)
        syncReflection(obj)
        if (typeof canvas.sendObjectBackwards === 'function') canvas.sendObjectBackwards(clone)
        else if (typeof clone.sendBackwards === 'function') clone.sendBackwards()
        canvas.renderAll()
    }

    function applyLayer(action) {
        if (action === 'front') {
            if (typeof canvas.bringObjectToFront === 'function') canvas.bringObjectToFront(obj)
            else if (typeof obj.bringToFront === 'function') obj.bringToFront()
        }
        if (action === 'back') {
            if (typeof canvas.sendObjectToBack === 'function') canvas.sendObjectToBack(obj)
            else if (typeof obj.sendToBack === 'function') obj.sendToBack()
        }
        if (action === 'forward') {
            if (typeof canvas.bringObjectForward === 'function') canvas.bringObjectForward(obj)
            else if (typeof obj.bringForward === 'function') obj.bringForward()
        }
        if (action === 'backward') {
            if (typeof canvas.sendObjectBackwards === 'function') canvas.sendObjectBackwards(obj)
            else if (typeof obj.sendBackwards === 'function') obj.sendBackwards()
        }
        canvas.renderAll()
    }

    function toggleRedaction(enabled) {
        if (!obj.data) obj.data = {}
        if (!obj.data.redaction) obj.data.redaction = {}
        if (!obj.data.redaction.original) {
            obj.data.redaction.original = {
                text: obj.text ?? '',
                fill: obj.fill ?? '#ffffff',
                stroke: obj.stroke ?? null,
                strokeWidth: obj.strokeWidth ?? 0,
                shadow: obj.shadow?.toObject?.() ?? null,
            }
        }
        obj.data.redaction.enabled = enabled
        setRedactionEnabled(enabled)

        if (enabled) {
            const original = obj.data.redaction.original?.text ?? obj.text ?? ''
            update({ text: '█'.repeat(Math.max(1, original.length)), fill: '#000000', shadow: null })
            return
        }

        const original = obj.data.redaction.original
        update({
            text: original?.text ?? obj.text,
            fill: original?.fill ?? obj.fill,
            stroke: original?.stroke ?? null,
            strokeWidth: original?.strokeWidth ?? 0,
            shadow: original?.shadow ? new Shadow(original.shadow) : null,
        })
    }

    async function handleFontUpload(file) {
        if (!file) return
        const fontName = file.name.replace(/\.[^/.]+$/, '')
        const fontUrl = URL.createObjectURL(file)
        const fontFace = new FontFace(fontName, `url(${fontUrl})`)
        await fontFace.load()
        document.fonts.add(fontFace)
        setCustomFonts(prev => (prev.includes(fontName) ? prev : [...prev, fontName]))
        setFontFamily(fontName)
        update({ fontFamily: fontName })
    }

    return (
        <div className="flex flex-col gap-3">
            <Section title="1. Font" open={open.font} onToggle={() => toggleSection('font')}>
                <label className="text-xs text-slate-400">Font Family</label>
                <select
                    value={fontFamily}
                    onChange={(e) => {
                        setFontFamily(e.target.value)
                        update({ fontFamily: e.target.value })
                    }}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200"
                >
                    {allFonts.map((font) => <option key={font} value={font}>{font}</option>)}
                </select>
                <label className="text-xs text-slate-400">Upload Font</label>
                <input
                    type="file"
                    accept=".ttf,.otf,.woff,.woff2"
                    onChange={(e) => handleFontUpload(e.target.files?.[0])}
                    className="text-xs text-slate-300 file:mr-2 file:px-2 file:py-1 file:rounded file:border-0 file:bg-violet-600 file:text-white"
                />
            </Section>

            <Section title="2. Typography" open={open.typography} onToggle={() => toggleSection('typography')}>
                <label className="text-xs text-slate-400">Font Size</label>
                <input type="number" min={8} max={200} value={fontSize} onChange={(e) => {
                    const n = Number(e.target.value) || 32
                    setFontSize(n); update({ fontSize: n })
                }} className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-slate-200" />
                <label className="text-xs text-slate-400">Font Weight</label>
                <select value={fontWeight} onChange={(e) => {
                    const n = Number(e.target.value) || 400
                    setFontWeight(n); update({ fontWeight: n })
                }} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200">
                    {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((w) => <option key={w} value={w}>{w}</option>)}
                </select>
                <label className="text-xs text-slate-400">Letter Spacing (charSpacing)</label>
                <input type="number" min={-1000} max={1000} value={charSpacing} onChange={(e) => {
                    const n = Number(e.target.value) || 0
                    setCharSpacing(n); update({ charSpacing: n })
                }} className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-slate-200" />
            </Section>

            <Section title="3. Style" open={open.style} onToggle={() => toggleSection('style')}>
                <div className="flex gap-2">
                    <button onClick={() => { const next = fontWeight >= 700 ? 400 : 700; setFontWeight(next); update({ fontWeight: next }) }} className={`${BTN_BASE} ${fontWeight >= 700 ? 'bg-violet-600 text-white' : 'bg-white/5 text-slate-300'}`}>B</button>
                    <button onClick={() => { const next = fontStyle === 'italic' ? 'normal' : 'italic'; setFontStyle(next); update({ fontStyle: next }) }} className={`${BTN_BASE} ${fontStyle === 'italic' ? 'bg-violet-600 text-white' : 'bg-white/5 text-slate-300'}`}>I</button>
                    <button onClick={() => { const next = !underline; setUnderline(next); update({ underline: next }) }} className={`${BTN_BASE} ${underline ? 'bg-violet-600 text-white' : 'bg-white/5 text-slate-300'}`}>U</button>
                    <button onClick={() => { const next = !linethrough; setLinethrough(next); update({ linethrough: next }) }} className={`${BTN_BASE} ${linethrough ? 'bg-violet-600 text-white' : 'bg-white/5 text-slate-300'}`}>S</button>
                </div>
                <label className="text-xs text-slate-400">Text Color</label>
                <input type="color" value={fill} onChange={(e) => { setFill(e.target.value); update({ fill: e.target.value }) }} className="w-10 h-10 rounded border border-white/10" />
                <label className="text-xs text-slate-400">Opacity</label>
                <input type="range" min={0} max={1} step={0.01} value={opacity} onChange={(e) => {
                    const n = Number(e.target.value); setOpacity(n); update({ opacity: n })
                }} className="accent-violet-500" />
            </Section>

            <Section title="4. Alignment" open={open.alignment} onToggle={() => toggleSection('alignment')}>
                <div className="grid grid-cols-3 gap-2">
                    {['left', 'center', 'right'].map((val) => (
                        <button key={val} onClick={() => { setTextAlign(val); update({ textAlign: val }) }} className={`${BTN_BASE} ${textAlign === val ? 'bg-violet-600 text-white' : 'bg-white/5 text-slate-300'}`}>{val}</button>
                    ))}
                </div>
            </Section>

            <Section title="5. Transform" open={open.transform} onToggle={() => toggleSection('transform')}>
                <label className="text-xs text-slate-400">X</label>
                <input type="number" value={left} onChange={(e) => { const n = Number(e.target.value) || 0; setLeft(n); update({ left: n }) }} className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-slate-200" />
                <label className="text-xs text-slate-400">Y</label>
                <input type="number" value={top} onChange={(e) => { const n = Number(e.target.value) || 0; setTop(n); update({ top: n }) }} className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-slate-200" />
                <label className="text-xs text-slate-400">Rotation</label>
                <input type="number" min={-360} max={360} value={angle} onChange={(e) => { const n = Number(e.target.value) || 0; setAngle(n); update({ angle: n }) }} className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-slate-200" />
                <label className="text-xs text-slate-400">SkewX</label>
                <input type="number" min={-89} max={89} value={skewX} onChange={(e) => { const n = Number(e.target.value) || 0; setSkewX(n); update({ skewX: n }) }} className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-slate-200" />
                <div className="flex gap-2">
                    <button onClick={() => { const next = !flipX; setFlipX(next); update({ flipX: next }) }} className={`${BTN_BASE} ${flipX ? 'bg-violet-600 text-white' : 'bg-white/5 text-slate-300'}`}>FlipX</button>
                    <button onClick={() => { const next = !flipY; setFlipY(next); update({ flipY: next }) }} className={`${BTN_BASE} ${flipY ? 'bg-violet-600 text-white' : 'bg-white/5 text-slate-300'}`}>FlipY</button>
                </div>
            </Section>

            <Section title="6. Effects" open={open.effects} onToggle={() => toggleSection('effects')}>
                <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Shadow</span>
                    <button onClick={() => applyShadow({
                        enabled: !shadowEnabled, color: shadowColor, blur: shadowBlur, offsetX: shadowOffsetX, offsetY: shadowOffsetY,
                    })} className={`${BTN_BASE} ${shadowEnabled ? 'bg-violet-600 text-white' : 'bg-white/5 text-slate-300'}`}>{shadowEnabled ? 'On' : 'Off'}</button>
                </div>
                <input type="color" value={shadowColor} disabled={!shadowEnabled} onChange={(e) => applyShadow({ enabled: true, color: e.target.value, blur: shadowBlur, offsetX: shadowOffsetX, offsetY: shadowOffsetY })} className="w-10 h-10 rounded border border-white/10 disabled:opacity-40" />
                <input type="number" value={shadowBlur} onChange={(e) => applyShadow({ enabled: shadowEnabled, color: shadowColor, blur: Number(e.target.value) || 0, offsetX: shadowOffsetX, offsetY: shadowOffsetY })} className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-slate-200" placeholder="Blur" />
                <div className="grid grid-cols-2 gap-2">
                    <input type="number" value={shadowOffsetX} onChange={(e) => applyShadow({ enabled: shadowEnabled, color: shadowColor, blur: shadowBlur, offsetX: Number(e.target.value) || 0, offsetY: shadowOffsetY })} className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-slate-200" placeholder="OffsetX" />
                    <input type="number" value={shadowOffsetY} onChange={(e) => applyShadow({ enabled: shadowEnabled, color: shadowColor, blur: shadowBlur, offsetX: shadowOffsetX, offsetY: Number(e.target.value) || 0 })} className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-slate-200" placeholder="OffsetY" />
                </div>

                <label className="text-xs text-slate-400">Outline Stroke</label>
                <input type="color" value={stroke} onChange={(e) => { setStroke(e.target.value); update({ stroke: e.target.value }) }} className="w-10 h-10 rounded border border-white/10" />
                <input type="number" min={0} max={20} value={strokeWidth} onChange={(e) => { const n = Number(e.target.value) || 0; setStrokeWidth(n); update({ strokeWidth: n }) }} className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-slate-200" placeholder="Stroke Width" />

                <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Reflection</span>
                    <button onClick={() => applyReflection(!reflectionEnabled)} className={`${BTN_BASE} ${reflectionEnabled ? 'bg-violet-600 text-white' : 'bg-white/5 text-slate-300'}`}>{reflectionEnabled ? 'On' : 'Off'}</button>
                </div>
                <input type="range" min={0} max={1} step={0.01} value={reflectionOpacity} onChange={(e) => {
                    const n = Number(e.target.value); applyReflection(reflectionEnabled, n, reflectionOffsetY)
                }} className="accent-violet-500" />
                <input type="number" value={reflectionOffsetY} onChange={(e) => {
                    const n = Number(e.target.value) || 0; applyReflection(reflectionEnabled, reflectionOpacity, n)
                }} className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-slate-200" placeholder="Reflection Y Offset" />
            </Section>

            <Section title="7. Layers" open={open.layers} onToggle={() => toggleSection('layers')}>
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => applyLayer('front')} className={`${BTN_BASE} bg-white/5 text-slate-300`}>Front</button>
                    <button onClick={() => applyLayer('back')} className={`${BTN_BASE} bg-white/5 text-slate-300`}>Back</button>
                    <button onClick={() => applyLayer('forward')} className={`${BTN_BASE} bg-white/5 text-slate-300`}>Forward</button>
                    <button onClick={() => applyLayer('backward')} className={`${BTN_BASE} bg-white/5 text-slate-300`}>Backward</button>
                </div>
            </Section>

            <Section title="8. Redaction" open={open.redaction} onToggle={() => toggleSection('redaction')}>
                <button
                    onClick={() => toggleRedaction(!redactionEnabled)}
                    className={`${BTN_BASE} ${redactionEnabled ? 'bg-violet-600 text-white' : 'bg-white/5 text-slate-300'}`}
                >
                    {redactionEnabled ? 'Disable Redaction' : 'Enable Redaction'}
                </button>
            </Section>
        </div>
    )
}