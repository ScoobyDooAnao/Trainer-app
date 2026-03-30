// ═══════════════════════════════════════════════════════════════════
// PATCH — WorkoutEditor.jsx
// Adiciona seção de Habilidades Motoras para crianças/adolescentes
// Arquivo novo: MotorSkillsSection.jsx (já criado separado)
// ═══════════════════════════════════════════════════════════════════
//
// PASSO 1 — Adicionar import no topo do WorkoutEditor.jsx
// (logo após o import do supabase)
// ───────────────────────────────────────────────────────────────────

import MotorSkillsSection from './MotorSkillsSection'

// ───────────────────────────────────────────────────────────────────
// PASSO 2 — Adicionar helper de idade dentro do WorkoutEditor
// (logo abaixo da linha: const ageGroup = getAgeGroup(...) )
// ───────────────────────────────────────────────────────────────────

const studentAge = student?.birth_date
  ? Math.floor((Date.now() - new Date(student.birth_date)) / (365.25 * 24 * 3600 * 1000))
  : student?.age ? parseInt(student.age) : null

// ───────────────────────────────────────────────────────────────────
// PASSO 3 — Inserir <MotorSkillsSection /> dentro do JSX
// Localizar o bloco de cada dia de treino no return().
// Encontre a tag <NoEquipmentSection ... /> e adicione logo ABAIXO dela:
// ───────────────────────────────────────────────────────────────────

{/* INSERIR APÓS <NoEquipmentSection .../> */}
<MotorSkillsSection
  dayId={day.id}
  ageGroup={ageGroup}
  studentAge={studentAge}
  onAddExercise={(ex) => addExercise(day.id, ex)}
/>

// ───────────────────────────────────────────────────────────────────
// RESULTADO FINAL (contexto completo do bloco s.addRow para conferir)
// ───────────────────────────────────────────────────────────────────

{/* Add exercise */}
<div style={s.addRow}>
  <div style={{ fontSize:10, color:'#334155', marginBottom:10, textTransform:'uppercase', letterSpacing:1, fontWeight:600 }}>Adicionar Exercício</div>

  {/* Busca com filtro por modalidade */}
  <ExerciseSearch
    onSelect={ex => setNewExForms(f => ({ ...f, [day.id]:{ name:ex.name, sets:ex.sets, reps:ex.reps, rest:ex.rest, tip:ex.tip, type:ex.type } }))}
    suggestedTypes={suggestedTypes}
    ageGroup={ageGroup}
  />

  {/* Seção rápida sem equipamento */}
  <NoEquipmentSection
    dayId={day.id}
    dayColor={color}
    onAddExercise={(ex) => addExercise(day.id, ex)}
  />

  {/* ✅ NOVO: Seção de Habilidades Motoras (só para criança/adolescente) */}
  <MotorSkillsSection
    dayId={day.id}
    ageGroup={ageGroup}
    studentAge={studentAge}
    onAddExercise={(ex) => addExercise(day.id, ex)}
  />

  {/* Formulário manual */}
  <div style={{ marginTop:10 }}>
    <div style={{ fontSize:9, color:'#334155', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>Ou adicionar manualmente</div>
    {/* ... resto do formulário manual igual ... */}
  </div>
</div>
