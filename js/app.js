import { store } from "./store.js";
import {
  applyInvitationContext,
  clearInvitationContext,
  hideAuthScreen,
  initAuth,
  showAuthScreen,
  showInvitationError,
} from "./auth.js";
import { renderDisciple, renderDisciples } from "./discipulos.js";
import { renderStudies, renderStudy, renderStudyForm } from "./estudios.js";
import { renderAssignment, renderMyStudies, renderProgress } from "./seguimiento.js";
import {
  escapeHtml,
  formatDate,
  icon,
  infoNote,
  initials,
  openDialog,
  pageHeader,
  setButtonLoading,
  setFormError,
  toast,
} from "./ui.js";

const NAV_ITEMS = {
  discipulador: [
    { path: "/discipulos", label: "Mis discípulos", iconName: "users" },
    { path: "/estudios", label: "Estudios bíblicos", iconName: "book" },
    { path: "/perfil", label: "Mi perfil", iconName: "user" },
  ],
  discipulo: [
    { path: "/mis-estudios", label: "Mis estudios", iconName: "book" },
    { path: "/progreso", label: "Mi progreso", iconName: "trending" },
    { path: "/perfil", label: "Mi perfil", iconName: "user" },
  ],
};

const ROUTES = {
  discipulador: [
    { pattern: /^\/discipulos$/, render: (view) => renderDisciples(view), title: "Mis discípulos" },
    {
      pattern: /^\/discipulos\/([^/]+)$/,
      render: (view, params) => renderDisciple(view, decodeURIComponent(params[1])),
      title: "Ficha del discípulo",
    },
    { pattern: /^\/estudios$/, render: (view) => renderStudies(view), title: "Estudios bíblicos" },
    {
      pattern: /^\/estudios\/nuevo$/,
      render: (view) => renderStudyForm(view),
      title: "Crear estudio",
    },
    {
      pattern: /^\/estudios\/([^/]+)\/editar$/,
      render: (view, params) => renderStudyForm(view, decodeURIComponent(params[1])),
      title: "Editar estudio",
    },
    {
      pattern: /^\/estudios\/([^/]+)$/,
      render: (view, params) => renderStudy(view, decodeURIComponent(params[1])),
      title: "Estudio bíblico",
    },
    { pattern: /^\/perfil$/, render: (view) => renderProfile(view), title: "Mi perfil" },
  ],
  discipulo: [
    {
      pattern: /^\/mis-estudios$/,
      render: (view) => renderMyStudies(view),
      title: "Mis estudios",
    },
    {
      pattern: /^\/mis-estudios\/([^/]+)$/,
      render: (view, params) => renderAssignment(view, decodeURIComponent(params[1])),
      title: "Lección",
    },
    { pattern: /^\/progreso$/, render: (view) => renderProgress(view), title: "Mi progreso" },
    { pattern: /^\/perfil$/, render: (view) => renderProfile(view), title: "Mi perfil" },
  ],
};

const view = document.getElementById("view");
let routeRequest = 0;

const PENDING_INVITE_KEY = "discipulos.pending.invite.v1";
let pendingInviteToken = null;

