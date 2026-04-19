import { createWorker } from 'tesseract.js'
import { Textbox, FabricImage } from 'fabric'

const OCR_DEBUG_STYLES = false

export function useOCR(fabricRef) {

  async function extractAndOverlay(file, onProgress) {
    const canvas = fabricRef?.current
    if (!canvas || !file) return 0

    const naturalSize = await getNaturalSize(file)
    const sourceImageData = await getSourceImageData(file)
    console.log('Image natural size:', naturalSize)

    const canvasW = canvas.getWidth()
    const canvasH = canvas.getHeight()
    const { w: imgW, h: imgH } = naturalSize

    const scale   = Math.min(canvasW / imgW, canvasH / imgH)
    const offsetX = (canvasW - imgW * scale) / 2
    const offsetY = (canvasH - imgH * scale) / 2

    console.log(`Scale: ${scale.toFixed(4)} Offset: x=${offsetX.toFixed(2)} y=${offsetY.toFixed(2)}`)

    const words = await runOCR(file, onProgress)
    const styleCache = new Map()
    const backgroundColorCache = new Map()
    console.log(`OCR complete — ${words.length} words detected`)

    // Remove previous OCR overlays/masks
    canvas
      .getObjects()
      .filter(o => o.data?.role === 'ocr' || o.data?.role === 'ocr-mask')
      .forEach(o => canvas.remove(o))

    const backgroundObj = canvas.getObjects().find((o) => o.data?.role === 'background')
    const preparedWords = []

    words.forEach(word => {
      const text = word.text.trim()
      if (!text)                return
      if (word.confidence < 65) return

      const { x0, y0, x1, y1 } = word.bbox
      const left     = x0 * scale + offsetX
      const top      = y0 * scale + offsetY
      const width    = Math.max(2, (x1 - x0) * scale)
      const height   = Math.max(2, (y1 - y0) * scale)
      const textStyle = getOCRTextStyle({
        imageData: sourceImageData,
        bbox: word.bbox,
        text,
        scale,
        cache: styleCache,
        backgroundColorCache,
      })
      const layout = calibrateTextboxLayout({
        text,
        width,
        height,
        fontFamily: textStyle.fontFamily,
        fontWeight: textStyle.fontWeight,
        fontStyle: textStyle.fontStyle,
        textAlign: textStyle.textAlign,
      })
      preparedWords.push({
        word,
        text,
        left,
        top,
        width,
        height,
        textStyle,
        layout,
      })
    })

    if (backgroundObj && preparedWords.length > 0) {
      const cleanedElement = await createCompositedImageElement({
        sourceImageData,
        preparedWords,
      })
      const replacement = new FabricImage(cleanedElement, {
        left:          backgroundObj.left,
        top:           backgroundObj.top,
        originX:       backgroundObj.originX,
        originY:       backgroundObj.originY,
        scaleX:        backgroundObj.scaleX,
        scaleY:        backgroundObj.scaleY,
        selectable:    false,
        evented:       false,
        hasControls:   false,
        hasBorders:    false,
        lockMovementX: true,
        lockMovementY: true,
        data:          { role: 'background' },
      })

      canvas.remove(backgroundObj)
      canvas.add(replacement)
      if (typeof canvas.sendObjectToBack === 'function') canvas.sendObjectToBack(replacement)
    } else if (backgroundObj && typeof canvas.sendObjectToBack === 'function') {
      canvas.sendObjectToBack(backgroundObj)
    }

    const replacedCount = preparedWords.filter(({ word }) => (word.confidence ?? 0) >= 95).length

    canvas.renderAll()
    console.log(`Replaced ${replacedCount} words on image (strict realism mode)`)
    return replacedCount
  }

  return { extractAndOverlay }
}

