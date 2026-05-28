import type { Siniestro, SemaforoFinal } from '../types/siniestro'
import mockData from '../data/dashboard.json'

// Cuando el backend esté listo, reemplazar el cuerpo por:
//   const res = await fetch('/api/siniestros')
//   if (!res.ok) throw new Error(`HTTP ${res.status}`)
//   return (await res.json()) as Siniestro[]
export async function fetchSiniestros(): Promise<Siniestro[]> {
  await new Promise((resolve) => setTimeout(resolve, 350))
  return mockData as Siniestro[]
}

export type SiniestrosBySemaforo = Record<SemaforoFinal, Siniestro[]>

export function groupBySemaforo(items: Siniestro[]): SiniestrosBySemaforo {
  const groups: SiniestrosBySemaforo = { Rojo: [], Amarillo: [], Verde: [] }
  for (const item of items) {
    const key = item.semaforo_final ?? 'Verde'
    groups[key].push(item)
  }
  for (const key of Object.keys(groups) as SemaforoFinal[]) {
    groups[key].sort((a, b) => (b.score_final ?? 0) - (a.score_final ?? 0))
  }
  return groups
}
