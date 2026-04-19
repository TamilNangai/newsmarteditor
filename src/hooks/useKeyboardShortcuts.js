import { useEffect } from 'react'
import { deleteActive, duplicateActive } from '../utils/fabricHelpers'

export function useKeyboardShortcuts(fabricRef, onUndo, onRedo, setActiveTool) {
  useEffect(() => {
    async function handleKeyDown(e) {
      const canvas = fabricRef?.current
      if (!canvas) return

      const tag = document.activeElement?.tagName
      const isTyping    = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
      const isEditingText = canvas.getActiveObject()?.isEditing
      if (isTyping || isEditingText) return

      const ctrl = e.ctrlKey || e.metaKey

      switch (true) {
        // Object actions
        case e.key === 'Delete' || e.key === 'Backspace':
          e.preventDefault()
          deleteActive(canvas)
          break
        case ctrl && e.key === 'z':
          e.preventDefault()
          await onUndo?.()
          break
        case ctrl && (e.key === 'y' || e.key === 'Y'):
          e.preventDefault()
          await onRedo?.()
          break
        case ctrl && (e.key === 'd' || e.key === 'D'):
          e.preventDefault()
          await duplicateActive(canvas)
          break
        case e.key === 'Escape':
          canvas.discardActiveObject()
          canvas.requestRenderAll()
          break

        // Tool shortcuts
        case e.key === 'v' || e.key === 'V':
          setActiveTool?.('select')
          break
        case e.key === 't' || e.key === 'T':
          setActiveTool?.('text')
          break
        case e.key === 'r' || e.key === 'R':
          setActiveTool?.('rect')
          break
        case e.key === 'c' || e.key === 'C':
          setActiveTool?.('circle')
          break
        case e.key === 'a' || e.key === 'A':
          setActiveTool?.('arrow')
          break

        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [fabricRef, onUndo, onRedo, setActiveTool])
}