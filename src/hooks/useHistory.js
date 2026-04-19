import { useRef, useCallback } from 'react'

export function useHistory(fabricRef) {
  const history  = useRef([])   // array of JSON snapshots
  const pointer  = useRef(-1)   // current position in history
  const paused   = useRef(false) // pause recording during undo/redo

  // Save current canvas state to history
  const save = useCallback(() => {
    if (paused.current) return
    const canvas = fabricRef?.current
    if (!canvas) return

    const json = canvas.toJSON(['data', 'selectable', 'evented',
                                'hasControls', 'hasBorders',
                                'lockMovementX', 'lockMovementY'])

    // If we undo then make a change, discard the redo branch
    if (pointer.current < history.current.length - 1) {
      history.current = history.current.slice(0, pointer.current + 1)
    }

    history.current.push(json)
    pointer.current = history.current.length - 1
  }, [fabricRef])

  // Restore a snapshot at a given pointer position
  const restore = useCallback(async (index) => {
    const canvas = fabricRef?.current
    if (!canvas) return
    const snapshot = history.current[index]
    if (!snapshot) return

    paused.current = true
    await canvas.loadFromJSON(snapshot)
    canvas.renderAll()
    canvas.fire('history:restored')
    paused.current = false
  }, [fabricRef])

  const undo = useCallback(async () => {
    if (pointer.current <= 0) return
    pointer.current -= 1
    await restore(pointer.current)
  }, [restore])

  const redo = useCallback(async () => {
    if (pointer.current >= history.current.length - 1) return
    pointer.current += 1
    await restore(pointer.current)
  }, [restore])

  const canUndo = () => pointer.current > 0
  const canRedo = () => pointer.current < history.current.length - 1

  return { save, undo, redo, canUndo, canRedo }
}