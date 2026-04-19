import { create } from 'zustand'

export const useEditorStore = create((set) => ({
  activeTool:    'select',
  setActiveTool: (tool) => set({ activeTool: tool }),

  fabricRef:    null,
  setFabricRef: (ref) => set({ fabricRef: ref }),

  // Store the raw image file for OCR
  imageFile:    null,
  setImageFile: (file) => set({ imageFile: file }),

  onUndo: null,
  onRedo: null,
  onSave: null,
  setHistoryActions: (actions) => set(actions),
}))