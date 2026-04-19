import { useEffect, useState } from 'react'

/**
 * Tracks the currently selected fabric object.
 * Returns null when nothing is selected.
 */
export function useActiveObject(fabricRef) {
  const [activeObject, setActiveObject] = useState(null)

  useEffect(() => {
    if (!fabricRef) return
    const canvas = fabricRef.current
    if (!canvas) return

    function isTextSelection(obj) {
      return obj?.type === 'i-text' || obj?.type === 'textbox'
    }

    function onSelect(e) {
      const selected = e.selected?.[0] ?? null
      setActiveObject(isTextSelection(selected) ? selected : null)
    }

    function onClear() {
      setActiveObject(null)
    }

    canvas.on('selection:created',  onSelect)
    canvas.on('selection:updated',  onSelect)
    canvas.on('selection:cleared',  onClear)

    return () => {
      canvas.off('selection:created',  onSelect)
      canvas.off('selection:updated',  onSelect)
      canvas.off('selection:cleared',  onClear)
    }
  }, [fabricRef?.current]) // re-bind when canvas is ready

  return { activeObject, setActiveObject }
}