async function createCompositedImageElement({ sourceImageData, preparedWords }) {
  const offCanvas = document.createElement('canvas')
  offCanvas.width = sourceImageData.width
  offCanvas.height = sourceImageData.height
  const ctx = offCanvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Could not create compositing context')

  ctx.putImageData(sourceImageData, 0, 0)
  const replaceWords = preparedWords.filter(({ word }) => (word.confidence ?? 0) >= 95)

  replaceWords.forEach(({ word, textStyle }) => {
    const { x0, y0, x1, y1 } = word.bbox
    const x = Math.floor(Math.min(x0, x1))
    const y = Math.floor(Math.min(y0, y1))
    const w = Math.max(1, Math.ceil(Math.abs(x1 - x0)))
    const h = Math.max(1, Math.ceil(Math.abs(y1 - y0)))

    // Per-word cleanup avoids large accidental erase bands.
    eraseRegionFeathered(ctx, x, y, w, h, 2)
    refillRegionWithTexture(ctx, x, y, w, h, textStyle.backgroundFill)
  })
  // 3) Draw OCR text naturally onto cleaned bitmap
  replaceWords.forEach((entry) => {
    drawNaturalOCRText(ctx, entry)
  })
  ctx.globalCompositeOperation = 'source-over'

  const img = new Image()
  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
    img.src = offCanvas.toDataURL('image/png')
  })
  return img
}

function eraseRegionFeathered(ctx, x, y, w, h, featherPx = 3) {
  const pad = Math.max(2, featherPx * 2)
  const tmp = document.createElement('canvas')
  tmp.width = Math.max(1, w + pad * 2)
  tmp.height = Math.max(1, h + pad * 2)
  const tctx = tmp.getContext('2d')
  if (!tctx) return
  tctx.clearRect(0, 0, tmp.width, tmp.height)
  tctx.fillStyle = '#fff'
  tctx.fillRect(pad, pad, w, h)
  tctx.filter = `blur(${featherPx}px)`
  tctx.drawImage(tmp, 0, 0)

  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  ctx.drawImage(tmp, x - pad, y - pad)
  ctx.restore()
}

function refillRegionWithTexture(ctx, x, y, w, h, baseColorHex) {
  const rgb = hexToRgb(baseColorHex) ?? { r: 240, g: 240, b: 240 }
  const grad = ctx.createLinearGradient(x, y, x + w, y + h)
  grad.addColorStop(0, `rgb(${clampByte(rgb.r - 3)}, ${clampByte(rgb.g - 3)}, ${clampByte(rgb.b - 3)})`)
  grad.addColorStop(1, `rgb(${clampByte(rgb.r + 3)}, ${clampByte(rgb.g + 3)}, ${clampByte(rgb.b + 3)})`)
  ctx.save()
  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = grad
  ctx.fillRect(x, y, w, h)

  // subtle texture noise prevents flat synthetic patches
  const noiseAlpha = 0.035
  for (let iy = y; iy < y + h; iy += 2) {
    for (let ix = x; ix < x + w; ix += 2) {
      const n = ((ix * 13 + iy * 17) % 9) - 4
      const nr = clampByte(rgb.r + n)
      const ng = clampByte(rgb.g + n)
      const nb = clampByte(rgb.b + n)
      ctx.fillStyle = `rgba(${nr},${ng},${nb},${noiseAlpha})`
      ctx.fillRect(ix, iy, 2, 2)
    }
  }
  ctx.restore()
}


function drawNaturalOCRText(ctx, entry) {
  const { text, left, top, width, height, textStyle, layout } = entry
  const rgb = hexToRgb(textStyle.fill) ?? { r: 20, g: 20, b: 20 }
  const bg = hexToRgb(textStyle.backgroundFill) ?? { r: 240, g: 240, b: 240 }
  const fg = adjustTextColorForBackground(rgb, bg)
  const bgLum = 0.2126 * bg.r + 0.7152 * bg.g + 0.0722 * bg.b
  const alpha = Math.min(1, 0.94 + (((Math.floor(left) + Math.floor(top)) % 5) / 100))
  const blurPx = bgLum > 160 ? 0.15 : 0.3

  ctx.save()
  ctx.globalCompositeOperation = 'source-over'
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'
  ctx.font = `${textStyle.fontStyle} ${textStyle.fontWeight} ${layout.fontSize}px ${toSafeFontFamily(textStyle.fontFamily)}`
  ctx.fillStyle = `rgba(${fg.r}, ${fg.g}, ${fg.b}, ${Math.min(1, alpha)})`
  ctx.filter = `blur(${blurPx}px)`

  const metrics = ctx.measureText(text)
  const rawW = Math.max(1, metrics.width)
  const rawH = Math.max(1, (metrics.actualBoundingBoxAscent ?? layout.fontSize * 0.8) + (metrics.actualBoundingBoxDescent ?? layout.fontSize * 0.2))
  const targetW = Math.max(1, width)
  const targetH = Math.max(1, height * 0.92)
  const sx = Math.max(0.9, Math.min(1.12, targetW / rawW))
  const sy = Math.max(0.9, Math.min(1.12, targetH / rawH))

  ctx.translate(left, top + layout.baselineOffset)
  ctx.scale(sx, sy)
  drawTextWithCharSpacing(ctx, text, 0, 0, { ...layout, textAlign: 'left' })
  ctx.restore()
}

