# DISCÍPULOS

Aplicación web de discipulado cristiano para acompañar a otras personas en su crecimiento: estudios bíblicos, asignaciones, respuestas y seguimiento privado.

Construida solo con **HTML5, CSS3, JavaScript (vanilla, módulos ES) y Supabase**. No usa frameworks, bundler ni proceso de compilación.

---

## 1. Cómo abrir la aplicación

La aplicación necesita servirse por HTTP para que funcionen los módulos ES. No abras `index.html` con doble clic (`file://`).

Con Python instalado, desde la carpeta del proyecto:

```bash
py -m http.server 4173 --bind 127.0.0.1
```

Luego abrí:

```text
http://127.0.0.1:4173/
```

También podés publicarla en cualquier hosting estático (Netlify, Vercel, GitHub Pages, Cloudflare Pages, un servidor propio). Solo hay que subir los archivos tal como están.

---

## 2. Modo demostración

Si `js/config.js` conserva los valores de ejemplo, la aplicación arranca en **modo demostración**. En este modo:

- No se conecta a Supabase.
- La cuenta que crees y todos tus datos se guardan en `localStorage` de ese navegador.
- La interfaz muestra la etiqueta **DEMO** y un aviso visible.
- La demostración arranca **vacía**: no hay cuentas, estudios ni respuestas precargadas.
- Nada se envía a un servidor. Si borrás los datos del sitio, cambiás de navegador o usás una ventana privada, la cuenta desaparece.

### Crear la cuenta

1. Entrá a **Crear cuenta**.
2. Elegí **Discipulador** o **Discípulo**.
3. Completá nombre, email y una contraseña de al menos 8 caracteres.

La cuenta queda guardada en ese navegador. Podés cerrar sesión y volver a entrar con el mismo email y contraseña. No hay recuperación de contraseña en modo demo: si la olvidás, podés reiniciar los datos y crear una cuenta nueva.

Si al iniciar sesión aparece **“No encontramos una cuenta con ese email en este navegador”**, la cuenta no existe en ese navegador (por ejemplo, porque se borraron los datos del sitio, se usó una ventana privada o se abrió desde otro dispositivo). En modo demo las cuentas no se sincronizan entre navegadores.

### Reiniciar la demostración

Para borrar todas las cuentas y datos locales y volver al estado inicial vacío, abrí la consola del navegador y ejecutá:

```js
localStorage.removeItem("discipulos.demo.db.v1");
localStorage.removeItem("discipulos.demo.session.v1");
localStorage.removeItem("discipulos.pending.invite.v1");
location.reload();
```

También podés borrar los datos del sitio desde la configuración del navegador.

Las contraseñas del modo demo se guardan como hash SHA-256 con una sal fija. Es una medida de higiene local, no reemplaza la seguridad de Supabase Auth. **No uses el modo demostración para datos reales.**

---

## 3. Conectar Supabase (modo real)

### 3.1 Crear el proyecto

