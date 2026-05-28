# agentes.md — Contexto del proyecto Fraudia (frontend)

Este archivo es la guía operativa para agentes de IA (y nuevos desarrolladores)
que trabajen sobre este repositorio. Léelo completo antes de proponer cambios.

---

## 1. Qué es Fraudia

Fraudia es el **panel de control frontend** de un sistema de detección de
posible fraude en siniestros de seguros. El backend procesa siniestros con un
motor de reglas + un modelo ML, y persiste el resultado en la tabla
`fraud_ia.siniestros_scored_final` (ver `src/resources/create_siniestros_scored_final.sql`).

La salida de ese pipeline **no es una acusación automática**: es una alerta
para revisión humana. El frontend tiene que reflejar esa filosofía: presentar
información útil para el analista, sin lenguaje punitivo.

Cada registro de la tabla tiene, entre otros:

- IDs (`id_siniestro`, `id_poliza`, `id_asegurado`, `id_proveedor`, `id_vehiculo`).
- Datos del reclamo (`ramo`, `cobertura`, fechas, montos, ciudades, descripción).
- Flags documentales (`docs_faltantes`, `docs_inconsistentes`).
- Frecuencias en 18 meses (asegurado, vehículo, conductor).
- Similitud textual + IDs similares (`ids_siniestros_similares_top5`).
- 14 sub-scores por regla y un `score_total_reglas`.
- 12 reglas críticas booleanas `rf_01..rf_12`.
- Salidas finales: `score_final` (0–100), `probabilidad_ml` (0–1),
  `prediccion_ml` (0|1) y los semáforos `semaforo_score`, `semaforo_score_final`,
  `semaforo_reglas_criticas`, `semaforo_final` (`Verde`/`Amarillo`/`Rojo`).
- `reglas_criticas_activadas` y `alertas_score_activadas` (JSONB arrays).
- `explicabilidad`: texto humano que justifica la clasificación.

El frontend agrupa siniestros por `semaforo_final` en un tablero kanban.

---

## 2. Stack y herramientas

- **Vue 3** (`<script setup lang="ts">`, Composition API).
- **TypeScript** estricto (`vue-tsc`, `noUnusedLocals`, `noUnusedParameters`,
  `erasableSyntaxOnly`).
- **Vite 8** + plugin oficial `@vitejs/plugin-vue`.
- **Tailwind CSS v4** vía `@tailwindcss/vite` (no hay `tailwind.config.js`,
  el theme se define en `src/style.css` con `@theme`).
- Sin Vue Router ni Pinia: navegación por estado local en `App.vue` (3 vistas).
- Sin librerías de iconos: SVG inline en `src/components/icons/`.

### Comandos

```bash
npm install
npm run dev        # arranca Vite en desarrollo
npm run build      # vue-tsc -b && vite build (typecheck + build)
npm run preview    # preview del build
```

---

## 3. Arquitectura del frontend

### Layout

`App.vue` mantiene `current: ViewKey` (`'dashboard' | 'upload' | 'chat'`) y un
`sidebarOpen` para el drawer móvil. El `<main>` hace `transition` `view`
(fade + translate) entre vistas. La sidebar es `sticky` en desktop (`lg`+) y
drawer absoluto con backdrop blur en mobile.

### Vistas

- **`DashboardView.vue`** — Llama `fetchSiniestros()` en `onMounted`, mantiene
  `loading | error | siniestros`. Calcula `groups` con `groupBySemaforo` y los
  KPIs (`totalReclamado`, `promedioScore`, conteo de Rojo). Renderiza 3
  columnas (Rojo/Amarillo/Verde) con header, conteo, skeletons al cargar y
  `<SiniestroCard>` por item ordenado por `score_final` desc.
- **`SiniestroCard.vue`** — Recibe `Siniestro` y muestra: id, ramo, cobertura,
  sucursal, badge de `score_final`, `monto_reclamado` (formato COP),
  `probabilidad_ml` (%), `explicabilidad` truncada a 2 líneas, footer con
  fecha, conteo de reglas críticas y badges de docs/frecuencia.
- **`UploadView.vue`** — Drag & drop estilizado para `.csv`, validación por
  extensión/MIME y delegación de la subida a `uploadCsv()`. Estado
  `isUploading` que cambia el copy del dropzone a "Subiendo archivo…" y lo
  bloquea durante la operación. Mantiene el `alert('Archivo subido
  correctamente')` y la tarjeta de confirmación.
- **`ChatView.vue`** — Chat con mensajes tipados como `ChatMessage` (de
  `src/services/chat.ts`), scroll automático con `nextTick`, indicador de
  typing animado y envío vía `sendChatMessage()`. Bloquea el botón de envío
  mientras `isTyping`. Errores del servicio se muestran como mensaje del bot.

### Capa de datos

- **`src/types/siniestro.ts`** — Refleja 1:1 la SQL: `Siniestro`,
  `SemaforoFinal`, `ReglaCritica`, `AlertaScore`, `REGLA_LABELS`. **Si la SQL
  cambia, este archivo debe actualizarse primero.**
