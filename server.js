const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const port = parseInt(process.env.PORT || '3000', 10)
const hostname = process.env.HOSTNAME || 'localhost'

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// In-memory session store shared with Next.js API routes via global
if (!global._sessions) {
  global._sessions = new Map()
}
const sessions = global._sessions

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  const io = new Server(httpServer, {
    path: '/api/socket',
    cors: {
      origin: [
        'https://iblearning.space',
        'https://teacher.iblearning.space',
        'http://localhost:3000'
      ],
      methods: ['GET', 'POST']
    }
  })

  // Expose io globally so Next.js API routes can emit events
  global._io = io

  io.on('connection', (socket) => {
    // ─── Teacher events ───────────────────────────────────────────
    socket.on('teacher:join', ({ sessionId }) => {
      socket.join(`session:${sessionId}:teacher`)
      socket.join(`session:${sessionId}`)
      const session = sessions.get(sessionId)
      if (session) socket.emit('session:state', sanitizeSession(session))
    })

    socket.on('teacher:advance_phase', ({ sessionId }) => {
      const session = sessions.get(sessionId)
      if (!session) return
      const phases = ['engage', 'explore', 'explain', 'elaborate', 'evaluate']
      const idx = phases.indexOf(session.phase)
      if (idx < phases.length - 1) {
        session.phase = phases[idx + 1]
        io.to(`session:${sessionId}`).emit('phase:changed', { phase: session.phase })
      }
    })

    socket.on('teacher:push_hint', ({ sessionId, studentSocketId, hint }) => {
      const session = sessions.get(sessionId)
      if (!session) return
      const student = session.students.find(s => s.socketId === studentSocketId)
      if (student) student.hints.push(hint)
      io.to(studentSocketId).emit('hint:push', { hint })
    })

    socket.on('teacher:pause', ({ sessionId }) => {
      const session = sessions.get(sessionId)
      if (!session) return
      session.status = 'paused'
      io.to(`session:${sessionId}`).emit('session:paused')
    })

    socket.on('teacher:resume', ({ sessionId }) => {
      const session = sessions.get(sessionId)
      if (!session) return
      session.status = 'active'
      io.to(`session:${sessionId}`).emit('session:resumed')
    })

    // ─── Student events ───────────────────────────────────────────
    socket.on('student:join', ({ pin, name }) => {
      const session = findActiveSessionByPin(pin)
      if (!session) {
        socket.emit('error', { message: 'Session not found. Check your PIN.' })
        return
      }

      const student = {
        socketId: socket.id,
        name,
        phase: session.phase,
        submissions: [],
        lastActivity: new Date().toISOString(),
        flags: [],
        hints: [],
        isActive: true,
        _stuckTimer: null
      }
      session.students.push(student)

      socket.join(`session:${session.id}`)
      socket.data.sessionId = session.id

      socket.emit('session:joined', {
        session: sanitizeSession(session),
        student: sanitizeStudent(student)
      })

      io.to(`session:${session.id}:teacher`).emit('student:connected', {
        student: sanitizeStudent(student),
        sessionId: session.id
      })

      resetStuckTimer(student, session, io, port)
    })

    socket.on('student:submit', ({ taskId, type, content }) => {
      const { sessionId } = socket.data
      if (!sessionId) return
      const session = sessions.get(sessionId)
      if (!session) return
      const student = session.students.find(s => s.socketId === socket.id)
      if (!student) return

      const submission = { taskId, type, content, submittedAt: new Date().toISOString() }
      student.submissions.push(submission)
      student.lastActivity = new Date().toISOString()

      clearStuckTimer(student)

      io.to(`session:${sessionId}:teacher`).emit('pulse:update', {
        student: sanitizeStudent(student),
        sessionId
      })

      // Fire-and-forget AI evaluation
      evaluateAsync(session, student, submission, io, port)
    })

    socket.on('student:activity', () => {
      const { sessionId } = socket.data
      if (!sessionId) return
      const session = sessions.get(sessionId)
      if (!session) return
      const student = session.students.find(s => s.socketId === socket.id)
      if (!student) return
      student.lastActivity = new Date().toISOString()
      resetStuckTimer(student, session, io, port)
    })

    socket.on('disconnect', () => {
      const { sessionId } = socket.data
      if (!sessionId) return
      const session = sessions.get(sessionId)
      if (!session) return
      const student = session.students.find(s => s.socketId === socket.id)
      if (student) {
        clearStuckTimer(student)
        student.isActive = false
      }
      io.to(`session:${sessionId}:teacher`).emit('student:disconnected', { socketId: socket.id })
    })
  })

  httpServer.listen(port, () => {
    console.log(`> Inquire.ai ready on http://localhost:${port}`)
    console.log(`> Student:  http://localhost:${port}/student`)
    console.log(`> Teacher:  http://localhost:${port}/teacher`)
  })
})

