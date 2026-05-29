import type { Siniestro, SemaforoFinal } from '../types/siniestro'
import { apiUrl, readError } from './api'

export async function fetchSiniestros(): Promise<Siniestro[]> {
  const res = await fetch(apiUrl('/api/siniestros'))
  if (!res.ok) throw new Error(await readError(res))
  return (await res.json()) as Siniestro[]
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
