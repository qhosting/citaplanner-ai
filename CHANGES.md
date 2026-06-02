# CHANGES — CitaPlanner AI Technical Change Log

> Formato: `[TC-NNN]` | Estado: `planned → in_progress → implemented → tested → deployed`  
> Generado con `technical-change-tracker` skill.  
> Última actualización: 2026-06-02

---

## [TC-007] Awesome Skills Sprint — Mejora Integral con 5+3 Skills
**Estado:** `deployed`  
**Commits:** `9b6076b`, `(current)`  
**Archivos modificados:** `server.js`, `vite.config.ts`, `pages/LoginPage.tsx`, `pages/LandingPage.tsx`, `context/AuthContext.tsx`, `.gitignore`, `.env.example`, `README.md`, `CHANGES.md`

### Cambios aplicados

#### `codebase-audit-pre-push`
| # | Tipo | Descripción |
|---|---|---|
| 1 | 🔒 Security | Dev bypass `dev/dev` ahora requiere `DEV_BYPASS_ENABLED=true` en `.env` |
| 2 | 🔒 Security | Eliminados `console.log` que filtraban phone y API response en `AuthContext` |
| 3 | 🔒 Security | Eliminado `console.log` de auth debug en `server.js` (exponía phone+tenantId) |
| 4 | 🧹 Cleanup | Eliminados 3 debug logs en `LoginPage.tsx` y `LandingPage.tsx` |
| 5 | 📦 Deps | `npm audit fix`: 46 → 13 vulnerabilidades (33 resueltas) |
| 6 | 📄 Config | `.gitignore` reforzado: `scratch/`, `coverage/`, `.env.local`, `*.bak`, OS files |
| 7 | 📄 Config | `.env.example` documentado con `DEV_BYPASS_ENABLED` |

#### `performance-optimizer`
| # | Tipo | Descripción |
|---|---|---|
| 1 | ⚡ Perf | `vite.config.ts`: `manualChunks` — 6 vendor groups |
| 2 | ⚡ Perf | Chunk principal: **610KB → 129KB** (−79%) |
| 3 | ⚡ Perf | Vendors separados: `react`, `ui`, `data`, `charts`, `heavy(xlsx)`, `cloud(supabase/google)` |

#### `logic-lens`
| # | Tipo | Descripción |
|---|---|---|
| 1 | 🔒 Security | `AuthContext.tsx`: eliminado log que exponía credenciales |
| 2 | 🐛 Bug Fix | `LoginPage.tsx`: redirect con `replace:true` y guard `isLoading` |
| 3 | 🔒 Security | `server.js`: eliminado log que exponía phone/tenantId en cada login |

#### `brooks-lint`
| # | Tipo | Descripción |
|---|---|---|
| 1 | 🧹 Dead Code | `SYSTEM_VERSION` import eliminado de `LandingPage.tsx` |
| 2 | 🐛 Bug Fix | `useLocation` import agregado a `LoginPage.tsx` (DRY — ya se usaba pero no se importaba) |

#### `bug-hunter` (sesión actual)
| # | Tipo | Descripción |
|---|---|---|
| 1 | 🐛 Bug Fix | `GET /api/appointments`: sin LIMIT — DoS risk. Agregada paginación (page/limit/total) |
| 2 | 🐛 Bug Fix | `GET /api/clients`: sin LIMIT — DoS risk. Agregada paginación + búsqueda full-text |
| 3 | 🔒 Security | Errores de server ya no exponen `e.message` en producción (sanitizados) |
| 4 | ⚡ Perf | `GET /api/appointments` ahora usa `Promise.all([findMany, count])` en paralelo |
| 5 | ⚡ Perf | `GET /api/clients` ahora usa `Promise.all([findMany, count])` en paralelo |