function drawTextWithCharSpacing(ctx, text, x, y, layout) {
  const spacingPx = (layout.charSpacing / 1000) * layout.fontSize
  if (Math.abs(spacingPx) < 0.01) {
    ctx.fillText(text, x, y)
    return
  }

  const align = layout.textAlign
  const metrics = ctx.measureText(text)
  const totalSpacing = spacingPx * Math.max(0, text.length - 1)
  const totalWidth = metrics.width + totalSpacing
  let cursor = x
  if (align === 'center') cursor = x - totalWidth / 2
  if (align === 'right') cursor = x - totalWidth

  for (const ch of text) {
    ctx.fillText(ch, cursor, y)
    cursor += ctx.measureText(ch).width + spacingPx
  }
}

// ─── getNaturalSize ───────────────────────────────────────────

function getNaturalSize(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      resolve({ w: img.naturalWidth, h: img.naturalHeight })
      URL.revokeObjectURL(url)
    }
    img.onerror = (e) => {
      URL.revokeObjectURL(url)
      reject(e)
    }
    img.src = url
  })
}

function getSourceImageData(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const offscreen = document.createElement('canvas')
      offscreen.width = img.naturalWidth
      offscreen.height = img.naturalHeight
      const ctx = offscreen.getContext('2d', { willReadFrequently: true })
      if (!ctx) {
        URL.revokeObjectURL(url)
        reject(new Error('Could not get 2D context for color extraction'))
        return
      }
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, offscreen.width, offscreen.height)
      URL.revokeObjectURL(url)
      resolve(imageData)
    }
    img.onerror = (e) => {
      URL.revokeObjectURL(url)
      reject(e)
    }
    img.src = url
  })
}

function getDominantColorInBBox(imageData, bbox) {
  const { data, width, height } = imageData
  const x0 = Math.max(0, Math.floor(Math.min(bbox.x0, bbox.x1)))
  const y0 = Math.max(0, Math.floor(Math.min(bbox.y0, bbox.y1)))
  const x1 = Math.min(width - 1, Math.ceil(Math.max(bbox.x0, bbox.x1)))
  const y1 = Math.min(height - 1, Math.ceil(Math.max(bbox.y0, bbox.y1)))
  if (x1 <= x0 || y1 <= y0) return '#ffffff'

  // Quantized histogram (16x16x16 bins) gives robust dominant color.
  const bins = new Map()
  const area = (x1 - x0 + 1) * (y1 - y0 + 1)
  const sampleStep = area > 12000 ? 3 : area > 4000 ? 2 : 1

  for (let y = y0; y <= y1; y += sampleStep) {
    for (let x = x0; x <= x1; x += sampleStep) {
      const i = (y * width + x) * 4
      const a = data[i + 3]
      if (a < 24) continue

      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const qr = r >> 4
      const qg = g >> 4
      const qb = b >> 4
      const key = (qr << 8) | (qg << 4) | qb

      const bucket = bins.get(key) ?? { count: 0, rSum: 0, gSum: 0, bSum: 0 }
      bucket.count += 1
      bucket.rSum += r
      bucket.gSum += g
      bucket.bSum += b
      bins.set(key, bucket)
    }
  }

  let best = null
  for (const bucket of bins.values()) {
    if (!best || bucket.count > best.count) best = bucket
  }
  if (!best || best.count === 0) return '#ffffff'

  const r = Math.round(best.rSum / best.count)
  const g = Math.round(best.gSum / best.count)
  const b = Math.round(best.bSum / best.count)
  return rgbToHex(r, g, b)
}

