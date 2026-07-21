import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Brush,
  Eraser,
  PaintBucket,
  Pipette,
  Plus,
  Shuffle,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Upload,
  Save,
  FolderOpen,
  Volume2,
  VolumeX,
  FlipHorizontal2,
} from 'lucide-react'
import BeadBoard, { type Tool } from '@/components/BeadBoard'
import TemplatePreview from '@/components/TemplatePreview'
import {
  PALETTE,
  GRID_SIZES,
  TEMPLATES,
  beadBackground,
  exportPNG,
  extractImageColors,
  findNearestColor,
  floodFill,
  generateRandomPalette,
  templateToCells,
  type BeadColor,
  type Grid,
  type Template,
} from '@/lib/beads'
import { setSoundEnabled, playChime } from '@/lib/sound'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const TOOLS: { id: Tool; name: string; shortcut: string; icon: typeof Brush }[] = [
  { id: 'brush', name: '画笔', shortcut: 'B', icon: Brush },
  { id: 'eraser', name: '橡皮', shortcut: 'E', icon: Eraser },
  { id: 'fill', name: '填充', shortcut: 'F', icon: PaintBucket },
  { id: 'picker', name: '取色', shortcut: 'I', icon: Pipette },
]

type ColorMode = 'classic' | 'random' | 'advanced' | 'image'
const COLOR_MODES: { id: ColorMode; label: string; title: string }[] = [
  { id: 'classic', label: '经典', title: '经典 14 色' },
  { id: 'random', label: '随机', title: '随机一组颜色' },
  { id: 'advanced', label: '高级', title: '调色板选色 + 最近使用' },
  { id: 'image', label: '图片', title: '上传图片提取主色' },
]

interface SavedState {
  version: number
  n: number
  grid: number[]
  colorMode: ColorMode
  color: number
  randomPalette?: BeadColor[]
  imagePalette?: BeadColor[]
  recentColors?: number[]
}

/** 背景漂浮装饰豆 */
const DECO_BEADS: { hex: string; style: React.CSSProperties; delay: string }[] = [
  { hex: '#E23E3E', style: { left: '6%', top: '15%', width: 30, height: 30 }, delay: '0s' },
  { hex: '#F6CF3D', style: { left: '3%', top: '58%', width: 22, height: 22 }, delay: '0.8s' },
  { hex: '#3E63D2', style: { left: '9%', top: '85%', width: 26, height: 26 }, delay: '1.6s' },
  { hex: '#F79AC0', style: { right: '5%', top: '11%', width: 24, height: 24 }, delay: '0.4s' },
  { hex: '#2F9E57', style: { right: '3%', top: '72%', width: 30, height: 30 }, delay: '1.2s' },
]

function emptyGrid(n: number): Grid {
  return new Uint8Array(n * n)
}

/** 小熨斗图标 */
function IronIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 16h18v3H3z" fill="currentColor" stroke="none" />
      <path d="M3 16v-3c0-1 .5-1.8 1.5-2.2L9 9c1-2 3-3 5.5-3H16c2.5 0 4.5 2 5 4.5l.5 2.5" />
      <path d="M8 9.5C9 6.5 11.5 5 14 5" />
    </svg>
  )
}

/** 卡片标题：前置一颗彩色豆 */
function SectionTitle({ dot, children }: { dot: string; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-1.5 text-sm font-bold tracking-wide">
      <span className="h-2.5 w-2.5 rounded-full border border-stone-900" style={{ background: dot }} />
      {children}
    </h2>
  )
}

