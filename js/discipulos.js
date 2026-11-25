import { store } from "./store.js";
import { openResponsesDialog } from "./estudios.js";
import {
  ETAPAS,
  escapeHtml,
  emptyState,
  formatDate,
  icon,
  infoNote,
  initials,
  openFormDialog,
  pageHeader,
  pluralize,
  setButtonLoading,
  setFormError,
  statusBadge,
  etapaBadge,
  toast,
  validateEmail,
} from "./ui.js";

function discipleCard(link) {
  const { discipulo, stats } = link;
  const total = stats?.total || 0;
  const completed = stats?.completados || 0;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  return `
    <a class="card disciple-card" href="#/discipulos/${encodeURIComponent(discipulo.id)}">
      <div class="person-row">
        <span class="avatar">${escapeHtml(initials(discipulo.nombre))}</span>
        <div class="person-row-text">
          <h2>${escapeHtml(discipulo.nombre)}</h2>
          <p>${escapeHtml(discipulo.email)}</p>
        </div>
        ${icon("chevron-right")}
      </div>
      <div class="card-meta">
        <span>Desde ${escapeHtml(formatDate(link.fecha_inicio))}</span>
        <span>${total ? `${completed} de ${total} estudios` : "Sin estudios asignados"}</span>
      </div>
      <div class="progress-meta">
        <span>Progreso</span>
        <strong>${percent}%</strong>
      </div>
      <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}" aria-label="Progreso de ${escapeHtml(discipulo.nombre)}: ${percent}%">
        <span style="width: ${percent}%"></span>
      </div>
    </a>`;
}

function openAddDiscipleDialog(container) {
  openFormDialog({
    title: "Agregar discípulo",
    subtitle: "La persona debe tener una cuenta registrada como discípulo.",
    fields: `
      <div class="field">
        <label for="disciple-email">Email del discípulo</label>
        <input type="email" id="disciple-email" name="email" inputmode="email" autocomplete="off" placeholder="nombre@correo.com" required>
        <p class="field-hint">Usá el mismo email con el que la persona se registró en Discípulos.</p>
      </div>
      ${infoNote(
        "Al agregarla, podrás compartirle estudios y ver su progreso. La persona verá tu nombre como su discipulador.",
        { tone: "gold", iconName: "info" },
      )}`,
    submitLabel: "Agregar discípulo",
    onSubmit: async (form) => {
      const email = form.elements.email.value.trim();
      if (!validateEmail(email)) throw new Error("Ingresá un email válido.");
      await store.api.addDisciple(email);
      toast("Discípulo agregado a tu lista.");
      await renderDisciples(container);
    },
  });
}

export async function renderDisciples(container) {
  const disciples = await store.api.listDisciples();

  const addButton = `<button type="button" class="btn btn-primary" data-add-disciple>${icon("plus")} Agregar discípulo</button>`;

  container.innerHTML = `
    <section class="page">
      ${pageHeader({
        eyebrow: "Acompañamiento",
        title: "Mis discípulos",
        description:
          "Las personas que estás acompañando. Entrá en una ficha para ver su progreso, sus respuestas y tus observaciones.",
        actions: addButton,
      })}
      ${
        disciples.length
          ? `<div class="grid-cards">${disciples.map(discipleCard).join("")}</div>`
          : emptyState({
              iconName: "users",
              title: "Todavía no acompañás a nadie",
              text: "Agregá a tu primer discípulo usando el email con el que se registró. Después podrás compartirle estudios y seguir su crecimiento.",
              action: `<button type="button" class="btn btn-primary" data-add-disciple>${icon("plus")} Agregar primer discípulo</button>`,
            })
      }
    </section>`;

  container.querySelectorAll("[data-add-disciple]").forEach((button) => {
    button.addEventListener("click", () => openAddDiscipleDialog(container));
  });
}

