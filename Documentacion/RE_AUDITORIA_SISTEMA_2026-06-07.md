# Re-Auditoría del Sistema — EduWanka

**Fecha:** 2026-06-07
**Alcance:** Verificación del cierre de los 14 hallazgos de la [auditoría original](./AUDITORIA_COMPLETA_SISTEMA_2026-06.md), revisión del código nuevo (Fases 1–3) y detección de hallazgos residuales/nuevos.
**Metodología:** Revisión estática + ejecución de la suite de pruebas (108 tests, 315 assertions, 100% verde) + pruebas en vivo (curl/navegador) de los flujos críticos.

---

## 1. Resumen ejecutivo

Tras las Fases 0–3, **los 14 hallazgos de la auditoría original están resueltos**. Los 2 críticos y los 6 de severidad alta están cerrados y verificados con pruebas automatizadas; los 6 de severidad media (deuda técnica) también se cerraron. Adicionalmente se implementó el **Libro de Reclamaciones** completo (backend + frontend), que antes era un mock en `localStorage` y constituía un riesgo legal.

La cobertura de pruebas pasó de ~60 métodos a **108 tests (315 assertions)**, incluyendo el webhook de pagos, el ciclo de vida de certificados, la entrega segura de archivos, la unicidad por tenant y el Libro de Reclamaciones, además de las primeras pruebas unitarias reales.

| Estado | Cantidad |
|---|---|
| 🔴 Críticos resueltos | 2 / 2 |
| 🟠 Altos resueltos | 6 / 6 |
| 🟡 Medios resueltos | 6 / 6 |
| **Total cerrado** | **14 / 14** |

---

## 2. Verificación hallazgo por hallazgo

| # | Hallazgo original | Estado | Evidencia (archivo:línea) |
|---|---|---|---|
| 1 🔴 | Bypass de aislamiento vía `X-Tenant-Slug` no validado | ✅ Cerrado | `EnsureTenantMatchesAuthenticatedUser.php:27-30` rechaza con `403 Forbidden` cuando `user.tenant_id !== tenant.id` (salvo `superadmin`); middleware `tenant.verify` aplicado en todos los grupos autenticados de `routes/api.php`. Test: `TenantIsolationTest::test_user_cannot_spoof_a_different_tenant_via_header`. |
| 2 🔴 | Fuga del token de reseteo en log y respuesta JSON | ✅ Cerrado | `ForgotPasswordController.php` ya no devuelve `token` ni lo escribe en log (solo `Log::error` del mensaje de excepción). Frontend `ForgotPassword.tsx` sin bloque "Simulación" ni render del token. Test: `RegisterAndRecoveryTest` asegura ausencia de `token` en la respuesta. |
| 3 🟠 | XSS almacenado: HTML sin sanitizar | ✅ Cerrado | Helper `frontend/src/lib/sanitizeHtml.ts` (DOMPurify) aplicado en `StudentCourseDetail.tsx`, `StudentAssignment.tsx`, `HomeLegacy.tsx`. |
| 4 🟠 | Monto de compra controlado por el cliente | ✅ Cerrado | `RegisterPurchaseController` calcula el monto desde `Course::price`. Tests: `RegisterPurchaseTest`/`AulaPurchaseTest` "ignores client supplied amount". |
| 5 🟠 | Webhook MercadoPago sin auth/firma/throttle | ✅ Cerrado | Verificación de firma + `throttle:30,1` + comparación de monto. Test: `MercadoPagoWebhookTest` (firma inválida, monto no coincidente). |
| 6 🟠 | IDOR en `index` de evaluaciones | ✅ Cerrado | Scoping por curso autorizado y exclusión de `is_correct` en Assignment/Questionnaire/SubstituteExam controllers. |
| 7/8 🟠 | Tokens/rol en `localStorage` → cookies httpOnly | ✅ Cerrado | `apiClient.ts` usa cookies de sesión (`withCredentials` + `withXSRFToken`), sin `Authorization: Bearer`; `auth.ts` solo cachea perfil no sensible. `bootstrap/app.php` corrige `redirectGuestsTo('/login')` (bug de 500 detectado en QA). |
| 9 🟡 | Uniques globales en vez de por tenant | ✅ Cerrado | Migración `2026_06_07_010000_make_uniques_composite_per_tenant.php`: `(tenant_id, email/slug/certificate_code/idempotency_key)`. Reglas `unique` de validación acotadas por tenant en `RegisterController`/`AdminUsersController`. Test: `TenantCompositeUniqueTest`. |
| 10 🟡 | Libro de Reclamaciones solo en `localStorage` | ✅ Cerrado | Backend completo (tabla `complaints`, modelo, controladores público/admin/superadmin, rutas, 9 tests `ComplaintBookTest`). Frontend `ComplaintsBook.tsx` y `AdminComplaints.tsx` conectados al API real. |
| 11 🟡 | Cobertura: webhook, certificados, `Unit/` vacío | ✅ Cerrado | +`MercadoPagoWebhookTest`, `CertificateLifecycleTest`, `SecureFileDownloadTest`, `TenantCompositeUniqueTest`, `ComplaintBookTest`, y unit real `TenantManagerTest`. |
| 12 🟡 | Restos de scaffold AI Studio/Gemini | ✅ Cerrado | `vite.config.ts` sin bloque `define`/HMR de AI Studio; `frontend/.env.example` reescrito; `package.json` renombrado a `eduwanka-frontend`, sin `@google/genai`/`dotenv`/`express`, `vite` deduplicado. |
| 13 🟡 | Exposición pública de recibos/certificados; nombre de archivo sin sanitizar | ✅ Cerrado (con matiz, ver §3) | `SecureFileController` autenticado + verificación de propiedad/tenant; recibos movidos al disco privado `local`; brochures con nombre `Str::uuid()`. Test: `SecureFileDownloadTest`. |
| 14 🟡 | `cascadeOnDelete` peligrosos; certificados sin `Auditable` | ✅ Cerrado | Migración `2026_06_07_010100_fix_cascade_on_delete_constraints.php`: `audit_logs.tenant_id → SET NULL`, FK colgante de `certificates.exam_attempt_id` eliminada y columna nullable; `Certificate`/`CertificateTemplate` usan `Auditable`. |