function getOCRTextStyle({ imageData, bbox, text, scale, cache, backgroundColorCache }) {
  const key = [
    Math.floor(bbox.x0 / 8),
    Math.floor(bbox.y0 / 8),
    Math.floor(bbox.x1 / 8),
    Math.floor(bbox.y1 / 8),
    text.length,
  ].join(':')
  if (cache.has(key)) return cache.get(key)

  const analysis = analyzeTextRegion(imageData, bbox, backgroundColorCache)
  const bboxHeight = Math.max(1, (bbox.y1 - bbox.y0) * scale)
  const bboxWidth = Math.max(1, (bbox.x1 - bbox.x0) * scale)
  const fontSize = Math.max(8, Math.round(bboxHeight * 0.92))
  const fontWeight = analysis.textPixelDensity > 0.4 || analysis.edgeContrast > 100 ? 'bold' : 'normal'
  const fontStyle = Math.abs(analysis.slant) > 0.12 ? 'italic' : 'normal'
  const fontFamily = pickClosestFont({
    text,
    slant: analysis.slant,
    edgeContrast: analysis.edgeContrast,
    roundness: analysis.roundness,
  })
  const textAlign = 'left'

  const chars = Math.max(1, text.length)
  const avgAdvance = bboxWidth / chars
  const spacingRatio = (avgAdvance / Math.max(1, fontSize)) - 0.56
  const charSpacing = Math.max(-40, Math.min(120, Math.round(spacingRatio * 1000)))

  const style = {
    fontFamily,
    fontSize,
    fontWeight,
    fontStyle,
    textAlign,
    fill: analysis.fill,
    backgroundFill: analysis.backgroundFill,
    charSpacing,
  }
  if (style.fill === '#ffffff') {
    console.warn('OCR style fallback to white fill for bbox:', bbox)
  }
  if (OCR_DEBUG_STYLES) {
    console.log('OCR style:', { bbox, text, style })
  }
  cache.set(key, style)
  return style
}

function calibrateTextboxLayout({
  text,
  width,
  height,
  fontFamily,
  fontWeight,
  fontStyle,
  textAlign,
}) {
  const targetW = Math.max(1, width)
  const targetH = Math.max(1, height)
  let fontSize = Math.max(8, targetH)
  let lineHeight = 1
  let charSpacing = 0
  const baselineOffset = targetH * 0.06

  // Refine font size so rendered height tracks bbox height.
  for (let i = 0; i < 5; i += 1) {
    const probe = new Textbox(text, {
      width: targetW,
      fontFamily,
      fontWeight,
      fontStyle,
      fontSize,
      lineHeight,
      charSpacing,
      textAlign,
      originX: 'left',
      originY: 'top',
      padding: 0,
      splitByGrapheme: false,
    })
    probe.initDimensions?.()
    const measuredH = Math.max(1, probe.height ?? probe.getScaledHeight?.() ?? targetH)
    const ratio = targetH / measuredH
    fontSize = Math.max(8, fontSize * ratio)
    if (Math.abs(1 - ratio) < 0.03) break
  }

  // Estimate charSpacing from target width vs measured width.
  const widthProbe = new Textbox(text, {
    width: targetW,
    fontFamily,
    fontWeight,
    fontStyle,
    fontSize,
    lineHeight,
    charSpacing: 0,
    textAlign,
    originX: 'left',
    originY: 'top',
    padding: 0,
    splitByGrapheme: false,
  })
  widthProbe.initDimensions?.()
  const measuredTextWidth = Math.max(1, widthProbe.width ?? widthProbe.getScaledWidth?.() ?? targetW)
  const charCount = Math.max(1, text.length)
  const spacingPx = (targetW - measuredTextWidth) / charCount
  charSpacing = Math.max(-30, Math.min(90, Math.round((spacingPx * 1000) / Math.max(1, fontSize))))

  // Final residual fit by scaling to bbox dimensions.
  const fitProbe = new Textbox(text, {
    width: targetW,
    fontFamily,
    fontWeight,
    fontStyle,
    fontSize,
    lineHeight,
    charSpacing,
    textAlign,
    originX: 'left',
    originY: 'top',
    padding: 0,
    splitByGrapheme: false,
  })
  fitProbe.initDimensions?.()
  const fitW = Math.max(1, fitProbe.width ?? fitProbe.getScaledWidth?.() ?? targetW)
  const fitH = Math.max(1, fitProbe.height ?? fitProbe.getScaledHeight?.() ?? targetH)

  return {
    textAlign,
    fontSize,
    lineHeight,
    charSpacing,
    baselineOffset,
    scaleX: Math.max(0.92, Math.min(1.08, targetW / fitW)),
    scaleY: Math.max(0.92, Math.min(1.08, targetH / fitH)),
  }
}

