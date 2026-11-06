// Regras de cálculo da antropometria (Teste / Reteste / Desempate) — fonte única
export const TOLERANCIA = 1 // cm (ou kg): diferença máxima Teste×Reteste antes de exigir desempate

export function calcFinal(t1, t2, t3) {
  const n1 = parseFloat(t1), n2 = parseFloat(t2), n3 = parseFloat(t3)
  if (isNaN(n1) || isNaN(n2)) return null
  if (Math.abs(n1 - n2) <= TOLERANCIA) return +((n1 + n2) / 2).toFixed(1)
  if (isNaN(n3)) return null
  return [n1, n2, n3].sort((a, b) => a - b)[1] // mediana das 3
}

export function precisaDesempate(t1, t2) {
  const n1 = parseFloat(t1), n2 = parseFloat(t2)
  if (isNaN(n1) || isNaN(n2)) return false
  return Math.abs(n1 - n2) > TOLERANCIA
}
