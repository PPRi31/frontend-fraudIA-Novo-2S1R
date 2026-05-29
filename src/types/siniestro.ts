// Tipos que reflejan fraud_ia.siniestros_scored_final
// Mantener alineado con: src/resources/create_siniestros_scored_final.sql

export type SemaforoFinal = 'Rojo' | 'Amarillo' | 'Verde'

export type ReglaCritica =
  | 'rf_01_perdida_total_robo'
  | 'rf_02_adulteracion_doc'
  | 'rf_03_lista_restrictiva'
  | 'rf_04_dinamica_imposible'
  | 'rf_05_borde_vigencia_48h'
  | 'rf_06_demora_robo_4dias'
  | 'rf_07_narrativa_clonada'
  | 'rf_08_score_reglas_alto'
  | 'rf_09_score_alto_y_ml_riesgo'
  | 'rf_10_documental_multiple'
  | 'rf_11_proveedor_recurrente_monto_atipico'
  | 'rf_12_alta_frecuencia_y_borde_vigencia'

export type AlertaScore =
  | 'score_reclamo_vigencia'
  | 'score_demora_robo'
  | 'score_freq_asegurado'
  | 'score_freq_vehiculo'
  | 'score_freq_conductor'
  | 'score_rc_only'
  | 'score_proveedor'
  | 'score_docs_incompletos'
  | 'score_docs_inconsistentes'
  | 'score_dinamica_sospechosa'
  | 'score_sin_tercero'
  | 'score_reporte_tardio'
  | 'score_monto_suma_asegurada'
  | 'score_narrativas_similares'

export interface Siniestro {
  id_siniestro: number
  id_poliza: number | null
  id_asegurado: number | null
  id_proveedor: number | null
  id_vehiculo: number | null

  ramo: string | null
  cobertura: string | null
  fecha_ocurrencia: string | null
  fecha_reporte: string | null

  monto_reclamado: number | null
  monto_estimado: number | null
  monto_pagado: number | null
  suma_asegurada: number | null

  estado: string | null
  sucursal: string | null
  ciudad_poliza: string | null
  ciudad_asegurado: string | null
  ciudad_proveedor: string | null
  descripcion: string | null

  documentos_completos: boolean | null
  docs_faltantes: boolean | null
  docs_inconsistentes: boolean | null

  freq_asegurado_18m: number
  freq_vehiculo_18m: number
  freq_conductor_18m: number

  max_similitud_textual: number | null
  ids_siniestros_similares_top5: number[]

  score_total_reglas: number
  semaforo_score: SemaforoFinal | null
  probabilidad_ml: number | null
  prediccion_ml: 0 | 1 | null
  score_final: number | null
  semaforo_score_final: SemaforoFinal | null
  semaforo_reglas_criticas: SemaforoFinal | null
  semaforo_final: SemaforoFinal | null

  reglas_criticas_activadas: ReglaCritica[]
  alertas_score_activadas: AlertaScore[]
  explicabilidad: string | null
}

export const REGLA_LABELS: Record<ReglaCritica, string> = {
  rf_01_perdida_total_robo: 'Pérdida total por robo',
  rf_02_adulteracion_doc: 'Adulteración documental',
  rf_03_lista_restrictiva: 'Lista restrictiva',
  rf_04_dinamica_imposible: 'Dinámica imposible',
  rf_05_borde_vigencia_48h: 'Borde de vigencia 48h',
  rf_06_demora_robo_4dias: 'Demora reporte robo 4d',
  rf_07_narrativa_clonada: 'Narrativa clonada',
  rf_08_score_reglas_alto: 'Score reglas alto',
  rf_09_score_alto_y_ml_riesgo: 'Score alto + ML riesgo',
  rf_10_documental_multiple: 'Documental múltiple',
  rf_11_proveedor_recurrente_monto_atipico: 'Proveedor recurrente atípico',
  rf_12_alta_frecuencia_y_borde_vigencia: 'Alta frecuencia + borde vigencia',
}

export const ALERTA_LABELS: Record<AlertaScore, string> = {
  score_reclamo_vigencia: 'Reclamo cerca de vigencia',
  score_demora_robo: 'Demora en reporte de robo',
  score_freq_asegurado: 'Alta frecuencia del asegurado',
  score_freq_vehiculo: 'Alta frecuencia del vehículo',
  score_freq_conductor: 'Alta frecuencia del conductor',
  score_rc_only: 'Cobertura solo RC',
  score_proveedor: 'Proveedor recurrente',
  score_docs_incompletos: 'Documentos incompletos',
  score_docs_inconsistentes: 'Documentos inconsistentes',
  score_dinamica_sospechosa: 'Dinámica sospechosa',
  score_sin_tercero: 'Sin tercero involucrado',
  score_reporte_tardio: 'Reporte tardío',
  score_monto_suma_asegurada: 'Monto cerca de suma asegurada',
  score_narrativas_similares: 'Narrativas similares a otras',
}
