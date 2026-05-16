import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'

export default function Register() {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters')
      return
    }

    setLoading(true)
    try {
      await api.register(name.trim(), password)
      setDone(true)
      setTimeout(() => navigate('/'), 2500)
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid-bg flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-mono text-2xl font-bold text-white">
            NEW<span className="text-accent">_</span>EMPLOYEE
          </h1>
          <p className="font-mono text-xs text-muted mt-2 tracking-wider">REGISTRATION PORTAL</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8">
          {done ? (
            <div className="text-center animate-fade-in">
              <div className="text-4xl mb-4">✅</div>
              <h2 className="font-mono text-lg font-bold text-white mb-2">Registered!</h2>
              <p className="font-sans text-sm text-muted">Welcome aboard, <span className="text-accent">{name}</span>.</p>
              <p className="font-mono text-xs text-muted mt-2">Redirecting to terminal...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="font-mono text-xs text-muted block mb-2 tracking-wider">FULL NAME</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-3 font-sans text-sm text-white focus:outline-none focus:border-accent transition-colors placeholder-muted/40"
                  placeholder="John Smith"
                  autoFocus
                  required
                  maxLength={50}
                />
              </div>
              <div>
                <label className="font-mono text-xs text-muted block mb-2 tracking-wider">PASSWORD</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-3 font-sans text-sm text-white focus:outline-none focus:border-accent transition-colors placeholder-muted/40"
                  placeholder="Min. 4 characters"
                  required
                />
              </div>
              <div>
                <label className="font-mono text-xs text-muted block mb-2 tracking-wider">CONFIRM PASSWORD</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-3 font-sans text-sm text-white focus:outline-none focus:border-accent transition-colors placeholder-muted/40"
                  placeholder="Repeat password"
                  required
                />
              </div>

              {error && (
                <p className="font-mono text-xs text-warn bg-warn/10 border border-warn/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !name || !password || !confirm}
                className="w-full py-3 rounded-lg font-mono text-sm font-bold bg-accent text-ink hover:bg-accent-dim transition-colors disabled:opacity-40"
              >
                {loading ? 'REGISTERING...' : 'CREATE ACCOUNT'}
              </button>

              <Link
                to="/"
                className="block text-center font-mono text-xs text-muted hover:text-white transition-colors mt-2"
              >
                ← Back to Terminal
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
