import type { Siniestro } from '../types/siniestro'
import { apiUrl, readError } from './api'

export const REQUIRED_UPLOAD_FILES = [
  { field: 'asegurados', filename: 'asegurados.csv', label: 'Asegurados' },
  {
    field: 'beneficiarios_proveedores',
    filename: 'beneficiarios_proveedores.csv',
    label: 'Beneficiarios / proveedores',
  },
  { field: 'documentos', filename: 'documentos.csv', label: 'Documentos' },
  { field: 'polizas', filename: 'polizas.csv', label: 'Pólizas' },
  { field: 'siniestros', filename: 'siniestros.csv', label: 'Siniestros' },
  { field: 'vehiculos', filename: 'vehiculos.csv', label: 'Vehículos' },
] as const

export type RequiredUploadField = (typeof REQUIRED_UPLOAD_FILES)[number]['field']
export type UploadFilesMap = Record<RequiredUploadField, File>

export interface FraudUploadSummary {
  total: number
  semaforo_final: Record<string, number>
  score_final_promedio: number | null
  monto_reclamado_total: number
}

export interface UploadResult {
  ok: true
  processed_rows: number
  persisted: boolean
  inserted_rows: number | null
  summary: FraudUploadSummary
  records: Siniestro[]
}

export async function uploadFraudCsvSet(
  files: UploadFilesMap,
  persist = true,
): Promise<UploadResult> {
  const form = new FormData()
  for (const requirement of REQUIRED_UPLOAD_FILES) {
    form.append(requirement.field, files[requirement.field], files[requirement.field].name)
  }

  const endpoint = persist ? '/api/v1/fraud/ingest' : '/api/v1/fraud/score'
  const res = await fetch(apiUrl(endpoint), {
    method: 'POST',
    body: form,
  })

  if (!res.ok) throw new Error(await readError(res))
  return (await res.json()) as UploadResult
}
