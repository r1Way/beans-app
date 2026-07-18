// 拼豆核心数据：调色板、模板图案、绘制辅助函数

export interface BeadColor {
  name: string
  hex: string
}

/** 精简调色板 —— simple is more，14 色经典拼豆色 */
export const PALETTE: BeadColor[] = [
  { name: '纯白', hex: '#FFFFFF' },
  { name: '浅灰', hex: '#C9C6D0' },
  { name: '纯黑', hex: '#2A2630' },
  { name: '棕色', hex: '#8A5A3B' },
  { name: '肤色', hex: '#F6C99B' },
  { name: '大红', hex: '#E23E3E' },
  { name: '橙色', hex: '#F07B22' },
  { name: '明黄', hex: '#F6CF3D' },
  { name: '草绿', hex: '#7EC850' },
  { name: '深绿', hex: '#2F9E57' },
  { name: '天蓝', hex: '#6FC3E8' },
  { name: '宝蓝', hex: '#3E63D2' },
  { name: '紫色', hex: '#9A63C7' },
  { name: '粉色', hex: '#F79AC0' },
]

/** 网格值：0 = 空，n = PALETTE[n-1] */
export type Grid = Uint8Array

export const GRID_SIZES = [
  { label: '小', n: 16 },
  { label: '中', n: 24 },
  { label: '大', n: 32 },
] as const

export interface Template {
  name: string
  rows: string[]
  map: Record<string, number> // 字符 -> PALETTE 下标
}

const C = (name: string) => PALETTE.findIndex((c) => c.name === name)

// 常用色键：K纯黑 W纯白 P粉色 Y明黄 O橙色 R大红 B棕色 S肤色 G深绿 A天蓝 V紫色 U宝蓝
const ANIMAL_MAP = {
  K: C('纯黑'),
  W: C('纯白'),
  P: C('粉色'),
  Y: C('明黄'),
  O: C('橙色'),
  R: C('大红'),
  B: C('棕色'),
  S: C('肤色'),
  G: C('深绿'),
  A: C('天蓝'),
  V: C('紫色'),
  U: C('宝蓝'),
}