1. Creá un proyecto en [Supabase](https://supabase.com/).
2. Entrá a **Project Settings → API** y copiá:
   - `Project URL`
   - `anon public key`

### 3.2 Instalar el esquema

1. Abrí **SQL Editor** en Supabase.
2. Pegá y ejecutá todo el contenido de `supabase/schema.sql`.
3. El script crea tablas, índices, triggers, funciones auxiliares, políticas RLS y permisos.

Si el proyecto ya existía antes de las invitaciones por link, ejecutá también `supabase/migrations/20261125_invitations.sql`. Es idempotente: agrega la tabla `invitations`, sus políticas y las funciones `get_invitation` y `accept_invitation` sin borrar datos.

### 3.3 Configurar la aplicación

Editá `js/config.js`:

```js
export const CONFIG = {
  SUPABASE_URL: "https://TU-PROYECTO.supabase.co",
  SUPABASE_ANON_KEY: "TU_ANON_KEY",
  BIBLE_VERSION: "RVR1960",
};
```

Al guardar credenciales válidas, la aplicación pasa automáticamente a **modo real**:

- El aviso de demostración desaparece.
- La autenticación la maneja Supabase Auth.
- Los datos se leen y escriben en PostgreSQL con RLS.

La `anon key` es pública por diseño. **Nunca** pongas la `service_role key` en el frontend ni en este repositorio: esa clave omite RLS.

### 3.4 Configurar autenticación

En Supabase, revisá **Authentication → URL Configuration** y cargá la URL donde vas a publicar la app. Para desarrollo local podés agregar:

```text
http://127.0.0.1:4173
```

Si dejás activada la confirmación por email, después del registro la persona recibirá un correo y deberá confirmar la cuenta antes de ingresar. La aplicación muestra ese aviso correctamente. Si preferís pruebas rápidas, podés desactivar la confirmación en **Authentication → Providers → Email** mientras desarrollás.

### 3.5 Primeros pasos en modo real

1. Registrate como **discipulador**.
2. En **Mis discípulos → Invitar discípulo**, ingresá el nombre y el email de la persona.
3. Copiá el link personal o compartilo por WhatsApp.
4. La persona abre el link, crea su cuenta con ese email (el rol de discípulo queda fijado por la invitación) y acepta automáticamente.
5. Creá estudios en **Estudios bíblicos** y asignálos.
6. El discípulo podrá leerlos, responder y completarlos desde su cuenta.

El vínculo se crea al aceptar la invitación. No hace falta que la persona se registre antes por su cuenta ni que el discipulador conozca su contraseña.

---

## 4. Funciones por rol

### Discipulador

- **Mis discípulos**
  - Ver la lista de discípulos vinculados y su progreso.
  - Invitar discípulos con un link personal por email, sin que la cuenta exista todavía.
  - Copiar el link, compartirlo por WhatsApp, revocarlo o ver su vencimiento.
  - Abrir la ficha de cada discípulo.
  - Ver estudios asignados, estado y respuestas.
  - Asignar estudios a uno o varios discípulos.
  - Escribir observaciones privadas (solo las ve el discipulador).
- **Estudios bíblicos**
  - Listar, filtrar por etapa y ver el detalle.
  - Crear y editar estudios con título, descripción, etapa, pasaje, objetivo, contenido, preguntas de reflexión, actividad práctica y material opcional.
  - Asignar un estudio a varios discípulos.
  - Ver las respuestas de cada asignación.
  - Eliminar un estudio con confirmación explícita y advertencia de borrado en cascada.
- **Mi perfil**
  - Ver email, rol, fecha de alta y nombre visible.
  - Cambiar el nombre visible.

### Discípulo

- **Mis estudios**
  - Ver solo los estudios asignados por su discipulador.
  - Filtrar por pendientes/completados.
  - Abrir la lección, leer el contenido y responder las preguntas.
  - Guardar respuestas (se conservan al recargar).
  - Marcar la lección como completada, con confirmación si quedan preguntas sin responder.
- **Mi progreso**
  - Ver el porcentaje general, los contadores y el avance por etapa.
  - Ver el listado de lecciones completadas.
  - Ver quién es su discipulador.
- **Mi perfil**
  - Ver sus datos y el nombre de su discipulador.
  - Cambiar su nombre visible.

### Reglas de acceso

- El rol se elige al registrarse y no se puede cambiar desde la aplicación.
- Cada rol tiene su propio menú y sus propias rutas.
- Si una persona intenta abrir una ruta del otro rol, el router la redirige a su inicio.
- Un discipulador solo puede ver los perfiles, asignaciones, respuestas y observaciones vinculados a sus propios discípulos.
- Un discípulo solo puede ver sus propios estudios, respuestas y los datos de su discipulador.
- Las observaciones son privadas del discipulador que las escribió.
- Una invitación solo puede aceptarla la cuenta cuyo email coincide con el de la invitación, y siempre entra como `discipulo`.
- El token del link es el secreto: no se muestra en la lista de discípulos ni se puede adivinar a partir del email.

---

## 5. Etapas y estados

Las etapas son **categorías**, no niveles obligatorios ni progresión forzada:

| ID | Nombre |
| --- | --- |
| `nuevos-comienzos` | Nuevos comienzos |
| `crecimiento` | Crecimiento |
| `caracter` | Carácter |
| `compromiso` | Compromiso |

Una asignación puede estar:

- `pendiente`
- `completado`

No hay fechas límite, puntajes ni desbloqueos. El orden lo define el discipulador al asignar estudios.

---

## 6. Modelo de datos

| Tabla | Para qué sirve |
| --- | --- |
| `profiles` | Datos públicos del usuario: nombre, email, rol. Se crea automáticamente al registrarse. |
| `discipleships` | Vínculo entre un discipulador y un discípulo. |
| `studies` | Estudios bíblicos creados por un discipulador. |
| `assignments` | Asignación de un estudio a un discípulo. |
| `responses` | Respuestas de un discípulo a una asignación, guardadas como JSONB por ID de pregunta. |
| `observations` | Notas privadas del discipulador sobre un discípulo. |
| `invitations` | Links personales para invitar discípulos: token, email, estado y vencimiento. |

Decisiones relevantes:

- **Las contraseñas no están en estas tablas.** Las gestiona Supabase Auth (`auth.users`).
- **Las respuestas usan JSONB con IDs estables de pregunta.** Así un estudio puede tener varias preguntas y las respuestas no se rompen si se edita el texto.
- **Editar un estudio conserva los IDs de las preguntas existentes.** Las respuestas anteriores siguen asociadas.
- **Eliminar un estudio elimina en cascada sus asignaciones y respuestas.** La interfaz lo advierte antes de borrar.
- **El perfil se crea con un trigger** al insertarse el usuario en `auth.users`. Si el trigger no existe, el cliente intenta crear el perfil como respaldo.
- **La invitación guarda el email y el token**, no la contraseña. Al registrarse con ese email, el trigger fuerza el rol `discipulo` y la aceptación crea el vínculo en `discipleships`.
- **Las invitaciones vencen a los 14 días** y pasan a `expirada`; el discipulador puede revocarlas antes de que se usen.

---

## 7. Seguridad y RLS

Todo el acceso a datos pasa por políticas **Row Level Security**. Resumen:

- `profiles`: cada persona ve su propio perfil y los perfiles de sus discípulos o de su discipulador. Solo puede actualizar su propio nombre; el rol y el email están protegidos por trigger.
- `discipleships`: visibles solo para las dos partes del vínculo. Solo un discipulador puede crear vínculos con cuentas de rol `discipulo`.
- `studies`: visibles para su creador y para los discípulos que tienen una asignación de ese estudio. Solo el creador puede editar o eliminar.
- `assignments`: visibles para el discipulador que asignó y para el discípulo asignado. El discípulo solo puede actualizar el estado y la fecha de finalización; un trigger impide cambiar el estudio, el discípulo o el autor.
- `responses`: visibles para el discípulo dueño y para el discipulador que hizo la asignación. Solo el discípulo dueño puede crearlas o editarlas. Un trigger impide cambiar la asignación o el discípulo.
- `observations`: solo el discipulador que las escribió puede verlas, crearlas, editarlas o eliminarlas.
- `invitations`: el discipulador ve y gestiona solo las suyas; el discípulo invitado puede ver la que aceptó. La aceptación se hace por función `SECURITY DEFINER`, que verifica sesión, vencimiento, estado y email.

Además:

- `anon` no tiene permisos sobre las tablas.
- Las funciones auxiliares de RLS son `SECURITY DEFINER` con `search_path` fijo para evitar bloqueos circulares entre políticas.
- `buscar_discipulo_por_email` solo devuelve coincidencias exactas y solo puede ejecutarla un discipulador autenticado.
- `get_invitation` se puede llamar sin sesión porque el token es el secreto del link; solo devuelve los datos necesarios para mostrar la invitación.
- `accept_invitation` exige sesión autenticada y no permite aceptar invitaciones de otro email.
- Las claves y contraseñas reales nunca se guardan en el repositorio. `js/config.js` solo contiene la URL y la `anon key`, que son públicas.

Si cambiás el esquema, volvé a ejecutar el archivo completo o aplicá las políticas nuevas y recargá el esquema de la API (`notify pgrst, 'reload schema'`).

---

## 8. Estructura del proyecto

```text
discipuladov2/
├── index.html                 Estructura base: acceso, app, diálogo y toasts
├── README.md
├── assets/
│   └── img/
│       ├── favicon.svg
│       ├── logo.svg
│       └── logo-mark.svg
├── css/
│   └── styles.css             Identidad visual, componentes y responsive
├── js/
│   ├── app.js                 Arranque, sesión, router, navegación y perfil
│   ├── auth.js                Login y registro
│   ├── invite.js             Token, URL y mensaje de WhatsApp de invitaciones
│   ├── config.js              URL/clave de Supabase y detección de modo
│   ├── store.js               Selección de backend y estado de sesión
│   ├── demo.js                Backend local vacío para la demostración
│   ├── supabase.js            Backend real: Auth, consultas y operaciones
│   ├── ui.js                  Iconos, formato, diálogos, formularios y toasts
│   ├── discipulos.js          Vistas del discipulador sobre sus discípulos
│   ├── estudios.js            Listado, detalle, formulario y asignación de estudios
│   └── seguimiento.js         Estudios del discípulo, lección y progreso
└── supabase/
    ├── schema.sql             Tablas, triggers, funciones, RLS y permisos
    └── migrations/
        └── 20261125_invitations.sql  Migración de invitaciones para proyectos existentes
```

### Por qué existen `config.js`, `store.js`, `demo.js` y `ui.js`

No son funcionalidades extra: son separaciones internas para cumplir los requisitos sin duplicar código.

- **`config.js`** centraliza las credenciales y decide si la app está en modo demo o real.
- **`store.js`** es la única puerta de entrada a los datos. La interfaz llama a `store.api` y no sabe si detrás está Supabase o localStorage.
- **`demo.js`** implementa el mismo contrato que `supabase.js` usando `localStorage`, para poder probar toda la app sin credenciales.
- **`ui.js`** reúne helpers visuales compartidos (escapado de HTML, fechas, iconos, diálogos, validaciones y notificaciones).

---

## 9. Validación, errores y experiencia de uso

- Los formularios validan en el cliente antes de enviar: email, contraseña mínima, nombre, título, etapa, pasaje, objetivo, contenido y preguntas.
- Los errores se muestran junto al formulario o dentro del diálogo, con `role="alert"`.
- Las operaciones no recargan la página: usan `fetch`/Supabase y actualizan la vista.
- Los botones muestran estado de carga y se deshabilitan mientras la operación está en curso.
- Supabase devuelve mensajes traducidos al español para credenciales inválidas, email sin confirmar, sesión expirada, permisos RLS, duplicados y problemas de red.
- Las acciones destructivas piden confirmación.
- Los datos no se consideran guardados hasta que la operación contra el backend termina correctamente.

### Accesibilidad y responsive

- HTML semántico, navegación por teclado, foco visible y enlace **Saltar al contenido**.
- Diálogos nativos con cierre por `Escape`, botón de cierre y clic en el fondo.
- Los filtros exponen `aria-pressed` y los menús marcan `aria-current`.
- Etiquetas asociadas a los campos, mensajes de error anunciados y contraste cuidado.
- Diseño adaptable desde 320 px: el menú se desplaza horizontalmente y no hay desborde horizontal de página.

---

## 10. Estado de verificación

Probado en navegador con el modo demostración:

- Registro de discipulador y de discípulo, cierre de sesión y nuevo inicio con las mismas credenciales.
- La demostración arranca sin cuentas ni datos de ejemplo; las cuentas creadas persisten en el navegador.
- Menús y rutas separadas por rol, con redirección al intentar abrir rutas del otro rol.
- Invitación de discípulo: creación del link, copia, mensaje de WhatsApp y revocación.
- Aceptación desde el link sin sesión: registro con email y rol fijados por la invitación, aceptación automática y aparición en la lista del discipulador.
- Links inválidos, revocados y vencidos muestran el aviso correspondiente y no se guardan para después.
- Intento de aceptar una invitación con otro email: se rechaza con un mensaje claro y sin crear el vínculo.
- Ficha del discípulo, progreso, asignaciones, respuestas y observaciones privadas.
- Creación, edición, filtrado y eliminación de estudios.
- Asignación de estudios a discípulos.
- Lectura de lecciones, guardado de respuestas, persistencia tras recargar y finalización.
- Progreso general y por etapa.
- Actualización del nombre visible.
- Enlace de salto sin cambiar el hash.
- Diálogos, cierre con `Escape`, toasts y validaciones.
- Revisión responsive a 390 px y 320 px sin desborde horizontal.

**Modo real:** la integración con Supabase está implementada y el esquema incluye RLS, pero no se ejecutó de punta a punta en este entorno porque no hay credenciales de un proyecto Supabase. Antes de usar datos reales, seguí los pasos de la sección 3 y probá registro, confirmación por email, vinculación y asignación en tu proyecto.

---

## 11. Limitaciones y trabajo pendiente

Lo que la aplicación **no** incluye a propósito:

- No hay panel general ni métricas globales.
- No hay chat, notificaciones push ni correo automático. El link de invitación se comparte manualmente por WhatsApp o se copia.
- No hay carga de archivos ni material multimedia.
- No hay edición de email ni recuperación de contraseña desde la interfaz (se pueden gestionar desde Supabase).
- No se envían recordatorios automáticos de invitaciones pendientes.
- No hay opción para desvincular discípulos ni para quitar una asignación.
- No hay progresión automática entre etapas, fechas límite ni calificaciones.
- No hay modo oscuro.

Mejoras posibles si se amplía el alcance:

- Recuperación de contraseña con `resetPasswordForEmail`.
- Desvincular discípulos y quitar asignaciones con confirmación.
- Reordenar preguntas y material del estudio.
- Exportar respuestas o el progreso.
- Notificaciones por email cuando se asigna un estudio.
- Pruebas automatizadas y despliegue continuo.

---

## 12. Publicación

Al ser estática, alcanza con subir el contenido del proyecto a un hosting que sirva HTTPS. Recordá:

1. Ejecutar `supabase/schema.sql` en el proyecto real.
2. Completar `js/config.js` con la URL y la `anon key`.
3. Agregar la URL publicada en **Authentication → URL Configuration** de Supabase.
4. Verificar que la app muestre el modo real (sin la etiqueta DEMO).

### GitHub Pages

Este repositorio incluye un flujo de GitHub Actions en `.github/workflows/pages.yml`. Para publicarlo:

1. Creá un repositorio en GitHub (por ejemplo `discipulos`).
2. En la carpeta del proyecto, inicializá Git y subí los archivos:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
   git push -u origin main
   ```

3. En GitHub, entrá a **Settings → Pages**.
4. En **Build and deployment**, elegí **Source: GitHub Actions**.
5. El flujo se ejecutará automáticamente y publicará el sitio en:

   ```text
   https://TU_USUARIO.github.io/TU_REPO/
   ```

6. Antes de usar modo real, completá `js/config.js` con la URL y la `anon key` de Supabase y agregá esa URL en **Authentication → URL Configuration**.

El archivo `.nojekyll` evita que GitHub Pages procese el sitio con Jekyll y respeta los nombres de archivo tal como están.

No subas claves `service_role`, contraseñas ni archivos `.env` con secretos.
