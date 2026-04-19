/**
 * Exports the fabric canvas as a PNG and triggers a download.
 * Temporarily hides selection handles before export.
 */
export function downloadCanvas(fabricRef, filename = 'smarteditor.png') {
  const canvas = fabricRef?.current
  if (!canvas) return

  // Deselect everything so handles don't appear in the export
  canvas.discardActiveObject()
  canvas.requestRenderAll()

  // Use fabric's built-in export
  const dataURL = canvas.toDataURL({
    format:     'png',
    quality:    1,
    multiplier: 1, // 1 = actual canvas size, 2 = 2x resolution
  })

  // Trigger browser download
  const link = document.createElement('a')
  link.href     = dataURL
  link.download = filename
  link.click()
}

/**
 * Export at 2x resolution for high-DPI / retina output
 */
export function downloadCanvasHD(fabricRef, filename = 'smarteditor-hd.png') {
  const canvas = fabricRef?.current
  if (!canvas) return

  canvas.discardActiveObject()
  canvas.requestRenderAll()

  const dataURL = canvas.toDataURL({
    format:     'png',
    quality:    1,
    multiplier: 2,
  })

  const link = document.createElement('a')
  link.href     = dataURL
  link.download = filename
  link.click()
}