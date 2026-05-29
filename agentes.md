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
- **DOMPurify** para sanitizar el HTML del bot del chat (`src/utils/sanitize.ts`).
- Sin Vue Router ni Pinia. La navegación entre las 3 vistas internas se hace
  con un `ref` en `App.vue`. Para la página de detalle existe un router manual
  (window.location + `popstate`) que matchea `/<id>` y monta
  `SiniestroDetailView`.
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

`App.vue` cumple dos funciones:

1. **Router manual.** Lee `window.location.pathname`. Si hace match con
   `^/(\d+)/?$` monta `SiniestroDetailView` con ese `id` como prop. Cualquier
   otra ruta (incluyendo `/`) renderiza el layout principal con sidebar.
   Hay un listener de `popstate` para soportar back/forward del navegador.
2. **Layout principal.** Mantiene `current: ViewKey`
   (`'dashboard' | 'upload' | 'chat'`) y `sidebarOpen` para el drawer móvil. El
   `<main>` hace `transition` `view` (fade + translate) entre vistas. La
   sidebar es `sticky` en desktop (`lg`+) y drawer con backdrop blur en mobile.

> Si en el futuro se agregan más rutas (por ejemplo `/poliza/<id>`,
> `/asegurado/<id>`), el router manual sigue funcionando: solo añadir más
> ramas a `parseRoute()` en `App.vue`. Si llegan a ser muchas, ahí sí
> considerar Vue Router.

### Vistas

- **`DashboardView.vue`** — Llama `fetchSiniestros()` en `onMounted`, mantiene
  `loading | error | siniestros`. Calcula `groups` con `groupBySemaforo` y los
  KPIs (`totalReclamado`, `promedioScore`, conteo de Rojo). Renderiza 3
  columnas (Rojo/Amarillo/Verde) con header, conteo, skeletons al cargar y
  `<SiniestroCard>` por item ordenado por `score_final` desc.
- **`SiniestroCard.vue`** — Recibe `Siniestro` y muestra: id, ramo, cobertura,
  sucursal, badge de `score_final`, `monto_reclamado` (formato COP),
  `probabilidad_ml` (%), `explicabilidad` truncada a 2 líneas, footer con
  fecha, conteo de reglas críticas y badges de docs/frecuencia. **Es un
  `<a target="_blank">`** que apunta a `/<id_siniestro>`, así click,
  middle-click y Cmd-click abren el detalle en una pestaña nueva.
- **`SiniestroDetailView.vue`** — Página `/<id>`. Llama
  `fetchSiniestroById(id)` en `onMounted` y al cambiar `id`. Muestra todo el
  registro en secciones: Identificación, Fechas, Montos, Ubicación,
  Documentación, Frecuencias 18m, Análisis de riesgo (semáforos, prob/score
  ML, similitud, IDs similares clickables), Reglas críticas activadas
  (`REGLA_LABELS`), Alertas de score (`ALERTA_LABELS`), Descripción y
  Explicabilidad. Tiene botón "Volver" (history.back con fallback a `/`).
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
  `SemaforoFinal`, `ReglaCritica`, `AlertaScore`, `REGLA_LABELS`,
  `ALERTA_LABELS`. **Si la SQL cambia, este archivo debe actualizarse primero.**
- **`src/services/api.ts`** — Helpers compartidos: `apiUrl(path)` (resuelve
  con `VITE_API_URL` o ruta relativa) y `readError(res)` para extraer mensaje
  legible de la respuesta de error.
- **`src/services/siniestros.ts`** —
  - `fetchSiniestros(): Promise<Siniestro[]>` → `GET /api/siniestros`.
  - `fetchSiniestroById(id): Promise<Siniestro>` → llama `fetchSiniestros()`
    y filtra por `id_siniestro`. Cuando el backend exponga
    `GET /api/siniestros/:id`, sustituir por una sola petición directa.
  - `groupBySemaforo()` ordena por `score_final` desc.
- **`src/services/upload.ts`** — `uploadCsv(file): Promise<UploadResult>` →
  `POST /api/upload/csv` con `FormData`.
- **`src/services/chat.ts`** — `sendChatMessage(message, sessionId)` →
  `POST /api/chat` con JSON. Exporta también `ChatMessage`, `ChatRole`,
  `ChatResponse`.