function assignmentRow(assignment, discipleName) {
  const study = assignment.estudio;
  const title = study?.titulo || "Estudio no disponible";
  const href = study ? `#/estudios/${encodeURIComponent(study.id)}` : "#/estudios";
  return `
    <li class="assignment-row">
      <span class="avatar avatar-sm">${escapeHtml(initials(discipleName))}</span>
      <div class="assignment-row-text">
        <strong><a href="${href}">${escapeHtml(title)}</a></strong>
        <small>Asignado el ${escapeHtml(formatDate(assignment.fecha_asignacion))}${
          assignment.fecha_completado
            ? ` · Completado el ${escapeHtml(formatDate(assignment.fecha_completado))}`
            : ""
        }</small>
      </div>
      ${statusBadge(assignment.estado)}
      <button type="button" class="btn btn-ghost btn-sm" data-view-responses="${escapeHtml(
        assignment.id,
      )}">
        ${icon("eye")} Respuestas
      </button>
    </li>`;
}

async function openAssignDialog(disciple, detail, container) {
  const studies = await store.api.listStudies();
  const assignedIds = new Set(detail.assignments.map((assignment) => assignment.estudio_id));
  const available = studies.filter((study) => !assignedIds.has(study.id));

  if (!available.length) {
    toast("Ya tiene todos tus estudios asignados.", "info");
    return;
  }

  const groups = ETAPAS.map((etapa) => {
    const items = available.filter((study) => study.etapa === etapa.id);
    if (!items.length) return "";
    return `
      <fieldset class="etapa-group">
        <legend class="etapa-group-title">${escapeHtml(etapa.label)}</legend>
        ${items
          .map(
            (study) => `
            <label class="check-row">
              <input type="checkbox" name="estudios" value="${escapeHtml(study.id)}">
              <span>${escapeHtml(study.titulo)}<small>${escapeHtml(study.pasaje_biblico)}</small></span>
            </label>`,
          )
          .join("")}
      </fieldset>`;
  }).join("");

  openFormDialog({
    title: "Asignar estudios",
    subtitle: `Elegí qué estudios querés compartir con ${disciple.nombre}.`,
    wide: true,
    fields: `<div class="assignment-check-list">${groups}</div>`,
    submitLabel: "Asignar seleccionados",
    onSubmit: async (form) => {
      const selected = [...form.querySelectorAll('input[name="estudios"]:checked')].map(
        (input) => input.value,
      );
      if (!selected.length) throw new Error("Seleccioná al menos un estudio.");
      for (const studyId of selected) {
        await store.api.assignStudy(studyId, [disciple.id]);
      }
      toast(pluralize(selected.length, "estudio asignado", "estudios asignados") + ".");
      await renderDisciple(container, disciple.id);
    },
  });
}

function observationsHtml(observations) {
  if (!observations.length) {
    return `<p class="text-muted text-sm">Todavía no escribiste observaciones sobre este proceso.</p>`;
  }
  return `
    <ul class="observation-list">
      ${observations
        .map(
          (observation) => `
          <li class="observation-item">
            <p>${escapeHtml(observation.observacion)}</p>
            <time datetime="${escapeHtml(observation.fecha_creacion)}">${escapeHtml(
              formatDate(observation.fecha_creacion),
            )}</time>
          </li>`,
        )
        .join("")}
    </ul>`;
}

