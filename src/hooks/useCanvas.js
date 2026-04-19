import { useEffect, useRef } from 'react'
import { Canvas } from 'fabric'

const CANVAS_WIDTH  = 800
const CANVAS_HEIGHT = 550

export function useCanvas(containerRef) {
  const canvasRef = useRef(null)
  const fabricRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container || fabricRef.current) return

    canvasRef.current.width  = CANVAS_WIDTH
    canvasRef.current.height = CANVAS_HEIGHT

    fabricRef.current = new Canvas(canvasRef.current, {
      width:                  CANVAS_WIDTH,
      height:                 CANVAS_HEIGHT,
      backgroundColor:        'transparent',
      preserveObjectStacking: true,
      selection:              true,
    })

    console.log('Canvas initialized:', CANVAS_WIDTH, CANVAS_HEIGHT)

    return () => {
      fabricRef.current?.dispose()
      fabricRef.current = null
    }
  }, [])

  return { canvasRef, fabricRef }
}