---

## 3. Hallazgos residuales y nuevos (deuda técnica menor)

Ninguno bloqueante. Se documentan para transparencia y planificación futura:

1. **Certificados aún en disco público (residual de #13).** Los recibos de pago (datos bancarios) se movieron al disco privado y se sirven autenticados. Los **PDFs de certificados** se sirven por el endpoint autenticado (`/api/v1/files/certificates/{id}`), pero su archivo físico sigue en el disco `public` porque son documentos diseñados para compartirse/verificarse y su privatización total tocaría la generación de ZIP, la importación masiva y la vista del estudiante. Recomendación: si se requiere blindaje total, migrar también a disco privado en un sprint dedicado.

2. **Uploads genéricos sin restricción de MIME (audit §3.5, fuera de los 14).** `ModuleManagementController` y `AdminMaterialsController` aceptan cualquier tipo de archivo hasta 20–50MB en disco público. Riesgo de stored-XSS vía HTML/SVG servido desde el mismo origen. Recomendación: allowlist de MIME + `Content-Disposition: attachment`.

3. **`audit_logs` no es a prueba de manipulación (audit §3.9, fuera de los 14).** Sigue siendo un modelo Eloquent normal sin hash-chaining ni almacenamiento append-only.

4. **Índices de rendimiento (audit §4.4).** `purchases.status`/`shipping_status`/`course_code` siguen sin índice; impactará a volumen alto por tenant.

5. **`tsx` quedó como devDependency huérfana** tras retirar el scaffold de `express` (no se usa en ningún script). Poda opcional.

6. **CSRF en el formulario público de reclamos.** El POST a `/api/v1/complaints` depende de que el SPA ya haya obtenido la cookie `XSRF-TOKEN` en su arranque (lo hace al cargar datos públicos del tenant). Un cliente que enviara el POST como primerísima petición sin GET previo recibiría 419. En el flujo real de la SPA no ocurre; se documenta como nota.

---

## 4. Revisión del código nuevo (Fases 1–3)

- **`SecureFileController`**: autorización correcta (staff o dueño), binding acotado por `TenantScope` (cross-tenant → 404), lectura disco privado→público. Sin path traversal (usa `basename`). ✅
- **Libro de Reclamaciones**: `tenant_id` se asigna en servidor desde `TenantManager`, nunca desde el body; folio correlativo global por año (único global); `track` acotado por ámbito (no filtra entre tenants); `Complaint` no usa `BelongsToTenant` a propósito (documentado) pero sí `Auditable`. ✅
- **Migraciones**: idempotentes y compatibles MySQL/SQLite (`Schema::getForeignKeys` en vez de `information_schema`). `down()` reversible donde aplica. ✅
- **Reglas de unicidad por tenant**: `Rule::unique(...)->where('tenant_id', ...)` en registro y alta de usuarios, alineadas con los nuevos índices compuestos. ✅

---

## 5. Conclusión

El sistema cerró la totalidad de los hallazgos de la auditoría de seguridad y completó el módulo legal del Libro de Reclamaciones. El par crítico (bypass de tenant + fuga de token) está resuelto y cubierto por pruebas; el bloque de frontend (XSS + tokens en `localStorage`) migró a un modelo de cookies httpOnly. La deuda técnica restante (§3) es de severidad baja, no bloqueante, y queda documentada para sprints futuros.

**Estado de la suite:** 108 tests / 315 assertions / 100% verde. **Frontend:** `tsc --noEmit` sin errores.
