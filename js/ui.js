/**
 * Utilidades compartidas de interfaz.
 * No contiene lógica de negocio ni acceso a datos.
 */

import { CONFIG } from "./config.js";

const ICONS = {
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M9 7h7M9 11h5"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  trending: '<path d="m3 17 6-6 4 4 8-8"/><path d="M14 7h7v7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  "arrow-left": '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  "arrow-right": '<path d="m12 5 7 7-7 7"/><path d="M5 12h14"/>',
  "chevron-right": '<path d="m9 18 6-6-6-6"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6M14 11v6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  "check-circle": '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m22 4-10 10.01-3-3"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  link: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/>',
  sparkle: '<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="M19 17v4M17 19h4"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/>',
  userCheck: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m16 11 2 2 4-4"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  whatsapp: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
};

/**
 * Devuelve un ícono SVG en línea.
 * @param {string} name
 * @param {string} className
 */
export function icon(name, className = "") {
  const content = ICONS[name] || ICONS.info;
  return `<svg class="icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${content}</svg>`;
}

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

export function uid(prefix = "id") {
  const random =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${random}`;
}

export function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value ?? "").trim());
}

export function initials(nombre) {
  const parts = String(nombre ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("es");
}

export function formatDate(value) {
  if (!value) return "—";
  const text = String(value);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(text)
    ? new Date(`${text}T12:00:00`)
    : new Date(text);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function pluralize(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export const ETAPAS = [
  {
    id: "nuevos-comienzos",
    label: "Nuevos comienzos",
    description: "Fundamentos de la salvación y primeros pasos de la vida cristiana.",
  },
  {
    id: "crecimiento",
    label: "Crecimiento",
    description: "Hábitos espirituales y fundamentos de la fe.",
  },
  {
    id: "caracter",
    label: "Carácter",
    description: "Formación del carácter conforme a Cristo.",
  },
  {
    id: "compromiso",
    label: "Compromiso",
    description: "Servicio, responsabilidad y capacidad de discipular a otros.",
  },
];

export function getEtapa(id) {
  return ETAPAS.find((etapa) => etapa.id === id) || null;
}

export function etapaBadge(id) {
  const etapa = getEtapa(id);
  const label = etapa ? etapa.label : "Sin etapa";
  return `<span class="badge etapa-${escapeHtml(id || "sin-etapa")}">${escapeHtml(label)}</span>`;
}

export function statusBadge(estado) {
  if (estado === "completado") {
    return `<span class="badge badge-completado">${icon("check")} Completado</span>`;
  }
  return `<span class="badge badge-pendiente">${icon("clock")} Pendiente</span>`;
}

export function richText(value, fallback = "Sin contenido.") {
  const text = String(value ?? "").trim();
  if (!text) return `<p class="text-muted">${escapeHtml(fallback)}</p>`;
  return text
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function linkifyText(value) {
  return escapeHtml(value).replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>',
  );
}

export function bibleUrl(reference) {
  return `https://www.biblegateway.com/passage/?version=${encodeURIComponent(
    CONFIG.BIBLE_VERSION,
  )}&search=${encodeURIComponent(String(reference ?? "").trim())}`;
}

export function pageHeader({ eyebrow = "", title, description = "", actions = "" }) {
  return `
    <header class="page-head">
      <div>
        ${eyebrow ? `<p class="eyebrow">${escapeHtml(eyebrow)}</p>` : ""}
        <h1>${escapeHtml(title)}</h1>
        ${description ? `<p class="lede">${escapeHtml(description)}</p>` : ""}
      </div>
      ${actions ? `<div class="page-actions">${actions}</div>` : ""}
    </header>`;
}

export function emptyState({ iconName = "book", title, text = "", action = "" }) {
  return `
    <div class="empty-state">
      <span class="empty-icon">${icon(iconName)}</span>
      <h2>${escapeHtml(title)}</h2>
      ${text ? `<p>${escapeHtml(text)}</p>` : ""}
      ${action}
    </div>`;
}

export function progressMarkup(completed, total) {
  const safeTotal = Number(total) || 0;
  const safeCompleted = Number(completed) || 0;
  const percent = safeTotal ? Math.round((safeCompleted / safeTotal) * 100) : 0;
  return `
    <div class="progress-meta">
      <span>${safeTotal ? `${safeCompleted} de ${safeTotal} completados` : "Sin estudios asignados"}</span>
      <strong>${percent}%</strong>
    </div>
    <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}" aria-label="Progreso: ${percent}%">
      <span style="width: ${percent}%"></span>
    </div>`;
}

export function infoNote(text, { tone = "neutral", iconName = "info" } = {}) {
  const tones = {
    neutral: "info-note",
    gold: "info-note info-note-gold",
    green: "info-note info-note-green",
    danger: "info-note info-note-danger",
  };
  return `<div class="${tones[tone] || tones.neutral}">${icon(iconName)}<div>${text}</div></div>`;
}

/* ---------------- Notificaciones ---------------- */

export function toast(message, type = "success") {
  const region = document.getElementById("toast-region");
  if (!region) return;
  const iconName = type === "error" ? "alert" : type === "info" ? "info" : "check-circle";
  const element = document.createElement("div");
  element.className = `toast toast-${type}`;
  element.innerHTML = `${icon(iconName)}<span>${escapeHtml(message)}</span>`;
  region.appendChild(element);

  while (region.children.length > 4) {
    region.removeChild(region.firstElementChild);
  }

  requestAnimationFrame(() => element.classList.add("is-visible"));
  setTimeout(() => {
    element.classList.remove("is-visible");
    setTimeout(() => element.remove(), 240);
  }, 4800);
}

/* ---------------- Diálogos ---------------- */

const dialog = document.getElementById("app-dialog");

if (dialog) {
  dialog.addEventListener("click", (event) => {
    if (event.target.closest("[data-dialog-close]")) {
      dialog.close();
      return;
    }
    if (event.target === dialog) {
      dialog.close();
    }
  });
  dialog.addEventListener("close", () => {
    document.body.classList.remove("modal-open");
  });
}

export function openDialog({ title, subtitle = "", content = "", footer = "", wide = false }) {
  if (!dialog) throw new Error("No se encontró el contenedor de diálogos.");
  dialog.innerHTML = `
    <div class="modal-card ${wide ? "modal-card-wide" : ""}">
      <header class="modal-head">
        <div>
          <h2 id="dialog-title">${escapeHtml(title)}</h2>
          ${subtitle ? `<p class="modal-subtitle">${escapeHtml(subtitle)}</p>` : ""}
        </div>
        <button type="button" class="btn btn-icon btn-ghost" data-dialog-close aria-label="Cerrar diálogo">
          ${icon("x")}
        </button>
      </header>
      ${content}
      ${footer}
    </div>`;
  if (!dialog.open) dialog.showModal();
  document.body.classList.add("modal-open");
  return dialog;
}

export function closeDialog() {
  if (dialog && dialog.open) dialog.close();
}

export function openFormDialog({
  title,
  subtitle = "",
  fields,
  submitLabel = "Guardar",
  submitClass = "btn-primary",
  cancelLabel = "Cancelar",
  wide = false,
  onSubmit,
}) {
  openDialog({
    title,
    subtitle,
    wide,
    content: `
      <form class="dialog-form" novalidate>
        <div class="modal-content">
          ${fields}
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" data-dialog-close>${escapeHtml(cancelLabel)}</button>
          <button type="submit" class="btn ${submitClass}">${escapeHtml(submitLabel)}</button>
        </div>
      </form>`,
  });

  const form = dialog.querySelector("form");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFormError(form);
    const submitButton = form.querySelector('[type="submit"]');
    setButtonLoading(submitButton, true, "Guardando…");
    try {
      const result = await onSubmit(form);
      if (result !== false) closeDialog();
    } catch (error) {
      setFormError(form, error.message || "No pudimos completar la operación.");
    } finally {
      setButtonLoading(submitButton, false);
    }
  });

  setTimeout(() => {
    const firstField = form.querySelector("input, textarea, select");
    firstField?.focus();
  }, 50);

  return form;
}

export function confirmDialog({
  title = "Confirmar acción",
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = false,
}) {
  return new Promise((resolve) => {
    openDialog({
      title,
      content: `<div class="modal-content"><p class="confirm-text">${message}</p></div>`,
      footer: `
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" data-confirm-cancel>${escapeHtml(cancelLabel)}</button>
          <button type="button" class="btn ${danger ? "btn-danger" : "btn-primary"}" data-confirm-ok>${escapeHtml(confirmLabel)}</button>
        </div>`,
    });

    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      closeDialog();
      resolve(value);
    };

    dialog.querySelector("[data-confirm-ok]")?.addEventListener("click", () => finish(true));
    dialog.querySelector("[data-confirm-cancel]")?.addEventListener("click", () => finish(false));
    dialog.addEventListener("close", () => finish(false), { once: true });
  });
}

/* ---------------- Formularios ---------------- */

export function setFormError(form, message) {
  let box = form.querySelector("[data-form-error]");
  if (!box) {
    box = document.createElement("div");
    box.className = "form-error";
    box.setAttribute("data-form-error", "");
    box.setAttribute("role", "alert");
    const container = form.querySelector(".modal-content") || form;
    container.prepend(box);
  }
  box.textContent = message;
  box.hidden = false;
}

export function clearFormError(form) {
  const box = form.querySelector("[data-form-error]");
  if (box) {
    box.textContent = "";
    box.hidden = true;
  }
}

export function setFormSuccess(form, message) {
  let box = form.querySelector("[data-form-success]");
  if (!box) {
    box = document.createElement("div");
    box.className = "form-success";
    box.setAttribute("data-form-success", "");
    box.setAttribute("role", "status");
    const container = form.querySelector(".modal-content") || form;
    container.prepend(box);
  }
  box.textContent = message;
  box.hidden = false;
}

export function setButtonLoading(button, loading, label = "Procesando…") {
  if (!button) return;
  if (loading) {
    if (!button.dataset.originalHtml) button.dataset.originalHtml = button.innerHTML;
    button.classList.add("is-loading");
    button.disabled = true;
    button.innerHTML = `<span class="spinner" aria-hidden="true"></span><span>${escapeHtml(label)}</span>`;
  } else {
    button.classList.remove("is-loading");
    button.disabled = false;
    if (button.dataset.originalHtml) {
      button.innerHTML = button.dataset.originalHtml;
      delete button.dataset.originalHtml;
    }
  }
}