function analyzeTextRegion(imageData, bbox, backgroundColorCache) {
  const { data, width, height } = imageData
  const x0 = Math.max(0, Math.floor(Math.min(bbox.x0, bbox.x1)))
  const y0 = Math.max(0, Math.floor(Math.min(bbox.y0, bbox.y1)))
  const x1 = Math.min(width - 1, Math.ceil(Math.max(bbox.x0, bbox.x1)))
  const y1 = Math.min(height - 1, Math.ceil(Math.max(bbox.y0, bbox.y1)))
  if (x1 <= x0 || y1 <= y0) {
    return { fill: '#ffffff', inkDensity: 0, edgeContrast: 0, slant: 0 }
  }

  const bins = new Map()
  const textBins = new Map()
  const regionW = x1 - x0 + 1
  const regionH = y1 - y0 + 1
  const area = regionW * regionH
  const step = area > 12000 ? 4 : area > 4000 ? 3 : 2
  let sampleCount = 0
  let textPixelCount = 0
  let edgeContrast = 0
  let slantWeighted = 0
  let slantWeight = 0
  let centerXWeighted = 0
  let centerXWeight = 0
  let roundnessAccumulator = 0

  const backgroundFill = getBackgroundColorAroundBBox(imageData, bbox, backgroundColorCache)
  const bgRgb = hexToRgb(backgroundFill) ?? { r: 245, g: 245, b: 245 }
  const bgLum = 0.2126 * bgRgb.r + 0.7152 * bgRgb.g + 0.0722 * bgRgb.b

  for (let y = y0; y <= y1; y += step) {
    for (let x = x0; x <= x1; x += step) {
      const i = (y * width + x) * 4
      const a = data[i + 3]
      if (a < 24) continue
      sampleCount += 1

      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b

      const qr = r >> 4
      const qg = g >> 4
      const qb = b >> 4
      const key = (qr << 8) | (qg << 4) | qb
      const bucket = bins.get(key) ?? { count: 0, rSum: 0, gSum: 0, bSum: 0 }
      bucket.count += 1
      bucket.rSum += r
      bucket.gSum += g
      bucket.bSum += b
      bins.set(key, bucket)

      if (x + step <= x1) {
        const j = (y * width + (x + step)) * 4
        const lum2 = 0.2126 * data[j] + 0.7152 * data[j + 1] + 0.0722 * data[j + 2]
        edgeContrast += Math.abs(lum - lum2)
      }

      const contrastWithBg = Math.abs(lum - bgLum)
      const likelyTextOnLight = bgLum > 140 && lum < (bgLum - 18)
      const likelyTextOnDark = bgLum <= 140 && lum > (bgLum + 18)
      const isLikelyTextPixel = contrastWithBg > 22 && (likelyTextOnLight || likelyTextOnDark)
      if (isLikelyTextPixel) {
        textPixelCount += 1
        const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4)
        const textBucket = textBins.get(key) ?? { count: 0, rSum: 0, gSum: 0, bSum: 0 }
        textBucket.count += 1
        textBucket.rSum += r
        textBucket.gSum += g
        textBucket.bSum += b
        textBins.set(key, textBucket)

        // Slant heuristic: compare normalized x-center shift by y
        const nx = (x - x0) / Math.max(1, regionW)
        const ny = (y - y0) / Math.max(1, regionH)
        slantWeighted += (nx - 0.5) * (ny - 0.5)
        slantWeight += 1
        centerXWeighted += nx
        centerXWeight += 1
        roundnessAccumulator += Math.abs((nx - 0.5) * (ny - 0.5))
      }
    }
  }

  let best = null
  for (const bucket of bins.values()) {
    if (!best || bucket.count > best.count) best = bucket
  }
  let textBest = null
  for (const bucket of textBins.values()) {
    if (!textBest || bucket.count > textBest.count) textBest = bucket
  }
  let fill = textBest && textBest.count
    ? rgbToHex(
      Math.round(textBest.rSum / textBest.count),
      Math.round(textBest.gSum / textBest.count),
      Math.round(textBest.bSum / textBest.count),
    )
    : null
  if (!fill) {
    fill = best && best.count
    ? rgbToHex(
      Math.round(best.rSum / best.count),
      Math.round(best.gSum / best.count),
      Math.round(best.bSum / best.count),
    )
    : '#ffffff'
  }

  // Ensure high contrast fallback if text color drifts to background/white.
  if (!hasSufficientContrast(fill, backgroundFill) || fill === '#ffffff') {
    fill = bgLum > 140 ? '#111111' : '#f5f5f5'
  }

  return {
    fill,
    backgroundFill,
    textPixelDensity: sampleCount ? textPixelCount / sampleCount : 0,
    edgeContrast: sampleCount ? edgeContrast / sampleCount : 0,
    slant: slantWeight ? slantWeighted / slantWeight : 0,
    centerXNorm: centerXWeight ? centerXWeighted / centerXWeight : 0.5,
    roundness: slantWeight ? roundnessAccumulator / slantWeight : 0,
  }
}