export async function renderDisciple(container, discipleId) {
  const [detail, observations] = await Promise.all([
    store.api.getDiscipleDetail(discipleId),
    store.api.listObservations(discipleId),
  ]);

  const { profile, discipleship, assignments } = detail;
  const total = assignments.length;
  const completed = assignments.filter((assignment) => assignment.estado === "completado").length;
  const pending = total - completed;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  const assignmentsById = new Map(assignments.map((assignment) => [assignment.id, assignment]));

  container.innerHTML = `
    <section class="page">
      <a class="breadcrumb" href="#/discipulos">${icon("arrow-left")} Mis discípulos</a>

      <header class="page-head">
        <div>
          <p class="eyebrow">Ficha del discípulo</p>
          <div class="identity-line">
            <span class="avatar avatar-lg">${escapeHtml(initials(profile.nombre))}</span>
            <div>
              <h1>${escapeHtml(profile.nombre)}</h1>
              <p class="lede">${escapeHtml(profile.email)}</p>
              <div class="meta-row">
                <span>${icon("calendar")} Acompañamiento desde ${escapeHtml(
                  formatDate(discipleship.fecha_inicio),
                )}</span>
                <span>${icon("userCheck")} ${escapeHtml(
                  discipleship.estado === "activo" ? "Vínculo activo" : discipleship.estado,
                )}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="page-actions">
          <button type="button" class="btn btn-primary" data-assign-study>${icon("plus")} Asignar estudio</button>
        </div>
      </header>

      <div class="detail-layout">
        <div class="side-stack">
          <article class="card card-pad">
            <div class="card-head">
              <div>
                <h2 class="card-title">Estudios asignados</h2>
                <p>${pluralize(total, "lección compartida", "lecciones compartidas")}</p>
              </div>
            </div>
            ${
              assignments.length
                ? `<ul class="assignment-list">${assignments
                    .map((assignment) => assignmentRow(assignment, profile.nombre))
                    .join("")}</ul>`
                : emptyState({
                    iconName: "book",
                    title: "Sin estudios asignados",
                    text: "Compartile una lección para comenzar a acompañar su proceso.",
                    action: `<button type="button" class="btn btn-secondary" data-assign-study>${icon("plus")} Asignar estudio</button>`,
                  })
            }
          </article>
        </div>

        <aside class="side-stack">
          <article class="card status-card">
            <div class="card-head">
              <h2>Progreso</h2>
              <span class="badge ${pending ? "badge-pendiente" : "badge-completado"}">${
                pending ? `${pending} pendientes` : "Al día"
              }</span>
            </div>
            <div class="center-x mb-md">
              <div class="ring" style="--value: ${percent}" role="img" aria-label="Progreso: ${percent}%">
                <span class="ring-inner">
                  <span class="ring-value">${percent}%</span>
                  <span class="ring-label">completado</span>
                </span>
              </div>
            </div>
            <dl class="info-list">
              <div class="info-row"><dt>Estudios</dt><dd>${total}</dd></div>
              <div class="info-row"><dt>Completados</dt><dd>${completed}</dd></div>
              <div class="info-row"><dt>Pendientes</dt><dd>${pending}</dd></div>
            </dl>
          </article>

          <article class="card card-pad">
            <div class="card-head">
              <div>
                <h2 class="card-title">Observaciones</h2>
                <p><span class="private-note">${icon("lock")} Privadas</span></p>
              </div>
            </div>
            ${infoNote(
              "Estas notas son solo tuyas. La persona acompañada no puede verlas.",
              { tone: "gold", iconName: "lock" },
            )}
            <div class="mt-sm">
              ${observationsHtml(observations)}
            </div>
            <form id="observation-form" class="form mt-md" novalidate>
              <div class="field">
                <label for="observation-text">Nueva observación</label>
                <textarea id="observation-text" name="observacion" rows="3" maxlength="2000" placeholder="¿Qué querés recordar de este proceso?" required></textarea>
              </div>
              <button type="submit" class="btn btn-secondary btn-block">${icon("save")} Guardar observación</button>
            </form>
          </article>
        </aside>
      </div>
    </section>`;

  container.querySelectorAll("[data-assign-study]").forEach((button) => {
    button.addEventListener("click", () => openAssignDialog(profile, detail, container));
  });

  container.querySelectorAll("[data-view-responses]").forEach((button) => {
    button.addEventListener("click", () => {
      const assignment = assignmentsById.get(button.dataset.viewResponses);
      if (!assignment?.estudio) {
        toast("No encontramos el estudio de esta asignación.", "error");
        return;
      }
      openResponsesDialog({
        title: assignment.estudio.titulo,
        subtitle: `Respuestas de ${profile.nombre}`,
        study: assignment.estudio,
        assignment,
      });
    });
  });

  const observationForm = container.querySelector("#observation-form");
  observationForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = observationForm.querySelector('[type="submit"]');
    const text = observationForm.elements.observacion.value.trim();
    if (!text) {
      setFormError(observationForm, "Escribí una observación antes de guardar.");
      observationForm.elements.observacion.focus();
      return;
    }
    setButtonLoading(submit, true, "Guardando…");
    try {
      await store.api.addObservation(profile.id, text);
      toast("Observación guardada.");
      await renderDisciple(container, profile.id);
    } catch (error) {
      setFormError(observationForm, error.message || "No pudimos guardar la observación.");
    } finally {
      setButtonLoading(submit, false);
    }
  });
}
