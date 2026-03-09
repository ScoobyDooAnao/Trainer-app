import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const EMOJIS = [
  '💪','🏋️','🔥','⚡','🎯','🏆','🦁','🐺','🦅','🐉',
  '🌟','💥','🚀','🏃','🤸','🥊','🧠','🫀','🌊','🏔️',
  '🎖️','⚔️','🛡️','🧬','💎','🌀','🔱','🦾','🫁','🏅',
]

const s = {
  wrap:      { minHeight: '100vh', background: '#080B12', padding: '24px 20px', fontFamily: "'Segoe UI', system-ui, sans-serif", color: '#E2E8F0' },
  inner:     { maxWidth: 640, margin: '0 auto' },
  back:      { background: 'none', border: 'none', color: '#475569', fontSize: 14, cursor: 'pointer', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6 },
  section:   { background: '#0D1117', borderRadius: 16, border: '1px solid rgba(255,255,255,0.07)', marginBottom: 16, overflow: 'hidden' },
  secHead:   (color) => ({ background: `${color}10`, borderBottom: `1px solid ${color}25`, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10 }),
  secTitle:  (color) => ({ fontWeight: 700, fontSize: 14, color }),
  secBody:   { padding: '20px' },
  label:     { fontSize: 11, color: '#64748B', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6, display: 'block', marginTop: 14 },
  input:     { width: '100%', background: '#161B27', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px', color: '#E2E8F0', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  saveBtn:   (c='#34D399') => ({ background: `linear-gradient(135deg,${c},${c}cc)`, border: 'none', borderRadius: 10, padding: '12px 24px', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }),
  tag:       (active, color) => ({
    fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 700, cursor: 'pointer',
    background: active ? `${color}25` : 'rgba(255,255,255,0.04)',
    color: active ? color : '#475569',
    border: `1px solid ${active ? color + '50' : 'rgba(255,255,255,0.08)'}`,
  }),
}

export default function TeacherProfile({ navigate, session }) {
  const uid = session.user.id

  const [profile, setProfile]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(null) // 'public' | 'private' | null
  const [saved, setSaved]       = useState(null)
  const [toast, setToast]       = useState(null)

  // Campos públicos
  const [displayName, setDisplayName] = useState('')
  const [emoji, setEmoji]             = useState('💪')
  const [cref, setCref]               = useState('')
  const [whatsapp, setWhatsapp]       = useState('')

  // Campos privados
  const [fullName, setFullName] = useState('')
  const [age, setAge]           = useState('')

  useEffect(() => { fetchProfile() }, [])

  const fetchProfile = async () => {
    const { data } = await supabase.from('teacher_profiles').select('*').eq('id', uid).single()
    if (data) {
      setProfile(data)
      setDisplayName(data.display_name || '')
      setEmoji(data.emoji || '💪')
      setCref(data.cref || '')
      setWhatsapp(data.whatsapp || '')
      setFullName(data.full_name || '')
      setAge(data.age || '')
    }
    setLoading(false)
  }

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const savePublic = async () => {
    setSaving('public')
    const payload = { id: uid, display_name: displayName, emoji, cref, whatsapp, updated_at: new Date().toISOString() }
    const { error } = profile
      ? await supabase.from('teacher_profiles').update(payload).eq('id', uid)
      : await supabase.from('teacher_profiles').insert(payload)
    setSaving(null)
    if (!error) { setProfile(p => ({ ...p, ...payload })); showToast('✅ Dados públicos salvos!') }
  }

  const savePrivate = async () => {
    setSaving('private')
    const payload = { id: uid, full_name: fullName, age: age ? +age : null, updated_at: new Date().toISOString() }
    const { error } = profile
      ? await supabase.from('teacher_profiles').update(payload).eq('id', uid)
      : await supabase.from('teacher_profiles').insert(payload)
    setSaving(null)
    if (!error) { setProfile(p => ({ ...p, ...payload })); showToast('✅ Dados privados salvos!') }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#080B12', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34D399' }}>
      Carregando perfil...
    </div>
  )

  return (
    <div style={s.wrap}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', background: '#34D399', color: '#052e16', borderRadius: 50, padding: '10px 22px', fontWeight: 800, fontSize: 13, zIndex: 999, whiteSpace: 'nowrap', boxShadow: '0 4px 20px rgba(52,211,153,0.4)' }}>
          {toast}
        </div>
      )}

      <div style={s.inner}>
        <button style={s.back} onClick={() => navigate('dashboard')}>← Voltar ao Dashboard</button>

        {/* Header do perfil */}
        <div style={{ background: 'linear-gradient(135deg,#0f2027,#203a43)', borderRadius: 20, padding: 24, marginBottom: 20, border: '1px solid rgba(52,211,153,0.12)', display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(52,211,153,0.1)', border: '2px solid rgba(52,211,153,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38 }}>
            {emoji}
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#34D399', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 }}>Perfil do Professor</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>
              {displayName || fullName || session.user.email}
            </div>
            <div style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>
              {cref && <span style={{ marginRight: 12 }}>📋 CREF {cref}</span>}
              {whatsapp && <span>📱 {whatsapp}</span>}
            </div>
          </div>
        </div>

        {/* ── SEÇÃO PÚBLICA ── */}
        <div style={s.section}>
          <div style={s.secHead('#34D399')}>
            <span style={{ fontSize: 16 }}>👁️</span>
            <div>
              <div style={s.secTitle('#34D399')}>Visível para os alunos</div>
              <div style={{ fontSize: 11, color: '#475569' }}>Estas informações aparecem na página de cada aluno</div>
            </div>
          </div>
          <div style={s.secBody}>

            {/* Emoji picker */}
            <label style={s.label}>Emoji que representa você</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setEmoji(e)} style={{
                  fontSize: 22, width: 44, height: 44, borderRadius: 10, cursor: 'pointer',
                  background: emoji === e ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `2px solid ${emoji === e ? '#34D399' : 'rgba(255,255,255,0.07)'}`,
                  transition: 'all 0.15s',
                }}>
                  {e}
                </button>
              ))}
            </div>

            <label style={s.label}>Nome de exibição <span style={{ color: '#334155', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(como aparece para os alunos)</span></label>
            <input style={s.input} placeholder="Ex: Prof. Carlos" value={displayName} onChange={e => setDisplayName(e.target.value)} />

            <label style={s.label}>CREF</label>
            <input style={s.input} placeholder="Ex: 012345-G/SP" value={cref} onChange={e => setCref(e.target.value)} />

            <label style={s.label}>WhatsApp para contato</label>
            <input style={s.input} placeholder="Ex: (11) 99999-9999" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />

            <div style={{ marginTop: 20 }}>
              <button style={s.saveBtn('#34D399')} onClick={savePublic} disabled={saving === 'public'}>
                {saving === 'public' ? 'Salvando...' : '💾 Salvar dados públicos'}
              </button>
            </div>
          </div>
        </div>

        {/* ── SEÇÃO PRIVADA ── */}
        <div style={s.section}>
          <div style={s.secHead('#A78BFA')}>
            <span style={{ fontSize: 16 }}>🔒</span>
            <div>
              <div style={s.secTitle('#A78BFA')}>Informações privadas</div>
              <div style={{ fontSize: 11, color: '#475569' }}>Somente você vê estes dados</div>
            </div>
          </div>
          <div style={s.secBody}>
            <label style={s.label}>Nome completo</label>
            <input style={s.input} placeholder="Seu nome completo" value={fullName} onChange={e => setFullName(e.target.value)} />

            <label style={s.label}>Idade</label>
            <input style={s.input} type="number" placeholder="Ex: 30" value={age} onChange={e => setAge(e.target.value)} />

            <div style={{ marginTop: 6, padding: '10px 14px', background: 'rgba(167,139,250,0.06)', borderRadius: 10, border: '1px solid rgba(167,139,250,0.15)' }}>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>📧 E-mail da conta: <strong style={{ color: '#CBD5E1' }}>{session.user.email}</strong></div>
            </div>

            <div style={{ marginTop: 20 }}>
              <button style={s.saveBtn('#A78BFA')} onClick={savePrivate} disabled={saving === 'private'}>
                {saving === 'private' ? 'Salvando...' : '💾 Salvar dados privados'}
              </button>
            </div>
          </div>
        </div>

        {/* ── TREINO DO PROFESSOR (em breve) ── */}
        <div style={{ ...s.section, opacity: 0.5 }}>
          <div style={s.secHead('#FBBF24')}>
            <span style={{ fontSize: 16 }}>🏋️</span>
            <div>
              <div style={s.secTitle('#FBBF24')}>Meu Treino Pessoal</div>
              <div style={{ fontSize: 11, color: '#475569' }}>Planeje e monitore seu próprio treino — em breve</div>
            </div>
          </div>
          <div style={{ padding: '30px 20px', textAlign: 'center', color: '#334155', fontSize: 13 }}>
            🚧 Funcionalidade em desenvolvimento
          </div>
        </div>

      </div>
    </div>
  )
}
