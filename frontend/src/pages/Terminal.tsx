import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import Camera, { CameraHandle } from '../components/Camera'
import { api } from '../lib/api'

type Step = 'idle' | 'login' | 'capture' | 'success' | 'error'
type ActionType = 'checkin' | 'checkout'

interface SuccessData {
  name: string
  type: ActionType
  timestamp: string
}

export default function Terminal() {
  const [step, setStep] = useState<Step>('idle')
  const [action, setAction] = useState<ActionType>('checkin')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<SuccessData | null>(null)
  const cameraRef = useRef<CameraHandle>(null)

  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const dateStr = now.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.login(name, password)
      localStorage.setItem('token', data.token)
      localStorage.setItem('userName', data.name)
      setStep('capture')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleCapture() {
    setError('')
    setLoading(true)
    try {
      const blob = await cameraRef.current?.capture()
      if (!blob) throw new Error('Camera capture failed')

      const data = action === 'checkin'
        ? await api.checkin(blob)
        : await api.checkout(blob)

      setSuccess({
        name: localStorage.getItem('userName') || name,
        type: action,
        timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      })
      setStep('success')
      localStorage.removeItem('token')
      localStorage.removeItem('userName')

      setTimeout(() => {
        setStep('idle')
        setName('')
        setPassword('')
        setSuccess(null)
      }, 4000)
    } catch (err: any) {
      setError(err.message || 'Action failed')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setStep('idle')
    setName('')
    setPassword('')
    setError('')
    setSuccess(null)
    localStorage.removeItem('token')
  }

  return (
    <div className="min-h-screen grid-bg flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="w-full max-w-md mb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse-slow glow" />
          <span className="font-mono text-xs text-muted tracking-widest uppercase">System Online</span>
        </div>
        <h1 className="font-mono text-3xl font-bold text-white tracking-tight glow-text">
          CHECKIN<span className="text-accent">_</span>TERMINAL
        </h1>
        <p className="font-mono text-xs text-muted mt-2">{dateStr}</p>
        <Clock />
      </div>

      {/* Main card */}
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl overflow-hidden">

          {/* IDLE — action selection */}
          {step === 'idle' && (
            <div className="p-8 animate-fade-in">
              <p className="font-mono text-sm text-muted text-center mb-6 tracking-wider uppercase">Select Action</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => { setAction('checkin'); setStep('login') }}
                  className="group relative py-5 rounded-xl border-2 border-accent bg-accent/5 hover:bg-accent/15 transition-all duration-200"
                >
                  <div className="text-2xl mb-1">🟢</div>
                  <div className="font-mono text-sm font-bold text-accent">CHECK IN</div>
                </button>
                <button
                  onClick={() => { setAction('checkout'); setStep('login') }}
                  className="group relative py-5 rounded-xl border-2 border-warn/60 bg-warn/5 hover:bg-warn/15 transition-all duration-200"
                >
                  <div className="text-2xl mb-1">🔴</div>
                  <div className="font-mono text-sm font-bold text-warn">CHECK OUT</div>
                </button>
              </div>
              <Link
                to="/register"
                className="block text-center font-mono text-xs text-muted hover:text-accent transition-colors mt-4"
              >
                New employee? Register →
              </Link>
              <Link
                to="/admin"
                className="block text-center font-mono text-xs text-muted/40 hover:text-muted transition-colors mt-2"
              >
                Admin
              </Link>
            </div>
          )}

          {/* LOGIN */}
          {step === 'login' && (
            <div className="p-8 animate-slide-up">
              <div className="flex items-center gap-3 mb-6">
                <button onClick={reset} className="text-muted hover:text-white transition-colors font-mono text-xs">← Back</button>
                <div className={`ml-auto px-3 py-1 rounded-full font-mono text-xs font-bold ${action === 'checkin' ? 'bg-accent/20 text-accent' : 'bg-warn/20 text-warn'}`}>
                  {action === 'checkin' ? 'CHECK IN' : 'CHECK OUT'}
                </div>
              </div>
              <p className="font-mono text-sm text-muted mb-6 tracking-wider">IDENTIFY YOURSELF</p>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="font-mono text-xs text-muted block mb-2 tracking-wider">NAME</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-accent transition-colors"
                    placeholder="Your name"
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label className="font-mono text-xs text-muted block mb-2 tracking-wider">PASSWORD</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-accent transition-colors"
                    placeholder="••••••••"
                    required
                  />
                </div>
                {error && (
                  <p className="font-mono text-xs text-warn bg-warn/10 border border-warn/20 rounded-lg px-3 py-2">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg font-mono text-sm font-bold bg-accent text-ink hover:bg-accent-dim transition-colors disabled:opacity-50"
                >
                  {loading ? 'VERIFYING...' : 'CONTINUE →'}
                </button>
              </form>
            </div>
          )}

          {/* CAPTURE */}
          {step === 'capture' && (
            <div className="p-6 animate-slide-up">
              <div className="flex items-center gap-3 mb-4">
                <button onClick={reset} className="text-muted hover:text-white transition-colors font-mono text-xs">← Cancel</button>
                <p className="ml-auto font-mono text-xs text-muted tracking-wider">FACE SCAN</p>
              </div>
              <Camera ref={cameraRef} active={true} />
              <p className="font-mono text-xs text-muted text-center mt-3 mb-4">
                Look directly at the camera
              </p>
              {error && (
                <p className="font-mono text-xs text-warn bg-warn/10 border border-warn/20 rounded-lg px-3 py-2 mb-3">{error}</p>
              )}
              <button
                onClick={handleCapture}
                disabled={loading}
                className={`w-full py-4 rounded-xl font-mono text-sm font-bold transition-all duration-200 disabled:opacity-50 ${
                  action === 'checkin'
                    ? 'bg-accent text-ink hover:bg-accent-dim glow'
                    : 'bg-warn text-white hover:bg-orange-500'
                }`}
              >
                {loading ? 'CAPTURING...' : action === 'checkin' ? '🟢 CONFIRM CHECK IN' : '🔴 CONFIRM CHECK OUT'}
              </button>
            </div>
          )}

          {/* SUCCESS */}
          {step === 'success' && success && (
            <div className="p-8 text-center animate-fade-in">
              <div className={`text-5xl mb-4 ${success.type === 'checkin' ? 'animate-bounce' : ''}`}>
                {success.type === 'checkin' ? '✅' : '👋'}
              </div>
              <h2 className="font-mono text-xl font-bold text-white mb-1">
                {success.type === 'checkin' ? 'Welcome!' : 'Goodbye!'}
              </h2>
              <p className="font-sans text-lg text-accent font-medium mb-1">{success.name}</p>
              <p className="font-mono text-sm text-muted">
                {success.type === 'checkin' ? 'Checked in' : 'Checked out'} at {success.timestamp}
              </p>
              <div className="mt-6 w-full bg-surface rounded-full h-1">
                <div className="h-1 bg-accent rounded-full animate-[width_4s_linear]" style={{ animation: 'shrink 4s linear' }} />
              </div>
              <p className="font-mono text-xs text-muted mt-2">Returning to terminal...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Clock() {
  const [time, setTime] = useState(new Date())
  useState(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  })
  return (
    <p className="font-mono text-2xl text-accent/80 mt-1 tabular-nums">
      {time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </p>
  )
}
