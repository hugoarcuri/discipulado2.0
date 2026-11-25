import { store } from "./store.js";
import {
  clearFormError,
  setButtonLoading,
  setFormError,
  setFormSuccess,
  validateEmail,
} from "./ui.js";

let callbacks = { onAuthenticated: null };
let initialized = false;

function authElements() {
  return {
    authScreen: document.getElementById("auth-screen"),
    loginForm: document.getElementById("login-form"),
    registerForm: document.getElementById("register-form"),
    modeChip: document.getElementById("auth-mode-chip"),
    demoBox: document.getElementById("demo-box"),
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
    const rol = form.querySelector('input[name="rol"]:checked')?.value;
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