#### `api-endpoint-builder`
| # | Tipo | Descripción |
|---|---|---|
| 1 | 🆕 Feature | Global Express error handler (4-arg) — prod sanitiza, dev expone stack |
| 2 | 🆕 Feature | `DELETE /api/services/:id`: corregido a `204 No Content` |
| 3 | 📄 Docs | JSDoc en `GET /api/appointments` y `GET /api/clients` |
| 4 | 🆕 Feature | `GET /api/appointments` soporta filtros `?from=` y `?to=` por fecha |
| 5 | 🆕 Feature | `GET /api/clients` soporta búsqueda `?search=` por nombre/phone/email |

#### `squirrel` (fase 7: Document)
| # | Tipo | Descripción |
|---|---|---|
| 1 | 📄 Docs | `README.md` completamente reescrito: stack completo, setup, env vars, estructura |
| 2 | 📄 Docs | `CHANGES.md` creado con historial estructurado (este archivo) |

#### `technical-change-tracker`
| # | Tipo | Descripción |
|---|---|---|
| 1 | 📄 Tracking | `CHANGES.md` inicializado con historial de TC-001 a TC-007 |

---

## [TC-006] Aurum Gold Design System Migration
**Estado:** `deployed`  
**Commit:** `e9c20f2`  
**Descripción:** Migración completa de colores bugambilia (`#CE4676`) a Aurum Gold (`#D4AF37`) en 28 archivos. Validado con tsc + build + 14/14 tests.

---

## [TC-005] WhatsApp Flows Interactive Setup
**Estado:** `deployed`  
**Commit:** `faa3e05`  
**Descripción:** Setup interactivo de WhatsApp Flows, simulador de smartphone en tiempo real, y SEO Open Graph dinámico vía server-side injection.

---

## [TC-004] Deposit Bypass Toggle + bcrypt Fix
**Estado:** `deployed`  
**Commit:** `f576dbd`  
**Descripción:** Toggle de exención de depósito por cliente, corrección de crash de login por bcrypt.

---

## [TC-003] PWA + Native Layout Optimizations
**Estado:** `deployed`  
**Commit:** `982e532`  
**Descripción:** Optimizaciones de layout para Desktop, PWA standalone y Mobile nativo. Eliminación de shell del simulador.

---

## [TC-002] Client Inline Login + Booking Pre-fill
**Estado:** `deployed`  
**Commit:** `531e005`  
**Descripción:** Login inline en paso 4 del portal de reservas, pre-llenado de perfil del cliente autenticado.

---

## [TC-001] Smart Scheduler + Gemini Integration
**Estado:** `deployed`  
**Descripción:** Integración inicial de Google Gemini para Smart Scheduler y predicción de no-shows.

---

## Sesión Handoff — Próxima IA

**Contexto del proyecto:** SaaS multi-tenant de gestión de citas (CitaPlanner AI) — `v3.2.0`  
**Stack:** React 19 + TypeScript + Vite (frontend) | Node.js + Express + Prisma + PostgreSQL (backend)  
**Design System:** Aurum Gold (`#D4AF37`) — glassmorphism dark mode  
**Branch activa:** `main` — último commit es TC-007  

### Estado actual
- ✅ TSC limpio (0 errores)
- ✅ Build OK (7.5s, chunks optimizados)
- ✅ 14/14 tests pasando
- ✅ 13 vulnerabilidades npm (sin fix disponible — son deps transitivas)

### Próximas mejoras sugeridas
1. `GET /api/appointments` — actualizar frontend (`ClientsPage`, `Dashboard`) para consumir nueva respuesta `{ data, pagination }` en vez de array directo
2. `GET /api/clients` — mismo ajuste en `ClientsPage.tsx`
3. Agregar CI/CD con GitHub Actions (`squirrel` fase 8: ship)
4. Extender tests: paginación, búsqueda, error handler global

### Archivos clave a revisar
- [`server.js`](./server.js) — Backend principal (3,869 líneas)
- [`App.tsx`](./App.tsx) — Routing + lazy loading
- [`context/AuthContext.tsx`](./context/AuthContext.tsx) — Auth state
- [`services/api.ts`](./services/api.ts) — Todos los calls al backend
- [`prisma/schema.prisma`](./prisma/schema.prisma) — Modelo de datos
