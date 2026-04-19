import { useEffect, useState } from 'react'
import { Shadow } from 'fabric'
import FontControls from './text-toolbar/FontControls'
import StyleControls from './text-toolbar/StyleControls'
import TransformControls from './text-toolbar/TransformControls'
import EffectsPanel from './text-toolbar/EffectsPanel'
import LayersPanel from './text-toolbar/LayersPanel'

export default function TextToolbar({ selectedText, canvas }) {
    if (!selectedText || !canvas) return null

    function ensureTextId(obj) {
        if (!obj.data) obj.data = {}
        if (!obj.data.textId) obj.data.textId = `txt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        return obj.data.textId
    }

    function findReflectionObject(sourceObj) {
        const sourceId = ensureTextId(sourceObj)
        return canvas.getObjects().find(o => o?.data?.reflectionOf === sourceId) ?? null
    }

    function find3DShadowLayers(sourceObj) {
        const sourceId = ensureTextId(sourceObj)
        return canvas
            .getObjects()
            .filter(o => o?.data?.shadow3dOf === sourceId)
            .sort((a, b) => (a?.data?.shadow3dLayer ?? 0) - (b?.data?.shadow3dLayer ?? 0))
    }

    function clear3DShadowLayers(sourceObj) {
        find3DShadowLayers(sourceObj).forEach(layer => canvas.remove(layer))
    }

    function syncReflectionObject(sourceObj, reflectionObj, config) {
        reflectionObj.set({
            text: sourceObj.text,
            fontFamily: sourceObj.fontFamily,
            fontSize: sourceObj.fontSize,
            fontWeight: sourceObj.fontWeight,
            fontStyle: sourceObj.fontStyle,
            underline: sourceObj.underline,
            linethrough: sourceObj.linethrough,
            charSpacing: sourceObj.charSpacing,
            fill: sourceObj.fill,
            stroke: sourceObj.stroke,
            strokeWidth: sourceObj.strokeWidth,
            strokeDashArray: sourceObj.strokeDashArray,
            angle: sourceObj.angle,
            skewX: sourceObj.skewX,
            skewY: sourceObj.skewY,
            scaleX: sourceObj.scaleX,
            scaleY: sourceObj.scaleY,
            flipX: sourceObj.flipX,
            flipY: sourceObj.flipY,
            left: sourceObj.left,
            top: (sourceObj.top ?? 0) + config.offsetY,
            opacity: config.opacity,
            selectable: false,
            evented: false,
            hasControls: false,
            hasBorders: false,
            excludeFromExport: true,
        })
    }

    function applyTextStyle(props) {
        selectedText.set(props)
        const reflectionObj = findReflectionObject(selectedText)
        if (reflectionObj) {
            syncReflectionObject(selectedText, reflectionObj, {
                offsetY: reflection.offsetY,
                opacity: reflection.opacity,
            })
        }
        if (shadow3D.enabled) sync3DShadowLayers(selectedText, shadow3D)
        canvas.renderAll()
    }

    const [transform, setTransform] = useState({ x: 0, y: 0, angle: 0, skewX: 0 })
    const [typography, setTypography] = useState({ opacity: 1, charSpacing: 0, fontWeight: 400 })
    const [outline, setOutline] = useState({ stroke: '#000000', strokeWidth: 0, dashed: false })
    const [reflection, setReflection] = useState({ enabled: false, opacity: 0.35, offsetY: 24 })
    const [shadow3D, setShadow3D] = useState({ enabled: false, angle: 45, depth: 12, opacity: 0.35 })
    const [redaction, setRedaction] = useState({ enabled: false, mode: 'black' })
    const [shadow, setShadow] = useState({
        enabled: false,
        color: '#000000',
        blur: 8,
        offsetX: 4,
        offsetY: 4,
    })

    useEffect(() => {
        setTransform({
            x: Math.round(selectedText.left ?? 0),
            y: Math.round(selectedText.top ?? 0),
            angle: Math.round(selectedText.angle ?? 0),
            skewX: Math.round(selectedText.skewX ?? 0),
        })

        const textShadow = selectedText.shadow
        const hasShadow = !!textShadow
        setShadow({
            enabled: hasShadow,
            color: hasShadow ? (textShadow.color ?? '#000000') : '#000000',
            blur: hasShadow ? Math.round(textShadow.blur ?? 8) : 8,
            offsetX: hasShadow ? Math.round(textShadow.offsetX ?? 4) : 4,
            offsetY: hasShadow ? Math.round(textShadow.offsetY ?? 4) : 4,
        })

        const rawWeight = Number(selectedText.fontWeight)
        const normalizedWeight = Number.isFinite(rawWeight) && rawWeight >= 100 && rawWeight <= 900
            ? rawWeight
            : (selectedText.fontWeight === 'bold' ? 700 : 400)
        setTypography({
            opacity: selectedText.opacity ?? 1,
            charSpacing: Math.round(selectedText.charSpacing ?? 0),
            fontWeight: normalizedWeight,
        })

        const strokeWidth = Number(selectedText.strokeWidth ?? 0)
        setOutline({
            stroke: selectedText.stroke ?? '#000000',
            strokeWidth: Number.isFinite(strokeWidth) ? strokeWidth : 0,
            dashed: Array.isArray(selectedText.strokeDashArray) && selectedText.strokeDashArray.length > 0,
        })

        const reflectionObj = findReflectionObject(selectedText)
        setReflection({
            enabled: !!reflectionObj,
            opacity: reflectionObj?.opacity ?? 0.35,
            offsetY: Math.round((reflectionObj?.top ?? selectedText.top ?? 0) - (selectedText.top ?? 0)) || 24,
        })

        const shadow3DConfig = selectedText?.data?.shadow3DConfig
        setShadow3D({
            enabled: !!shadow3DConfig?.enabled,
            angle: shadow3DConfig?.angle ?? 45,
            depth: shadow3DConfig?.depth ?? 12,
            opacity: shadow3DConfig?.opacity ?? 0.35,
        })

        const redactionConfig = selectedText?.data?.redaction
        setRedaction({
            enabled: !!redactionConfig?.enabled,
            mode: redactionConfig?.mode === 'blur' ? 'blur' : 'black',
        })
    }, [selectedText])

    function updateTransform(stateKey, fabricKey, rawValue, fallback = 0) {
        const value = Number(rawValue)
        const nextValue = Number.isFinite(value) ? value : fallback
        setTransform(prev => ({ ...prev, [stateKey]: nextValue }))
        applyTextStyle({ [fabricKey]: nextValue })
    }

    function applyShadow(nextShadow) {
        setShadow(nextShadow)
        if (!nextShadow.enabled) {
            applyTextStyle({ shadow: null })
            return
        }

        applyTextStyle({
            shadow: new Shadow({
                color: nextShadow.color,
                blur: nextShadow.blur,
                offsetX: nextShadow.offsetX,
                offsetY: nextShadow.offsetY,
            }),
        })
    }

    function updateShadow(key, rawValue, fallback = 0) {
        const value = Number(rawValue)
        const nextValue = Number.isFinite(value) ? value : fallback
        const nextShadow = { ...shadow, [key]: nextValue }
        applyShadow(nextShadow)
    }

    function updateTypography(key, fabricKey, rawValue, fallback = 0) {
        const value = Number(rawValue)
        const nextValue = Number.isFinite(value) ? value : fallback
        setTypography(prev => ({ ...prev, [key]: nextValue }))
        applyTextStyle({ [fabricKey]: nextValue })
    }

    function applyOutline(nextOutline) {
        setOutline(nextOutline)
        applyTextStyle({
            stroke: nextOutline.stroke,
            strokeWidth: nextOutline.strokeWidth,
            strokeDashArray: nextOutline.dashed ? [6, 4] : null,
        })
    }

    function updateOutline(key, rawValue, fallback = 0) {
        const value = Number(rawValue)
        const nextValue = Number.isFinite(value) ? value : fallback
        const nextOutline = { ...outline, [key]: nextValue }
        applyOutline(nextOutline)
    }

    function applyReflection(nextReflection) {
        setReflection(nextReflection)
        const reflectionObj = findReflectionObject(selectedText)

        if (!nextReflection.enabled) {
            if (reflectionObj) canvas.remove(reflectionObj)
            canvas.renderAll()
            return
        }

        if (reflectionObj) {
            syncReflectionObject(selectedText, reflectionObj, nextReflection)
            canvas.renderAll()
            return
        }

        const ReflectionClass = selectedText.constructor
        const reflectionClone = new ReflectionClass(selectedText.text ?? '', selectedText.toObject())
        reflectionClone.set({ data: { reflectionOf: ensureTextId(selectedText), role: 'text-reflection' } })
        syncReflectionObject(selectedText, reflectionClone, nextReflection)
        canvas.add(reflectionClone)
        if (typeof canvas.sendObjectBackwards === 'function') canvas.sendObjectBackwards(reflectionClone)
        else if (typeof reflectionClone.sendBackwards === 'function') reflectionClone.sendBackwards()
        canvas.renderAll()
    }

    function updateReflection(key, rawValue, fallback = 0) {
        const value = Number(rawValue)
        const nextValue = Number.isFinite(value) ? value : fallback
        applyReflection({ ...reflection, [key]: nextValue })
    }

    function sync3DShadowLayers(sourceObj, config) {
        const rawDepth = Math.max(0, Number(config.depth) || 0)
        const layerCount = Math.min(24, Math.round(rawDepth))
        const sourceId = ensureTextId(sourceObj)
        const radians = ((Number(config.angle) || 0) * Math.PI) / 180
        const baseOpacity = Math.max(0, Math.min(1, Number(config.opacity) || 0.35))
        const layers = find3DShadowLayers(sourceObj)
        const LayerClass = sourceObj.constructor

        if (layerCount === 0) {
            layers.forEach(layer => canvas.remove(layer))
            return
        }

        for (let i = 1; i <= layerCount; i += 1) {
            let layerObj = layers[i - 1]
            if (!layerObj) {
                layerObj = new LayerClass(sourceObj.text ?? '', sourceObj.toObject())
                layerObj.set({ data: { shadow3dOf: sourceId, shadow3dLayer: i, role: 'text-shadow-3d' } })
                canvas.add(layerObj)
            }

            const offsetX = Math.cos(radians) * i
            const offsetY = Math.sin(radians) * i
            const layerOpacity = baseOpacity * (1 - i / (layerCount + 1))

            layerObj.set({
                text: sourceObj.text,
                fontFamily: sourceObj.fontFamily,
                fontSize: sourceObj.fontSize,
                fontWeight: sourceObj.fontWeight,
                fontStyle: sourceObj.fontStyle,
                underline: sourceObj.underline,
                linethrough: sourceObj.linethrough,
                charSpacing: sourceObj.charSpacing,
                angle: sourceObj.angle,
                skewX: sourceObj.skewX,
                skewY: sourceObj.skewY,
                scaleX: sourceObj.scaleX,
                scaleY: sourceObj.scaleY,
                flipX: sourceObj.flipX,
                flipY: sourceObj.flipY,
                left: (sourceObj.left ?? 0) + offsetX,
                top: (sourceObj.top ?? 0) + offsetY,
                fill: '#000000',
                stroke: null,
                strokeWidth: 0,
                strokeDashArray: null,
                shadow: null,
                opacity: layerOpacity,
                selectable: false,
                evented: false,
                hasControls: false,
                hasBorders: false,
                excludeFromExport: true,
            })
        }

        for (let i = layerCount; i < layers.length; i += 1) {
            canvas.remove(layers[i])
        }

        const refreshedLayers = find3DShadowLayers(sourceObj)
        for (let i = 0; i < refreshedLayers.length; i += 1) {
            if (typeof canvas.sendObjectToBack === 'function') canvas.sendObjectToBack(refreshedLayers[i])
            else if (typeof refreshedLayers[i].sendToBack === 'function') refreshedLayers[i].sendToBack()
        }
    }

    function apply3DShadow(next3DShadow) {
        setShadow3D(next3DShadow)
        if (!selectedText.data) selectedText.data = {}
        selectedText.data.shadow3DConfig = next3DShadow

        if (!next3DShadow.enabled) {
            clear3DShadowLayers(selectedText)
            canvas.renderAll()
            return
        }

        sync3DShadowLayers(selectedText, next3DShadow)
        canvas.renderAll()
    }

    function update3DShadow(key, rawValue, fallback = 0) {
        const value = Number(rawValue)
        const nextValue = Number.isFinite(value) ? value : fallback
        apply3DShadow({ ...shadow3D, [key]: nextValue })
    }

    function applyRedactionStyle(mode) {
        const originalText = selectedText?.data?.redaction?.original?.text ?? selectedText.text ?? ''
        const redactedText = mode === 'black' ? '█'.repeat(Math.max(1, originalText.length)) : originalText

        const styleForMode = mode === 'black'
            ? {
                text: redactedText,
                fill: '#000000',
                stroke: null,
                strokeWidth: 0,
                strokeDashArray: null,
                shadow: null,
            }
            : {
                text: redactedText,
                fill: 'rgba(0,0,0,0.18)',
                shadow: new Shadow({ color: 'rgba(0,0,0,0.85)', blur: 10, offsetX: 0, offsetY: 0 }),
            }

        selectedText.set(styleForMode)
    }

    function toggleRedaction(nextEnabled, mode = redaction.mode) {
        if (!selectedText.data) selectedText.data = {}
        if (!selectedText.data.redaction) selectedText.data.redaction = {}

        const existingOriginal = selectedText.data.redaction.original
        if (!existingOriginal) {
            selectedText.data.redaction.original = {
                text: selectedText.text ?? '',
                fill: selectedText.fill ?? '#ffffff',
                stroke: selectedText.stroke ?? null,
                strokeWidth: selectedText.strokeWidth ?? 0,
                strokeDashArray: selectedText.strokeDashArray ?? null,
                shadow: selectedText.shadow?.toObject?.() ?? null,
            }
        }

        selectedText.data.redaction.enabled = nextEnabled
        selectedText.data.redaction.mode = mode
        setRedaction({ enabled: nextEnabled, mode })

        if (nextEnabled) {
            applyRedactionStyle(mode)
            const reflectionObj = findReflectionObject(selectedText)
            if (reflectionObj) {
                syncReflectionObject(selectedText, reflectionObj, {
                    offsetY: reflection.offsetY,
                    opacity: reflection.opacity,
                })
            }
            if (shadow3D.enabled) sync3DShadowLayers(selectedText, shadow3D)
            canvas.renderAll()
            return
        }

        const original = selectedText.data.redaction.original
        selectedText.set({
            text: original?.text ?? selectedText.text,
            fill: original?.fill ?? selectedText.fill,
            stroke: original?.stroke ?? null,
            strokeWidth: original?.strokeWidth ?? 0,
            strokeDashArray: original?.strokeDashArray ?? null,
            shadow: original?.shadow ? new Shadow(original.shadow) : null,
        })

        const reflectionObj = findReflectionObject(selectedText)
        if (reflectionObj) {
            syncReflectionObject(selectedText, reflectionObj, {
                offsetY: reflection.offsetY,
                opacity: reflection.opacity,
            })
        }
        if (shadow3D.enabled) sync3DShadowLayers(selectedText, shadow3D)
        canvas.renderAll()
    }

    function cycleRedactionMode() {
        const nextMode = redaction.mode === 'black' ? 'blur' : 'black'
        if (!redaction.enabled) {
            setRedaction(prev => ({ ...prev, mode: nextMode }))
            if (!selectedText.data) selectedText.data = {}
            if (!selectedText.data.redaction) selectedText.data.redaction = {}
            selectedText.data.redaction.mode = nextMode
            return
        }
        toggleRedaction(true, nextMode)
    }

    function applyLayer(action) {
        if (action === 'front') {
            if (typeof canvas.bringObjectToFront === 'function') canvas.bringObjectToFront(selectedText)
            else if (typeof selectedText.bringToFront === 'function') selectedText.bringToFront()
        }

        if (action === 'back') {
            if (typeof canvas.sendObjectToBack === 'function') canvas.sendObjectToBack(selectedText)
            else if (typeof selectedText.sendToBack === 'function') selectedText.sendToBack()
        }

        if (action === 'forward') {
            if (typeof canvas.bringObjectForward === 'function') canvas.bringObjectForward(selectedText)
            else if (typeof selectedText.bringForward === 'function') selectedText.bringForward()
        }

        if (action === 'backward') {
            if (typeof canvas.sendObjectBackwards === 'function') canvas.sendObjectBackwards(selectedText)
            else if (typeof selectedText.sendBackwards === 'function') selectedText.sendBackwards()
        }

        canvas.renderAll()
    }

    const isBold = selectedText.fontWeight === 'bold'
    const isItalic = selectedText.fontStyle === 'italic'
    const isUnderline = !!selectedText.underline
    const isStrike = !!selectedText.linethrough

    return (
        <div
            style={{
                position: 'absolute',
                top: '12px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 10px',
                borderRadius: '10px',
                background: 'rgba(12, 10, 24, 0.92)',
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                zIndex: 30,
            }}
        >
            <FontControls
                selectedText={selectedText}
                typography={typography}
                outline={outline}
                applyTextStyle={applyTextStyle}
                updateTypography={updateTypography}
                applyOutline={applyOutline}
                updateOutline={updateOutline}
            />
            <StyleControls
                selectedText={selectedText}
                isBold={isBold}
                isItalic={isItalic}
                isUnderline={isUnderline}
                isStrike={isStrike}
                redaction={redaction}
                applyTextStyle={applyTextStyle}
                toggleRedaction={toggleRedaction}
                cycleRedactionMode={cycleRedactionMode}
            />
            <TransformControls
                transform={transform}
                updateTransform={updateTransform}
            />
            <EffectsPanel
                shadow={shadow}
                reflection={reflection}
                shadow3D={shadow3D}
                applyShadow={applyShadow}
                updateShadow={updateShadow}
                applyReflection={applyReflection}
                updateReflection={updateReflection}
                apply3DShadow={apply3DShadow}
                update3DShadow={update3DShadow}
            />
            <LayersPanel applyLayer={applyLayer} />
        </div>
    )
}
