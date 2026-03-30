// ═══════════════════════════════════════════════════════════════════
// PATCH — StudentView.jsx
// Exibe atividades motoras separadas dos exercícios normais
// no treino do aluno (criança/adolescente).
// ═══════════════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────────────
// PASSO 1 — Adicionar imports no topo do StudentView.jsx
// ───────────────────────────────────────────────────────────────────

import {
  MotorActivityCard,
  MotorSectionDivider,
  extractMotorActivities,
  extractRegularExercises,
} from './MotorActivityCard'

// ───────────────────────────────────────────────────────────────────
// PASSO 2 — Na ABA TREINO, substituir o bloco de listagem de exercícios
//
// ANTES (dentro da ABA TREINO, no bloco "day.exercises.map"):
//
//   {day.exercises.map(ex => (
//     <ExerciseLogRow key={ex.id} ex={ex} studentId={studentId} dayColor={color} isMobile={isMobile} />
//   ))}
//
// DEPOIS:
// ───────────────────────────────────────────────────────────────────

{/* Separar exercícios regulares de atividades motoras */}
{(() => {
  const regularExs = extractRegularExercises(day.exercises)
  const motorExs   = extractMotorActivities(day.exercises)

  return (
    <>
      {/* Exercícios regulares de musculação/funcional */}
      {regularExs.map(ex => (
        <ExerciseLogRow
          key={ex.id}
          ex={ex}
          studentId={studentId}
          dayColor={color}
          isMobile={isMobile}
        />
      ))}

      {/* Separador + atividades motoras (só aparece se houver) */}
      {motorExs.length > 0 && (
        <>
          <MotorSectionDivider count={motorExs.length} dayColor={color} />
          {motorExs.map(ex => (
            <MotorActivityCard
              key={ex.id}
              ex={ex}
              studentId={studentId}
              dayColor={color}
              isMobile={isMobile}
            />
          ))}
        </>
      )}
    </>
  )
})()}

// ───────────────────────────────────────────────────────────────────
// CONTEXTO COMPLETO — onde exatamente inserir no StudentView.jsx
// Encontre este bloco (dentro de {day && ( <div ... > ... </div> )}):
//
//   {day.exercises.length === 0 ? (
//     <div ...>Nenhum exercício neste dia ainda.</div>
//   ) : (
//     day.exercises.map(ex => (          ← SUBSTITUIR ESTA LINHA
//       <ExerciseLogRow ... />
//     ))
//   )}
//
// E substituir apenas a parte do .map() pelo bloco acima.
// O check de day.exercises.length === 0 permanece igual.
// ───────────────────────────────────────────────────────────────────

// ───────────────────────────────────────────────────────────────────
// RESULTADO FINAL (bloco completo para copiar e colar no lugar certo)
// ───────────────────────────────────────────────────────────────────

{day.exercises.length === 0 ? (
  <div style={{ padding: 30, textAlign: 'center', color: '#334155', fontSize: 13 }}>
    Nenhum exercício neste dia ainda.
  </div>
) : (
  (() => {
    const regularExs = extractRegularExercises(day.exercises)
    const motorExs   = extractMotorActivities(day.exercises)
    return (
      <>
        {regularExs.map(ex => (
          <ExerciseLogRow
            key={ex.id}
            ex={ex}
            studentId={studentId}
            dayColor={color}
            isMobile={isMobile}
          />
        ))}
        {motorExs.length > 0 && (
          <>
            <MotorSectionDivider count={motorExs.length} dayColor={color} />
            {motorExs.map(ex => (
              <MotorActivityCard
                key={ex.id}
                ex={ex}
                studentId={studentId}
                dayColor={color}
                isMobile={isMobile}
              />
            ))}
          </>
        )}
      </>
    )
  })()
)}