export const TEMPLATES: Template[] = [
  {
    name: '猫咪',
    map: ANIMAL_MAP,
    rows: [
      '..KK............KK..',
      '.KOOK..........KOOK.',
      '.KOWWK........KWWOK.',
      '.KOWWWK......KWWWOK.',
      '.KOWWWWKKKKKKWWWWOK.',
      'KOWWWWWWWWWWWWWWWWOK',
      'KOWWWWWWWWWWWWWWWWOK',
      'KWWWWWWWWWWWWWWWWWWK',
      'KWWWWWKWWWWWWWKWWWWK',
      'KWWWWKKWWWWWWKKWWWWK',
      'KWWWWKKWWPPWWKKWWWWK',
      'KPWWWWWWKWWKWWWWWPK.',
      'KPPWWWWWWKKWWWWWPPK.',
      '.KPWWWWWWWWWWWWWWPK.',
      '..KWWWWWWWWWWWWWWK..',
      '...KKKKKKKKKKKKKK...',
    ],
  },
  {
    name: '熊猫',
    map: ANIMAL_MAP,
    rows: [
      '...KKK........KKK...',
      '..KKKKK......KKKKK..',
      '..KKKKK......KKKKK..',
      '...KKWWWWWWWWWWKK...',
      '..KWWWWWWWWWWWWWWK..',
      '.KWWWWWWWWWWWWWWWWK.',
      'KWWKKKKWWWWWWKKKKWWK',
      'KWWKWKKWWWWWWKWKKWWK',
      'KWWKKKKWWWWWWKKKKWWK',
      'KWWWWWWWWPPWWWWWWWWK',
      '.KPWWWWWWWWWWWWWWPK.',
      '.KPPWWWWKWWKWWWWPPK.',
      '..KPWWWWWKKWWWWPK...',
      '...KKWWWWWWWWWWKK...',
      '.....KKKKKKKKKK.....',
    ],
  },
  {
    name: '兔子',
    map: ANIMAL_MAP,
    rows: [
      '...KK........KK...',
      '..KWWK......KWWK..',
      '..KPWK......KPWK..',
      '..KPWK......KPWK..',
      '..KPWK......KPWK..',
      '..KWWK......KWWK..',
      '..KWWK......KWWK..',
      '..KWWK......KWWK..',
      '...KWWK....KWWK...',
      '...KWWWKKKKWWWK...',
      '..KWWWWWWWWWWWWK..',
      '.KWWWKWWWWWWWKWWWK',
      '.KWWKKWWWWWWKKWWWK',
      '.KWWKKWWPPWWKKWWWK',
      'KPWWWWKWWWWKWWWWPK',
      'KPPWWWWWKKWWWWWPPK',
      '.KPWWWWWWWWWWWWPK.',
      '..KWWWWWWWWWWWWK..',
      '...KKKKKKKKKKKK...',
    ],
  },
  {
    name: '小鸡',
    map: ANIMAL_MAP,
    rows: [
      '.....KKKKKK.....',
      '...KKYYYYYYKK...',
      '..KYYYYYYYYYYK..',
      '.KYKYYYYYYYYKYK.',
      '.KYKYYYYYYYYKYK.',
      '.KYYYYYYYYYYYYK.',
      'KYYYYYOOOOYYYYYK',
      'KYYYYOOOOOOYYYYK',
      'KPYYYYOOOOYYYYPK',
      '.KPYYYYYYYYYYPK.',
      '.KYYYYYYYYYYYYK.',
      'KYYYYYYYYYYYYYYK',
      'KYYYYYYYYYYYYYYK',
      '.KYYYYYYYYYYYYK.',
      '..KKKKKKKKKKKK..',
    ],
  },
  {
    name: '章鱼',
    map: ANIMAL_MAP,
    rows: [
      '....KKKKK....',
      '..KKPPPPPKK..',
      '.KPPPPPPPPPK.',
      '.KPPPPPPPPPK.',
      'KPWKPPPPPWKPK',
      'KPKKPPPPPKKPK',
      'KPPPPPPPPPPPK',
      'KPPPPPKKPPPPK',
      '.KPPPPPPPPPK.',
      '.KPPKPPKPPK..',
      '..KK.KK.KK...',
    ],
  },
  {
    name: '猫耳娘',
    map: ANIMAL_MAP,
    rows: [
      '..KK............KK..',
      '.KVPK..........KPVK.',
      '.KVPVK........KVPVK.',
      '.KVVVVK......KVVVVK.',
      '.KVVVVVVVVVVVVVVVVK.',
      'KVVVVVVVVVVVVVVVVVVK',
      'KVVVSSVVVSSVVVSSVVVK',
      'KVVSSSSSSSSSSSSSSSVV',
      'KVVSSSSSSSSSSSSSSVVK',
      'KVVSKKSSSSSSSSKKSVVK',
      'KVVSWUSSSSSSSSWUSVVK',
      'KVVSUUSSSSSSSSUUSVVK',
      'KVVPPSSSSSSSSSSPPVVK',
      'KVVSSSSSSKKSSSSSSVVK',
      '.KVVSSSSSSSSSSSSVVK.',
      '.KVVSSSSSSSSSSSSVVK.',
      '..KVVKSSSSSSSSKVVK..',
      '..KVVKKKKKKKKKKVVK..',
      '..KVVK........KVVK..',
      '..KVVK........KVVK..',
      '...KKK........KKK...',
    ],
  },
  {
    name: '双马尾',
    map: ANIMAL_MAP,
    rows: [
      '......KKKKKKKK......',
      '....KAAAAAAAAAAK....',
      '...KAAAAAAAAAAAAK...',
      '..KAAAAAAAAAAAAAAK..',
      '..KAAASAAASAAASAAAK.',
      'KAAKSSSSSSSSSSSSKAAK',
      'KPPKSSSSSSSSSSSSKPPK',
      'KAAKSKKSSSSSSKKSKAAK',
      'KAAKSWGSSSSSSWGSKAAK',
      'KAAKSGGSSSSSSGGSKAAK',
      'KAAKPPSSSSSSSSPPKAAK',
      'KAAKSSSSSKKSSSSSKAAK',
      'KAAKSKSSSSSSSSKSKAAK',
      'KAAK..KKKKKKKK..KAAK',
      'KAAK............KAAK',
      'KAAK............KAAK',
      '.KK..............KK.',
    ],
  },
  {
    name: '魔法少女',
    map: ANIMAL_MAP,
    rows: [
      '......KKKKKKKK......',
      '....KPPPPPPPPPPK....',
      '...KPPPPPP.YPPPPK...',
      '..KPPPPPPPYYYPPPPK..',
      '..KPPPPPPPPYPPPPPK..',
      '..KPPPSPPPSPPPSPPPK.',
      '.KPPSSSSSSSSSSSSPPK.',
      '.KPPSKKSSSSSSKKSPPK.',
      '.KPPSWRSSSSSSWRSPPK.',
      '.KPPSRRSSSSSSRRSPPK.',
      '.KPPRRSSSSSSSSRRPPK.',
      '.KPPSSSSSKKSSSSSPPK.',
      '..KPPKSSSSSSSSKPPK..',
      '..KPPKKKKKKKKKKPPK..',
      '..KPPK........KPPK..',
      '..KPPK........KPPK..',
      '..KPPK........KPPK..',
      '...KKK........KKK...',
    ],
  },
  {
    name: '小幽灵',
    map: ANIMAL_MAP,
    rows: [
      '....KKKKKK....',
      '..KKWWWWWWKK..',
      '.KWWWWWWWWWWK.',
      '.KWWKWWWWWKWK.',
      '.KWKKWWWWKKWK.',
      'KWWWWWWWWWWWWK',
      'KWPPWWKKWWPPWK',
      'KWWWWWWWWWWWWK',
      '.KWWWWWWWWWWK.',
      '.KWWWKWWWKWWK.',
      '..KKK.KKK.KK..',
    ],
  },
  {
    name: '爱心',
    map: { R: C('大红') },
    rows: [
      '.RR...RR.',
      'RRRR.RRRR',
      'RRRRRRRRR',
      'RRRRRRRRR',
      '.RRRRRRR.',
      '..RRRRR..',
      '...RRR...',
      '....R....',
    ],
  },
  {
    name: '蘑菇',
    map: ANIMAL_MAP,
    rows: [
      '....RRRRRR....',
      '..RRRRRRRRRR..',
      '.RRWWRRRRWWRR.',
      '.RWWWRRRRWWWR.',
      'RRRWWRRRRWWRRR',
      'RRRRRRRRRRRRRR',
      '.RRRRRRRRRRRR.',
      '..SSSSSSSSSS..',
      '..SSKSSSSKSS..',
      '..SSKSSSSKSS..',
      '...SSSSSSSS...',
      '....SSSSSS....',
    ],
  },
  {
    name: '小花',
    map: ANIMAL_MAP,
    rows: [
      '..PP...PP..',
      '.PPPP.PPPP.',
      '.PPPPPPPPP.',
      '.PPPYYYPPP.',
      '.PPYYYYYPP.',
      '.PPPYYYPPP.',
      '.PPPPPPPPP.',
      '..PPP.PPP..',
      '...P...P...',
      '.....G.....',
      '..G..G..G..',
      '...GG.GG...',
      '.....G.....',
    ],
  },
]