export default function App() {
  const [n, setN] = useState(24)
  const [grid, setGrid] = useState<Grid>(() => emptyGrid(24))
  const [tool, setTool] = useState<Tool>('brush')
  const [color, setColor] = useState(5) // 默认大红
  const [colorMode, setColorMode] = useState<ColorMode>('classic')
  const [recentColors, setRecentColors] = useState<number[]>([])
  const [randomPalette, setRandomPalette] = useState<BeadColor[]>(() => generateRandomPalette(14))
  const [imagePalette, setImagePalette] = useState<BeadColor[]>([])
  const [mirror, setMirror] = useState(false)
  const [sound, setSound] = useState(true)
  const [ironed, setIroned] = useState(false)
  const [ironing, setIroning] = useState(false)
  const [ironSignal, setIronSignal] = useState(0)
  const [exportOpen, setExportOpen] = useState(false)
  const [exportTransparent, setExportTransparent] = useState(false)
  const [exportWatermark, setExportWatermark] = useState(false)

  const history = useRef<{ past: Grid[]; future: Grid[] }>({ past: [], future: [] })
  const [, forceRender] = useState(0)

  useEffect(() => {
    setSoundEnabled(sound)
  }, [sound])

  // ---- 历史记录 ----
  const pushHistory = useCallback((g: Grid) => {
    history.current.past.push(new Uint8Array(g))
    if (history.current.past.length > 60) history.current.past.shift()
    history.current.future = []
    forceRender((v) => v + 1)
  }, [])

  const undo = useCallback(() => {
    const prev = history.current.past.pop()
    if (!prev) return
    setIroned(false)
    history.current.future.push(new Uint8Array(grid))
    setGrid(prev)
  }, [grid])

  const redo = useCallback(() => {
    const next = history.current.future.pop()
    if (!next) return
    history.current.past.push(new Uint8Array(grid))
    setGrid(next)
  }, [grid])

  // ---- 编辑操作 ----
  const applyCells = useCallback((indices: number[], value: number) => {
    setIroned(false) // 继续作画，回到豆粒状态
    setGrid((prev) => {
      let dirty = false
      const next = new Uint8Array(prev)
      for (const i of indices) {
        if (next[i] !== value) {
          next[i] = value
          dirty = true
        }
      }
      return dirty ? next : prev
    })
  }, [])

  const handleFill = useCallback(
    (x: number, y: number) => {
      const changed = floodFill(grid, n, x, y, color + 1)
      if (changed.length === 0) return
      setIroned(false)
      pushHistory(grid)
      applyCells(changed, color + 1)
    },
    [grid, n, color, pushHistory, applyCells],
  )

  const handlePick = useCallback(
    (x: number, y: number) => {
      const v = grid[y * n + x]
      if (v > 0) setColor(v - 1)
      setTool('brush')
    },
    [grid],
  )

  const clearAll = useCallback(() => {
    if (grid.every((v) => v === 0)) return
    setIroned(false)
    pushHistory(grid)
    setGrid(emptyGrid(n))
  }, [grid, n, pushHistory])

  const resize = useCallback(
    (newN: number) => {
      if (newN === n) return
      // 把现有图案居中搬到新板上
      const next = emptyGrid(newN)
      const off = Math.floor((newN - n) / 2)
      for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) {
          const v = grid[y * n + x]
          if (v === 0) continue
          const nx = x + off
          const ny = y + off
          if (nx >= 0 && ny >= 0 && nx < newN && ny < newN) next[ny * newN + nx] = v
        }
      }
      history.current = { past: [], future: [] }
      setIroned(false)
      setN(newN)
      setGrid(next)
    },
    [n, grid],
  )

  const applyTemplate = useCallback(
    (t: Template) => {
      const { w, h, cells } = templateToCells(t)
      // 画板放不下时，自动切换到能容纳的最小尺寸
      const fit = GRID_SIZES.find((s) => s.n >= Math.max(w, h))
      const target = w > n || h > n ? (fit?.n ?? n) : n
      const next = emptyGrid(target)
      const ox = Math.floor((target - w) / 2)
      const oy = Math.floor((target - h) / 2)
      cells.forEach((v, i) => {
        if (v === 0) return
        const x = (i % w) + ox
        const y = Math.floor(i / w) + oy
        if (x >= 0 && y >= 0 && x < target && y < target) next[y * target + x] = v
      })
      setIroned(false)
      if (target !== n) {
        history.current = { past: [], future: [] }
        setN(target)
      } else {
        pushHistory(grid)
      }
      setGrid(next)
      playChime()
    },
    [grid, n, pushHistory],
  )

  const startIroning = useCallback(() => {
    if (ironing) return
    setIroning(true)
    setIronSignal((s) => s + 1)
  }, [ironing])

  const handleIroningDone = useCallback(() => {
    setIroning(false)
    setIroned(true)
    playChime()
  }, [])

  const handleExport = useCallback(() => {
    setExportOpen(true)
  }, [])

  const handleSaveProgress = useCallback(() => {
    const state: SavedState = {
      version: 1,
      n,
      grid: Array.from(grid),
      colorMode,
      color,
      randomPalette,
      imagePalette,
      recentColors,
    }
    const blob = new Blob([JSON.stringify(state)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const now = new Date()
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
    a.href = url
    a.download = `拼豆进度-${stamp}.json`
    a.click()
    URL.revokeObjectURL(url)
    playChime()
  }, [grid, n, colorMode, color, randomPalette, imagePalette, recentColors])

  const handleLoadProgress = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as SavedState
        if (!data || data.version !== 1 || typeof data.n !== 'number' || !Array.isArray(data.grid)) {
          throw new Error('文件格式不正确')
        }
        if (data.grid.length !== data.n * data.n) {
          throw new Error('网格尺寸不匹配')
        }

        const validModes: ColorMode[] = ['classic', 'random', 'advanced', 'image']
        let mode: ColorMode = validModes.includes(data.colorMode) ? data.colorMode : 'classic'
        const loadedRandom = Array.isArray(data.randomPalette) ? data.randomPalette : generateRandomPalette(14)
        const loadedImage = Array.isArray(data.imagePalette) ? data.imagePalette : []

        // 图片模式若没有保存的调色板，则回退到经典模式
        if (mode === 'image' && loadedImage.length === 0) mode = 'classic'

        const palette = mode === 'random' ? loadedRandom : mode === 'image' ? loadedImage : PALETTE
        if (palette.length === 0) {
          throw new Error('调色板为空')
        }

        for (const v of data.grid) {
          if (typeof v !== 'number' || v < 0 || v > palette.length) {
            throw new Error('网格颜色值超出当前调色板范围')
          }
        }

        const loadedColor =
          typeof data.color === 'number' && data.color >= 0 && data.color < palette.length
            ? data.color
            : 0

        history.current = { past: [], future: [] }
        setIroned(false)
        setN(data.n)
        setGrid(new Uint8Array(data.grid))
        setColorMode(mode)
        setRandomPalette(loadedRandom)
        setImagePalette(loadedImage)
        if (Array.isArray(data.recentColors)) setRecentColors(data.recentColors.slice(0, 6))
        setColor(loadedColor)
        playChime()
      } catch (e) {
        alert(`读取失败：${e instanceof Error ? e.message : '未知错误'}`)
      }
    }
    reader.readAsText(file)
  }, [])

  // ---- 快捷键 ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.ctrlKey || e.metaKey
      if (meta && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if (meta && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        redo()
      } else if (!meta) {
        const k = e.key.toLowerCase()
        if (k === 'b') setTool('brush')
        else if (k === 'e') setTool('eraser')
        else if (k === 'f') setTool('fill')
        else if (k === 'i') setTool('picker')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo, setTool])

  // ---- 颜色模式 ----
  const activePalette = useMemo(() => {
    if (colorMode === 'random') return randomPalette
    if (colorMode === 'image') return imagePalette
    return PALETTE
  }, [colorMode, randomPalette, imagePalette])

  const visibleColorIndices = useMemo(() => activePalette.map((_, i) => i), [activePalette])

  const advancedRecent = recentColors.slice(0, 6)

  // 切换调色板时，保证当前选色下标合法
  useEffect(() => {
    if (color >= activePalette.length) setColor(0)
  }, [color, activePalette.length])

  const rerollRandomColors = useCallback(() => {
    setRandomPalette(generateRandomPalette(14))
  }, [])

  const handleAdvancedColor = useCallback(
    (hex: string) => {
      const idx = findNearestColor(hex)
      setRecentColors((prev) => {
        const next = [idx, ...prev.filter((c) => c !== idx)].slice(0, 6)
        return next
      })
      setColor(idx)
      if (tool === 'eraser') setTool('brush')
    },
    [tool],
  )

  const handleImageUpload = useCallback((file: File) => {
    const img = new Image()
    img.onload = () => {
      const palette = extractImageColors(img, 14)
      setImagePalette(palette)
      if (palette.length > 0) setColor(0)
    }
    img.src = URL.createObjectURL(file)
  }, [])

  // ---- 用量统计 ----
  const stats = useMemo(() => {
    const counts = new Array(activePalette.length).fill(0)
    for (const v of grid) if (v > 0 && v <= activePalette.length) counts[v - 1]++
    return counts
  }, [grid, activePalette.length])
  const total = useMemo(() => stats.reduce((a, b) => a + b, 0), [stats])

  const confirmExport = useCallback(() => {
    const now = new Date()
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
    const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`
    exportPNG(grid, n, `拼豆-${stamp}`, ironed, exportTransparent, exportWatermark, dateStr, activePalette)
    playChime()
    setExportOpen(false)
  }, [grid, n, ironed, exportTransparent, exportWatermark, activePalette])

  const canUndo = history.current.past.length > 0
  const canRedo = history.current.future.length > 0

  return (
    <div className="relative min-h-screen text-stone-800">
      {/* 背景漂浮装饰豆 */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {DECO_BEADS.map((b, i) => (
          <span
            key={i}
            className="deco-bead hidden sm:block"
            style={{ ...b.style, background: beadBackground(b.hex), animationDelay: b.delay }}
          />
        ))}
      </div>

      <div className="relative z-10">
        {/* 顶栏 */}
        <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 pt-6 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="hidden grid-cols-2 gap-[3px] rounded-2xl border-2 border-stone-900 bg-[#FFFDF7] p-2 shadow-[3px_3px_0_0_#292524] sm:grid">
              {[PALETTE[5], PALETTE[7], PALETTE[11], PALETTE[13]].map((c, i) => (
                <span
                  key={i}
                  className="h-3.5 w-3.5 rounded-full"
                  style={{ background: beadBackground(c.hex), boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)' }}
                />
              ))}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-cute whitespace-nowrap text-2xl leading-none sm:text-3xl">拼豆工坊</h1>
                <span className="hidden whitespace-nowrap rounded-full border-2 border-stone-900 bg-stone-900 px-2 py-0.5 text-[10px] font-bold text-amber-300 sm:inline-block">
                  Kimi3 出品
                </span>
              </div>
              <p className="mt-1 hidden text-xs text-stone-500 sm:block">点点点，拼出小可爱</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setSound((v) => !v)}
              title={sound ? '关闭音效' : '打开音效'}
              className="craft-icon-btn rounded-full p-2 text-stone-600 sm:p-2.5"
            >
              {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <button
              onClick={undo}
              disabled={!canUndo}
              title="撤销 (Ctrl+Z)"
              className="craft-icon-btn rounded-full p-2 text-stone-600 disabled:opacity-30 sm:p-2.5"
            >
              <Undo2 size={18} />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              title="重做 (Ctrl+Shift+Z)"
              className="craft-icon-btn rounded-full p-2 text-stone-600 disabled:opacity-30 sm:p-2.5"
            >
              <Redo2 size={18} />
            </button>
            <button
              onClick={clearAll}
              title="清空画板"
              className="craft-icon-btn rounded-full p-2 text-stone-600 sm:p-2.5"
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={startIroning}
              disabled={total === 0 || ironing}
              title="熨烫定型"
              className={`craft-btn ml-1 flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-bold sm:px-4 sm:py-2.5 ${
                ironing ? 'cursor-wait bg-amber-100 text-amber-600' : 'bg-amber-400 text-stone-900'
              }`}
            >
              <IronIcon size={16} />
              <span className="sm:hidden">{ironing ? '中' : '熨'}</span>
              <span className="hidden sm:inline">{ironing ? '熨烫中' : '熨烫'}</span>
            </button>
            <button
              onClick={handleSaveProgress}
              title="保存进度"
              className="craft-btn flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#3E63D2] px-3.5 py-2 text-sm font-bold text-white sm:px-4 sm:py-2.5"
            >
              <Save size={16} />
              <span className="sm:hidden">存</span>
              <span className="hidden sm:inline">保存</span>
            </button>
            <label
              title="读取进度"
              className="craft-btn flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full bg-[#6FC3E8] px-3.5 py-2 text-sm font-bold text-white sm:px-4 sm:py-2.5"
            >
              <FolderOpen size={16} />
              <span className="sm:hidden">读</span>
              <span className="hidden sm:inline">读取</span>
              <input
                type="file"
                accept=".json,application/json"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleLoadProgress(file)
                  e.currentTarget.value = ''
                }}
              />
            </label>
            <button
              onClick={handleExport}
              className="craft-btn flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#E23E3E] px-3.5 py-2 text-sm font-bold text-white sm:px-4 sm:py-2.5"
            >
              <Download size={16} />
              <span className="sm:hidden">导出</span>
              <span className="hidden sm:inline">导出</span>
            </button>
          </div>
        </header>

        {/* 主体 */}
        <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:items-start">
          {/* 画板 */}
          <section className="min-w-0 flex-1">
            <div className="relative mx-auto w-full max-w-[680px] rounded-[1.8rem] border-[3px] border-stone-900 bg-[#FFFDF7] p-3 shadow-[7px_7px_0_0_rgba(41,37,36,0.9)] sm:p-4">
              {/* 和纸胶带 */}
              <span className="washi-tape -top-3 left-10 -rotate-6 rounded-sm" />
              <span className="washi-tape -top-3 right-10 rotate-3 rounded-sm" style={{ background: 'rgba(247,154,192,0.45)' }} />
              <BeadBoard
                n={n}
                grid={grid}
                tool={tool}
                color={color}
                palette={activePalette}
                mirror={mirror}
                ironed={ironed}
                ironing={ironing}
                ironSignal={ironSignal}
                onIroningDone={handleIroningDone}
                onStrokeStart={() => pushHistory(grid)}
                onStrokeCancel={undo}
                onApply={applyCells}
                onFill={handleFill}
                onPick={handlePick}
              />
            </div>
            <p className="mt-4 text-center text-xs text-stone-500">
              {ironed ? (
                <span className="inline-flex items-center rounded-full border-2 border-amber-500 bg-amber-100 px-3 py-1 font-bold text-amber-700">
                  ✨ 已熨烫定型！继续作画可回到豆粒状态
                </span>
              ) : (
                <>
                  <span className="sm:hidden">单指作画 · 双指缩放移动</span>
                  <span className="hidden sm:inline">按住拖动作画 · 右键快速擦除 · 滚轮缩放 · 画完点「熨烫」定型～</span>
                </>
              )}
            </p>
          </section>

          {/* 控制面板 */}
          <aside className="w-full shrink-0 space-y-4 lg:w-[310px]">
            {/* 调色板 */}
            <div className="craft-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SectionTitle dot="#E23E3E">颜色</SectionTitle>
                  <div className="flex rounded-full border border-stone-200 bg-white p-0.5 text-[10px]">
                    {COLOR_MODES.map((m) => (
                      <button
                        key={m.id}
                        title={m.title}
                        onClick={() => setColorMode(m.id)}
                        className={`rounded-full px-1.5 py-0.5 transition-colors ${
                          colorMode === m.id
                            ? 'bg-stone-900 text-white'
                            : 'text-stone-500 hover:bg-stone-100'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                  {colorMode === 'random' && (
                    <button
                      onClick={rerollRandomColors}
                      title="重新随机"
                      className="rounded-full p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
                    >
                      <Shuffle size={12} />
                    </button>
                  )}
                </div>
                <span className="rounded-full border border-stone-300 bg-white px-2 py-0.5 text-xs text-stone-500">
                  {activePalette[color]?.name ?? ''}
                </span>
              </div>
              <div className="grid grid-cols-7 gap-x-2 gap-y-2.5">
                {colorMode === 'advanced' && (
                  <label
                    title="选择颜色"
                    className="relative flex aspect-square w-full cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-stone-400 bg-white text-stone-400 transition-colors hover:border-stone-600 hover:text-stone-600"
                  >
                    <Plus size={14} />
                    <input
                      type="color"
                      className="sr-only"
                      onChange={(e) => handleAdvancedColor(e.target.value)}
                    />
                  </label>
                )}
                {colorMode === 'image' && (
                  <label
                    title="上传图片"
                    className="relative flex aspect-square w-full cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-stone-400 bg-white text-stone-400 transition-colors hover:border-stone-600 hover:text-stone-600"
                  >
                    <Upload size={14} />
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload(file)
                      }}
                    />
                  </label>
                )}
                {(colorMode === 'advanced'
                  ? advancedRecent
                  : visibleColorIndices
                ).map((i) => (
                  <button
                    key={`${colorMode}-${i}`}
                    title={activePalette[i].name}
                    onClick={() => {
                      setColor(i)
                      if (tool === 'eraser') setTool('brush')
                    }}
                    className={`aspect-square w-full rounded-full transition-transform hover:scale-110 ${
                      color === i ? 'scale-110 ring-2 ring-stone-900 ring-offset-2 ring-offset-[#FFFDF7]' : ''
                    }`}
                    style={{ background: beadBackground(activePalette[i].hex), boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)' }}
                  />
                ))}
                {colorMode === 'image' && imagePalette.length === 0 && (
                  <span className="col-span-6 self-center text-xs text-stone-400">上传图片提取主色</span>
                )}
                {colorMode === 'advanced' && (
                  <>
                    <div className="col-span-7 my-1 border-t border-stone-200" />
                    {PALETTE.map((c, i) => (
                      <button
                        key={`advanced-base-${i}`}
                        title={c.name}
                        onClick={() => {
                          setColor(i)
                          if (tool === 'eraser') setTool('brush')
                        }}
                        className={`aspect-square w-full rounded-full transition-transform hover:scale-110 ${
                          color === i ? 'scale-110 ring-2 ring-stone-900 ring-offset-2 ring-offset-[#FFFDF7]' : ''
                        }`}
                        style={{ background: beadBackground(c.hex), boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)' }}
                      />
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* 工具 */}
            <div className="craft-card p-4">
              <div className="mb-3">
                <SectionTitle dot="#3E63D2">工具</SectionTitle>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {TOOLS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTool(t.id)}
                    className={`flex flex-col items-center gap-1 rounded-xl border-2 py-2.5 text-xs transition-all ${
                      tool === t.id
                        ? 'border-stone-900 bg-stone-900 text-white shadow-[3px_3px_0_0_rgba(41,37,36,0.3)]'
                        : 'border-stone-200 bg-[#FFFDF7] text-stone-500 hover:border-stone-900 hover:text-stone-800'
                    }`}
                  >
                    <t.icon size={17} />
                    <span className="flex items-center gap-1">
                      {t.name}
                      <kbd
                        className={`hidden rounded px-1 text-[9px] sm:inline-block ${
                          tool === t.id ? 'bg-white/20 text-white/80' : 'bg-stone-200 text-stone-500'
                        }`}
                      >
                        {t.shortcut}
                      </kbd>
                    </span>
                  </button>
                ))}
              </div>
              <label className="mt-3 flex cursor-pointer items-center justify-between rounded-xl border-2 border-stone-200 bg-[#FFFDF7] px-3.5 py-2.5 transition-colors hover:border-stone-400">
                <span className="flex items-center gap-2 text-xs text-stone-600">
                  <FlipHorizontal2 size={15} />
                  对称作画
                </span>
                <Switch checked={mirror} onCheckedChange={setMirror} />
              </label>
            </div>

            {/* 尺寸 */}
            <div className="craft-card p-4">
              <div className="mb-3">
                <SectionTitle dot="#F6CF3D">画板尺寸</SectionTitle>
              </div>
              <div className="grid grid-cols-4 gap-1 rounded-xl border-2 border-stone-900 bg-[#FFFDF7] p-1">
                {GRID_SIZES.map((s) => (
                  <button
                    key={s.n}
                    onClick={() => resize(s.n)}
                    className={`rounded-lg py-2 text-xs transition ${
                      n === s.n ? 'bg-stone-900 font-bold text-white' : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    {s.label} {s.n}×{s.n}
                  </button>
                ))}
              </div>
            </div>

            {/* 模板 */}
            <div className="craft-card p-4">
              <div className="mb-3 flex items-baseline justify-between">
                <SectionTitle dot="#F79AC0">一键模板</SectionTitle>
                <span className="text-xs text-stone-400">手残党友好</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => applyTemplate(t)}
                    className="group flex flex-col items-center gap-1 rounded-xl border-2 border-stone-200 bg-[#FFFDF7] p-2 transition-all hover:-translate-y-0.5 hover:border-stone-900 hover:shadow-[3px_3px_0_0_#292524]"
                  >
                    <TemplatePreview t={t} size={52} />
                    <span className="text-xs text-stone-500 group-hover:font-bold group-hover:text-stone-800">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 用量统计 */}
            <div className="craft-card p-4">
              <div className="mb-3 flex items-baseline justify-between">
                <SectionTitle dot="#2F9E57">豆子用量</SectionTitle>
                {total > 0 && (
                  <span className="rounded-full border border-stone-300 bg-white px-2 py-0.5 text-xs text-stone-500">
                    共 {total} 颗
                  </span>
                )}
              </div>
              {total === 0 ? (
                <p className="py-1 text-xs text-stone-400">画板还是空的，快放上第一颗豆子吧～</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {stats.map((count, i) =>
                    count > 0 && activePalette[i] ? (
                      <span
                        key={i}
                        className="flex items-center gap-1.5 rounded-full border-[1.5px] border-stone-300 bg-white py-1 pl-1.5 pr-2.5 text-xs text-stone-600"
                      >
                        <span
                          className="h-4 w-4 rounded-full"
                          style={{ background: beadBackground(activePalette[i].hex), boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)' }}
                        />
                        {activePalette[i].name} ×{count}
                      </span>
                    ) : null,
                  )}
                </div>
              )}
            </div>
          </aside>
        </main>

        <footer className="pb-6 text-center text-xs text-stone-400">
          拼豆工坊 · 由 Kimi3 设计与构建
        </footer>

        {/* 导出设置弹窗 */}
        <Dialog open={exportOpen} onOpenChange={setExportOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>导出设置</DialogTitle>
              <DialogDescription>选择导出图片的样式</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <label className="flex cursor-pointer items-center justify-between rounded-xl border-2 border-stone-200 bg-[#FFFDF7] px-3.5 py-2.5 transition-colors hover:border-stone-400">
                <span className="text-sm text-stone-700">透明背景</span>
                <Switch checked={exportTransparent} onCheckedChange={setExportTransparent} />
              </label>
              <label className="flex cursor-pointer items-center justify-between rounded-xl border-2 border-stone-200 bg-[#FFFDF7] px-3.5 py-2.5 transition-colors hover:border-stone-400">
                <span className="text-sm text-stone-700">添加水印边框</span>
                <Switch checked={exportWatermark} onCheckedChange={setExportWatermark} />
              </label>
              <p className="text-xs text-stone-400">
                水印边框会画在图片外侧，带有本站地址（r1way.github.io/beans-app）和当前日期，方便他人访问并使用本网站，也不会遮挡你的作品。
              </p>
            </div>
            <DialogFooter>
              <button
                onClick={() => setExportOpen(false)}
                className="rounded-full border-2 border-stone-200 bg-white px-4 py-2 text-sm font-bold text-stone-600 transition-colors hover:border-stone-400"
              >
                取消
              </button>
              <button
                onClick={confirmExport}
                className="rounded-full bg-[#E23E3E] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#c93232]"
              >
                导出
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
