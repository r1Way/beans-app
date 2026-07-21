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
  { label: '超大', n: 64 },
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
    // 简洁圆环：单色填充 + 细描边 + 通透中心孔
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fillStyle = hex
    ctx.fill()
    ctx.strokeStyle = 'rgba(60,50,40,0.14)'
    ctx.lineWidth = Math.max(1, r * 0.05)
    ctx.stroke()

    const holeR = r * 0.44
    ctx.save()
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(cx, cy, holeR, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
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

/** 把 [r, g, b] 转为大写 hex */
export const rgbToHex = (r: number, g: number, b: number): string => {
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`.toUpperCase()
}

/** 生成一组真随机颜色 */
export const generateRandomPalette = (count = 14): BeadColor[] => {
  return Array.from({ length: count }, () => {
    const r = Math.floor(Math.random() * 256)
    const g = Math.floor(Math.random() * 256)
    const b = Math.floor(Math.random() * 256)
    const hex = rgbToHex(r, g, b)
    return { name: hex, hex }
  })
}

/** 用 k-means 从图片中提取 k 种主色 */
export const extractImageColors = (img: HTMLImageElement, k = 14, size = 100): BeadColor[] => {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, size, size)
  const data = ctx.getImageData(0, 0, size, size).data

  const pixels: [number, number, number][] = []
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const a = data[i + 3]
    if (a >= 128) pixels.push([r, g, b])
  }
  if (pixels.length === 0) return []

  // 初始化聚类中心：尽量选不同的随机像素
  const centroids: [number, number, number][] = []
  const used = new Set<number>()
  while (centroids.length < k && used.size < pixels.length) {
    const idx = Math.floor(Math.random() * pixels.length)
    if (used.has(idx)) continue
    used.add(idx)
    centroids.push([...pixels[idx]])
  }
  while (centroids.length < k) {
    centroids.push([Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256)])
  }

  const counts = new Array(k).fill(0)
  const sums = Array.from({ length: k }, () => [0, 0, 0])

  for (let iter = 0; iter < 12; iter++) {
    counts.fill(0)
    for (const s of sums) {
      s[0] = 0
      s[1] = 0
      s[2] = 0
    }

    for (const [r, g, b] of pixels) {
      let best = 0
      let bestDist = Infinity
      for (let ci = 0; ci < k; ci++) {
        const [cr, cg, cb] = centroids[ci]
        const dist = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2
        if (dist < bestDist) {
          bestDist = dist
          best = ci
        }
      }
      counts[best]++
      sums[best][0] += r
      sums[best][1] += g
      sums[best][2] += b
    }

    let moved = false
    for (let ci = 0; ci < k; ci++) {
      if (counts[ci] === 0) {
        const idx = Math.floor(Math.random() * pixels.length)
        centroids[ci] = [...pixels[idx]]
        moved = true
      } else {
        const nr = Math.round(sums[ci][0] / counts[ci])
        const ng = Math.round(sums[ci][1] / counts[ci])
        const nb = Math.round(sums[ci][2] / counts[ci])
        if (centroids[ci][0] !== nr || centroids[ci][1] !== ng || centroids[ci][2] !== nb) {
          centroids[ci] = [nr, ng, nb]
          moved = true
        }
      }
    }
    if (!moved) break
  }

  const result = counts
    .map((count, i) => ({ count, color: centroids[i] as [number, number, number] }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count)
    .map((x) => {
      const hex = rgbToHex(...x.color)
      return { name: hex, hex }
    })

  // 若主色不足 k 种，用随机色补齐
  while (result.length < k) {
    const c = [Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256)] as [number, number, number]
    const hex = rgbToHex(...c)
    result.push({ name: hex, hex })
  }

  return result
}

/** 导出 PNG：把网格渲染成成品图。
 *  - fused = true 时按熨烫后效果导出
 *  - transparent = true 时背景透明
 *  - watermark = true 时在图片外加带网址的水印边框
 */
export function exportPNG(
  grid: Grid,
  n: number,
  name: string,
  fused = false,
  transparent = false,
  watermark = false,
  date = '',
  palette: BeadColor[] = PALETTE,
) {
  const cell = Math.max(24, Math.min(40, Math.floor(1152 / n)))
  const pad = Math.round(cell * 1.2)
  const size = n * cell + pad * 2
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  if (!transparent) {
    // 奶油色圆角底
    const r = cell * 1.4
    ctx.fillStyle = '#FFF8EC'
    ctx.beginPath()
    ctx.roundRect(0, 0, size, size, r)
    ctx.fill()
  }

  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const v = grid[y * n + x]
      if (v === 0 || v > palette.length) continue
      const cx = pad + x * cell + cell / 2
      const cy = pad + y * cell + cell / 2
      drawBead(ctx, cx, cy, cell * 0.46, palette[v - 1].hex, fused ? 1 : 0)
    }
  }

  let outputCanvas: HTMLCanvasElement = canvas
  if (watermark) {
    const border = Math.round(size * 0.08)
    const wmCanvas = document.createElement('canvas')
    wmCanvas.width = size + border * 2
    wmCanvas.height = size + border * 2
    const wmCtx = wmCanvas.getContext('2d')!

    if (!transparent) {
      wmCtx.fillStyle = '#FFF8EC'
      wmCtx.fillRect(0, 0, wmCanvas.width, wmCanvas.height)
    }

    wmCtx.drawImage(canvas, border, border)

    // 顶部图标：红色拼豆圆环
    const iconR = border * 0.22
    const iconX = wmCanvas.width / 2
    const iconY = border / 2
    wmCtx.fillStyle = '#E23E3E'
    wmCtx.beginPath()
    wmCtx.arc(iconX, iconY, iconR, 0, Math.PI * 2)
    wmCtx.fill()
    if (transparent) {
      wmCtx.globalCompositeOperation = 'destination-out'
      wmCtx.beginPath()
      wmCtx.arc(iconX, iconY, iconR * 0.45, 0, Math.PI * 2)
      wmCtx.fill()
      wmCtx.globalCompositeOperation = 'source-over'
    } else {
      wmCtx.fillStyle = '#FFF8EC'
      wmCtx.beginPath()
      wmCtx.arc(iconX, iconY, iconR * 0.45, 0, Math.PI * 2)
      wmCtx.fill()
    }

    // 底部水印文字（网站地址 + 日期）
    wmCtx.fillStyle = '#8c7b70'
    wmCtx.font = `bold ${Math.max(12, Math.round(border * 0.28))}px sans-serif`
    wmCtx.textAlign = 'center'
    wmCtx.textBaseline = 'middle'
    const watermarkText = date
      ? `r1way.github.io/beans-app · ${date}`
      : 'r1way.github.io/beans-app'
    wmCtx.fillText(watermarkText, wmCanvas.width / 2, wmCanvas.height - border / 2)

    outputCanvas = wmCanvas
  }

  const a = document.createElement('a')
  a.download = `${name}.png`
  a.href = outputCanvas.toDataURL('image/png')
  a.click()
}
