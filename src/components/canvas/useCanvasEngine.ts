'use client'

import { useRef, useState, useCallback, useEffect } from 'react'

export type CanvasTool = 'pen' | 'brush' | 'marker' | 'eraser' | 'bucket' | 'eyedropper' | 'hand' | 'move_base'

export interface CanvasLayer {
  id: string
  name: string
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  visible: boolean
  opacity: number
  isParentBase?: boolean
}

export interface CanvasEngineOptions {
  width: number
  height: number
  parentImageUrl?: string | null
}

export interface ParentTransform {
  x: number
  y: number
  scale: number
}

interface Point {
  x: number
  y: number
  pressure: number
}

const MAX_HISTORY = 25

export function useCanvasEngine({ width, height, parentImageUrl }: CanvasEngineOptions) {
  const [tool, setTool] = useState<CanvasTool>('pen')
  const [color, setColor] = useState('#23272E')
  const [brushSize, setBrushSize] = useState(6)
  const [brushOpacity, setBrushOpacity] = useState(1.0)
  const [stabilizerAmount, setStabilizerAmount] = useState(3) // 0〜10
  const [zoom, setZoom] = useState(1.0)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  // 親画像の変形（位置・スケール）
  const [parentTransform, setParentTransform] = useState<ParentTransform>({ x: 0, y: 0, scale: 1.0 })
  const parentImgRef = useRef<HTMLImageElement | null>(null)
  const lastMoveStartRef = useRef<{ x: number; y: number; initialX: number; initialY: number } | null>(null)

  const layersRef = useRef<CanvasLayer[]>([])
  const activeLayerIdRef = useRef<string | null>(null)
  const [layersState, setLayersState] = useState<{ id: string; name: string; visible: boolean; opacity: number; isParentBase?: boolean }[]>([])
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null)

  // Undo / Redo 履歴
  const historyStackRef = useRef<{ layerId: string; imageData: ImageData }[][]>([])
  const historyIndexRef = useRef<number>(-1)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const isDrawingRef = useRef(false)
  const pointsRef = useRef<Point[]>([])
  const isInitializedRef = useRef(false)

  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null)

  // レイヤー全体の描画をメインキャンバスに合成表示
  const renderComposite = useCallback(() => {
    const mainCanvas = mainCanvasRef.current
    if (!mainCanvas) return
    const mainCtx = mainCanvas.getContext('2d')
    if (!mainCtx) return

    mainCtx.clearRect(0, 0, width, height)

    // ドットペーパー風の背景を描画
    mainCtx.fillStyle = '#F7F5F0'
    mainCtx.fillRect(0, 0, width, height)

    for (const layer of layersRef.current) {
      if (!layer.visible) continue
      mainCtx.globalAlpha = layer.opacity
      mainCtx.drawImage(layer.canvas, 0, 0)
    }
    mainCtx.globalAlpha = 1.0
  }, [width, height])

  // 親画像レイヤーを再描画
  const redrawParentLayer = useCallback((trans: ParentTransform) => {
    const parentLayer = layersRef.current.find((l) => l.isParentBase)
    const img = parentImgRef.current
    if (!parentLayer || !img) return

    const ctx = parentLayer.ctx
    ctx.clearRect(0, 0, width, height)
    ctx.drawImage(
      img,
      trans.x,
      trans.y,
      width * trans.scale,
      height * trans.scale
    )
    renderComposite()
  }, [width, height, renderComposite])

  // 親画像の変形更新 API
  const updateParentTransform = useCallback((newTrans: Partial<ParentTransform>) => {
    setParentTransform((prev) => {
      const updated = { ...prev, ...newTrans }
      redrawParentLayer(updated)
      return updated
    })
  }, [redrawParentLayer])

  // 履歴の保存
  const pushHistory = useCallback(() => {
    const snapshot = layersRef.current.map((layer) => {
      const imgData = layer.ctx.getImageData(0, 0, width, height)
      return { layerId: layer.id, imageData: imgData }
    })

    const newStack = historyStackRef.current.slice(0, historyIndexRef.current + 1)
    newStack.push(snapshot)
    if (newStack.length > MAX_HISTORY) {
      newStack.shift()
    }

    historyStackRef.current = newStack
    historyIndexRef.current = newStack.length - 1
    setCanUndo(historyIndexRef.current > 0)
    setCanRedo(false)
  }, [width, height])

  // Undo
  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return
    historyIndexRef.current -= 1
    const snapshot = historyStackRef.current[historyIndexRef.current]
    if (!snapshot) return

    for (const item of snapshot) {
      const layer = layersRef.current.find((l) => l.id === item.layerId)
      if (layer) {
        layer.ctx.putImageData(item.imageData, 0, 0)
      }
    }
    renderComposite()
    setCanUndo(historyIndexRef.current > 0)
    setCanRedo(true)
  }, [renderComposite])

  // Redo
  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyStackRef.current.length - 1) return
    historyIndexRef.current += 1
    const snapshot = historyStackRef.current[historyIndexRef.current]
    if (!snapshot) return

    for (const item of snapshot) {
      const layer = layersRef.current.find((l) => l.id === item.layerId)
      if (layer) {
        layer.ctx.putImageData(item.imageData, 0, 0)
      }
    }
    renderComposite()
    setCanUndo(true)
    setCanRedo(historyIndexRef.current < historyStackRef.current.length - 1)
  }, [renderComposite])

  // レイヤー追加ヘルパー
  const createLayer = useCallback((id: string, name: string, isParentBase = false): CanvasLayer => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    return { id, name, canvas, ctx, visible: true, opacity: 1.0, isParentBase }
  }, [width, height])

  const updateLayersState = useCallback(() => {
    setLayersState(
      layersRef.current.map((l) => ({
        id: l.id,
        name: l.name,
        visible: l.visible,
        opacity: l.opacity,
        isParentBase: l.isParentBase,
      }))
    )
    setActiveLayerId(activeLayerIdRef.current)
  }, [])

  // 初期化
  useEffect(() => {
    if (isInitializedRef.current || width === 0 || height === 0) return
    isInitializedRef.current = true

    const init = async () => {
      const layers: CanvasLayer[] = []

      // 1. 親作品レイヤー (Base Layer)
      if (parentImageUrl) {
        const baseLayer = createLayer('layer-parent', '元作品 (背景)', true)
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.src = parentImageUrl
        parentImgRef.current = img

        await new Promise((resolve) => {
          img.onload = () => {
            baseLayer.ctx.drawImage(img, 0, 0, width, height)
            resolve(true)
          }
          img.onerror = () => resolve(false)
        })
        layers.push(baseLayer)
      }

      // 2. ユーザー描画レイヤー 1
      const drawLayer = createLayer('layer-1', '描画レイヤー 1', false)
      layers.push(drawLayer)

      layersRef.current = layers
      activeLayerIdRef.current = drawLayer.id
      updateLayersState()
      renderComposite()
      pushHistory()
    }

    init()
  }, [width, height, parentImageUrl, createLayer, updateLayersState, renderComposite, pushHistory])

  // レイヤー操作 API
  const addLayer = useCallback(() => {
    const newId = `layer-${Date.now()}`
    const newName = `レイヤー ${layersRef.current.length}`
    const newLayer = createLayer(newId, newName)
    layersRef.current.push(newLayer)
    activeLayerIdRef.current = newId
    updateLayersState()
    renderComposite()
    pushHistory()
  }, [createLayer, updateLayersState, renderComposite, pushHistory])

  const removeLayer = useCallback((id: string) => {
    if (layersRef.current.length <= 1) return
    const target = layersRef.current.find((l) => l.id === id)
    if (target?.isParentBase) return

    layersRef.current = layersRef.current.filter((l) => l.id !== id)
    if (activeLayerIdRef.current === id) {
      activeLayerIdRef.current = layersRef.current[layersRef.current.length - 1].id
    }
    updateLayersState()
    renderComposite()
    pushHistory()
  }, [updateLayersState, renderComposite, pushHistory])

  const setLayerVisibility = useCallback((id: string, visible: boolean) => {
    const layer = layersRef.current.find((l) => l.id === id)
    if (layer) {
      layer.visible = visible
      updateLayersState()
      renderComposite()
    }
  }, [updateLayersState, renderComposite])

  const setLayerOpacity = useCallback((id: string, opacity: number) => {
    const layer = layersRef.current.find((l) => l.id === id)
    if (layer) {
      layer.opacity = opacity
      updateLayersState()
      renderComposite()
    }
  }, [updateLayersState, renderComposite])

  const selectLayer = useCallback((id: string) => {
    activeLayerIdRef.current = id
    setActiveLayerId(id)
  }, [])

  const moveLayer = useCallback((id: string, direction: 'up' | 'down') => {
    const index = layersRef.current.findIndex((l) => l.id === id)
    if (index === -1) return
    const targetIndex = direction === 'up' ? index + 1 : index - 1
    if (targetIndex < 0 || targetIndex >= layersRef.current.length) return

    const temp = layersRef.current[index]
    layersRef.current[index] = layersRef.current[targetIndex]
    layersRef.current[targetIndex] = temp
    updateLayersState()
    renderComposite()
  }, [updateLayersState, renderComposite])

  // スポイト機能
  const pickColorAt = useCallback((x: number, y: number) => {
    const mainCanvas = mainCanvasRef.current
    if (!mainCanvas) return
    const ctx = mainCanvas.getContext('2d')
    if (!ctx) return

    const pixel = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data
    const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1)}`
    setColor(hex)
  }, [])

  // バケツ塗り (Flood Fill Algorithm)
  const floodFill = useCallback((startX: number, startY: number, fillColorHex: string) => {
    const activeLayer = layersRef.current.find((l) => l.id === activeLayerIdRef.current)
    if (!activeLayer || activeLayer.isParentBase) return

    const ctx = activeLayer.ctx
    const imgData = ctx.getImageData(0, 0, width, height)
    const data = imgData.data

    const r = parseInt(fillColorHex.slice(1, 3), 16)
    const g = parseInt(fillColorHex.slice(3, 5), 16)
    const b = parseInt(fillColorHex.slice(5, 7), 16)
    const a = 255

    const targetPos = (Math.floor(startY) * width + Math.floor(startX)) * 4
    const targetR = data[targetPos]
    const targetG = data[targetPos + 1]
    const targetB = data[targetPos + 2]
    const targetA = data[targetPos + 3]

    if (targetR === r && targetG === g && targetB === b && targetA === a) return

    const matchTarget = (pos: number) => {
      return (
        Math.abs(data[pos] - targetR) <= 30 &&
        Math.abs(data[pos + 1] - targetG) <= 30 &&
        Math.abs(data[pos + 2] - targetB) <= 30 &&
        Math.abs(data[pos + 3] - targetA) <= 30
      )
    }

    const queue: number[] = [Math.floor(startX), Math.floor(startY)]

    while (queue.length > 0) {
      const cy = queue.pop()!
      const cx = queue.pop()!

      const pos = (cy * width + cx) * 4
      if (matchTarget(pos)) {
        data[pos] = r
        data[pos + 1] = g
        data[pos + 2] = b
        data[pos + 3] = a

        if (cx > 0) queue.push(cx - 1, cy)
        if (cx < width - 1) queue.push(cx + 1, cy)
        if (cy > 0) queue.push(cx, cy - 1)
        if (cy < height - 1) queue.push(cx, cy + 1)
      }
    }

    ctx.putImageData(imgData, 0, 0)
    renderComposite()
    pushHistory()
  }, [width, height, renderComposite, pushHistory])

  // 手ブレ補正移動平均
  const getSmoothedPoint = (points: Point[], amount: number): Point => {
    if (points.length === 0) return { x: 0, y: 0, pressure: 0.5 }
    if (amount === 0 || points.length < 2) return points[points.length - 1]

    const samples = points.slice(-Math.min(points.length, amount + 2))
    let sumX = 0
    let sumY = 0
    let sumP = 0
    samples.forEach((p) => {
      sumX += p.x
      sumY += p.y
      sumP += p.pressure
    })

    return {
      x: sumX / samples.length,
      y: sumY / samples.length,
      pressure: sumP / samples.length,
    }
  }

  // 描画開始
  const startDrawing = useCallback((x: number, y: number, pressure = 0.5) => {
    if (tool === 'move_base') {
      isDrawingRef.current = true
      lastMoveStartRef.current = {
        x,
        y,
        initialX: parentTransform.x,
        initialY: parentTransform.y,
      }
      return
    }
    if (tool === 'eyedropper') {
      pickColorAt(x, y)
      return
    }
    if (tool === 'bucket') {
      floodFill(x, y, color)
      return
    }

    const activeLayer = layersRef.current.find((l) => l.id === activeLayerIdRef.current)
    if (!activeLayer || activeLayer.isParentBase) return

    isDrawingRef.current = true
    pointsRef.current = [{ x, y, pressure }]

    const ctx = activeLayer.ctx
    ctx.beginPath()

    const size = brushSize * (0.3 + 0.7 * pressure)

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.strokeStyle = 'rgba(0,0,0,1)'
      ctx.fillStyle = 'rgba(0,0,0,1)'
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = color
      ctx.fillStyle = color
      ctx.globalAlpha = tool === 'brush' ? brushOpacity * 0.4 : tool === 'marker' ? brushOpacity * 0.7 : brushOpacity
    }

    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = size

    ctx.arc(x, y, size / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(x, y)

    renderComposite()
  }, [tool, color, brushSize, brushOpacity, pickColorAt, floodFill, renderComposite, parentTransform])

  // 描画中
  const draw = useCallback((x: number, y: number, pressure = 0.5) => {
    if (!isDrawingRef.current) return

    if (tool === 'move_base' && lastMoveStartRef.current) {
      const dx = x - lastMoveStartRef.current.x
      const dy = y - lastMoveStartRef.current.y
      const nextX = Math.round(lastMoveStartRef.current.initialX + dx)
      const nextY = Math.round(lastMoveStartRef.current.initialY + dy)
      updateParentTransform({ x: nextX, y: nextY })
      return
    }

    const activeLayer = layersRef.current.find((l) => l.id === activeLayerIdRef.current)
    if (!activeLayer || activeLayer.isParentBase) return

    pointsRef.current.push({ x, y, pressure })
    const smoothed = getSmoothedPoint(pointsRef.current, stabilizerAmount)

    const ctx = activeLayer.ctx
    const size = brushSize * (0.3 + 0.7 * smoothed.pressure)
    ctx.lineWidth = size

    ctx.lineTo(smoothed.x, smoothed.y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(smoothed.x, smoothed.y)

    renderComposite()
  }, [tool, brushSize, stabilizerAmount, renderComposite, updateParentTransform])

  // 描画終了
  const stopDrawing = useCallback(() => {
    if (!isDrawingRef.current) return
    isDrawingRef.current = false
    lastMoveStartRef.current = null
    pointsRef.current = []

    const activeLayer = layersRef.current.find((l) => l.id === activeLayerIdRef.current)
    if (activeLayer) {
      activeLayer.ctx.globalCompositeOperation = 'source-over'
      activeLayer.ctx.globalAlpha = 1.0
    }

    renderComposite()
    pushHistory()
  }, [renderComposite, pushHistory])

  // 完成画像のエクスポート (PNG DataURL)
  const exportImage = useCallback((): string | null => {
    const mainCanvas = mainCanvasRef.current
    if (!mainCanvas) return null
    return mainCanvas.toDataURL('image/png')
  }, [])

  return {
    mainCanvasRef,
    tool,
    setTool,
    color,
    setColor,
    brushSize,
    setBrushSize,
    brushOpacity,
    setBrushOpacity,
    stabilizerAmount,
    setStabilizerAmount,
    zoom,
    setZoom,
    pan,
    setPan,
    parentTransform,
    updateParentTransform,
    layersState,
    activeLayerId,
    selectLayer,
    addLayer,
    removeLayer,
    setLayerVisibility,
    setLayerOpacity,
    moveLayer,
    startDrawing,
    draw,
    stopDrawing,
    undo,
    redo,
    canUndo,
    canRedo,
    exportImage,
  }
}
