import { useEffect, useRef, useState } from 'react'
import { Plus, Minus } from 'lucide-react'
import { PALETTE, drawBead, lineCells, type Grid } from '@/lib/beads'
import { playPop, playErase, playHiss } from '@/lib/sound'

export type Tool = 'brush' | 'eraser' | 'fill' | 'picker'

interface BoardProps {
  n: number
  grid: Grid
  tool: Tool
  color: number
  mirror: boolean
  ironed: boolean
  ironing: boolean
  ironSignal: number
  onIroningDone: () => void
  onStrokeStart: () => void
  onStrokeCancel: () => void
  onApply: (indices: number[], value: number) => void
  onFill: (x: number, y: number) => void
  onPick: (x: number, y: number) => void
}

interface Sprite {
  c: HTMLCanvasElement
  S: number
}

interface View {
  s: number
  tx: number
  ty: number
}

const MAX_ZOOM = 5

export default function BeadBoard({
  n,
  grid,
  tool,
  color,
  mirror,
  ironed,
  ironing,
  ironSignal,
  onIroningDone,
  onStrokeStart,
  onStrokeCancel,
  onApply,
  onFill,
  onPick,
}: BoardProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ironRef = useRef<HTMLDivElement>(null)
  const flipRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<[number, number] | null>(null)
  const [zoom, setZoom] = useState(1)
  const painting = useRef(false)
  const eraseMode = useRef(false)
  const lastCell = useRef<[number, number] | null>(null)
  const frontRef = useRef<number | null>(null) // 熨烫进行时的「热浪前锋」0..~1.06
  const renderRef = useRef<(() => void) | null>(null)
  const doneRef = useRef(onIroningDone)
  const sprites = useRef(new Map<string, Sprite>())
  const view = useRef<View>({ s: 1, tx: 0, ty: 0 })
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef<{
    d0: number
    s0: number
    wx: number
    wy: number
    moved: boolean
    t0: number
  } | null>(null)
  doneRef.current = onIroningDone

  // 蛇形路径：豆子在熨烫顺序中的位置 t ∈ [0,1]
  const beadT = (x: number, y: number) => {
    const idx = y * n + (y % 2 === 0 ? x : n - 1 - x)
    return (idx + 0.5) / (n * n)
  }
  // 蛇形路径上 p 点的格子坐标（连续）
  const pathPoint = (p: number): [number, number] => {
    const rowFloat = Math.min(p, 0.99999) * n
    const row = Math.floor(rowFloat)
    const within = rowFloat - row
    const x = row % 2 === 0 ? within * (n - 1) : (1 - within) * (n - 1)
    return [x, rowFloat]
  }

  // 豆子精灵缓存（按颜色 × 融化档位 × 尺寸），保证动画帧率
  const spriteFor = (v: number, q: number, cell: number): Sprite => {
    const px = Math.max(8, Math.round(cell))
    const key = `${v}|${q}|${px}`
    const cache = sprites.current
    let s = cache.get(key)
    if (!s) {
      if (cache.size > 600) cache.clear()
      const dpr = window.devicePixelRatio || 1
      const pad = Math.ceil(px * 0.16)
      const S = px + pad * 2
      const c = document.createElement('canvas')
      c.width = S * dpr
      c.height = S * dpr
      const cctx = c.getContext('2d')!
      cctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      drawBead(cctx, S / 2, S / 2, px * 0.46, PALETTE[v - 1].hex, q / 8)
      s = { c, S }
      cache.set(key, s)
    }
    return s
  }

  const applyView = (nv: View) => {
    const wrap = wrapRef.current
    const size = wrap ? wrap.clientWidth : 300
    const s = Math.min(Math.max(nv.s, 1), MAX_ZOOM)
    // 平移约束：画板始终盖住可视区
    const minT = size * (1 - s)
    view.current = {
      s,
      tx: Math.min(Math.max(nv.tx, minT), 0),
      ty: Math.min(Math.max(nv.ty, minT), 0),
    }
    setZoom(view.current.s)
    renderRef.current?.()
  }

  const zoomBy = (f: number, cx?: number, cy?: number) => {
    const wrap = wrapRef.current
    if (!wrap) return
    const size = wrap.clientWidth
    const mx = cx ?? size / 2
    const my = cy ?? size / 2
    const { s, tx, ty } = view.current
    const ns = Math.min(Math.max(s * f, 1), MAX_ZOOM)
    const wx = (mx - tx) / s
    const wy = (my - ty) / s
    applyView({ s: ns, tx: mx - wx * ns, ty: my - wy * ns })
  }

  const resetZoom = () => applyView({ s: 1, tx: 0, ty: 0 })

  // 换板重置缩放
  useEffect(() => {
    view.current = { s: 1, tx: 0, ty: 0 }
    setZoom(1)
  }, [n])

  // ---- 渲染 ----
  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    const render = () => {
      const cssSize = wrap.clientWidth
      const dpr = window.devicePixelRatio || 1
      canvas.width = cssSize * dpr
      canvas.height = cssSize * dpr
      canvas.style.width = `${cssSize}px`
      canvas.style.height = `${cssSize}px`
      const ctx = canvas.getContext('2d')!
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const { s: vs, tx, ty } = view.current
      const cell = (cssSize / n) * vs
      const front = frontRef.current

      // 拼豆底板
      ctx.fillStyle = '#FDFAF3'
      ctx.beginPath()
      ctx.roundRect(tx, ty, n * cell, n * cell, Math.min(cell * 0.6, 24))
      ctx.fill()

      // 板上的定位小凸点（空格）
      ctx.fillStyle = 'rgba(120,100,80,0.14)'
      for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) {
          if (grid[y * n + x] !== 0) continue
          ctx.beginPath()
          ctx.arc(tx + (x + 0.5) * cell, ty + (y + 0.5) * cell, Math.max(1, cell * 0.07), 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // 豆子（按熨烫前锋计算每颗的融化档位）
      for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) {
          const v = grid[y * n + x]
          if (v === 0) continue
          let q = 0
          if (front != null) {
            const m = Math.min(Math.max((front - beadT(x, y)) / 0.045, 0), 1)
            q = Math.round(m * 8)
          } else if (ironed) {
            q = 8
          }
          const { c, S } = spriteFor(v, q, cell)
          const scale = cell / Math.max(8, Math.round(cell))
          const dw = S * scale
          ctx.drawImage(c, tx + (x + 0.5) * cell - dw / 2, ty + (y + 0.5) * cell - dw / 2, dw, dw)
        }
      }

      // 悬停预览（熨烫时不显示）
      if (hover && !ironing && front == null) {
        const [hx, hy] = hover
        const drawGhost = (gx: number, gy: number) => {
          if (gx < 0 || gy < 0 || gx >= n || gy >= n) return
          const cx = tx + (gx + 0.5) * cell
          const cy = ty + (gy + 0.5) * cell
          ctx.beginPath()
          ctx.arc(cx, cy, cell * 0.46, 0, Math.PI * 2)
          if (tool === 'eraser') {
            ctx.strokeStyle = 'rgba(226,62,62,0.8)'
            ctx.lineWidth = 2
            ctx.stroke()
          } else {
            ctx.fillStyle = PALETTE[color].hex + '88'
            ctx.fill()
          }
        }
        drawGhost(hx, hy)
        if (mirror && tool !== 'fill' && tool !== 'picker') drawGhost(n - 1 - hx, hy)
      }
    }

    renderRef.current = render
    render()
    const ro = new ResizeObserver(render)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [grid, n, hover, tool, color, mirror, ironed, ironing])

  // ---- 熨烫动画 ----
  useEffect(() => {
    if (!ironSignal) return
    const dur = 2800
    const start = performance.now()
    let raf = 0
    playHiss(dur / 1000 + 0.2)
    setHover(null)
    if (ironRef.current) ironRef.current.style.opacity = '1'

    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1)
      frontRef.current = p * 1.06

      const wrap = wrapRef.current
      const iron = ironRef.current
      if (wrap && iron) {
        const size = wrap.clientWidth
        const { s: vs, tx, ty } = view.current
        const cell = (size / n) * vs
        const [gx, gy] = pathPoint(p)
        const w = cell * 5.6
        const h = w * 0.78
        iron.style.width = `${w}px`
        iron.style.height = `${h}px`
        iron.style.transform = `translate(${tx + (gx + 0.5) * cell - w / 2}px, ${ty + (gy + 0.5) * cell - h * 0.82}px)`
        const row = Math.floor(Math.min(p, 0.99999) * n)
        if (flipRef.current) flipRef.current.style.transform = `scaleX(${row % 2 === 1 ? -1 : 1})`
      }

      renderRef.current?.()
      if (p < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        frontRef.current = null
        if (ironRef.current) ironRef.current.style.opacity = '0'
        doneRef.current()
        renderRef.current?.()
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ironSignal])

  // ---- 桌面滚轮缩放 ----
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      zoomBy(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - rect.left, e.clientY - rect.top)
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', onWheel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n])

  // ---- 交互 ----
  const cellFromPoint = (px: number, py: number): [number, number] | null => {
    const wrap = wrapRef.current!
    const { s: vs, tx, ty } = view.current
    const cell = (wrap.clientWidth / n) * vs
    const x = Math.floor((px - tx) / cell)
    const y = Math.floor((py - ty) / cell)
    if (x < 0 || y < 0 || x >= n || y >= n) return null
    return [x, y]
  }

  const cellFromEvent = (e: React.PointerEvent): [number, number] | null => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return cellFromPoint(e.clientX - rect.left, e.clientY - rect.top)
  }

  const paintCells = (x: number, y: number) => {
    const value = eraseMode.current ? 0 : color + 1
    const indices: number[] = [y * n + x]
    if (mirror) indices.push(y * n + (n - 1 - x))
    onApply(indices, value)
    if (eraseMode.current) playErase()
    else playPop(color)
  }

  const handleDown = (e: React.PointerEvent) => {
    if (ironing) return
    e.preventDefault()
    canvasRef.current?.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    // 第二根手指落下：进入双指手势（缩放/平移），并取消误触的一笔
    if (pointers.current.size === 2) {
      if (painting.current) {
        painting.current = false
        lastCell.current = null
        onStrokeCancel()
      }
      const [p1, p2] = [...pointers.current.values()]
      const rect = canvasRef.current!.getBoundingClientRect()
      const mx = (p1.x + p2.x) / 2 - rect.left
      const my = (p1.y + p2.y) / 2 - rect.top
      const { s, tx, ty } = view.current
      pinch.current = {
        d0: Math.max(Math.hypot(p1.x - p2.x, p1.y - p2.y), 1),
        s0: s,
        wx: (mx - tx) / s,
        wy: (my - ty) / s,
        moved: false,
        t0: performance.now(),
      }
      setHover(null)
      return
    }
    if (pointers.current.size > 2) return

    const cell = cellFromEvent(e)
    if (!cell) return
    const [x, y] = cell

    if (tool === 'fill') {
      onFill(x, y)
      playPop(color)
      return
    }
    if (tool === 'picker') {
      onPick(x, y)
      return
    }

    eraseMode.current = tool === 'eraser' || e.button === 2
    painting.current = true
    lastCell.current = [x, y]
    onStrokeStart()
    paintCells(x, y)
  }

  const handleMove = (e: React.PointerEvent) => {
    if (ironing) return
    if (pointers.current.has(e.pointerId)) {
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    }

    // 双指捏合：缩放 + 平移
    if (pinch.current && pointers.current.size >= 2) {
      const [p1, p2] = [...pointers.current.values()]
      const rect = canvasRef.current!.getBoundingClientRect()
      const mx = (p1.x + p2.x) / 2 - rect.left
      const my = (p1.y + p2.y) / 2 - rect.top
      const d = Math.hypot(p1.x - p2.x, p1.y - p2.y)
      const pc = pinch.current
      if (Math.abs(d - pc.d0) > 10) pc.moved = true
      const ns = Math.min(Math.max(pc.s0 * (d / pc.d0), 1), MAX_ZOOM)
      if (Math.hypot(mx - (pc.wx * view.current.s + view.current.tx), my - (pc.wy * view.current.s + view.current.ty)) > 6)
        pc.moved = true
      applyView({ s: ns, tx: mx - pc.wx * ns, ty: my - pc.wy * ns })
      return
    }

    const cell = cellFromEvent(e)
    setHover(cell)
    if (!painting.current || !cell || pointers.current.size !== 1) return
    const [x, y] = cell
    const [lx, ly] = lastCell.current ?? [x, y]
    if (lx === x && ly === y) return
    // 快速拖动时用直线补全中间格子
    for (const [px, py] of lineCells(lx, ly, x, y)) {
      if (px === lx && py === ly) continue
      paintCells(px, py)
    }
    lastCell.current = [x, y]
  }

  const handleUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId)

    // 双指手势结束：仅清理缩放状态，不再触发擦除
    if (pinch.current && pointers.current.size < 2) {
      pinch.current = null
    }

    if (pointers.current.size === 0) {
      painting.current = false
      lastCell.current = null
    }
  }

  return (
    <div ref={wrapRef} className="relative aspect-square w-full">
      <canvas
        ref={canvasRef}
        className="block cursor-crosshair touch-none select-none"
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
        onPointerLeave={() => setHover(null)}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* 缩放控制 */}
      <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
        {zoom > 1.01 && (
          <button
            onClick={resetZoom}
            title="重置缩放"
            className="rounded-full border-2 border-stone-900 bg-[#FFFDF7] px-2.5 py-1 text-[11px] font-bold text-stone-700 shadow-[2px_2px_0_0_#292524] transition hover:-translate-y-0.5"
          >
            {Math.round(zoom * 100)}%
          </button>
        )}
        <button
          onClick={() => zoomBy(1 / 1.4)}
          disabled={zoom <= 1.01}
          title="缩小"
          className="rounded-full border-2 border-stone-900 bg-[#FFFDF7] p-1.5 text-stone-700 shadow-[2px_2px_0_0_#292524] transition hover:-translate-y-0.5 disabled:opacity-40"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={() => zoomBy(1.4)}
          disabled={zoom >= MAX_ZOOM - 0.01}
          title="放大"
          className="rounded-full border-2 border-stone-900 bg-[#FFFDF7] p-1.5 text-stone-700 shadow-[2px_2px_0_0_#292524] transition hover:-translate-y-0.5 disabled:opacity-40"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* 熨斗 */}
      <div className="pointer-events-none absolute inset-0 overflow-visible">
        <div
          ref={ironRef}
          className="absolute left-0 top-0 opacity-0 transition-opacity duration-300"
          style={{ width: 120, height: 94 }}
        >
          <div ref={flipRef} className="relative h-full w-full">
            {/* 蒸汽 */}
            <span className="steam-puff" style={{ left: '62%', top: '2%', animationDelay: '0s' }} />
            <span className="steam-puff" style={{ left: '74%', top: '6%', animationDelay: '0.3s' }} />
            <span className="steam-puff" style={{ left: '52%', top: '8%', animationDelay: '0.6s' }} />
            <svg viewBox="0 0 140 104" className="iron-rock h-full w-full drop-shadow-md">
              <defs>
                <linearGradient id="ironBody" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fda4af" />
                  <stop offset="100%" stopColor="#f43f5e" />
                </linearGradient>
                <linearGradient id="ironSole" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e2e8f0" />
                  <stop offset="100%" stopColor="#94a3b8" />
                </linearGradient>
              </defs>
              {/* 手柄 */}
              <path
                d="M26 44 Q30 16 60 13 L86 11 Q108 13 110 34"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="13"
                strokeLinecap="round"
              />
              {/* 机身：尖头朝右 */}
              <path
                d="M12 82 L12 56 Q12 40 30 36 L50 31 Q58 18 78 17 L94 17 Q112 19 118 35 L126 55 Q134 62 136 74 L136 82 Z"
                fill="url(#ironBody)"
                stroke="#e11d48"
                strokeWidth="2"
              />
              {/* 按钮 */}
              <circle cx="98" cy="42" r="5.5" fill="#fff1f2" />
              <circle cx="98" cy="42" r="2.4" fill="#fb7185" />
              {/* 底板 */}
              <rect x="6" y="80" width="132" height="13" rx="6.5" fill="url(#ironSole)" stroke="#7c8aa0" strokeWidth="1.5" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
