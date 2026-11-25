# DISCÍPULOS · Informe de etapas

Este informe resume el trabajo realizado por etapas, los archivos principales involucrados y lo que queda por hacer.

## Etapa 1 — Base, identidad visual y estructura

**Objetivo:** crear la aplicación estática, responsive y con la identidad visual definida.

**Implementado:**
- Estructura del proyecto (`index.html`, `css/styles.css`, `js/*.js`, `assets/img/*`, `supabase/schema.sql`).
- Identidad visual cálida y minimalista: verde profundo, fondos claros, acentos dorados, tarjetas suaves, tipografía Inter en títulos y cuerpo.
- Pantalla de acceso con logo, frase *Crecer en Cristo. Acompañar a otros*, login y registro.
- Shell de la aplicación con encabezado, navegación por rol, vista principal, toasts y diálogo.
- Enlace **Saltar al contenido** que enfoca `#view` o `#auth-screen` sin cambiar el hash.

**Archivos:** `index.html`, `css/styles.css`, `assets/img/*`.

**Verificación:** responsive revisado en 390 px y 320 px sin desborde horizontal; skip link verificado.

## Etapa 2 — Integración de datos y modo demostración

**Objetivo:** permitir usar la aplicación sin credenciales reales y preparar el camino a Supabase.

**Implementado:**
- `js/config.js` con URL y `anon key` de ejemplo; detección automática de modo demo/real.
- `js/demo.js`: backend local con `localStorage`, hash SHA-256 para contraseñas, tres cuentas, cuatro estudios, asignaciones, respuestas y observaciones.
- `js/store.js`: única puerta de entrada a los datos; la interfaz no sabe si usa Supabase o demo.
- `js/supabase.js`: cliente real, Auth, consultas y operaciones equivalentes al backend demo.
- Etiqueta visible **DEMO** y aviso de modo demostración.

**Archivos:** `js/config.js`, `js/store.js`, `js/demo.js`, `js/supabase.js`.

**Verificación:** flujo completo de demostración probado en navegador; reinicio de datos documentado.

## Etapa 3 — Autenticación, roles y enrutamiento

**Objetivo:** separar estrictamente las funciones de discipulador y discípulo.

**Implementado:**
- Login y registro con selección de rol.
- Manejo de confirmación por email en modo real.
- Accesos rápidos de demostración.
- Router basado en hash con guardas: cada rol tiene su menú y sus rutas; las rutas del otro rol redirigen al inicio.
- Perfil de usuario con nombre visible editable.
- Cierre de sesión y restauración de sesión al recargar.

**Archivos:** `js/auth.js`, `js/app.js`, `js/ui.js`.

**Verificación:** registro de discípulo, login por rol, redirección de rutas y persistencia de sesión probados.

## Etapa 4 — Funcionalidades del discipulador

**Objetivo:** acompañar a discípulos, asignar estudios y registrar observaciones privadas.

**Implementado:**
- Lista de discípulos vinculados con progreso.
- Alta de discípulo por invitación: link personal por email (ver Etapa 7).
- Ficha del discípulo con asignaciones, estado, respuestas y observaciones.
- Asignación de un estudio a varios discípulos.
- Observaciones privadas del discipulador.
- Vista de respuestas por asignación.

**Archivos:** `js/discipulos.js`, `js/estudios.js`, `js/ui.js`.

**Verificación:** alta correcta y de error, asignación, observaciones y visualización de respuestas probadas.

## Etapa 7 — Invitaciones de discípulos por link

**Objetivo:** permitir que el discipulador sume discípulos sin que la cuenta exista antes, compartiendo un link personal por WhatsApp.