function getBackgroundColorAroundBBox(imageData, bbox, cache) {
  const cacheKey = [
    Math.floor(bbox.x0 / 6),
    Math.floor(bbox.y0 / 6),
    Math.floor(bbox.x1 / 6),
    Math.floor(bbox.y1 / 6),
  ].join(':')
  if (cache?.has(cacheKey)) return cache.get(cacheKey)

  const { data, width, height } = imageData
  const x0 = Math.max(0, Math.floor(Math.min(bbox.x0, bbox.x1)))
  const y0 = Math.max(0, Math.floor(Math.min(bbox.y0, bbox.y1)))
  const x1 = Math.min(width - 1, Math.ceil(Math.max(bbox.x0, bbox.x1)))
  const y1 = Math.min(height - 1, Math.ceil(Math.max(bbox.y0, bbox.y1)))
  const ring = 3
  const bins = new Map()

  function sample(x, y) {
    if (x < 0 || y < 0 || x >= width || y >= height) return
    const i = (y * width + x) * 4
    if (data[i + 3] < 24) return
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
    // Ignore dark pixels likely belonging to foreground text.
    if (lum < 70) return
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4)
    const bucket = bins.get(key) ?? { count: 0, rSum: 0, gSum: 0, bSum: 0 }
    bucket.count += 1
    bucket.rSum += r
    bucket.gSum += g
    bucket.bSum += b
    bins.set(key, bucket)
  }

  const spanW = Math.max(1, x1 - x0 + 1)
  const spanH = Math.max(1, y1 - y0 + 1)
  const stepX = spanW > 140 ? 3 : spanW > 70 ? 2 : 1
  const stepY = spanH > 140 ? 3 : spanH > 70 ? 2 : 1

  // Top / bottom edge bands
  for (let y = y0 - ring; y <= y0 + ring; y += 1) {
    for (let x = x0; x <= x1; x += stepX) sample(x, y)
  }
  for (let y = y1 - ring; y <= y1 + ring; y += 1) {
    for (let x = x0; x <= x1; x += stepX) sample(x, y)
  }
  // Left / right edge bands
  for (let x = x0 - ring; x <= x0 + ring; x += 1) {
    for (let y = y0; y <= y1; y += stepY) sample(x, y)
  }
  for (let x = x1 - ring; x <= x1 + ring; x += 1) {
    for (let y = y0; y <= y1; y += stepY) sample(x, y)
  }

  let best = null
  for (const bucket of bins.values()) {
    if (!best || bucket.count > best.count) best = bucket
  }
  const color = !best || best.count === 0
    ? '#f5f5f5'
    : rgbToHex(
    Math.round(best.rSum / best.count),
    Math.round(best.gSum / best.count),
    Math.round(best.bSum / best.count),
  )
  if (cache) cache.set(cacheKey, color)
  return color
}

