/* ── Web Audio API: Heartbeat + Music Box ── */

let audioCtx = null

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

/* ── Heartbeat Sound ── */
let heartbeatInterval = null

function playHeartbeatOnce(ctx, time, volume = 0.3) {
  // "thump-thump" pattern: two low-frequency pulses
  const osc1 = ctx.createOscillator()
  const gain1 = ctx.createGain()
  osc1.type = 'sine'
  osc1.frequency.setValueAtTime(55, time)
  gain1.gain.setValueAtTime(0, time)
  gain1.gain.linearRampToValueAtTime(volume, time + 0.02)
  gain1.gain.exponentialRampToValueAtTime(0.001, time + 0.15)
  osc1.connect(gain1)
  gain1.connect(ctx.destination)
  osc1.start(time)
  osc1.stop(time + 0.15)

  // Second beat (slightly softer, slightly delayed)
  const osc2 = ctx.createOscillator()
  const gain2 = ctx.createGain()
  osc2.type = 'sine'
  osc2.frequency.setValueAtTime(50, time + 0.2)
  gain2.gain.setValueAtTime(0, time + 0.2)
  gain2.gain.linearRampToValueAtTime(volume * 0.7, time + 0.22)
  gain2.gain.exponentialRampToValueAtTime(0.001, time + 0.35)
  osc2.connect(gain2)
  gain2.connect(ctx.destination)
  osc2.start(time + 0.2)
  osc2.stop(time + 0.35)
}

export function startHeartbeat() {
  stopHeartbeat()
  const ctx = getAudioCtx()
  playHeartbeatOnce(ctx, ctx.currentTime)
  heartbeatInterval = setInterval(() => {
    playHeartbeatOnce(ctx, ctx.currentTime)
  }, 1200)
}

export function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval)
    heartbeatInterval = null
  }
}

/* ── BGM (mp3 file) ── */
const bgmAudio = new Audio()
bgmAudio.src = import.meta.env.BASE_URL + 'bgm.mp3'
bgmAudio.loop = true
bgmAudio.volume = 0.3

export function startBGM() {
  bgmAudio.currentTime = 0
  bgmAudio.play().catch(() => {})
}

export function stopBGM() {
  bgmAudio.pause()
  bgmAudio.currentTime = 0
}

/* ── Single heartbeat burst (for level reveal) ── */
export function playHeartbeatBurst() {
  const ctx = getAudioCtx()
  playHeartbeatOnce(ctx, ctx.currentTime, 0.4)
  setTimeout(() => playHeartbeatOnce(ctx, ctx.currentTime, 0.35), 1200)
  setTimeout(() => playHeartbeatOnce(ctx, ctx.currentTime, 0.3), 2400)
}

/* ── Resume audio context (must be called from user gesture) ── */
export function resumeAudio() {
  getAudioCtx()
}