- **`src/utils/sanitize.ts`** — `sanitizeHtml()` con DOMPurify, whitelist de
  tags y atributos seguros, hook que fuerza `target="_blank"` +
  `rel="noopener noreferrer"` en `<a>`.
- **`src/data/dashboard.json`** — Array de `Siniestro` con datos sintéticos
  para fixtures locales.

> **Patrón:** toda llamada al backend vive en `src/services/*.ts`. Las vistas
> nunca hacen `fetch` directo. Si la API cambia el shape, mapear el resultado
> dentro del servicio, no en la vista.

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

- No introducir Vue Router / Pinia mientras el router manual cubra los casos.
- No agregar `tailwind.config.js`; v4 usa `@theme` en CSS.
- No mezclar light/dark; el sistema es dark only.
- No comentar código con narraciones obvias.
- No crear README extra ni archivos de documentación a menos que se pidan
  explícitamente.
- No usar `v-html` con texto sin pasar por `sanitizeHtml()`.

---

## 6. Endpoints del backend

Todos los endpoints viven aislados en `src/services/*.ts`. Las vistas nunca
llaman `fetch` directo. Las rutas se resuelven con `apiUrl(path)` que respeta
`VITE_API_URL` (si está) o usa rutas relativas.

| Vista                    | Servicio                  | Función                  | Endpoint              | Método |
| ------------------------ | ------------------------- | ------------------------ | --------------------- | ------ |
| Dashboard                | `services/siniestros.ts`  | `fetchSiniestros()`      | `/api/siniestros`     | GET    |
| Detalle (`/<id>`)        | `services/siniestros.ts`  | `fetchSiniestroById(id)` | `/api/siniestros` *   | GET    |
| Subir archivos           | `services/upload.ts`      | `uploadCsv(file)`        | `/api/upload/csv`     | POST   |
| Chat                     | `services/chat.ts`        | `sendChatMessage(msg)`   | `/api/chat`           | POST   |

\* Hoy el detalle reusa `GET /api/siniestros` y filtra en cliente. Cuando el
backend exponga `GET /api/siniestros/:id`, simplificar `fetchSiniestroById` a
una sola petición.

### 6.1 Detalle por id

`fetchSiniestroById(id)` llama directamente a `fetchSiniestros()` y busca el
registro con `id_siniestro === id`. Esto evita duplicar contratos con el
backend mientras solo exista la lista. Cuando se agregue el endpoint
individual, reemplazar el cuerpo por:

```ts
const res = await fetch(apiUrl(`/api/siniestros/${id}`))
if (!res.ok) throw new Error(await readError(res))
return (await res.json()) as Siniestro
```

### 6.2 Notas

- **Subida CSV** — no setear `Content-Type` manualmente: el navegador agrega
  el `boundary` correcto.
- **Chat** — si el backend hace streaming (SSE), reescribir consumiendo
  `ReadableStream` y actualizando el último mensaje del bot token a token; la
  firma puede cambiar a `AsyncIterable<string>`. La respuesta puede traer HTML
  envuelto en fences Markdown (` ```html ... ``` `); `ChatView` los limpia
  antes de sanitizar.
- **Configuración compartida** — `VITE_API_URL` en `.env` + auth en un
  `httpClient` compartido si crece la cantidad de endpoints.

---

## 7. Routing manual

`App.vue` implementa un mini-router sin dependencias:

```ts
function parseRoute(pathname: string): Route {
  const match = pathname.match(/^\/(\d+)\/?$/)
  if (match) return { name: 'detail', id: Number(match[1]) }
  return { name: 'home' }
}
```

Convenciones:

- Las rutas dinámicas se abren con `<a target="_blank">` (no `window.open`)
  para conservar el comportamiento estándar de los navegadores: middle-click
  abre en pestaña, Cmd-click en pestaña en background, click derecho funciona,
  Enter sobre el link funciona.
- Los IDs en URLs son numéricos para que `parseRoute` los detecte. Si se
  introducen IDs no numéricos, hay que cambiar el regex.
- El servidor que sirva la app en producción debe hacer fallback a
  `index.html` para cualquier ruta no estática (Vite ya lo hace en dev).

---

## 8. Archivos clave de referencia

- `src/resources.txt` — prompt replicable que describe el sistema completo.
- `src/structure.txt` — árbol vivo de `src/`.
- `src/resources/create_siniestros_scored_final.sql` — fuente de verdad del modelo de datos.
- `src/resources/plantilla.png` — referencia visual del kanban.
