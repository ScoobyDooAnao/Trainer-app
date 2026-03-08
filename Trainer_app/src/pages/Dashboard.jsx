import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const GOALS = ['Ganho de Massa', 'Emagrecimento', 'Condicionamento', 'Força e Performance']
const LEVELS = ['Iniciante', 'Intermediário', 'Avançado']

const goalColor = { 'Ganho de Massa': '#00C9FF', 'Emagrecimento': '#34D399', 'Condicionamento': '#FBBF24', 'Força e Performance': '#A78BFA' }

const s = {
  wrap: { minHeight: '100vh', background: '#080B12', padding: '24px 20px' },
  header: { maxWidth: 1000, margin: '0 auto 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 },
  logo: { display: 'flex', alignItems: 'center', gap: 12 },
  logoIcon: { width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#34D399,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 },
  title: { fontSize: 22, fontWeight: 800, color: '#fff' },
  sub: { fontSize: 12, color: '#475569' },
  addBtn: { background: 'linear-gradient(135deg,#34D399,#059669)', border: 'none', borderRadius: 10, padding: '10px 18px', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' },
  logoutBtn: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 16px', color: '#64748B', fontWeight: 600, fontSize: 13, cursor: 'pointer' },
  grid: { maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
  card: { background: '#0D1117', borderRadius: 16, padding: 20, border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer', transition: 'border-color 0.2s' },
  empty: { maxWidth: 1000, margin: '80px auto', textAlign: 'center', color: '#334155' },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 },
  modalCard: { background: '#0D1117', borderRadius: 20, padding: 32, width: '100%', maxWidth: 460, border: '1px solid rgba(255,255,255,0.1)', maxHeight: '90vh', overflowY: 'auto' },
  label: { fontSize: 11, color: '#64748B', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6, display: 'block', marginTop: 14 },
  input: { width: '100%', background: '#161B27', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px', color: '#E2E8F0', fontSize: 14, outline: 'none' },
  select: { width: '100%', background: '#161B27', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px', color: '#E2E8F0', fontSize: 14, outline: 'none' },
  saveBtn: { width: '100%', background: 'linear-gradient(135deg,#34D399,#059669)', border: 'none', borderRadius: 10, padding: '13px', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginTop: 20 },
  cancelBtn: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '13px', color: '#64748B', fontWeight: 600, fontSize: 14, cursor: 'pointer', marginTop: 8 },
}

const emptyForm = { name: '', age: '', weight: '', height: '', goal: 'Ganho de Massa', level: 'Iniciante', notes: '' }

export default function Dashboard({ navigate, session }) {
  const [students, setStudents] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchStudents() }, [])

  const fetchStudents = async () => {
    const { data } = await supabase.from('students').select('*').eq('teacher_id', session.user.id).order('created_at', { ascending: false })
    if (data) setStudents(data)
  }

  const save = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    await supabase.from('students').insert([{ ...form, age: +form.age, weight: +form.weight, height: +form.height, teacher_id: session.user.id }])
    await fetchStudents()
    setShowModal(false)
    setForm(emptyForm)
    setSaving(false)
  }

  const logout = async () => { await supabase.auth.signOut(); window.location.reload() }

  const imc = (w, h) => h > 0 ? (w / ((h / 100) ** 2)).toFixed(1) : '—'

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={s.logo}>
          <div style={s.logoIcon}>💪</div>
          <div>
            <div style={s.title}>Trainer App</div>
            <div style={s.sub}>{students.length} aluno{students.length !== 1 ? 's' : ''} cadastrado{students.length !== 1 ? 's' : ''}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={s.addBtn} onClick={() => setShowModal(true)}>+ Novo Aluno</button>
          <button style={s.logoutBtn} onClick={logout}>Sair</button>
        </div>
      </div>

      {students.length === 0 ? (
        <div style={s.empty}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏋️</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Nenhum aluno cadastrado</div>
          <div style={{ fontSize: 14, color: '#334155' }}>Clique em "+ Novo Aluno" para começar</div>
        </div>
      ) : (
        <div style={s.grid}>
          {students.map(st => (
            <div key={st.id} style={{ ...s.card, borderColor: showModal ? 'rgba(255,255,255,0.07)' : undefined }}
              onMouseEnter={e => e.currentTarget.style.borderColor = (goalColor[st.goal] || '#34D399') + '60'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
              onClick={() => navigate('student-detail', { id: st.id })}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${goalColor[st.goal] || '#34D399'}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  {st.goal === 'Emagrecimento' ? '🔥' : st.goal === 'Força e Performance' ? '⚡' : st.goal === 'Condicionamento' ? '🏃' : '💪'}
                </div>
                <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, fontWeight: 700, background: `${goalColor[st.goal] || '#34D399'}15`, color: goalColor[st.goal] || '#34D399', border: `1px solid ${goalColor[st.goal] || '#34D399'}35` }}>
                  {st.level}
                </span>
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{st.name}</div>
              <div style={{ fontSize: 12, color: '#475569', marginBottom: 14 }}>{st.goal}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {[['Idade', st.age ? `${st.age}a` : '—'], ['Peso', st.weight ? `${st.weight}kg` : '—'], ['IMC', st.weight && st.height ? imc(st.weight, st.height) : '—']].map(([l, v]) => (
                  <div key={l} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 9, color: '#334155', textTransform: 'uppercase', letterSpacing: 1 }}>{l}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#E2E8F0' }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={s.modal} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={s.modalCard}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Novo Aluno</div>
            <div style={{ fontSize: 13, color: '#475569', marginBottom: 20 }}>Preencha os dados do aluno</div>
            {[['Nome completo', 'name', 'text', 'Ex: João Silva'], ['Idade', 'age', 'number', 'Ex: 25'], ['Peso (kg)', 'weight', 'number', 'Ex: 80'], ['Altura (cm)', 'height', 'number', 'Ex: 175']].map(([label, field, type, ph]) => (
              <div key={field}>
                <label style={s.label}>{label}</label>
                <input style={s.input} type={type} placeholder={ph} value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} />
              </div>
            ))}
            <label style={s.label}>Objetivo</label>
            <select style={s.select} value={form.goal} onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}>
              {GOALS.map(g => <option key={g}>{g}</option>)}
            </select>
            <label style={s.label}>Nível</label>
            <select style={s.select} value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))}>
              {LEVELS.map(l => <option key={l}>{l}</option>)}
            </select>
            <label style={s.label}>Observações</label>
            <textarea style={{ ...s.input, minHeight: 70, resize: 'vertical' }} placeholder="Lesões, restrições, observações..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            <button style={s.saveBtn} onClick={save} disabled={saving}>{saving ? 'Salvando...' : 'Cadastrar Aluno'}</button>
            <button style={s.cancelBtn} onClick={() => setShowModal(false)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  )
}