function findActiveSessionByPin(pin) {
  for (const session of sessions.values()) {
    if (session.pin === pin && (session.status === 'active' || session.status === 'waiting')) {
      return session
    }
  }
  return null
}

function sanitizeStudent(student) {
  const { _stuckTimer, ...rest } = student
  return rest
}

function sanitizeSession(session) {
  return {
    ...session,
    students: session.students.map(sanitizeStudent)
  }
}

function clearStuckTimer(student) {
  if (student._stuckTimer) {
    clearTimeout(student._stuckTimer)
    student._stuckTimer = null
  }
}

function resetStuckTimer(student, session, io, port) {
  clearStuckTimer(student)
  student._stuckTimer = setTimeout(async () => {
    try {
      const phase = session.lesson.phases.find(p => p.name === session.phase)
      if (!phase) return

      const res = await fetch(`http://localhost:${port}/api/agent/scaffold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission: { content: '', type: 'text', taskId: phase.studentTask.id, submittedAt: new Date().toISOString() },
          rubric: session.lesson.rubric,
          studentName: student.name,
          reason: 'stuck'
        })
      })

      if (!res.ok) return
      const { hint } = await res.json()
      student.hints.push(hint)
      io.to(student.socketId).emit('hint:push', { hint })

      const flag = {
        type: 'needs_attention',
        message: `${student.name} has been inactive for 3 minutes`,
        severity: 'medium',
        timestamp: new Date().toISOString()
      }
      student.flags.push(flag)
      io.to(`session:${session.id}:teacher`).emit('student:flagged', {
        student: sanitizeStudent(student),
        flag,
        sessionId: session.id
      })
    } catch (err) {
      console.error('Stuck timer error:', err)
    }
  }, 3 * 60 * 1000) // 3 minutes
}

async function evaluateAsync(session, student, submission, io, port) {
  try {
    const evalRes = await fetch(`http://localhost:${port}/api/agent/pulse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session: sanitizeSession(session),
        studentSocketId: student.socketId,
        submission
      })
    })

    if (!evalRes.ok) return
    const { evaluation, flag } = await evalRes.json()

    submission.aiEvaluation = evaluation

    if (flag) {
      student.flags.push(flag)
      io.to(`session:${session.id}:teacher`).emit('student:flagged', {
        student: sanitizeStudent(student),
        flag,
        sessionId: session.id
      })
    }

    io.to(`session:${session.id}:teacher`).emit('pulse:update', {
      student: sanitizeStudent(student),
      sessionId: session.id
    })

    // Auto-scaffold if struggling
    if (evaluation.understanding === 'struggling') {
      const scaffoldRes = await fetch(`http://localhost:${port}/api/agent/scaffold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission,
          rubric: session.lesson.rubric,
          studentName: student.name,
          reason: 'struggling'
        })
      })

      if (scaffoldRes.ok) {
        const { hint } = await scaffoldRes.json()
        student.hints.push(hint)
        io.to(student.socketId).emit('hint:push', { hint })
      }
    }
  } catch (err) {
    console.error('Evaluation error:', err)
  }
}
