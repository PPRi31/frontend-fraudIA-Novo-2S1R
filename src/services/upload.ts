export interface UploadResult {
  ok: true
  fileName: string
  size: number
}

// Cuando el backend esté listo, reemplazar el cuerpo por:
//
//   const form = new FormData()
//   form.append('file', file)
//   const res = await fetch('/api/upload/csv', {
//     method: 'POST',
//     body: form,
//   })
//   if (!res.ok) throw new Error(`HTTP ${res.status}`)
//   return (await res.json()) as UploadResult
//
// Notas:
// - No setear `Content-Type` manualmente: el browser pone el boundary correcto.
// - Si el endpoint requiere auth, agregar `headers: { Authorization: ... }`.
// - Para mostrar progreso real usar `XMLHttpRequest` con `upload.onprogress`
//   (fetch aún no expone progreso de subida en navegadores).
export async function uploadCsv(file: File): Promise<UploadResult> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  return { ok: true, fileName: file.name, size: file.size }
}
