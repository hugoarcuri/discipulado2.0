import { store } from "./store.js";
import {
  clearFormError,
  escapeHtml,
  icon,
  setButtonLoading,
  setFormError,
  setFormSuccess,
  validateEmail,
} from "./ui.js";

let callbacks = { onAuthenticated: null };
let initialized = false;
let invitationContext = null;

function authElements() {
  return {
    authScreen: document.getElementById("auth-screen"),
    loginForm: document.getElementById("login-form"),
    registerForm: document.getElementById("register-form"),
    modeChip: document.getElementById("auth-mode-chip"),
    demoBox: document.getElementById("demo-box"),
    banner: document.getElementById("invitation-banner"),
    roleField: document.getElementById("role-field"),
    registerTitle: document.getElementById("register-title"),
    registerLede: document.getElementById("register-lede"),
    registerEmailHint: document.getElementById("register-email-hint"),
  };
}

function switchView(view) {
  const { loginForm, registerForm } = authElements();
  const isLogin = view === "login";
  loginForm.hidden = !isLogin;
  registerForm.hidden = isLogin;
  clearNotices(loginForm);
  clearNotices(registerForm);
  const target = isLogin
    ? loginForm.querySelector("#login-email")
    : registerForm.querySelector("#register-name");
  setTimeout(() => target?.focus(), 30);
}

function clearNotices(form) {
  clearFormError(form);
  const success = form.querySelector("[data-form-success]");
  if (success) {
    success.textContent = "";
    success.hidden = true;
  }
  form.querySelectorAll('[aria-invalid="true"]').forEach((field) => {
    field.removeAttribute("aria-invalid");
  });
}

function focusInvalid(form, field, message) {
  if (field) {
    field.setAttribute("aria-invalid", "true");
    field.focus();
  }
  setFormError(form, message);
}

function setupMode() {
  const { modeChip, demoBox } = authElements();
  const isDemo = store.mode === "demo";
  modeChip.hidden = !isDemo;
  demoBox.hidden = !isDemo;

  if (!isDemo) {
    demoBox.querySelectorAll("[data-demo-login]").forEach((button) => {
      button.hidden = true;
    });
  }
}

function showInvitationBanner({ title, text, tone = "gold" }) {
  const { banner } = authElements();
  if (!banner) return;
  banner.hidden = false;
  banner.className = `invite-banner invite-banner-${tone}`;
  banner.innerHTML = `
    <span class="invite-banner-icon">${icon(tone === "danger" ? "alert" : "mail")}</span>
    <div>
      <p class="invite-banner-title">${escapeHtml(title)}</p>
      <p class="invite-banner-text">${text}</p>
    </div>`;
}

export function applyInvitationContext({ token, invitation }) {
  invitationContext = { token, invitation };
  const {
    loginForm,
    registerForm,
    roleField,
    registerTitle,
    registerLede,
    registerEmailHint,
    demoBox,
  } = authElements();

  const disciplerName = invitation.discipulador?.nombre || "Tu discipulador";
  showInvitationBanner({
    title: `${disciplerName} te invita a su espacio de discipulado`,
    text: `Creá tu cuenta con <strong>${escapeHtml(
      invitation.email,
    )}</strong> para aceptar la invitación. Si ya tenés cuenta con ese email, iniciá sesión.`,
  });

  if (roleField) roleField.hidden = true;
  const discipleRadio = registerForm.querySelector('input[name="rol"][value="discipulo"]');
  if (discipleRadio) discipleRadio.checked = true;

  const registerName = registerForm.elements.nombre;
  const registerEmail = registerForm.elements.email;
  const loginEmail = loginForm.elements.email;
  if (registerName) registerName.value = invitation.nombre || "";
  if (registerEmail) {
    registerEmail.value = invitation.email || "";
    registerEmail.readOnly = true;
  }
  if (loginEmail) {
    loginEmail.value = invitation.email || "";
    loginEmail.readOnly = true;
  }
  if (registerTitle) registerTitle.textContent = "Creá tu cuenta y aceptá la invitación";
  if (registerLede) {
    registerLede.textContent = "Solo falta tu contraseña. El email y el rol ya vienen definidos por el link.";
  }
  if (registerEmailHint) registerEmailHint.hidden = false;
  if (demoBox) demoBox.hidden = true;

  switchView("register");
}

export function showInvitationError({ title, text }) {
  showInvitationBanner({ title, text, tone: "danger" });
}

export function clearInvitationContext() {
  invitationContext = null;
  const {
    loginForm,
    registerForm,
    banner,
    roleField,
    registerTitle,
    registerLede,
    registerEmailHint,
    demoBox,
  } = authElements();
  if (banner) {
    banner.hidden = true;
    banner.className = "invite-banner";
    banner.innerHTML = "";
  }
  if (roleField) roleField.hidden = false;
  if (registerTitle) registerTitle.textContent = "Creá tu cuenta";
  if (registerLede) registerLede.textContent = "Elegí cómo vas a participar para preparar tu espacio.";
  if (registerEmailHint) registerEmailHint.hidden = true;
  if (demoBox) demoBox.hidden = store.mode !== "demo";

  for (const form of [loginForm, registerForm]) {
    const email = form?.elements?.email;
    if (email) email.readOnly = false;
  }
}