/** 把模板图案渲染成网格值（返回图案自身的宽、高、格子数组） */
export function templateToCells(t: Template): { w: number; h: number; cells: number[] } {
  const h = t.rows.length
  const w = Math.max(...t.rows.map((r) => r.length))
  const cells: number[] = []
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = t.rows[y][x] ?? '.'
      const idx = t.map[ch]
      cells.push(idx === undefined ? 0 : idx + 1)
    }
  }
  return { w, h, cells }
}

/** Bresenham 直线，用于快速拖动时补全中间格子 */
export function lineCells(x0: number, y0: number, x1: number, y1: number): [number, number][] {
  const pts: [number, number][] = []
  const dx = Math.abs(x1 - x0)
  const dy = Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx - dy
  let x = x0
  let y = y0
  for (;;) {
    pts.push([x, y])
    if (x === x1 && y === y1) break
    const e2 = 2 * err
    if (e2 > -dy) {
      err -= dy
      x += sx
    }
    if (e2 < dx) {
      err += dx
      y += sy
    }
  }
  return pts
}

/** 洪水填充 */
export function floodFill(grid: Grid, n: number, x: number, y: number, value: number): number[] {
  const target = grid[y * n + x]
  if (target === value) return []
  const changed: number[] = []
  const stack: [number, number][] = [[x, y]]
  const seen = new Set<number>()
  while (stack.length) {
    const [cx, cy] = stack.pop()!
    const i = cy * n + cx
    if (cx < 0 || cy < 0 || cx >= n || cy >= n || seen.has(i) || grid[i] !== target) continue
    seen.add(i)
    changed.push(i)
    stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1])
  }
  return changed
}

