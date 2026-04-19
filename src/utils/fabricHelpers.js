import { IText, Rect, Circle, Group, Line, Triangle } from 'fabric'

/**
 * Draws a CSS checkerboard pattern behind the canvas
 */
export function applyCheckerboard(containerEl) {
  containerEl.style.backgroundImage = `
    linear-gradient(45deg, #2a2a3e 25%, transparent 25%),
    linear-gradient(-45deg, #2a2a3e 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #2a2a3e 75%),
    linear-gradient(-45deg, transparent 75%, #2a2a3e 75%)
  `
  containerEl.style.backgroundSize     = '20px 20px'
  containerEl.style.backgroundPosition = '0 0, 0 10px, 10px -10px, -10px 0px'
}

/**
 * Add editable text
 */
export function addText(canvas, options = {}) {
  const text = new IText('Double-click to edit', {
    left:       canvas.getWidth()  / 2,
    top:        canvas.getHeight() / 2,
    originX:    'center',
    originY:    'center',
    fontSize:   32,
    fill:       '#ffffff',
    fontFamily: 'Arial',
    fontWeight: 'normal',
    fontStyle:  'normal',
    textAlign:  'left',
    editable:   true,
    ...options,
  })
  canvas.add(text)
  canvas.setActiveObject(text)
  canvas.requestRenderAll()
  return text
}

/**
 * Add a rectangle
 */
export function addRect(canvas) {
  const rect = new Rect({
    left:        canvas.getWidth()  / 2,
    top:         canvas.getHeight() / 2,
    originX:     'center',
    originY:     'center',
    width:       160,
    height:      100,
    fill:        'rgba(124, 58, 237, 0.5)',
    stroke:      '#7c3aed',
    strokeWidth: 2,
    rx:          8,
    ry:          8,
  })
  canvas.add(rect)
  canvas.setActiveObject(rect)
  canvas.requestRenderAll()
  return rect
}

/**
 * Add a circle
 */
export function addCircle(canvas) {
  const circle = new Circle({
    left:        canvas.getWidth()  / 2,
    top:         canvas.getHeight() / 2,
    originX:     'center',
    originY:     'center',
    radius:      60,
    fill:        'rgba(124, 58, 237, 0.5)',
    stroke:      '#7c3aed',
    strokeWidth: 2,
  })
  canvas.add(circle)
  canvas.setActiveObject(circle)
  canvas.requestRenderAll()
  return circle
}

/**
 * Add a proper arrow (line + triangle head grouped)
 */
export function addArrow(canvas) {
  const line = new Line([0, 0, 180, 0], {
    stroke:        '#ffffff',
    strokeWidth:   3,
    strokeLineCap: 'round',
  })

  const head = new Triangle({
    width:   16,
    height:  16,
    fill:    '#ffffff',
    left:    188,
    top:     -8,
    angle:   90,
  })

  const arrow = new Group([line, head], {
    left:    canvas.getWidth()  / 2,
    top:     canvas.getHeight() / 2,
    originX: 'center',
    originY: 'center',
  })

  canvas.add(arrow)
  canvas.setActiveObject(arrow)
  canvas.requestRenderAll()
  return arrow
}

/**
 * Delete active object
 */
export function deleteActive(canvas) {
  const obj = canvas.getActiveObject()
  if (!obj || obj.data?.role === 'background') return
  canvas.remove(obj)
  canvas.discardActiveObject()
  canvas.requestRenderAll()
}

/**
 * Duplicate active object
 */
export async function duplicateActive(canvas) {
  const obj = canvas.getActiveObject()
  if (!obj || obj.data?.role === 'background') return
  const clone = await obj.clone()
  clone.set({ left: obj.left + 20, top: obj.top + 20 })
  canvas.add(clone)
  canvas.setActiveObject(clone)
  canvas.requestRenderAll()
}