import React, { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'

const BOARD_SIZE = 20
const CELL_SIZE = 28
const MIN_SPEED = 60
const SPEED_INCREMENT = 3

const Direction = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
}

const LEVELS = [
  {
    emoji: '💖',
    chapter: 'Chapter I',
    chapterName: '心意初现',
    chapterEn: 'A Heart Appears',
    desc: '收集所有闪光，看看会出现什么…',
    reveal: '原来是一颗爱心！这是给你的心意',
    revealEn: 'A heart — my feelings for you',
    letterLine: '第一次心动，是因为你的笑容',
    speed: 160,
    color: '#ff4081',
    points: [
      { x: 7, y: 6 }, { x: 8, y: 6 }, { x: 11, y: 6 }, { x: 12, y: 6 },
      { x: 6, y: 7 }, { x: 9, y: 7 }, { x: 10, y: 7 }, { x: 13, y: 7 },
      { x: 6, y: 8 }, { x: 13, y: 8 },
      { x: 7, y: 9 }, { x: 12, y: 9 },
      { x: 8, y: 10 }, { x: 11, y: 10 },
      { x: 9, y: 11 }, { x: 10, y: 11 },
    ],
  },
  {
    emoji: '🌹',
    chapter: 'Chapter II',
    chapterName: '浪漫绽放',
    chapterEn: 'Romance Blooms',
    desc: '继续探索，惊喜正在绽放…',
    reveal: '一朵玫瑰为你盛开',
    revealEn: 'A rose, blooming just for you',
    letterLine: '想送你全世界的花，但你比花更美',
    speed: 150,
    color: '#e91e63',
    points: [
      { x: 9, y: 5 }, { x: 10, y: 5 }, { x: 11, y: 5 },
      { x: 9, y: 6 }, { x: 10, y: 6 }, { x: 11, y: 6 },
      { x: 10, y: 7 },
      { x: 10, y: 8 }, { x: 10, y: 9 }, { x: 10, y: 10 },
      { x: 9, y: 9 }, { x: 11, y: 10 },
    ],
  },
  {
    emoji: '💕',
    chapter: 'Chapter III',
    chapterName: '表白宣言',
    chapterEn: 'A Declaration',
    desc: '这一关藏着一句话，吃完就知道…',
    reveal: '是 LOVE！想对你说的那四个字母',
    revealEn: 'L-O-V-E — the word I want to say',
    letterLine: '千言万语，不如这四个字母',
    speed: 140,
    color: '#c44dff',
    points: [
      { x: 4, y: 7 }, { x: 4, y: 8 }, { x: 4, y: 9 }, { x: 5, y: 9 },
      { x: 7, y: 7 }, { x: 8, y: 7 }, { x: 7, y: 8 }, { x: 8, y: 8 }, { x: 7, y: 9 }, { x: 8, y: 9 },
      { x: 10, y: 7 }, { x: 12, y: 7 }, { x: 10, y: 8 }, { x: 12, y: 8 }, { x: 11, y: 9 },
      { x: 14, y: 7 }, { x: 15, y: 7 }, { x: 14, y: 8 }, { x: 14, y: 9 }, { x: 15, y: 9 },
    ],
  },
  {
    emoji: '💍',
    chapter: 'Chapter IV',
    chapterName: '终极承诺',
    chapterEn: 'The Promise',
    desc: '最后的秘密，即将揭晓…',
    reveal: '一枚钻戒！你愿意吗？',
    revealEn: 'A ring — will you say yes?',
    letterLine: '余生，想和你一起度过每一天',
    speed: 130,
    color: '#ffd700',
    points: [
      { x: 10, y: 5 },
      { x: 9, y: 6 }, { x: 11, y: 6 },
      { x: 8, y: 7 }, { x: 12, y: 7 },
      { x: 8, y: 8 }, { x: 12, y: 8 },
      { x: 8, y: 9 }, { x: 12, y: 9 },
      { x: 9, y: 10 }, { x: 10, y: 10 }, { x: 11, y: 10 },
    ],
  },
]