/** 颜色明度调整，amt > 0 变亮，< 0 变暗 */
export function shade(hex: string, amt: number): string {
  const num = parseInt(hex.slice(1), 16)
  let r = (num >> 16) & 0xff
  let g = (num >> 8) & 0xff
  let b = num & 0xff
  if (amt >= 0) {
    r = Math.round(r + (255 - r) * amt)
    g = Math.round(g + (255 - g) * amt)
    b = Math.round(b + (255 - b) * amt)
  } else {
    r = Math.round(r * (1 + amt))
    g = Math.round(g * (1 + amt))
    b = Math.round(b * (1 + amt))
  }
  return `rgb(${r},${g},${b})`
}

/** 生成「迷你豆子」CSS 背景（用于调色板按钮、统计小圆点）：环状空心 */
export function beadBackground(hex: string): string {
  return `radial-gradient(circle at 50% 50%, rgba(120,100,80,0.28) 0 21%, rgba(0,0,0,0.12) 22%, transparent 26%), radial-gradient(circle at 35% 30%, ${shade(hex, 0.45)} 0%, ${hex} 58%, ${shade(hex, -0.3)} 100%)`
}

/** 在 ctx 上画一颗拼豆。melt: 0 = 原始带孔豆粒，1 = 熨烫后融合的豆子 */
export function drawBead(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, hex: string, melt = 0) {
  if (melt <= 0.001) {
    // 真实拼豆是空心圆管：环状豆身 + 通透的中心孔
    const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.1, cx, cy, r)
    g.addColorStop(0, shade(hex, 0.42))
    g.addColorStop(0.55, hex)
    g.addColorStop(1, shade(hex, -0.28))
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fillStyle = g
    ctx.fill()
    ctx.strokeStyle = 'rgba(60,50,40,0.14)'
    ctx.lineWidth = Math.max(1, r * 0.05)
    ctx.stroke()

    // 中心孔：打穿透出底板（真实拼豆的孔是贯通的）
    const holeR = r * 0.44
    ctx.save()
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(cx, cy, holeR, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    // 孔内壁：下半圈柔和阴影，营造管壁厚度
    ctx.beginPath()
    ctx.arc(cx, cy, holeR * 0.86, Math.PI * 0.15, Math.PI * 0.85)
    ctx.globalAlpha = 0.4
    ctx.strokeStyle = shade(hex, -0.4)
    ctx.lineWidth = holeR * 0.34
    ctx.stroke()
    ctx.globalAlpha = 1

    // 高光点
    ctx.beginPath()
    ctx.ellipse(cx - r * 0.32, cy - r * 0.38, r * 0.2, r * 0.12, -Math.PI / 4, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.fill()
    return
  }

  // ---- 熨烫态：逐渐变成像素块；完全熨烫后纯色平涂，如像素画 ----
  const h = r * (1 + 0.13 * melt) // 半边长，略微膨胀盖住缝隙
  const corner = h * (1 - 0.78 * melt) // 圆角：圆 -> 近乎方形

  if (melt > 0.999) {
    ctx.beginPath()
    ctx.roundRect(cx - h, cy - h, h * 2, h * 2, corner)
    ctx.fillStyle = hex
    ctx.fill()
    return
  }

  // 过渡态：渐变随融化度拉平、描边淡出
  const g = ctx.createRadialGradient(cx - h * 0.3, cy - h * 0.35, h * 0.1, cx, cy, h * 1.15)
  g.addColorStop(0, shade(hex, 0.42 * (1 - melt)))
  g.addColorStop(0.6, hex)
  g.addColorStop(1, shade(hex, -0.28 * (1 - melt)))
  ctx.beginPath()
  ctx.roundRect(cx - h, cy - h, h * 2, h * 2, corner)
  ctx.fillStyle = g
  ctx.fill()
  if (melt < 0.9) {
    ctx.strokeStyle = `rgba(60,50,40,${0.14 * (1 - melt)})`
    ctx.lineWidth = Math.max(1, r * 0.05)
    ctx.stroke()
  }

  // 中心孔随熨烫闭合（打透式，透出底板）
  if (melt < 0.85) {
    const holeR = Math.max(r * 0.44 * (1 - melt), 0.01)
    ctx.save()
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(cx, cy, holeR, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    // 孔内壁阴影
    ctx.beginPath()
    ctx.arc(cx, cy, holeR * 0.86, Math.PI * 0.15, Math.PI * 0.85)
    ctx.globalAlpha = 0.4 * (1 - melt)
    ctx.strokeStyle = shade(hex, -0.4)
    ctx.lineWidth = Math.max(holeR * 0.34, 0.5)
    ctx.stroke()
    ctx.globalAlpha = 1
  }

  // 高光随融化淡出，最终呈现平面像素感
  ctx.beginPath()
  ctx.ellipse(cx - h * 0.28, cy - h * 0.38, h * 0.22, h * 0.12, -Math.PI / 5, 0, Math.PI * 2)
  ctx.fillStyle = `rgba(255,255,255,${0.5 * (1 - melt)})`
  ctx.fill()
}

/** 把 hex 解析为 [r, g, b] */
const hexToRgb = (hex: string): [number, number, number] => {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const bigint = parseInt(full, 16)
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255]
}

/** 在 PALETTE 中找到与目标 hex 最接近的颜色下标 */
export const findNearestColor = (hex: string): number => {
  const [r, g, b] = hexToRgb(hex)
  let best = 0
  let bestDist = Infinity
  PALETTE.forEach((c, i) => {
    const [rc, gc, bc] = hexToRgb(c.hex)
    const dist = (r - rc) ** 2 + (g - gc) ** 2 + (b - bc) ** 2
    if (dist < bestDist) {
      bestDist = dist
      best = i
    }
  })
  return best
}

/** Fisher-Yates 洗牌 */
export const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 导出 PNG：把网格渲染成成品图。fused = true 时按熨烫后效果导出 */
export function exportPNG(grid: Grid, n: number, name: string, fused = false) {
  const cell = Math.max(24, Math.min(40, Math.floor(1152 / n)))
  const pad = Math.round(cell * 1.2)
  const size = n * cell + pad * 2
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  // 奶油色圆角底
  const r = cell * 1.4
  ctx.fillStyle = '#FFF8EC'
  ctx.beginPath()
  ctx.roundRect(0, 0, size, size, r)
  ctx.fill()

  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const v = grid[y * n + x]
      if (v === 0) continue
      const cx = pad + x * cell + cell / 2
      const cy = pad + y * cell + cell / 2
      drawBead(ctx, cx, cy, cell * 0.46, PALETTE[v - 1].hex, fused ? 1 : 0)
    }
  }

  const a = document.createElement('a')
  a.download = `${name}.png`
  a.href = canvas.toDataURL('image/png')
  a.click()
}