function invitationRole() {
  return invitationContext ? "discipulo" : null;
}

function bindDemoLogin() {
  const demoBox = document.getElementById("demo-box");
  demoBox.querySelectorAll("[data-demo-login]").forEach((button) => {
    button.addEventListener("click", async () => {
      const role = button.dataset.demoLogin;
      const credentials = store.api?.demoCredentials?.[role];
      if (!credentials) {
        setFormError(
          document.getElementById("login-form"),
          "Las cuentas de demostración no están disponibles.",
        );
        return;
      }

      const loginForm = document.getElementById("login-form");
      loginForm.elements.email.value = credentials.email;
      loginForm.elements.password.value = credentials.password;
      setButtonLoading(button, true, "Ingresando…");
      clearFormError(loginForm);
      try {
        const user = await store.signIn(credentials.email, credentials.password);
        loginForm.reset();
        callbacks.onAuthenticated(user);
      } catch (error) {
        setFormError(loginForm, error.message || "No pudimos iniciar sesión.");
      } finally {
        setButtonLoading(button, false);
      }
    });
  });
}

function bindLoginForm() {
  const form = document.getElementById("login-form");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearNotices(form);

    const email = form.elements.email.value.trim();
    const password = form.elements.password.value;
    if (!email) return focusInvalid(form, form.elements.email, "Ingresá tu email.");
    if (!validateEmail(email)) {
      return focusInvalid(form, form.elements.email, "Ingresá un email válido.");
    }
    if (!password) return focusInvalid(form, form.elements.password, "Ingresá tu contraseña.");

    const submit = document.getElementById("login-submit");
    setButtonLoading(submit, true, "Ingresando…");
    try {
      const user = await store.signIn(email, password);
      form.reset();
      callbacks.onAuthenticated(user);
    } catch (error) {
      setFormError(form, error.message || "No pudimos iniciar sesión.");
      form.elements.password.focus();
    } finally {
      setButtonLoading(submit, false);
    }
  });
}

function bindRegisterForm() {
  const form = document.getElementById("register-form");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearNotices(form);

    const nombre = form.elements.nombre.value.trim().replace(/\s+/g, " ");
    const rol = invitationRole() || form.querySelector('input[name="rol"]:checked')?.value;
    const email = form.elements.email.value.trim();
    const password = form.elements.password.value;

    if (nombre.length < 2) {
      return focusInvalid(form, form.elements.nombre, "Ingresá tu nombre completo.");
    }
    if (!rol) {
      return focusInvalid(
        form,
        form.querySelector('input[name="rol"]'),
        "Seleccioná si vas a participar como discípulo o discipulador.",
      );
    }
    if (!validateEmail(email)) {
      return focusInvalid(form, form.elements.email, "Ingresá un email válido.");
    }
    if (password.length < 8) {
      return focusInvalid(
        form,
        form.elements.password,
        "La contraseña debe tener al menos 8 caracteres.",
      );
    }

    const submit = document.getElementById("register-submit");
    setButtonLoading(submit, true, "Creando cuenta…");
    try {
      const result = await store.signUp({ nombre, email, password, rol });
      if (result.needsConfirmation) {
        form.reset();
        setFormSuccess(
          form,
          "Te enviamos un email para confirmar tu cuenta. Revisá tu bandeja de entrada y luego iniciá sesión.",
        );
        return;
      }
      form.reset();
      callbacks.onAuthenticated(result.user);
    } catch (error) {
      setFormError(form, error.message || "No pudimos crear la cuenta.");
    } finally {
      setButtonLoading(submit, false);
    }
  });
}

export function initAuth({ onAuthenticated }) {
  if (initialized) return;
  initialized = true;
  callbacks.onAuthenticated = onAuthenticated;

  setupMode();
  bindLoginForm();
  bindRegisterForm();
  bindDemoLogin();

  document.querySelectorAll("[data-auth-view]").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.authView));
  });
}

export function showAuthScreen() {
  const { authScreen, loginForm, registerForm } = authElements();
  const boot = document.getElementById("boot-screen");
  const app = document.getElementById("app-screen");
  clearInvitationContext();
  if (boot) boot.hidden = true;
  if (app) app.hidden = true;
  authScreen.hidden = false;
  loginForm.reset();
  registerForm.reset();
  clearNotices(loginForm);
  clearNotices(registerForm);
  switchView("login");
  document.title = "Discípulos · Crecer en Cristo. Acompañar a otros.";
  setTimeout(() => document.getElementById("login-email")?.focus(), 60);
}

export function hideAuthScreen() {
  const authScreen = document.getElementById("auth-screen");
  if (authScreen) authScreen.hidden = true;
}
