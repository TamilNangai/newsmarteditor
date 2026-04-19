import { FabricImage } from 'fabric'
import { useEditorStore } from '../store/editorStore'

export function useImageUpload(fabricRef) {
  const setImageFile = useEditorStore((s) => s.setImageFile)

  async function loadImageToCanvas(file) {
    const canvas = fabricRef?.current
    if (!canvas) return

    const img = await new Promise((resolve, reject) => {
      const el  = new Image()
      el.onload = () => resolve(el)
      el.onerror = reject
      el.src = URL.createObjectURL(file)
    })

    const canvasW = canvas.getWidth()
    const canvasH = canvas.getHeight()
    const scale   = Math.min(canvasW / img.naturalWidth, canvasH / img.naturalHeight)

    const fabricImg = new FabricImage(img, {
      left:          canvasW / 2,
      top:           canvasH / 2,
      originX:       'center',
      originY:       'center',
      scaleX:        scale,
      scaleY:        scale,
      selectable:    false,
      evented:       false,
      hasControls:   false,
      hasBorders:    false,
      lockMovementX: true,
      lockMovementY: true,
      data:          { role: 'background' },
    })

    const existing = canvas.getObjects().find(o => o.data?.role === 'background')
    if (existing) canvas.remove(existing)

    canvas.add(fabricImg)
    canvas.sendObjectToBack(fabricImg)
    canvas.requestRenderAll()

    // Save file reference for OCR
    setImageFile(file)
  }

  return { loadImageToCanvas }
}