function invitationTokenFromHash() {
  const match = window.location.hash.match(/^#\/invitacion\/([^/?#]+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

function readStoredInviteToken() {
  try {
    return localStorage.getItem(PENDING_INVITE_KEY) || null;
  } catch (error) {
    return null;
  }
}

function storeInviteToken(token) {
  try {
    if (token) localStorage.setItem(PENDING_INVITE_KEY, token);
    else localStorage.removeItem(PENDING_INVITE_KEY);
  } catch (error) {
    // Si el navegador bloquea localStorage, el flujo puntual sigue funcionando.
  }
}

function clearStoredInviteToken() {
  storeInviteToken(null);
}

function defaultPath(rol) {
  return rol === "discipulador" ? "/discipulos" : "/mis-estudios";
}

function currentPath() {
  let raw = window.location.hash.replace(/^#/, "");
  if (!raw) return "/";
  if (!raw.startsWith("/")) raw = `/${raw}`;
  const withoutTrailing = raw.replace(/\/+$/, "");
  return withoutTrailing || "/";
}

function setPath(path) {
  window.history.replaceState(null, "", `#${path}`);
}

function renderHeader(user) {
  document.getElementById("user-name").textContent = user.nombre;
  document.getElementById("user-role").textContent =
    user.rol === "discipulador" ? "Discipulador" : "Discípulo";
  document.getElementById("user-avatar").textContent = initials(user.nombre);

  const modeChip = document.getElementById("mode-chip");
  modeChip.hidden = store.mode !== "demo";

  const nav = document.getElementById("main-nav");
  const items = NAV_ITEMS[user.rol] || [];
  nav.innerHTML = items
    .map(
      (item) => `
      <a class="nav-link" href="#${item.path}" data-nav-path="${item.path}">
        ${icon(item.iconName)} <span>${escapeHtml(item.label)}</span>
      </a>`,
    )
    .join("");
}

function updateActiveNav() {
  const root = `/${currentPath().split("/").filter(Boolean)[0] || ""}`;
  document.querySelectorAll("[data-nav-path]").forEach((link) => {
    const active = link.dataset.navPath === root;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

function renderError(container, error) {
  console.error(error);
  container.innerHTML = `
    <section class="page">
      <div class="error-state">
        <span class="empty-icon">${icon("alert")}</span>
        <h1>No pudimos cargar esta sección</h1>
        <p>${escapeHtml(
          error?.message || "Ocurrió un error inesperado. Revisá tu conexión e intentá nuevamente.",
        )}</p>
        <button type="button" class="btn btn-secondary" data-retry>${icon("refresh")} Reintentar</button>
        <p class="mt-sm"><a href="#${defaultPath(store.user?.rol)}">Volver al inicio</a></p>
      </div>
    </section>`;
  container.querySelector("[data-retry]")?.addEventListener("click", renderRoute);
}

function routeToDefault(user) {
  setPath(defaultPath(user.rol));
  renderRoute();
}

function showInvitationDialog({ title, message }) {
  openDialog({
    title,
    content: `<div class="modal-content">${infoNote(escapeHtml(message), {
      tone: "danger",
      iconName: "alert",
    })}</div>`,
    footer: `<div class="modal-actions"><button type="button" class="btn btn-primary" data-dialog-close>Entendido</button></div>`,
  });
}

async function acceptAndRoute(token, { explicit = false } = {}) {
  const user = store.user;
  if (!user) {
    showAuthScreen();
    return;
  }

  let invitation = null;
  try {
    invitation = await store.api.getInvitation(token);
  } catch (error) {
    invitation = null;
  }

  const reject = (title, message) => {
    clearStoredInviteToken();
    if (explicit) showInvitationDialog({ title, message });
    routeToDefault(user);
  };

  if (!invitation) {
    reject(
      "Invitación no válida",
      "No encontramos esta invitación. Pedile a tu discipulador que te envíe un link nuevo.",
    );
    return;
  }

  if (invitation.estado === "aceptada") {
    if (invitation.discipulo_id === user.id) {
      clearStoredInviteToken();
      routeToDefault(user);
      return;
    }
    reject("Invitación ya utilizada", "Esta invitación ya fue aceptada por otra cuenta.");
    return;
  }

  if (invitation.estado === "revocada") {
    reject("Invitación revocada", "El discipulador revocó este link. Pedile uno nuevo si querés unirte.");
    return;
  }

  if (invitation.estado === "expirada") {
    reject(
      "Invitación vencida",
      `Este link venció el ${formatDate(
        invitation.fecha_vencimiento,
      )}. Pedile a tu discipulador que genere uno nuevo.`,
    );
    return;
  }

  try {
    await store.api.acceptInvitation(token);
    clearStoredInviteToken();
    toast(
      `Invitación aceptada. Ya estás vinculado a ${
        invitation.discipulador?.nombre || "tu discipulador"
      }.`,
    );
    routeToDefault(user);
  } catch (error) {
    clearStoredInviteToken();
    if (explicit) {
      showInvitationDialog({
        title: "No pudimos aceptar la invitación",
        message: error.message || "Intentá nuevamente en unos minutos.",
      });
    }
    routeToDefault(user);
  }
}

async function handleInvitationLink(token) {
  pendingInviteToken = token;
  storeInviteToken(token);

  if (store.user) {
    await acceptAndRoute(token, { explicit: true });
    pendingInviteToken = null;
    return;
  }

  let invitation = null;
  try {
    invitation = await store.api.getInvitation(token);
  } catch (error) {
    invitation = null;
  }

  showAuthScreen();
  pendingInviteToken = token;

  if (!invitation) {
    clearStoredInviteToken();
    pendingInviteToken = null;
    showInvitationError({
      title: "Invitación no válida",
      text: "No encontramos este link. Pedile a tu discipulador que te envíe uno nuevo.",
    });
    return;
  }

  if (invitation.estado === "expirada") {
    clearStoredInviteToken();
    pendingInviteToken = null;
    showInvitationError({
      title: "Invitación vencida",
      text: `Este link venció el ${escapeHtml(
        formatDate(invitation.fecha_vencimiento),
      )}. Pedile a tu discipulador que genere uno nuevo.`,
    });
    return;
  }

  if (invitation.estado === "revocada") {
    clearStoredInviteToken();
    pendingInviteToken = null;
    showInvitationError({
      title: "Invitación revocada",
      text: "El discipulador revocó este link. Pedile uno nuevo si querés unirte.",
    });
    return;
  }

  if (invitation.estado === "aceptada") {
    clearStoredInviteToken();
    pendingInviteToken = null;
    showInvitationError({
      title: "Invitación ya utilizada",
      text: "Este link ya fue usado. Si ya tenés cuenta, iniciá sesión con tu email y contraseña.",
    });
    return;
  }

  applyInvitationContext({ token, invitation });
}

async function renderRoute() {
  if (!store.user) {
    showAuthScreen();
    return;
  }

  let path = currentPath();
  if (path === "/") {
    path = defaultPath(store.user.rol);
    setPath(path);
  }

  const routes = ROUTES[store.user.rol] || [];
  const route = routes
    .map((candidate) => {
      const match = path.match(candidate.pattern);
      return match ? { ...candidate, params: match } : null;
    })
    .find(Boolean);

  if (!route) {
    const fallback = defaultPath(store.user.rol);
    if (path !== fallback) {
      setPath(fallback);
      await renderRoute();
      return;
    }
    renderError(view, new Error("No encontramos esa sección."));
    return;
  }

  updateActiveNav();
  document.title = `Discípulos · ${route.title}`;
  window.scrollTo({ top: 0, behavior: "auto" });
  const token = ++routeRequest;
  view.innerHTML = `<div class="view-loading"><span class="loading-dot" aria-hidden="true"></span><p>Cargando…</p></div>`;

  try {
    await route.render(view, route.params);
    if (token !== routeRequest) return;
  } catch (error) {
    if (token !== routeRequest) return;
    renderError(view, error);
  }
}

async function enterApp(user) {
  store.setUser(user);
  hideAuthScreen();
  const boot = document.getElementById("boot-screen");
  if (boot) boot.hidden = true;
  document.getElementById("app-screen").hidden = false;
  renderHeader(user);

  if (pendingInviteToken) {
    const token = pendingInviteToken;
    pendingInviteToken = null;
    await acceptAndRoute(token, { explicit: true });
    return;
  }

  // Invitación abierta antes de confirmar el email: se retoma al iniciar sesión.
  const storedToken = readStoredInviteToken();
  if (storedToken) {
    let invitation = null;
    try {
      invitation = await store.api.getInvitation(storedToken);
    } catch (error) {
      invitation = null;
    }
    const sameEmail =
      invitation &&
      String(invitation.email || "").toLowerCase() === String(user.email || "").toLowerCase();
    if (invitation?.estado === "pendiente" && sameEmail && user.rol === "discipulo") {
      await acceptAndRoute(storedToken, { explicit: false });
      return;
    }
    clearStoredInviteToken();
  }

  const path = currentPath();
  const allowed = (ROUTES[user.rol] || []).some((route) => route.pattern.test(path));
  if (path === "/" || !allowed) {
    setPath(defaultPath(user.rol));
  }
  renderRoute();
}

async function handleLogout() {
  const button = document.getElementById("logout-button");
  setButtonLoading(button, true, "");
  try {
    await store.signOut();
    window.history.replaceState(null, "", "#/");
    showAuthScreen();
    toast("Sesión cerrada.", "info");
  } catch (error) {
    toast(error.message || "No pudimos cerrar sesión.", "error");
  } finally {
    setButtonLoading(button, false);
  }
}

async function renderProfile(container) {
  const user = store.user;
  if (!user) return;
  const discipler = user.rol === "discipulo" ? await store.api.getMyDiscipler().catch(() => null) : null;
  const roleLabel = user.rol === "discipulador" ? "Discipulador" : "Discípulo";
  const roleDescription =
    user.rol === "discipulador"
      ? "Acompañás a otras personas en su crecimiento, compartís estudios y seguís su proceso."
      : "Recibís acompañamiento, estudiás la Palabra y compartís tus respuestas con tu discipulador.";

  container.innerHTML = `
    <section class="page">
      ${pageHeader({
        eyebrow: "Cuenta",
        title: "Mi perfil",
        description: "Tus datos de acceso y la información de tu participación en Discípulos.",
      })}

      <div class="profile-grid">
        <div class="card profile-card">
          <div class="profile-identity">
            <span class="avatar avatar-lg">${escapeHtml(initials(user.nombre))}</span>
            <div class="profile-identity-text">
              <h2>${escapeHtml(user.nombre)}</h2>
              <p>${escapeHtml(user.email)}</p>
              <span class="badge badge-neutral">${escapeHtml(roleLabel)}</span>
            </div>
          </div>

          <div class="profile-section">
            <h3>Datos de la cuenta</h3>
            <dl class="info-list">
              <div class="info-row"><dt>Email</dt><dd>${escapeHtml(user.email)}</dd></div>
              <div class="info-row"><dt>Rol</dt><dd>${escapeHtml(roleLabel)}</dd></div>
              <div class="info-row"><dt>En Discípulos desde</dt><dd>${escapeHtml(
                formatDate(user.fecha_creacion),
              )}</dd></div>
            </dl>
          </div>

          <div class="profile-section">
            <h3>Nombre visible</h3>
            <form id="profile-form" class="profile-edit-form" novalidate>
              <div class="field">
                <label for="profile-name">Nombre y apellido</label>
                <input type="text" id="profile-name" name="nombre" maxlength="80" value="${escapeHtml(
                  user.nombre,
                )}" required>
              </div>
              <button type="submit" class="btn btn-secondary">${icon("save")} Guardar</button>
            </form>
          </div>

          <div class="profile-section">
            <h3>Tu rol</h3>
            <p class="text-muted text-sm">${escapeHtml(roleDescription)}</p>
          </div>
        </div>

        <aside class="side-stack">
          ${
            user.rol === "discipulo"
              ? `<article class="card discipler-card">
                  <div class="card-head">
                    <div>
                      <h2 class="card-title">Mi discipulador</h2>
                      <p class="text-muted text-xs">La persona que te acompaña</p>
                    </div>
                  </div>
                  ${
                    discipler
                      ? `<div class="person-row">
                          <span class="avatar">${escapeHtml(initials(discipler.nombre))}</span>
                          <div class="person-row-text">
                            <h3>${escapeHtml(discipler.nombre)}</h3>
                            <p>${escapeHtml(discipler.email)}</p>
                          </div>
                        </div>
                        <p>Podés consultar con tu discipulador cualquier duda sobre tu proceso y las lecciones asignadas.</p>`
                      : infoNote(
                          "Todavía no tenés un discipulador vinculado. Cuando te agregue, vas a ver sus datos en este espacio.",
                          { tone: "gold", iconName: "users" },
                        )
                  }
                </article>`
              : `<article class="card card-pad">
                  <h2 class="card-title">Acompañar a otros</h2>
                  <p class="text-muted text-sm mt-xs">
                    Desde «Mis discípulos» podés invitar personas con un link personal, ver su
                    progreso y asignarles estudios bíblicos. Las observaciones que escribas son
                    privadas.
                  </p>
                  <a class="btn btn-secondary btn-block mt-md" href="#/discipulos">
                    ${icon("users")} Ir a Mis discípulos
                  </a>
                </article>`
          }

          <article class="card card-pad">
            <h2 class="card-title">Datos y privacidad</h2>
            <div class="mt-sm">
              ${
                store.mode === "demo"
                  ? infoNote(
                      "Estás en modo demostración. Las cuentas y los datos de ejemplo se guardan solo en este navegador y no representan datos reales.",
                      { tone: "gold", iconName: "alert" },
                    )
                  : infoNote(
                      "La aplicación está conectada a Supabase. El acceso a los datos está protegido por políticas de seguridad RLS.",
                      { tone: "green", iconName: "shield" },
                    )
              }
            </div>
          </article>
        </aside>
      </div>
    </section>`;

  const form = container.querySelector("#profile-form");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const nombre = form.elements.nombre.value.trim().replace(/\s+/g, " ");
    if (nombre.length < 2) {
      setFormError(form, "Ingresá un nombre válido.");
      form.elements.nombre.focus();
      return;
    }
    const submit = form.querySelector('[type="submit"]');
    setButtonLoading(submit, true, "Guardando…");
    try {
      const updated = await store.api.updateProfile({ nombre });
      store.setUser(updated);
      renderHeader(updated);
      toast("Perfil actualizado.");
      await renderProfile(container);
    } catch (error) {
      setFormError(form, error.message || "No pudimos actualizar tu perfil.");
    } finally {
      setButtonLoading(submit, false);
    }
  });
}

async function boot() {
  const bootError = document.getElementById("boot-error");
  const bootText = document.getElementById("boot-text");
  try {
    await store.init();
    initAuth({ onAuthenticated: enterApp });
    document.getElementById("logout-button").addEventListener("click", handleLogout);

    // El enlace de salto no debe cambiar el hash: eso dispararía el router.
    document.getElementById("skip-link")?.addEventListener("click", (event) => {
      event.preventDefault();
      const app = document.getElementById("app-screen");
      const target = app.hidden
        ? document.getElementById("auth-screen")
        : document.getElementById("view");
      if (!target) return;
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
      target.scrollIntoView({ block: "start" });
    });
    window.addEventListener("hashchange", async () => {
      const token = invitationTokenFromHash();
      if (token) {
        await handleInvitationLink(token);
        return;
      }
      pendingInviteToken = null;
      if (!store.user) {
        showAuthScreen();
        return;
      }
      clearInvitationContext();
      renderRoute();
    });

    const inviteToken = invitationTokenFromHash();
    if (inviteToken) {
      pendingInviteToken = inviteToken;
      storeInviteToken(inviteToken);
      if (store.user) await enterApp(store.user);
      else await handleInvitationLink(inviteToken);
      return;
    }

    if (store.user) enterApp(store.user);
    else showAuthScreen();
  } catch (error) {
    console.error(error);
    bootText.hidden = true;
    bootError.hidden = false;
    document.getElementById("boot-error-message").textContent =
      error.message ||
      "No pudimos iniciar la aplicación. Revisá la configuración de Supabase y volvé a intentar.";
  }
}

document.getElementById("boot-retry").addEventListener("click", () => {
  window.location.reload();
});

boot();
