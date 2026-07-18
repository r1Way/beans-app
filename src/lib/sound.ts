// 拼豆音效：Web Audio 合成的「啵」声，按颜色映射五声音阶

let ctx: AudioContext | null = null
let enabled = true
let lastPlay = 0

export function setSoundEnabled(v: boolean) {
  enabled = v
}

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

// 五声音阶（C 大调），按颜色索引取音高，画起来像弹琴
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28, 31]

export function playPop(colorIndex: number) {
  if (!enabled) return
  const now = performance.now()
  if (now - lastPlay < 28) return // 限流，避免连续拖动时刺耳
  lastPlay = now
  const ac = getCtx()
  const t = ac.currentTime
  const semi = PENTA[colorIndex % PENTA.length]
  const freq = 392 * Math.pow(2, semi / 12)

  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(freq * 1.6, t)
  osc.frequency.exponentialRampToValueAtTime(freq, t + 0.06)
  gain.gain.setValueAtTime(0.16, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14)
  osc.connect(gain).connect(ac.destination)
  osc.start(t)
  osc.stop(t + 0.15)
}

export function playErase() {
  if (!enabled) return
  const now = performance.now()
  if (now - lastPlay < 40) return
  lastPlay = now
  const ac = getCtx()
  const t = ac.currentTime
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(220, t)
  osc.frequency.exponentialRampToValueAtTime(110, t + 0.08)
  gain.gain.setValueAtTime(0.1, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1)
  osc.connect(gain).connect(ac.destination)
  osc.start(t)
  osc.stop(t + 0.11)
}

/** 熨烫声：滤波白噪声，模拟熨斗滑过的滋滋声 */
export function playHiss(dur = 2.6) {
  if (!enabled) return
  const ac = getCtx()
  const t = ac.currentTime
  const len = Math.floor(ac.sampleRate * dur)
  const buf = ac.createBuffer(1, len, ac.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  const src = ac.createBufferSource()
  src.buffer = buf
  const lp = ac.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.setValueAtTime(800, t)
  lp.frequency.linearRampToValueAtTime(1500, t + dur * 0.5)
  lp.frequency.linearRampToValueAtTime(700, t + dur)
  const g = ac.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(0.05, t + 0.35)
  g.gain.setValueAtTime(0.05, Math.max(t + 0.35, t + dur - 0.45))
  g.gain.linearRampToValueAtTime(0.0001, t + dur)
  src.connect(lp).connect(g).connect(ac.destination)
  src.start(t)
  src.stop(t + dur)
}

export function playChime() {
  if (!enabled) return
  const ac = getCtx()
  const t = ac.currentTime
  ;[523, 659, 784].forEach((f, i) => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'sine'
    osc.frequency.value = f
    const t0 = t + i * 0.07
    gain.gain.setValueAtTime(0.001, t0)
    gain.gain.linearRampToValueAtTime(0.12, t0 + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.25)
    osc.connect(gain).connect(ac.destination)
    osc.start(t0)
    osc.stop(t0 + 0.3)
  })
}
