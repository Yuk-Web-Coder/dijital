'use client'

import { useEffect, useRef, useState } from 'react'
import { useCanvasEngine } from './useCanvasEngine'
import {
  PenTool,
  Paintbrush,
  Highlighter,
  Eraser,
  PaintBucket,
  Pipette,
  Hand,
  Move,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Layers,
  Check,
  X,
  Sliders,
  Maximize2,
  RotateCcw,
} from 'lucide-react'

interface WebCanvasEditorProps {
  parentArtworkId?: string
  parentImageUrl?: string | null
  parentAuthorName?: string
  onClose: () => void
  onExportAndPost: (dataUrl: string) => void
}

const COLOR_PRESETS = [
  '#23272E', // 墨・グラファイト
  '#2D4B75', // 群青 (Pigment Blue)
  '#BD5D38', // 弁柄 (Burnt Sienna)
  '#3D6B52', // 常磐 (Pigment Green)
  '#E8C85A', // 山吹 (Yamabuki Yellow)
  '#8C7B6B', // 灰土 (Raw Umber)
  '#FFFFFF', // 胡粉 (White)
]

export function WebCanvasEditor({
  parentImageUrl,
  parentAuthorName,
  onClose,
  onExportAndPost,
}: WebCanvasEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 800 })

  // コンテナサイズに合わせてキャンバスのアスペクト比を動的設定
  useEffect(() => {
    if (parentImageUrl) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = parentImageUrl
      img.onload = () => {
        let w = img.naturalWidth || 800
        let h = img.naturalHeight || 800
        const maxDim = 1200
        if (w > maxDim || h > maxDim) {
          const ratio = Math.min(maxDim / w, maxDim / h)
          w = Math.round(w * ratio)
          h = Math.round(h * ratio)
        }
        setCanvasDimensions({ width: w, height: h })
      }
    }
  }, [parentImageUrl])

  const {
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
  } = useCanvasEngine({
    width: canvasDimensions.width,
    height: canvasDimensions.height,
    parentImageUrl,
  })

  // ショートカットキーリスナー
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          redo()
        } else {
          undo()
        }
      } else if (e.key === '[') {
        setBrushSize((s) => Math.max(1, s - 2))
      } else if (e.key === ']') {
        setBrushSize((s) => Math.min(100, s + 2))
      } else if (e.key.toLowerCase() === 'b') {
        setTool('pen')
      } else if (e.key.toLowerCase() === 'e') {
        setTool('eraser')
      } else if (e.key.toLowerCase() === 'g') {
        setTool('bucket')
      } else if (e.key.toLowerCase() === 'i') {
        setTool('eyedropper')
      } else if (e.key.toLowerCase() === 'v') {
        setTool('move_base')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, setBrushSize, setTool])

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = mainCanvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    const pressure = e.pressure && e.pressure > 0 ? e.pressure : 0.5

    canvas.setPointerCapture(e.pointerId)
    startDrawing(x, y, pressure)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = mainCanvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    const pressure = e.pressure && e.pressure > 0 ? e.pressure : 0.5

    draw(x, y, pressure)
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = mainCanvasRef.current
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId)
    }
    stopDrawing()
  }

  const handleComplete = () => {
    const dataUrl = exportImage()
    if (dataUrl) {
      onExportAndPost(dataUrl)
    }
  }

  return (
    <div className="fixed inset-0 bg-[var(--ink-primary)]/80 backdrop-blur-sm z-50 flex flex-col animate-fade-in select-none">
      {/* 1. トップヘッダー */}
      <header className="h-13 bg-[var(--surface-paper)] border-b border-[var(--color-border-soft)] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-serif font-bold text-sm text-[var(--ink-primary)]">
            <Sliders size={16} className="text-[var(--pigment-blue)]" />
            <span>描き足し Webキャンバス Studio</span>
          </div>
          {parentAuthorName && (
            <span className="text-xs text-[var(--color-text-muted)] border-l border-[var(--color-border-soft)] pl-3">
              親作品: {parentAuthorName} さんの作品
            </span>
          )}
        </div>

        {/* 履歴 ＆ ズーム ＆ 完成ボタン */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 border-r border-[var(--color-border-soft)] pr-3">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="p-1.5 rounded-xs hover:bg-[var(--bg-gesso)] text-[var(--ink-primary)] disabled:opacity-30"
              title="元に戻す (Ctrl+Z)"
            >
              <Undo2 size={16} />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="p-1.5 rounded-xs hover:bg-[var(--bg-gesso)] text-[var(--ink-primary)] disabled:opacity-30"
              title="やり直し (Ctrl+Shift+Z)"
            >
              <Redo2 size={16} />
            </button>
          </div>

          <div className="flex items-center gap-1.5 border-r border-[var(--color-border-soft)] pr-3 text-xs font-mono">
            <button
              onClick={() => setZoom((z) => Math.max(0.2, z - 0.1))}
              className="p-1 rounded-xs hover:bg-[var(--bg-gesso)]"
            >
              <ZoomOut size={14} />
            </button>
            <span>{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(4.0, z + 0.1))}
              className="p-1 rounded-xs hover:bg-[var(--bg-gesso)]"
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={() => setZoom(1.0)}
              className="p-1 rounded-xs hover:bg-[var(--bg-gesso)] text-[0.7rem]"
              title="リセット"
            >
              <Maximize2 size={13} />
            </button>
          </div>

          <button
            onClick={handleComplete}
            className="btn btn--primary text-xs py-1.5 px-4"
          >
            <Check size={14} />
            <span>完成して投稿へ進む</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--ink-primary)]"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      {/* 2. メイン編集エリア (左ツールバー + 中央キャンバス + 右レイヤーパネル) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* 左: ツールバー */}
        <aside className="w-14 bg-[var(--surface-paper)] border-r border-[var(--color-border-soft)] p-2 flex flex-col items-center gap-2 shrink-0 z-10">
          <ToolButton
            active={tool === 'pen'}
            onClick={() => setTool('pen')}
            icon={<PenTool size={18} />}
            title="Gペン / インク (B)"
          />
          <ToolButton
            active={tool === 'brush'}
            onClick={() => setTool('brush')}
            icon={<Paintbrush size={18} />}
            title="水彩ブラシ"
          />
          <ToolButton
            active={tool === 'marker'}
            onClick={() => setTool('marker')}
            icon={<Highlighter size={18} />}
            title="マーカー"
          />
          <ToolButton
            active={tool === 'eraser'}
            onClick={() => setTool('eraser')}
            icon={<Eraser size={18} />}
            title="消しゴム (E)"
          />
          <ToolButton
            active={tool === 'bucket'}
            onClick={() => setTool('bucket')}
            icon={<PaintBucket size={18} />}
            title="バケツ塗りつぶし (G)"
          />
          <ToolButton
            active={tool === 'eyedropper'}
            onClick={() => setTool('eyedropper')}
            icon={<Pipette size={18} />}
            title="スポイト (I)"
          />
          <ToolButton
            active={tool === 'move_base'}
            onClick={() => setTool('move_base')}
            icon={<Move size={18} />}
            title="元絵の位置・サイズ移動 (V / ドラッグ可)"
          />
          <ToolButton
            active={tool === 'hand'}
            onClick={() => setTool('hand')}
            icon={<Hand size={18} />}
            title="手のひら (Space)"
          />
        </aside>

        {/* サブ設定バー (サイズ / 不透明度 / 手ブレ補正 / カラー / 元絵トランスフォーム) */}
        <div className="absolute top-3 left-18 z-20 bg-[var(--surface-paper)]/95 backdrop-blur-xs border border-[var(--color-border-soft)] rounded-xs p-2.5 shadow-md flex items-center gap-4 text-xs flex-wrap">
          {tool === 'move_base' ? (
            /* 元絵移動モード時のコントロールバー */
            <div className="flex items-center gap-4 text-xs">
              <span className="font-serif font-bold text-[var(--pigment-blue)] flex items-center gap-1">
                <Move size={14} /> 元絵の位置・拡大縮小調整 (ドラッグ移動可)
              </span>

              <div className="flex items-center gap-2 border-l border-[var(--color-border-soft)] pl-3">
                <span className="text-[var(--color-text-muted)]">拡大率:</span>
                <input
                  type="range"
                  min={0.2}
                  max={2.5}
                  step={0.05}
                  value={parentTransform.scale}
                  onChange={(e) => updateParentTransform({ scale: Number(e.target.value) })}
                  className="w-24 accent-[var(--pigment-blue)] cursor-pointer"
                />
                <span className="font-mono w-10 text-right">{Math.round(parentTransform.scale * 100)}%</span>
              </div>

              <div className="flex items-center gap-2 border-l border-[var(--color-border-soft)] pl-3">
                <span className="text-[var(--color-text-muted)]">位置 X:</span>
                <input
                  type="number"
                  value={parentTransform.x}
                  onChange={(e) => updateParentTransform({ x: Number(e.target.value) })}
                  className="form-input text-xs w-16 !py-0.5 px-1 font-mono text-center"
                />
                <span className="text-[var(--color-text-muted)]">Y:</span>
                <input
                  type="number"
                  value={parentTransform.y}
                  onChange={(e) => updateParentTransform({ y: Number(e.target.value) })}
                  className="form-input text-xs w-16 !py-0.5 px-1 font-mono text-center"
                />
              </div>

              <button
                onClick={() => updateParentTransform({ x: 0, y: 0, scale: 1.0 })}
                className="btn btn--outline btn--sm text-xs py-0.5 px-2 flex items-center gap-1 border-[var(--color-border-soft)]"
              >
                <RotateCcw size={12} />
                <span>リセット</span>
              </button>
            </div>
          ) : (
            /* 通常の描画ツールバー */
            <>
              {/* ブラシサイズ */}
              <div className="flex items-center gap-2">
                <span className="font-serif text-[var(--color-text-muted)]">サイズ:</span>
                <input
                  type="range"
                  min={1}
                  max={80}
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-20 accent-[var(--pigment-blue)] cursor-pointer"
                />
                <span className="font-mono w-6 text-right">{brushSize}px</span>
              </div>

              {/* 不透明度 */}
              <div className="flex items-center gap-2 border-l border-[var(--color-border-soft)] pl-3">
                <span className="font-serif text-[var(--color-text-muted)]">不透明度:</span>
                <input
                  type="range"
                  min={0.05}
                  max={1.0}
                  step={0.05}
                  value={brushOpacity}
                  onChange={(e) => setBrushOpacity(Number(e.target.value))}
                  className="w-16 accent-[var(--pigment-blue)] cursor-pointer"
                />
                <span className="font-mono w-8 text-right">{Math.round(brushOpacity * 100)}%</span>
              </div>

              {/* 手ブレ補正 */}
              <div className="flex items-center gap-2 border-l border-[var(--color-border-soft)] pl-3">
                <span className="font-serif text-[var(--color-text-muted)]">補正:</span>
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={stabilizerAmount}
                  onChange={(e) => setStabilizerAmount(Number(e.target.value))}
                  className="w-16 accent-[var(--pigment-blue)] cursor-pointer"
                />
                <span className="font-mono w-4 text-right">{stabilizerAmount}</span>
              </div>

              {/* カラーパレット */}
              <div className="flex items-center gap-1.5 border-l border-[var(--color-border-soft)] pl-3">
                {COLOR_PRESETS.map((hex) => (
                  <button
                    key={hex}
                    onClick={() => setColor(hex)}
                    className={`w-5 h-5 rounded-xs border transition-transform ${
                      color === hex ? 'scale-125 border-[var(--pigment-blue)] shadow-xs' : 'border-black/20 hover:scale-110'
                    }`}
                    style={{ backgroundColor: hex }}
                  />
                ))}
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-6 h-6 rounded-xs cursor-pointer border border-[var(--color-border-soft)] bg-transparent p-0"
                  title="カスタムカラー選択"
                />
              </div>
            </>
          )}
        </div>

        {/* 中央: キャンバス描画領域 */}
        <main
          ref={containerRef}
          className="flex-1 bg-[var(--bg-gesso)] overflow-auto flex items-center justify-center p-8 relative"
          style={{ cursor: tool === 'move_base' ? 'move' : tool === 'hand' ? 'grab' : tool === 'eyedropper' ? 'crosshair' : 'crosshair' }}
        >
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.05s ease-out',
              boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
            }}
          >
            <canvas
              ref={mainCanvasRef}
              width={canvasDimensions.width}
              height={canvasDimensions.height}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="touch-none bg-white rounded-xs border border-[var(--color-border-soft)]"
            />
          </div>
        </main>

        {/* 右: レイヤー管理パネル */}
        <aside className="w-64 bg-[var(--surface-paper)] border-l border-[var(--color-border-soft)] p-3 flex flex-col gap-3 shrink-0 z-10">
          <div className="flex items-center justify-between border-b border-[var(--color-border-soft)] pb-2">
            <div className="flex items-center gap-1.5 font-serif font-bold text-xs text-[var(--ink-primary)]">
              <Layers size={14} className="text-[var(--pigment-blue)]" />
              <span>レイヤー ({layersState.length})</span>
            </div>
            <button
              onClick={addLayer}
              className="btn btn--outline btn--sm text-xs py-0.5 px-2 flex items-center gap-1"
              title="新規レイヤー追加"
            >
              <Plus size={13} />
              <span>追加</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {layersState.map((layer) => {
              const isActive = activeLayerId === layer.id
              return (
                <div
                  key={layer.id}
                  onClick={() => selectLayer(layer.id)}
                  className={`p-2.5 rounded-xs border text-xs space-y-2 cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-[var(--pigment-blue-lt)] border-[var(--pigment-blue)] shadow-xs'
                      : 'bg-[var(--surface-paper)] border-[var(--color-border-soft)] hover:bg-[var(--bg-gesso)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-[var(--ink-primary)] truncate">
                      {layer.name}
                    </span>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setLayerVisibility(layer.id, !layer.visible)}
                        className="p-1 text-[var(--color-text-muted)] hover:text-[var(--ink-primary)]"
                      >
                        {layer.visible ? <Eye size={13} /> : <EyeOff size={13} className="text-red-400" />}
                      </button>
                      {!layer.isParentBase && (
                        <button
                          onClick={() => removeLayer(layer.id)}
                          className="p-1 text-[var(--color-text-muted)] hover:text-red-500"
                          title="削除"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 親作品レイヤーの場合の「位置・縮小調整」ボタン */}
                  {layer.isParentBase && (
                    <button
                      onClick={() => setTool('move_base')}
                      className="w-full btn btn--ghost text-[0.7rem] py-1 flex items-center justify-center gap-1 border border-[var(--pigment-blue)] text-[var(--pigment-blue)] bg-[var(--pigment-blue-lt)]"
                    >
                      <Move size={11} />
                      <span>元絵の位置・サイズを調整</span>
                    </button>
                  )}

                  {/* レイヤー不透明度スライダー */}
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[0.68rem] text-[var(--color-text-muted)]">不透明度</span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={layer.opacity}
                      onChange={(e) => setLayerOpacity(layer.id, Number(e.target.value))}
                      className="flex-1 accent-[var(--pigment-blue)] h-1 cursor-pointer"
                    />
                    <span className="font-mono text-[0.68rem] w-6 text-right">
                      {Math.round(layer.opacity * 100)}%
                    </span>
                  </div>

                  {/* 並べ替え */}
                  <div className="flex justify-end gap-1 pt-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => moveLayer(layer.id, 'up')}
                      className="text-[0.65rem] px-1.5 py-0.5 rounded-xs border border-[var(--color-border-soft)] bg-[var(--surface-paper)] hover:bg-[var(--bg-gesso)]"
                    >
                      ▲ 上へ
                    </button>
                    <button
                      onClick={() => moveLayer(layer.id, 'down')}
                      className="text-[0.65rem] px-1.5 py-0.5 rounded-xs border border-[var(--color-border-soft)] bg-[var(--surface-paper)] hover:bg-[var(--bg-gesso)]"
                    >
                      ▼ 下へ
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </aside>
      </div>
    </div>
  )
}

function ToolButton({
  active,
  onClick,
  icon,
  title,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  title: string
}) {
  return (
    <button
      onClick={onClick}
      className={`p-2.5 rounded-xs border transition-all ${
        active
          ? 'bg-[var(--pigment-blue)] text-white border-[var(--pigment-blue)] shadow-xs scale-105'
          : 'bg-[var(--surface-paper)] text-[var(--ink-primary)] border-[var(--color-border-soft)] hover:bg-[var(--bg-gesso)]'
      }`}
      title={title}
    >
      {icon}
    </button>
  )
}