- **`src/services/siniestros.ts`** — `fetchSiniestros(): Promise<Siniestro[]>`
  hoy lee `data/dashboard.json` con `setTimeout(350)`. La llamada real a
  `fetch('/api/siniestros')` está comentada dentro de la función.
  `groupBySemaforo()` ordena por `score_final` desc.
- **`src/services/upload.ts`** — `uploadCsv(file): Promise<UploadResult>`
  simula un POST con `setTimeout(500)` y retorna `{ ok, fileName, size }`. La
  llamada real (`POST /api/upload/csv` con `FormData`) está comentada dentro
  de la función.
- **`src/services/chat.ts`** — `sendChatMessage(message): Promise<ChatResponse>`
  simula la respuesta con `setTimeout(800)` y devuelve un `reply` fijo. La
  llamada real (`POST /api/chat` con JSON) está comentada dentro de la
  función. Exporta también `ChatMessage` y `ChatRole` que usa la vista.
- **`src/data/dashboard.json`** — Array de `Siniestro` con datos sintéticos que
  cumplen las constraints de la tabla.

> **Patrón:** toda llamada al backend vive en `src/services/*.ts`. Las vistas
> nunca hacen `fetch` directo. Para activar un endpoint real, descomentar el
> bloque marcado en cada servicio y borrar el `setTimeout` simulado. Ver
> `src/endpoints.txt` para el contrato detallado de cada uno.

---

## 4. Convenciones de UI

- **Dark mode permanente** (`color-scheme: dark` en `<html>`).
- Paleta en `--color-bg`, `--color-surface`, `--color-surface-2`,
  `--color-surface-3`, `--color-border`, `--color-border-strong`,
  `--color-text`, `--color-text-dim`, `--color-text-muted`, `--color-accent`
  (violeta `#8b5cf6`) y triada semáforo (`--color-red-soft`, `--color-yellow-soft`,
  `--color-green-soft` + sus `*-bg`).
- Tarjetas con bordes redondeados (`rounded-xl` / `rounded-2xl`), borde sutil,
  hover con `-translate-y-px` + sombra negra suave.
- Tipografía: Inter / system stack, números con `tabular-nums`.
- Animaciones cortas (200–300 ms), `fade-up` para entrada de listas con
  `animationDelay` escalonado.
- Layout responsive: `grid-cols-1` en mobile, `md:grid-cols-3` en desktop para
  el kanban.

---

## 5. Reglas para agentes

### Hacer

- Mantener tipos sincronizados con `create_siniestros_scored_final.sql`.
- Reutilizar tokens CSS (`var(--color-...)`) en lugar de colores hardcodeados.
- Formatear montos con `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' })`.
- Usar `tabular-nums` en cualquier número alineado en columnas.
- Validar siempre con `npm run build` antes de cerrar una tarea.
- Respetar la idea de "alerta para revisión humana": nada de copy acusatorio.
- Idioma de la UI: **español** (es-CO).

### No hacer

- No introducir Vue Router / Pinia para flujos triviales; un `ref` basta.
- No agregar `tailwind.config.js`; v4 usa `@theme` en CSS.
- No mezclar light/dark; el sistema es dark only.
- No comentar código con narraciones obvias.
- No crear README extra ni archivos de documentación a menos que se pidan
  explícitamente.

---

## 6. Cómo conectar el backend real

Hay **tres** endpoints, todos aislados en `src/services/*.ts`. La llamada
`fetch()` está comentada dentro de cada función; activarla es el único cambio
necesario.

### 6.1 Siniestros — `src/services/siniestros.ts`

```ts
export async function fetchSiniestros(): Promise<Siniestro[]> {
  const res = await fetch('/api/siniestros')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as Siniestro[]
}
```

### 6.2 Subida CSV — `src/services/upload.ts`

```ts
export async function uploadCsv(file: File): Promise<UploadResult> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch('/api/upload/csv', { method: 'POST', body: form })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as UploadResult
}
```

> No setear `Content-Type` manualmente: el navegador agrega el `boundary`.

### 6.3 Chat — `src/services/chat.ts`

```ts
export async function sendChatMessage(message: string): Promise<ChatResponse> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as ChatResponse
}
```

> Si el endpoint hace streaming (SSE), reescribir consumiendo `ReadableStream`
> y actualizando el último mensaje del bot token a token; la firma de la
> función puede cambiar a `AsyncIterable<string>`.

### 6.4 Configuración compartida

- Las rutas son relativas (`/api/...`) asumiendo mismo origen o proxy de Vite.
  Si el backend vive en otro dominio, exponer `VITE_API_URL` en `.env` y
  prefijar cada ruta con `import.meta.env.VITE_API_URL`.
- Para auth, agregar `headers: { Authorization: ... }` (idealmente en un
  `httpClient` compartido si se vuelve repetitivo).
- Detalle por endpoint (método, body, respuesta esperada, notas) en
  **`src/endpoints.txt`**.

---

## 7. Archivos clave de referencia

- `src/resources.txt` — prompt replicable que describe el sistema completo.
- `src/endpoints.txt` — contrato y guía de los 3 endpoints del backend.
- `src/structure.txt` — árbol vivo de `src/`.
- `src/resources/create_siniestros_scored_final.sql` — fuente de verdad del modelo de datos.
- `src/resources/plantilla.png` — referencia visual del kanban.