function pickClosestFont({ text, slant, edgeContrast, roundness }) {
  const hasMostlyDigits = /^[\d\s.,:/-]+$/.test(text)
  if (hasMostlyDigits) return 'Arial'
  if (edgeContrast < 20) return 'Times New Roman'
  if (Math.abs(slant) > 0.18) return 'Helvetica'
  return 'Arial'
}

function toSafeFontFamily(fontFamily) {
  if (fontFamily === 'Times New Roman') return `"Times New Roman", Georgia, serif`
  if (fontFamily === 'Helvetica') return `Helvetica, Arial, sans-serif`
  return `Arial, Helvetica, sans-serif`
}

function hasSufficientContrast(foreHex, backHex) {
  const f = hexToRgb(foreHex)
  const b = hexToRgb(backHex)
  if (!f || !b) return false
  const lf = 0.2126 * f.r + 0.7152 * f.g + 0.0722 * f.b
  const lb = 0.2126 * b.r + 0.7152 * b.g + 0.0722 * b.b
  return Math.abs(lf - lb) >= 45
}

function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return null
  const value = hex.replace('#', '').trim()
  if (value.length !== 6) return null
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  }
}

function adjustTextColorForBackground(fg, bg) {
  const fgLum = 0.2126 * fg.r + 0.7152 * fg.g + 0.0722 * fg.b
  const bgLum = 0.2126 * bg.r + 0.7152 * bg.g + 0.0722 * bg.b
  const delta = Math.abs(fgLum - bgLum)
  if (delta >= 52) return fg

  const direction = bgLum > fgLum ? -1 : 1
  const shift = 52 - delta
  return {
    r: clampByte(fg.r + direction * shift),
    g: clampByte(fg.g + direction * shift),
    b: clampByte(fg.b + direction * shift),
  }
}

function clampByte(v) {
  return Math.max(0, Math.min(255, Math.round(v)))
}

function rgbToHex(r, g, b) {
  const toHex = (v) => v.toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

// ─── runOCR ──────────────────────────────────────────────────

async function runOCR(file, onProgress) {
  // Tesseract.js v5 requires explicit output config
  // to get anything beyond plain text
  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        onProgress?.(Math.round(m.progress * 100))
      }
    },
  })

  // Set Tesseract parameters to enable HOCR + detailed output
  await worker.setParameters({
    tessedit_create_hocr:  '1',
    tessedit_create_tsv:   '1',
    tessedit_pageseg_mode: '3', // fully automatic page segmentation
  })

  const url = URL.createObjectURL(file)

  // Pass output options explicitly
  const result = await worker.recognize(url, {}, {
    hocr: true,
    text: true,
    tsv:  true,
  })

  URL.revokeObjectURL(url)
  await worker.terminate()

  const data = result.data

  console.log('Available keys:', Object.keys(data).filter(k =>
    data[k] !== undefined && data[k] !== null
  ))
  console.log('hocr exists:', typeof data.hocr === 'string' && data.hocr.length > 10)
  console.log('tsv exists:',  typeof data.tsv  === 'string' && data.tsv.length  > 10)
  console.log('text preview:', data.text?.substring(0, 150))

  return extractWords(data)
}

// ─── extractWords ─────────────────────────────────────────────

