import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { getSport, S } from '../lib/escolinhaShared'
import { ModalNovaTurma, TurmaDetail } from '../components/escolinha/professor/TurmasUI'
import { BancoAtividades } from '../components/escolinha/professor/BancoAtividades'


export default function TabEscolinha({ session, students }) {
  const [turmas, setTurmas]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [showModal, setShowModal]     = useState(false)
  const [selectedTurma, setSelectedTurma] = useState(null)
  const [navEsc, setNavEsc]           = useState('turmas') // 'turmas' | 'banco'

  const teacherId = session?.user?.id

  const fetchTurmas = async () => {
    try {
      const { data, error } = await supabase.from('turmas').select('*')
        .eq('teacher_id', teacherId).order('created_at')
      if (error) {
        console.error('Escolinha: tabela turmas indisponivel -', error.message)
        console.error('Execute o SQL escolinha_migration.sql no Supabase.')
      }
      setTurmas(data || [])
    } catch (err) {
      console.error('Escolinha fetchTurmas error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (teacherId) fetchTurmas() }, [teacherId])

  // Agrupar turmas por esporte
  const porEsporte = {}
  turmas.forEach(t => {
    const key = t.esporte
    if (!porEsporte[key]) porEsporte[key] = []
    porEsporte[key].push(t)
  })

  if (loading) return (
    <div style={{ padding: '60px 20px', textAlign: 'center', color: '#0C4A6E', opacity: 0.5 }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
      Carregando turmas...
    </div>
  )

  // Tabela não existe — SQL não foi executado
  if (!Array.isArray(turmas)) return (
    <div style={{ padding: '60px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#0C4A6E', marginBottom: 8 }}>Configuração necessária</div>
      <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>
        Execute o arquivo <strong>escolinha_migration.sql</strong><br/>
        no Supabase SQL Editor para ativar a Escolinha.
      </div>
    </div>
  )

  if (selectedTurma) return (
    <TurmaDetail
      turma={selectedTurma}
      students={students}
      teacherId={teacherId}
      onBack={() => setSelectedTurma(null)}
      onRefresh={fetchTurmas}
    />
  )

  return (
    <div>
      {/* Header + Nav tabs */}
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0C4A6E', marginBottom: 12 }}>Escolinha</h1>
        <div style={{ display:'flex', gap:8 }}>
          {[
            { id:'turmas', label:'Turmas', count: turmas.length },
            { id:'banco',  label:'Banco de Atividades', count: null },
          ].map(t => (
            <button key={t.id} onClick={() => setNavEsc(t.id)}
              style={{ padding:'9px 20px', borderRadius:10, border:'none', cursor:'pointer', fontWeight:700, fontSize:13, transition:'all 0.15s',
                background: navEsc === t.id ? 'linear-gradient(135deg,#0C4A6E,#155E8E)' : 'rgba(255,255,255,0.65)',
                color: navEsc === t.id ? '#fff' : '#0C4A6E',
                boxShadow: navEsc === t.id ? '0 4px 14px rgba(12,74,110,0.3)' : 'none' }}>
              {t.label}{t.count !== null ? ` (${t.count})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* ── ABA BANCO DE ATIVIDADES ── */}
      {navEsc === 'banco' && <BancoAtividades teacherId={teacherId} />}

      {/* ── ABA TURMAS ── */}
      {navEsc === 'turmas' && <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={() => setShowModal(true)} style={S.btn()}>+ Nova Turma</button>
      </div>

      {/* Lista agrupada por esporte */}
      {turmas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#0C4A6E', opacity: 0.5 }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>🏟️</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Nenhuma turma criada</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Clique em "+ Nova Turma" para começar</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {Object.entries(porEsporte).map(([esporte, turmasDoEsporte]) => {
            const sport = getSport(esporte)
            return (
              <div key={esporte}>
                {/* Cabeçalho do esporte */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 20 }}>{sport?.icon || '🏅'}</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#0C4A6E' }}>{sport?.label || esporte}</span>
                  <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 4 }}>{turmasDoEsporte.length} turma{turmasDoEsporte.length !== 1 ? 's' : ''}</span>
                </div>

                {/* Cards de turma */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
                  {turmasDoEsporte.map(turma => {
                    const diasLabel = (turma.dias_semana || []).join(' · ')
                    return (
                      <div key={turma.id} onClick={() => setSelectedTurma(turma)}
                        style={{ ...S.card, cursor: 'pointer', transition: 'all 0.18s', position: 'relative', overflow: 'hidden' }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 28px rgba(12,74,110,0.15)'}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#0C4A6E,#34D399)' }} />
                        <div style={{ paddingTop: 4 }}>
                          <div style={{ fontSize: 15, fontWeight: 800, color: '#0C4A6E', marginBottom: 4 }}>{turma.nome}</div>
                          {turma.posicao && <div style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>{turma.posicao}</div>}
                          {diasLabel && <div style={{ fontSize: 11, color: '#64748B', marginBottom: 6 }}>{diasLabel}</div>}
                          {turma.objetivo_final && (
                            <div style={{ fontSize: 10, color: '#0C4A6E', fontWeight: 600, background: 'rgba(12,74,110,0.07)', borderRadius: 6, padding: '3px 8px', display: 'inline-block', marginBottom: 6 }}>
                              {turma.objetivo_final}
                            </div>
                          )}
                          <div style={{ fontSize: 11, color: '#94A3B8' }}>
                            {turma.data_inicio && new Date(turma.data_inicio + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                            {turma.data_fim && ` → ${new Date(turma.data_fim + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}`}
                          </div>
                          <div style={{ marginTop: 8, fontSize: 12, color: '#0C4A6E', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                            Ver turma →
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      </> }

      {showModal && (
        <ModalNovaTurma teacherId={teacherId} students={students} onSave={fetchTurmas} onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}
