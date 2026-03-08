import { useState } from 'react'
import { supabase } from '../supabase'

const s = {
  wrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #080B12, #0f2027)' },
  card: { background: '#0D1117', borderRadius: 20, padding: '40px 36px', width: '100%', maxWidth: 400, border: '1px solid rgba(52,211,153,0.2)' },
  input: { width: '100%', background: '#161B27', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 14px', color: '#E2E8F0', fontSize: 14, marginBottom: 16, outline: 'none' },
  btn: { width: '100%', background: 'linear-gradient(135deg, #34D399, #059669)', border: 'none', borderRadius: 10, padding: '14px', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 8 },
  error: { background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '10px 14px', color: '#FCA5A5', fontSize: 13, marginBottom: 16 },
  warn: { background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 8, padding: '10px 14px', color: '#FCD34D', fontSize: 13, marginBottom: 16 },
  debug: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 14px', color: '#475569', fontSize: 11, marginBottom: 16, wordBreak: 'break-all' },
  label: { fontSize: 12, color: '#94A3B8', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6, display: 'block' },
}

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [warn, setWarn] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('login')

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  const handle = async () => {
    if (!email || !password) { setError('Preencha email e senha'); return }
    if (!supabaseUrl || !supabaseKey) { setError('Variaveis de ambiente nao encontradas.'); return }
    setLoading(true)
    setError('')
    setWarn('')
    try {
      const { data, error } = mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else if (mode === 'register' && !data?.session) {
        setWarn('Conta criada! Confirme seu email antes de entrar.')
      } else {
        onLogin()
      }
    } catch (e) {
      setError('Erro de conexao: ' + e.message)
    }
    setLoading(false)
  }

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #34D399, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 20 }}>
          💪
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Trainer App</div>
        <div style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>
          {mode === 'login' ? 'Entre na sua conta' : 'Crie sua conta'}
        </div>
        <div style={s.debug}>
          URL: {supabaseUrl ? '✅ ' + supabaseUrl.slice(0, 30) + '...' : '❌ NAO ENCONTRADA'}<br />
          KEY: {supabaseKey ? '✅ carregada' : '❌ NAO ENCONTRADA'}
        </div>
        {error && <div style={s.error}>{error}</div>}
        {warn && <div style={s.warn}>{warn}</div>}
        <label style={s.label}>Email</label>
        <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" />
        <label style={s.label}>Senha</label>
        <input style={s.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handle()} />
        <button style={s.btn} onClick={handle} disabled={loading}>
          {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar Conta'}
        </button>
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#475569' }}>
          {mode === 'login' ? 'Nao tem conta? ' : 'Ja tem conta? '}
          <span style={{ color: '#34D399', cursor: 'pointer', fontWeight: 600 }} onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setWarn('') }}>
            {mode === 'login' ? 'Cadastre-se' : 'Entrar'}
          </span>
        </div>
      </div>
    </div>
  )
}