function extractWords(data) {

  // ── Strategy 1: HOCR — most reliable with bbox data ──────────
  if (typeof data.hocr === 'string' && data.hocr.length > 10) {
    const words = parseHOCR(data.hocr)
    if (words.length > 0) {
      console.log(`HOCR path: ${words.length} words found`)
      return words
    }
    console.warn('HOCR present but parsed 0 words')
  }

  // ── Strategy 2: TSV if it truly exists ───────────────────────
  if (typeof data.tsv === 'string' && data.tsv.length > 0) {
    const words = parseTSV(data.tsv)
    if (words.length > 0) {
      console.log(`TSV path: ${words.length} words found`)
      return words
    }
  }

  // ── Strategy 3: data.words direct array ──────────────────────
  if (Array.isArray(data.words) && data.words.length > 0) {
    console.log(`data.words path: ${data.words.length} words found`)
    return data.words.map(normalizeWord)
  }

  // ── Strategy 4: Recurse through any nested structure ─────────
  const walked = walkForWords(data)
  if (walked.length > 0) {
    console.log(`Walk path: ${walked.length} words found`)
    return walked
  }

  console.error('All strategies failed — data.text was:', data.text?.substring(0, 100))
  return []
}

// ─── HOCR Parser ─────────────────────────────────────────────
// Tesseract HOCR format:
// <span class='ocrx_word' title='bbox x0 y0 x1 y1; x_wconf 96'>Hello</span>

function parseHOCR(hocr) {
  const words  = []

  try {
    const parser = new DOMParser()
    const doc    = parser.parseFromString(hocr, 'text/html')
    const spans  = doc.querySelectorAll('span.ocrx_word')

    console.log(`HOCR: found ${spans.length} word spans`)

    spans.forEach(span => {
      const text  = span.textContent.trim()
      const title = span.getAttribute('title') ?? ''

      // Parse confidence: x_wconf 96
      const confMatch = title.match(/x_wconf\s+(\d+(?:\.\d+)?)/)
      const conf      = confMatch ? parseFloat(confMatch[1]) : 0

      // Parse bbox: bbox 47 22 138 67
      const bboxMatch = title.match(/bbox\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/)
      if (!bboxMatch || !text) return

      words.push({
        text,
        confidence: conf,
        bbox: {
          x0: parseInt(bboxMatch[1], 10),
          y0: parseInt(bboxMatch[2], 10),
          x1: parseInt(bboxMatch[3], 10),
          y1: parseInt(bboxMatch[4], 10),
        },
      })
    })
  } catch (err) {
    console.error('HOCR parse error:', err)
  }

  return words
}

// ─── TSV Parser ───────────────────────────────────────────────

function parseTSV(tsv) {
  const words = []
  const lines = tsv.split('\n')

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].trim().split('\t')
    if (cols.length < 12) continue

    const level  = parseInt(cols[0], 10)
    const conf   = parseFloat(cols[10])
    const text   = cols.slice(11).join('\t').trim()

    if (level !== 5) continue
    if (conf < 0)    continue
    if (!text)       continue

    words.push({
      text,
      confidence: conf,
      bbox: {
        x0: parseInt(cols[6], 10),
        y0: parseInt(cols[7], 10),
        x1: parseInt(cols[6], 10) + parseInt(cols[8], 10),
        y1: parseInt(cols[7], 10) + parseInt(cols[9], 10),
      },
    })
  }

  return words
}

// ─── Walk any nested Tesseract structure ──────────────────────

function walkForWords(data) {
  const words = []

  function walk(node) {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) {
      node.forEach(walk)
      return
    }

    // Leaf word node — has text + confidence + bbox, no child arrays
    if (
      typeof node.text       === 'string' &&
      typeof node.confidence === 'number' &&
      node.bbox &&
      !node.words && !node.lines && !node.paragraphs
    ) {
      words.push(normalizeWord(node))
      return
    }

    // Recurse into child arrays
    ;['blocks', 'paragraphs', 'lines', 'words', 'layoutBlocks'].forEach(key => {
      if (Array.isArray(node[key])) walk(node[key])
    })
  }

  walk(data)
  return words
}

// ─── normalizeWord ────────────────────────────────────────────

function normalizeWord(w) {
  return {
    text:       w.text       ?? '',
    confidence: w.confidence ?? 0,
    bbox: {
      x0: w.bbox?.x0 ?? 0,
      y0: w.bbox?.y0 ?? 0,
      x1: w.bbox?.x1 ?? 0,
      y1: w.bbox?.y1 ?? 0,
    },
  }
}