export const today = () => new Date().toISOString().split('T')[0]
export const DAY_COLORS = ['#00C9FF', '#FF6B6B', '#A78BFA', '#FBBF24', '#34D399', '#F97316']

// Tokens de estilo compartilhados pelos componentes de Metas e Cárdio (StudentView)
export const CARD = {
  background:'rgba(13,17,23,0.92)', backdropFilter:'blur(14px)',
  WebkitBackdropFilter:'blur(14px)',
  border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:18, marginBottom:12,
}
export const INP = {
  background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)',
  borderRadius:10, padding:'11px 14px', color:'#E2E8F0', fontSize:14,
  outline:'none', width:'100%', boxSizing:'border-box',
}
export const LBL = {
  fontSize:10, color:'#64748B', fontWeight:800, letterSpacing:1.2,
  textTransform:'uppercase', marginBottom:5, display:'block', marginTop:14,
}