**Implementado:**
- Botón **Invitar discípulo** en **Mis discípulos**, con nombre y email.
- Token aleatorio de 24 bytes, vencimiento a 14 días y estados `pendiente`, `aceptada`, `revocada` y `expirada`.
- Diálogo de compartir con copia del link y mensaje de WhatsApp (`wa.me/?text=`).
- Lista de invitaciones pendientes con copiar, compartir, revocar y fecha de vencimiento.
- Ruta `#/invitacion/<token>`: muestra quién invita, fija el rol `discipulo` y el email de solo lectura.
- Aceptación automática al registrarse o iniciar sesión; vínculo creado en `discipleships`.
- Avisos claros para links inválidos, revocados, vencidos o usados con otro email.
- Tabla `invitations` con RLS y funciones `get_invitation` / `accept_invitation` en Supabase; migración para proyectos existentes.

**Archivos:** `js/invite.js`, `js/discipulos.js`, `js/auth.js`, `js/app.js`, `js/demo.js`, `js/supabase.js`, `index.html`, `css/styles.css`, `supabase/schema.sql`, `supabase/migrations/20261125_invitations.sql`.

**Verificación:** flujo completo en modo demo: crear invitación, copiar y compartir, abrir el link sin sesión, registrarse, aceptar, aparecer en la lista, revocar y rechazar links inválidos, vencidos o de otro email. Modo real revisado por código y esquema, pendiente de prueba con credenciales.

## Etapa 5 — Estudios bíblicos y seguimiento del discípulo

**Objetivo:** crear estudios por etapa y que el discípulo los lea, responda y complete.

**Implementado:**
- Estudios con título, descripción, etapa, pasaje, objetivo, contenido, preguntas de reflexión, actividad práctica y material opcional.
- Cuatro etapas como categorías: `nuevos-comienzos`, `crecimiento`, `caracter`, `compromiso`.
- Crear, editar y eliminar estudios; filtrado por etapa.
- Eliminación con confirmación y advertencia de borrado en cascada.
- Lección para el discípulo con guardado de respuestas y finalización.
- Progreso general y por etapa, incluido el listado de lecciones completadas.
- Visualización del discipulador propio en la cuenta del discípulo.

**Archivos:** `js/estudios.js`, `js/seguimiento.js`, `js/ui.js`.

**Verificación:** creación, edición, filtrado, eliminación, lectura, guardado, persistencia y finalización probados.

## Etapa 6 — Seguridad, limpieza y verificación final

**Objetivo:** proteger los datos con RLS y dejar la aplicación lista para uso real.

**Implementado:**
- `supabase/schema.sql` con tablas, índices, trigger de perfil, triggers de protección, funciones auxiliares, políticas RLS y permisos.
- RLS para discípulos, estudios, respuestas y observaciones privadas del discipulador.
- Limpieza de código y estilos: utilidades faltantes, estilos en línea removidos, filtros con `aria-pressed`.
- Corrección de bug demo: `clone(undefined)` con `|| null`.
- Corrección de accesibilidad: contraste de texto, landmarks, nombre accesible del logo.
- `README.md` con instrucciones, credenciales demo, setup de Supabase, seguridad, estructura y limitaciones.

**Archivos:** `supabase/schema.sql`, `js/*.js`, `css/styles.css`, `index.html`, `README.md`.

**Verificación:** Lighthouse con 100 en accesibilidad en pantallas principales; sin errores de consola en los flujos probados.

## Lo que queda

1. **Modo real no verificado de punta a punta** por falta de credenciales de un proyecto Supabase. El código y el esquema están revisados, pero deben probarse con un proyecto real.
2. **No hay recuperación de contraseña ni cambio de email** desde la interfaz; pueden gestionarse desde Supabase.
3. **No hay desvinculación de discípulos ni eliminación de asignaciones**; se puede agregar con confirmación.
4. **No hay carga de archivos, chat, notificaciones ni correo automático.**
5. **No hay pruebas automatizadas**; el despliegue a GitHub Pages sí es automático.
6. **La demostración depende de `localStorage`** y no debe usarse con datos reales.
7. **Las fechas de los datos demo son fijas**; si se desea, pueden hacerse relativas a la fecha actual.
8. **La versión del pasaje bíblico** proviene de `BIBLE_VERSION` en `js/config.js` y por defecto es RVR1960.