/* ── helpers ── */
function getRandomPosition(snake, excludePoints = []) {
  let pos
  do {
    pos = {
      x: Math.floor(Math.random() * BOARD_SIZE),
      y: Math.floor(Math.random() * BOARD_SIZE),
    }
  } while (
    snake.some((s) => s.x === pos.x && s.y === pos.y) ||
    excludePoints.some((p) => p.x === pos.x && p.y === pos.y)
  )
  return pos
}

function getNextLevelFood(snake, eatenSet, levelPoints) {
  const remaining = levelPoints.filter(
    (p) =>
      !eatenSet.has(`${p.x},${p.y}`) &&
      !snake.some((s) => s.x === p.x && s.y === p.y)
  )
  if (remaining.length === 0) return null
  return remaining[Math.floor(Math.random() * remaining.length)]
}

/* ── Particles component ── */
function Particles({ particles }) {
  return (
    <div className="particles-layer">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.x,
            top: p.y,
            '--dx': p.dx + 'px',
            '--dy': p.dy + 'px',
            '--pcolor': p.color,
          }}
        />
      ))}
    </div>
  )
}

/* ── Falling petals background ── */
function Petals() {
  const petals = useRef(
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 8,
      duration: 6 + Math.random() * 6,
      size: 10 + Math.random() * 14,
      emoji: ['🌸', '💗', '✨', '🩷'][Math.floor(Math.random() * 4)],
    }))
  ).current
  return (
    <div className="petals-bg">
      {petals.map((p) => (
        <span
          key={p.id}
          className="petal"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            fontSize: `${p.size}px`,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  )
}

/* ── Love Letter overlay ── */
function LoveLetter({ playerName, onClose }) {
  return (
    <div className="overlay letter-overlay">
      <div className="letter-card">
        <div className="letter-header">💌 A Letter For You</div>
        <div className="letter-body">
          {playerName && (
            <p className="letter-dear">亲爱的 {playerName}：</p>
          )}
          {LEVELS.map((lvl, i) => (
            <p key={i} className="letter-line" style={{ animationDelay: `${i * 0.6}s` }}>
              {lvl.emoji} {lvl.letterLine}
            </p>
          ))}
          <p className="letter-sign" style={{ animationDelay: `${LEVELS.length * 0.6}s` }}>
            —— 你的小蛇 🐍💕
          </p>
        </div>
        <button className="restart-btn letter-close-btn" onClick={onClose}>
          收下这封信 💌
        </button>
      </div>
    </div>
  )
}

/* ── Chapter intro overlay ── */
function ChapterIntro({ level, onStart }) {
  const lvl = LEVELS[level]
  return (
    <div className="overlay chapter-overlay">
      <div className="chapter-card">
        <div className="chapter-number">{lvl.chapter}</div>
        <div className="chapter-emoji-big">{lvl.emoji}</div>
        <h2 className="chapter-title">{lvl.chapterName}</h2>
        <p className="chapter-en">{lvl.chapterEn}</p>
        <p className="chapter-desc">{lvl.desc}</p>
        <button className="restart-btn" onClick={onStart}>
          开始 →
        </button>
        <p className="hint">按空格键 / 回车开始</p>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════ */
/*              Main App                 */
/* ══════════════════════════════════════ */
function App() {
  const initialSnake = [
    { x: 10, y: 14 },
    { x: 9, y: 14 },
    { x: 8, y: 14 },
  ]

  /* ── game state ── */
  const [snake, setSnake] = useState(initialSnake)
  const [food, setFood] = useState({ x: 15, y: 14 })
  const [direction, setDirection] = useState(Direction.RIGHT)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('snakeHighScore')
    return saved ? parseInt(saved, 10) : 0
  })
  const [isRunning, setIsRunning] = useState(false)
  const [speed, setSpeed] = useState(LEVELS[0].speed)
  const [trail, setTrail] = useState([])
  const [eatenPoints, setEatenPoints] = useState(new Set())
  const [level, setLevel] = useState(0)
  const [levelComplete, setLevelComplete] = useState(false)
  const [allComplete, setAllComplete] = useState(false)
  const [showReveal, setShowReveal] = useState(false)
  const [showLevelPanel, setShowLevelPanel] = useState(false)

  /* ── narrative state ── */
  const [gamePhase, setGamePhase] = useState('welcome')
  const [playerName, setPlayerName] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [showLetter, setShowLetter] = useState(false)
  const [particles, setParticles] = useState([])
  const particleIdRef = useRef(0)

  /* ── refs ── */
  const directionRef = useRef(direction)
  const snakeRef = useRef(snake)
  const foodRef = useRef(food)
  const gameOverRef = useRef(gameOver)
  const scoreRef = useRef(score)
  const speedRef = useRef(speed)
  const lastDirectionRef = useRef(direction)
  const levelRef = useRef(level)
  const levelCompleteRef = useRef(levelComplete)
  const boardRef = useRef(null)
  const touchStartRef = useRef(null)

  useEffect(() => { directionRef.current = direction }, [direction])
  useEffect(() => { snakeRef.current = snake }, [snake])
  useEffect(() => { foodRef.current = food }, [food])
  useEffect(() => { gameOverRef.current = gameOver }, [gameOver])
  useEffect(() => { scoreRef.current = score }, [score])
  useEffect(() => { speedRef.current = speed }, [speed])
  useEffect(() => { levelRef.current = level }, [level])
  useEffect(() => { levelCompleteRef.current = levelComplete }, [levelComplete])

  const currentLevel = LEVELS[level]

  /* ── spawn particles on eat ── */
  const spawnParticles = useCallback((cellX, cellY, color) => {
    const cx = cellX * CELL_SIZE + CELL_SIZE / 2
    const cy = cellY * CELL_SIZE + CELL_SIZE / 2
    const newP = Array.from({ length: 8 }, () => {
      const angle = Math.random() * Math.PI * 2
      const dist = 20 + Math.random() * 30
      return {
        id: particleIdRef.current++,
        x: cx,
        y: cy,
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist,
        color,
      }
    })
    setParticles((prev) => [...prev, ...newP])
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newP.includes(p)))
    }, 600)
  }, [])

  /* ── moveSnake ── */
  const moveSnake = useCallback(() => {
    if (gameOverRef.current || levelCompleteRef.current) return

    const currentSnake = snakeRef.current
    const currentDirection = directionRef.current
    const currentFood = foodRef.current

    lastDirectionRef.current = currentDirection

    const head = currentSnake[0]
    const newHead = {
      x: (head.x + currentDirection.x + BOARD_SIZE) % BOARD_SIZE,
      y: (head.y + currentDirection.y + BOARD_SIZE) % BOARD_SIZE,
    }

    // 撞自己检测
    if (currentSnake.some((seg) => seg.x === newHead.x && seg.y === newHead.y)) {
      setGameOver(true)
      setIsRunning(false)
      const finalScore = scoreRef.current
      if (finalScore > highScore) {
        setHighScore(finalScore)
        localStorage.setItem('snakeHighScore', finalScore.toString())
      }
      return
    }

    const newSnake = [newHead, ...currentSnake]

    if (newHead.x === currentFood.x && newHead.y === currentFood.y) {
      const newScore = scoreRef.current + 10
      setScore(newScore)
      setTrail((prev) => [...prev, { x: currentFood.x, y: currentFood.y }])
      spawnParticles(currentFood.x, currentFood.y, LEVELS[levelRef.current].color)

      const lvl = levelRef.current
      const lvlPoints = LEVELS[lvl].points

      setEatenPoints((prev) => {
        const next = new Set(prev)
        const key = `${currentFood.x},${currentFood.y}`
        const isLP = lvlPoints.some((p) => p.x === currentFood.x && p.y === currentFood.y)
        if (isLP) {
          next.add(key)
          if (next.size === lvlPoints.length) {
            setLevelComplete(true)
            setIsRunning(false)
            setShowReveal(true)
            return next
          }
        }
        const nextFood = getNextLevelFood(newSnake, next, lvlPoints)
        if (nextFood) setFood(nextFood)
        else setFood(getRandomPosition(newSnake, lvlPoints))
        return next
      })

      const newSpeed = Math.max(MIN_SPEED, speedRef.current - SPEED_INCREMENT)
      setSpeed(newSpeed)
    } else {
      newSnake.pop()
    }

    setSnake(newSnake)
  }, [highScore, spawnParticles])

  // reveal → panel delay
  useEffect(() => {
    if (!showReveal) return
    const timer = setTimeout(() => setShowLevelPanel(true), 2200)
    return () => clearTimeout(timer)
  }, [showReveal])

  // game loop
  useEffect(() => {
    if (!isRunning || gameOver || levelComplete) return
    const interval = setInterval(moveSnake, speed)
    return () => clearInterval(interval)
  }, [isRunning, gameOver, levelComplete, speed, moveSnake])

  /* ── keyboard ── */
  useEffect(() => {
    const handleKeyDown = (e) => {
      const actionKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 'a', 'A', 's', 'S', 'd', 'D', ' ', 'Enter']
      if (actionKeys.includes(e.key)) {
        e.preventDefault()
      }

      if (e.key === ' ' || e.key === 'Enter') {
        if (gamePhase === 'welcome') return
        if (gamePhase === 'chapterIntro') {
          beginLevel()
          return
        }
        if (showLetter) { setShowLetter(false); return }
        if (levelComplete && showLevelPanel) { goNextLevel(); return }
        if (levelComplete) return
        if (allComplete) { return }
        if (gameOver) { restartCurrentLevel(); return }
        setIsRunning((prev) => !prev)
        return
      }

      if (!isRunning || gameOver || levelComplete) return
      const last = lastDirectionRef.current

      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W':
          if (last !== Direction.DOWN) setDirection(Direction.UP); break
        case 'ArrowDown': case 's': case 'S':
          if (last !== Direction.UP) setDirection(Direction.DOWN); break
        case 'ArrowLeft': case 'a': case 'A':
          if (last !== Direction.RIGHT) setDirection(Direction.LEFT); break
        case 'ArrowRight': case 'd': case 'D':
          if (last !== Direction.LEFT) setDirection(Direction.RIGHT); break
        default: break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isRunning, gameOver, levelComplete, showLevelPanel, gamePhase, allComplete, showLetter])

  /* ── touch swipe ── */
  useEffect(() => {
    const board = boardRef.current
    if (!board) return
    const onTouchStart = (e) => {
      const t = e.touches[0]
      touchStartRef.current = { x: t.clientX, y: t.clientY }
    }
    const onTouchEnd = (e) => {
      if (!touchStartRef.current) return
      const t = e.changedTouches[0]
      const dx = t.clientX - touchStartRef.current.x
      const dy = t.clientY - touchStartRef.current.y
      touchStartRef.current = null
      if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return
      const last = lastDirectionRef.current
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0 && last !== Direction.LEFT) setDirection(Direction.RIGHT)
        else if (dx < 0 && last !== Direction.RIGHT) setDirection(Direction.LEFT)
      } else {
        if (dy > 0 && last !== Direction.UP) setDirection(Direction.DOWN)
        else if (dy < 0 && last !== Direction.DOWN) setDirection(Direction.UP)
      }
    }
    board.addEventListener('touchstart', onTouchStart, { passive: true })
    board.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      board.removeEventListener('touchstart', onTouchStart)
      board.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  /* ── actions ── */
  const startFromWelcome = () => {
    setPlayerName(nameInput.trim())
    setGamePhase('chapterIntro')
  }

  const beginLevel = () => {
    setGamePhase('playing')
    const firstFood = getNextLevelFood(snake, eatenPoints, currentLevel.points)
    if (firstFood) setFood(firstFood)
    setIsRunning(true)
  }

  const goNextLevel = () => {
    const nextLevel = level + 1
    if (nextLevel >= LEVELS.length) {
      setAllComplete(true)
      setLevelComplete(false)
      setShowReveal(false)
      setShowLevelPanel(false)
      return
    }
    const newSnake = [{ x: 10, y: 14 }, { x: 9, y: 14 }, { x: 8, y: 14 }]
    setLevel(nextLevel)
    setSnake(newSnake)
    setDirection(Direction.RIGHT)
    lastDirectionRef.current = Direction.RIGHT
    setSpeed(LEVELS[nextLevel].speed)
    setTrail([])
    setEatenPoints(new Set())
    setLevelComplete(false)
    setShowReveal(false)
    setShowLevelPanel(false)
    setGamePhase('chapterIntro')
    setIsRunning(false)
  }

  const restartCurrentLevel = () => {
    const newSnake = [{ x: 10, y: 14 }, { x: 9, y: 14 }, { x: 8, y: 14 }]
    setSnake(newSnake)
    setDirection(Direction.RIGHT)
    lastDirectionRef.current = Direction.RIGHT
    setGameOver(false)
    setSpeed(currentLevel.speed)
    setTrail([])
    setEatenPoints(new Set())
    setLevelComplete(false)
    setShowReveal(false)
    setShowLevelPanel(false)
    setGamePhase('chapterIntro')
    setIsRunning(false)
  }

  const restartGame = () => {
    const newSnake = [{ x: 10, y: 14 }, { x: 9, y: 14 }, { x: 8, y: 14 }]
    setSnake(newSnake)
    setDirection(Direction.RIGHT)
    lastDirectionRef.current = Direction.RIGHT
    setGameOver(false)
    setScore(0)
    setLevel(0)
    setSpeed(LEVELS[0].speed)
    setTrail([])
    setEatenPoints(new Set())
    setLevelComplete(false)
    setAllComplete(false)
    setShowReveal(false)
    setShowLevelPanel(false)
    setShowLetter(false)
    setGamePhase('chapterIntro')
    setIsRunning(false)
  }

  /* ── virtual joystick ── */
  const handleJoystick = (dir) => {
    if (!isRunning) return
    const last = lastDirectionRef.current
    if (dir === 'up' && last !== Direction.DOWN) setDirection(Direction.UP)
    if (dir === 'down' && last !== Direction.UP) setDirection(Direction.DOWN)
    if (dir === 'left' && last !== Direction.RIGHT) setDirection(Direction.LEFT)
    if (dir === 'right' && last !== Direction.LEFT) setDirection(Direction.RIGHT)
  }

  /* ── cell helpers ── */
  const isSnakeHead = (x, y) => snake[0]?.x === x && snake[0]?.y === y
  const isSnakeBody = (x, y) => snake.slice(1).some((s) => s.x === x && s.y === y)
  const isFoodCell = (x, y) => food.x === x && food.y === y
  const isTrail = (x, y) => trail.some((t) => t.x === x && t.y === y)
  const isLevelPoint = (x, y) => currentLevel.points.some((p) => p.x === x && p.y === y)
  const isEatenPoint = (x, y) => eatenPoints.has(`${x},${y}`)

  /* ══════════════════ RENDER ══════════════════ */
  return (
    <div className="game-container">
      <Petals />
      <div className="stars-bg" />

      <h1 className="game-title">💘 Valentine Snake 💘</h1>

      {/* 关卡指示器 */}
      <div className="level-indicator">
        {LEVELS.map((lvl, i) => (
          <div
            key={i}
            className={`level-dot ${i === level ? 'active' : ''} ${i < level ? 'done' : ''}`}
            style={{ '--level-color': lvl.color }}
          >
            <span className="level-emoji">{lvl.emoji}</span>
          </div>
        ))}
      </div>

      <div className="score-board">
        <div className="score-item">
          <span className="score-label">Chapter</span>
          <span className="score-value" style={{ color: currentLevel.color }}>
            {level + 1}/{LEVELS.length}
          </span>
        </div>
        <div className="score-item">
          <span className="score-label">Score</span>
          <span className="score-value">{score}</span>
        </div>
        <div className="score-item">
          <span className="score-label">Progress</span>
          <span className="score-value">
            {eatenPoints.size}/{currentLevel.points.length}
          </span>
        </div>
        <div className="score-item">
          <span className="score-label">Best</span>
          <span className="score-value high">{highScore}</span>
        </div>
      </div>

      <div className="board-wrapper" ref={boardRef}>
        <div
          className="board"
          style={{
            gridTemplateColumns: `repeat(${BOARD_SIZE}, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(${BOARD_SIZE}, ${CELL_SIZE}px)`,
          }}
        >
          {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, i) => {
            const x = i % BOARD_SIZE
            const y = Math.floor(i / BOARD_SIZE)
            const eaten = isEatenPoint(x, y)
            const onSnakeHead = isSnakeHead(x, y)
            const onSnakeBody = isSnakeBody(x, y)
            const onSnake = onSnakeHead || onSnakeBody
            const isPattern = isLevelPoint(x, y)

            let cellClass = 'cell'
            if (showReveal) {
              if (isPattern) cellClass += ' point-reveal'
            } else {
              if (onSnakeHead) cellClass += ' snake-head'
              else if (onSnakeBody) cellClass += ' snake-body'
              if (eaten && !onSnake) cellClass += ' point-eaten glow-trail'
              else if (isTrail(x, y) && !onSnake && !eaten) cellClass += ' trail glow-trail'
            }
            const showFood = !showReveal && isFoodCell(x, y)

            let revealDelay
            if (showReveal && isPattern) {
              const idx = currentLevel.points.findIndex((p) => p.x === x && p.y === y)
              revealDelay = idx >= 0 ? idx * 120 : 0
            }
            const needStyle = showReveal ? isPattern : (eaten && !onSnake)

            return (
              <div
                key={i}
                className={cellClass}
                style={
                  needStyle
                    ? {
                        '--eaten-color': currentLevel.color,
                        ...(revealDelay !== undefined ? { '--reveal-delay': `${revealDelay}ms` } : {}),
                      }
                    : undefined
                }
              >
                {showFood && <span className="food-emoji">{currentLevel.emoji}</span>}
              </div>
            )
          })}
        </div>

        <Particles particles={particles} />

        {/* ── Welcome screen ── */}
        {gamePhase === 'welcome' && (
          <div className="overlay welcome-overlay">
            <div className="game-over-panel welcome-panel">
              <div className="welcome-emoji">💘🐍</div>
              <h2>Valentine Snake</h2>
              <p className="welcome-subtitle">一段关于爱的小旅程</p>
              <p className="welcome-en">A little journey about love</p>
              <div className="name-input-area">
                <p className="name-label">🎁 输入 TA 的名字，解锁专属惊喜：</p>
                <input
                  className="name-input"
                  type="text"
                  placeholder="TA 的名字（可跳过）"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') startFromWelcome() }}
                  maxLength={20}
                />
              </div>
              <button className="restart-btn" onClick={startFromWelcome}>
                开始旅程 →
              </button>
              <p className="hint">WASD / 方向键 / 触屏滑动均可操控</p>
            </div>
          </div>
        )}

        {/* ── Chapter intro ── */}
        {gamePhase === 'chapterIntro' && !gameOver && !levelComplete && !allComplete && (
          <ChapterIntro level={level} onStart={beginLevel} />
        )}

        {/* ── Pause ── */}
        {gamePhase === 'playing' && !isRunning && !gameOver && !levelComplete && !allComplete && (
          <div className="overlay">
            <div className="game-over-panel start-panel">
              <h2>暂停中 ⏸</h2>
              <p className="controls-hint">按空格键继续</p>
              <button className="restart-btn" onClick={() => setIsRunning(true)}>
                继续游戏
              </button>
            </div>
          </div>
        )}

        {/* ── Level clear ── */}
        {levelComplete && showLevelPanel && !allComplete && (
          <div className="overlay level-clear-overlay">
            <div className="game-over-panel level-clear-panel">
              <div className="level-clear-emoji">{currentLevel.emoji}</div>
              <p className="level-reveal-text">{currentLevel.reveal}</p>
              <p className="level-reveal-en">{currentLevel.revealEn}</p>
              {playerName && (
                <p className="level-for-name">—— {playerName}，这是给你的 {currentLevel.emoji}</p>
              )}
              <p className="final-score">当前得分：{score}</p>
              <div className="level-clear-buttons">
                <button className="restart-btn" onClick={goNextLevel}>
                  {level + 1 < LEVELS.length ? '下一章 →' : '完成旅程 →'}
                </button>
                <button className="restart-btn secondary-btn" onClick={restartCurrentLevel}>
                  再玩一次
                </button>
              </div>
              <p className="hint">按空格键 / 回车继续</p>
            </div>
          </div>
        )}

        {/* ── All complete ── */}
        {allComplete && !showLetter && (
          <div className="overlay all-complete-overlay">
            <div className="game-over-panel all-complete-panel">
              <div className="all-complete-emojis">💖🌹💕💍</div>
              <h2>🎉 旅程完成！🎉</h2>
              {playerName && (
                <p className="all-complete-name">给 {playerName} 的惊喜之旅</p>
              )}
              <p className="all-complete-msg">四段心意，一份真情</p>
              <p className="all-complete-en">Four chapters, one love story</p>
              <p className="final-score">最终得分：{score}</p>
              {score >= highScore && score > 0 && (
                <p className="new-record">🎉 新纪录！</p>
              )}
              <div className="level-clear-buttons">
                <button className="restart-btn" onClick={() => setShowLetter(true)}>
                  打开情书 💌
                </button>
                <button className="restart-btn secondary-btn" onClick={restartGame}>
                  重新开始
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Love letter ── */}
        {showLetter && (
          <LoveLetter playerName={playerName} onClose={() => setShowLetter(false)} />
        )}

        {/* ── Game over ── */}
        {gameOver && !allComplete && (
          <div className="overlay">
            <div className="game-over-panel">
              <h2>🐍 小蛇迷路了…</h2>
              <p className="gameover-en">Don't give up on love</p>
              <p className="final-score">得分：{score}</p>
              <p className="level-info-text">
                在 {currentLevel.chapter}「{currentLevel.chapterName}」迷失
              </p>
              {score >= highScore && score > 0 && (
                <p className="new-record">🎉 新纪录！</p>
              )}
              <div className="level-clear-buttons">
                <button className="restart-btn" onClick={restartCurrentLevel}>
                  重试本章
                </button>
                <button className="restart-btn secondary-btn" onClick={restartGame}>
                  从头开始
                </button>
              </div>
              <p className="hint">按空格键重新开始</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Virtual joystick (mobile) ── */}
      <div className="joystick">
        <button className="joy-btn joy-up" onTouchStart={() => handleJoystick('up')}>↑</button>
        <div className="joy-mid">
          <button className="joy-btn joy-left" onTouchStart={() => handleJoystick('left')}>←</button>
          <div className="joy-center">🐍</div>
          <button className="joy-btn joy-right" onTouchStart={() => handleJoystick('right')}>→</button>
        </div>
        <button className="joy-btn joy-down" onTouchStart={() => handleJoystick('down')}>↓</button>
      </div>
    </div>
  )
}

export default App
