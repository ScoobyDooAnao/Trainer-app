import { OBJ_LABEL, imcInfo } from '../../lib/dashboardShared'

// Preparado para tipos futuros de notificação (Fase 3.3) — ainda não geradas pelo backend,
// mas o mapa já existe para o dia em que forem implementadas (Fase 5+).
export const NOTIF_TIPO_ICON = {
  nova_anamnese:     '🆕',
  treino_registrado: '🏋️',
  aniversario:       '🎂',
  ofensiva:          '🔥',
  meta:              '🎯',
}

export function NotificacoesPanel({ notifs, onClose, onMarkRead, onConfirm, onReject, navigate }) {
  const naoLidas = notifs.filter(n => !n.lida).length
  const fmtTime = (d) => {
    const diff = Date.now() - new Date(d)
    const min = Math.floor(diff/60000), h = Math.floor(min/60), days = Math.floor(h/24)
    if (min<1) return 'agora'; if (min<60) return `${min}min atrás`
    if (h<24)  return `${h}h atrás`; return `${days}d atrás`
  }
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:500, display:'flex', justifyContent:'flex-end' }}>
      <div onClick={e=>e.stopPropagation()} style={{ width:'100%', maxWidth:420, height:'100%', background:'#0D1117', borderLeft:'1px solid rgba(255,255,255,0.07)', display:'flex', flexDirection:'column', overflowY:'auto' }}>
        <div style={{ padding:'18px 20px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, background:'#0D1117', zIndex:10 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:800, color:'#E2E8F0' }}>Notificações</div>
            {naoLidas > 0 && <div style={{ fontSize:11, color:'#FBBF24', marginTop:2 }}>{naoLidas} não lida{naoLidas>1?'s':''}</div>}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {naoLidas > 0 && <button onClick={onMarkRead} style={{ fontSize:11, color:'#64748B', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'5px 10px', cursor:'pointer', fontFamily:'inherit' }}>Marcar lidas</button>}
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.05)', border:'none', borderRadius:8, padding:'5px 10px', color:'#64748B', cursor:'pointer', fontSize:15 }}>✕</button>
          </div>
        </div>
        <div style={{ flex:1 }}>
          {notifs.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px 20px', color:'#334155', fontSize:13 }}>Nenhuma notificação ainda</div>
          ) : notifs.map(n => {
            const p = n.payload || {}
            const imc = p.imc ? imcInfo(p.imc) : null
            if (n.tipo === 'nova_anamnese' && n.lida) return null
            if (n.tipo === 'nova_anamnese') return (
              <div key={n.id} style={{ padding:'14px 16px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                {/* Card azul — dados do candidato */}
                <div style={{ background:'rgba(59,130,246,0.08)', border:'1.5px solid rgba(59,130,246,0.25)', borderRadius:14, padding:'14px 16px', marginBottom:8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                    <div>
                      <div style={{ fontSize:14, fontWeight:800, color:'#E2E8F0' }}>{p.nome || 'Novo aluno'}</div>
                      <div style={{ fontSize:11, color:'#64748B', marginTop:2 }}>{fmtTime(n.data)}</div>
                    </div>
                    {!n.lida && <div style={{ width:8, height:8, borderRadius:'50%', background:'#FBBF24', flexShrink:0, marginTop:4 }}/>}
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginBottom:8 }}>
                    {[
                      { label:'Faixa etária', val: p.faixa_etaria || '—' },
                      { label:'Peso',         val: p.peso ? `${p.peso}kg` : '—' },
                      { label:'IMC',          val: p.imc  || '—', cor: imc?.cor, sub: imc?.cat },
                    ].map(stat => (
                      <div key={stat.label} style={{ background:'rgba(255,255,255,0.05)', borderRadius:9, padding:'8px 10px', textAlign:'center' }}>
                        <div style={{ fontSize:9, color:'#475569', textTransform:'uppercase', letterSpacing:0.8, marginBottom:3 }}>{stat.label}</div>
                        <div style={{ fontSize:12, fontWeight:700, color: stat.cor || '#E2E8F0' }}>{stat.val}</div>
                        {stat.sub && <div style={{ fontSize:8, color:stat.cor, marginTop:1 }}>{stat.sub}</div>}
                      </div>
                    ))}
                  </div>
                  {p.objetivo && (
                    <div style={{ padding:'5px 10px', background:'rgba(59,130,246,0.1)', borderRadius:8, fontSize:11, color:'#93C5FD', fontWeight:600 }}>
                      {OBJ_LABEL[p.objetivo] || p.objetivo}
                    </div>
                  )}
                </div>
                {/* Botões */}
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => onReject(n)}
                    style={{ width:44, height:44, borderRadius:10, border:'1.5px solid rgba(239,68,68,0.35)', background:'rgba(239,68,68,0.1)', color:'#F87171', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                  </button>
                  <button onClick={() => { navigate('student-detail', { id: p.student_id }); onClose() }}
                    style={{ flex:1, height:44, borderRadius:10, border:'1.5px solid rgba(34,197,94,0.35)', background:'rgba(34,197,94,0.1)', color:'#22C55E', cursor:'pointer', fontWeight:700, fontSize:12, display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontFamily:'inherit' }}>
                    Ver perfil e confirmar
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
                  </button>
                </div>
              </div>
            )

            return (
              <div key={n.id} style={{ padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,0.05)', background: n.lida ? 'transparent' : 'rgba(251,191,36,0.03)' }}>
                <div style={{ display:'flex', gap:10 }}>
                  <div style={{ width:7, height:7, borderRadius:'50%', background: n.lida ? '#334155' : '#FBBF24', flexShrink:0, marginTop:5 }}/>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#E2E8F0', marginBottom:3 }}>{NOTIF_TIPO_ICON[n.tipo] ? `${NOTIF_TIPO_ICON[n.tipo]} ` : ''}{n.titulo}</div>
                    {n.corpo && <div style={{ fontSize:12, color:'#64748B', lineHeight:1.6 }}>{n.corpo}</div>}
                    <div style={{ fontSize:10, color:'#334155', marginTop:5 }}>{fmtTime(n.data)}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
