import { useEffect, useRef } from 'react'
import { PALETTE, drawBead, templateToCells, type Template } from '@/lib/beads'

export default function TemplatePreview({ t, size = 88 }: { t: Template; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const { w, h, cells } = templateToCells(t)
    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    const ctx = canvas.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const cell = size / Math.max(w, h)
    const ox = (size - w * cell) / 2
    const oy = (size - h * cell) / 2
    cells.forEach((v, i) => {
      if (!v) return
      const x = i % w
      const y = Math.floor(i / w)
      drawBead(ctx, ox + (x + 0.5) * cell, oy + (y + 0.5) * cell, cell * 0.46, PALETTE[v - 1].hex)
    })
  }, [t, size])

  return <canvas ref={ref} className="pointer-events-none" />
}
