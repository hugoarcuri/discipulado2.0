import { store } from "./store.js";
import {
  activityHtml,
  answerFor,
  coreContentHtml,
  materialHtml,
  passageHtml,
} from "./estudios.js";
import {
  ETAPAS,
  confirmDialog,
  emptyState,
  escapeHtml,
  etapaBadge,
  formatDate,
  icon,
  infoNote,
  openDialog,
  pageHeader,
  pluralize,
  progressMarkup,
  setButtonLoading,
  setFormError,
  statusBadge,
  toast,
} from "./ui.js";

/* ---------------- Mis estudios ---------------- */

function assignmentCard(assignment) {
  const study = assignment.estudio;
  return `
    <a class="card study-card" href="#/mis-estudios/${encodeURIComponent(
      assignment.id,
    )}" data-assignment-status="${escapeHtml(assignment.estado)}">
      <div class="study-card-top">
        ${etapaBadge(study.etapa)}
        ${statusBadge(assignment.estado)}
      </div>
      <h2>${escapeHtml(study.titulo)}</h2>
      <p class="study-card-desc">${escapeHtml(study.descripcion)}</p>
      <div class="study-card-foot">
        <span class="passage">${icon("book")} ${escapeHtml(study.pasaje_biblico)}</span>
        <span>Asignado el ${escapeHtml(formatDate(assignment.fecha_asignacion))}</span>
      </div>
    </a>`;
}

export async function renderMyStudies(container) {
  const [assignments, discipler] = await Promise.all([
    store.api.listMyAssignments(),
    store.api.getMyDiscipler().catch(() => null),
  ]);

  if (!assignments.length) {
    container.innerHTML = `
      <section class="page">
        ${pageHeader({
          eyebrow: "Discipulado",
          title: "Mis estudios",
          description: "Las lecciones que tu discipulador comparte con vos.",
        })}
        ${emptyState({
          iconName: "book",
          title: "Todavía no tenés estudios asignados",
          text: discipler
            ? `${discipler.nombre} todavía no te compartió una lección. Cuando lo haga, aparecerá en este espacio.`
            : "Cuando un discipulador te agregue y te comparta una lección, aparecerá en este espacio.",
        })}
      </section>`;
    return;
  }

  const pending = assignments.filter((assignment) => assignment.estado !== "completado").length;
  const completed = assignments.length - pending;

  container.innerHTML = `
    <section class="page">
      ${pageHeader({
        eyebrow: "Discipulado",
        title: "Mis estudios",
        description: "Leé cada lección, respondé las preguntas y marcá tu avance.",
      })}
      ${
        discipler
          ? `<div class="discipler-strip">
              <span class="avatar">${escapeHtml(
                discipler.nombre
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")
                  .toUpperCase(),
              )}</span>
              <div>
                <span class="discipler-strip-label">Tu discipulador</span>
                <strong>${escapeHtml(discipler.nombre)}</strong>
              </div>
            </div>`
          : ""
      }
      <div class="filter-bar" role="group" aria-label="Filtrar estudios por estado">
        <button type="button" class="filter-chip active" data-status-filter="all" aria-pressed="true">
          Todos <span class="filter-count">${assignments.length}</span>
        </button>
        <button type="button" class="filter-chip" data-status-filter="pendiente" aria-pressed="false">
          Pendientes <span class="filter-count">${pending}</span>
        </button>
        <button type="button" class="filter-chip" data-status-filter="completado" aria-pressed="false">
          Completados <span class="filter-count">${completed}</span>
        </button>
      </div>
      <div class="grid-cards" id="my-studies-grid">
        ${assignments.map(assignmentCard).join("")}
      </div>
      <div id="status-empty" hidden>
        ${emptyState({
          iconName: "check-circle",
          title: "No hay estudios en esta lista",
          text: "Probá con otro filtro para ver tus lecciones.",
        })}
      </div>
    </section>`;

  const buttons = container.querySelectorAll("[data-status-filter]");
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      buttons.forEach((candidate) => {
        const active = candidate === button;
        candidate.classList.toggle("active", active);
        candidate.setAttribute("aria-pressed", String(active));
      });
      const filter = button.dataset.statusFilter;
      let visible = 0;
      container.querySelectorAll("[data-assignment-status]").forEach((card) => {
        const show = filter === "all" || card.dataset.assignmentStatus === filter;
        card.hidden = !show;
        if (show) visible += 1;
      });
      const empty = container.querySelector("#status-empty");
      if (empty) empty.hidden = visible > 0;
    });
  });
}

/* ---------------- Lección asignada ---------------- */

function answersFromForm(form) {
  const answers = {};
  form.querySelectorAll("[data-answer-id]").forEach((textarea) => {
    answers[textarea.dataset.answerId] = textarea.value.trim();
  });
  return answers;
}

function answeredCount(answers, questions) {
  return questions.filter((question) => String(answers[question.id] || "").trim()).length;
}

export async function renderAssignment(container, assignmentId) {
  const detail = await store.api.getAssignment(assignmentId);
  const { assignment, estudio: study } = detail;
  const questions = Array.isArray(study.preguntas) ? study.preguntas : [];
  const isCompleted = assignment.estado === "completado";
  const initialAnswers = Object.fromEntries(
    questions.map((question) => [question.id, answerFor(detail.respuesta, question.id)]),
  );
  const initialAnswered = answeredCount(initialAnswers, questions);

  container.innerHTML = `
    <section class="page">
      <a class="breadcrumb" href="#/mis-estudios">${icon("arrow-left")} Mis estudios</a>

      <header class="detail-head">
        <div class="meta-row meta-row-tight">
          ${etapaBadge(study.etapa)}
          ${statusBadge(assignment.estado)}
        </div>
        <h1>${escapeHtml(study.titulo)}</h1>
        <p class="lede">${escapeHtml(study.descripcion)}</p>
        <div class="meta-row">
          <span>${icon("calendar")} Asignado el ${escapeHtml(
            formatDate(assignment.fecha_asignacion),
          )}</span>
          ${
            assignment.fecha_completado
              ? `<span>${icon("check-circle")} Completado el ${escapeHtml(
                  formatDate(assignment.fecha_completado),
                )}</span>`
              : `<span>${icon("clock")} Pendiente de completar</span>`
          }
        </div>
      </header>

      <div class="detail-layout">
        <div class="card study-body">
          ${passageHtml(study)}
          ${coreContentHtml(study)}

          <section class="content-section" id="responder">
            <h2>Respondé las preguntas</h2>
            ${
              questions.length
                ? `<form id="assignment-form" class="answer-form" novalidate>
                    <div class="form-error" data-form-error role="alert" hidden></div>
                    ${questions
                      .map(
                        (question, index) => `
                        <div class="answer-field">
                          <label class="answer-label" for="answer-${escapeHtml(question.id)}">
                            <span class="question-number">${index + 1}</span>
                            <span>${escapeHtml(question.texto)}</span>
                          </label>
                          <textarea
                            id="answer-${escapeHtml(question.id)}"
                            data-answer-id="${escapeHtml(question.id)}"
                            rows="4"
                            maxlength="4000"
                            placeholder="Escribí tu respuesta…"
                          >${escapeHtml(initialAnswers[question.id] || "")}</textarea>
                        </div>`,
                      )
                      .join("")}
                    <div class="answer-actions">
                      <div class="answer-actions-left">
                        <span class="unsaved-note" id="unsaved-note" hidden>Hay cambios sin guardar</span>
                      </div>
                      <div class="answer-actions-right">
                        <button type="submit" class="btn btn-primary" id="save-answers">
                          ${icon("save")} Guardar respuestas
                        </button>
                        ${
                          isCompleted
                            ? `<span class="badge badge-completado">${icon(
                                "check",
                              )} Lección completada</span>`
                            : `<button type="button" class="btn btn-secondary" id="complete-lesson">
                                ${icon("check")} Marcar como completada
                              </button>`
                        }
                      </div>
                    </div>
                  </form>`
                : infoNote("Este estudio no tiene preguntas para responder.", {
                    tone: "gold",
                    iconName: "info",
                  })
            }
          </section>

          ${activityHtml(study)}
          ${materialHtml(study)}
        </div>

        <aside class="side-stack">
          <article class="card status-card">
            <div class="card-head">
              <h2>Tu lección</h2>
              ${statusBadge(assignment.estado)}
            </div>
            <dl class="info-list">
              <div class="info-row"><dt>Etapa</dt><dd>${escapeHtml(
                ETAPAS.find((etapa) => etapa.id === study.etapa)?.label || "Sin etapa",
              )}</dd></div>
              <div class="info-row"><dt>Asignada</dt><dd>${escapeHtml(
                formatDate(assignment.fecha_asignacion),
              )}</dd></div>
              <div class="info-row"><dt>Completada</dt><dd>${
                assignment.fecha_completado
                  ? escapeHtml(formatDate(assignment.fecha_completado))
                  : "Todavía no"
              }</dd></div>
              <div class="info-row"><dt>Preguntas respondidas</dt><dd id="answered-count">${initialAnswered} de ${questions.length}</dd></div>
            </dl>
            <div class="mt-md">
              ${infoNote(
                isCompleted
                  ? "La lección está completada. Podés seguir editando tus respuestas y guardarlas cuando quieras."
                  : "Tus respuestas se guardan cuando presionás «Guardar respuestas». La lección no se completa automáticamente.",
                { tone: isCompleted ? "green" : "gold", iconName: isCompleted ? "check-circle" : "save" },
              )}
            </div>
          </article>
        </aside>
      </div>
    </section>`;

  const form = container.querySelector("#assignment-form");
  if (!form) return;

  const unsavedNote = container.querySelector("#unsaved-note");
  const saveButton = container.querySelector("#save-answers");
  const completeButton = container.querySelector("#complete-lesson");
  const answeredCountNode = container.querySelector("#answered-count");

  const updateAnsweredCount = () => {
    const answers = answersFromForm(form);
    if (answeredCountNode) {
      answeredCountNode.textContent = `${answeredCount(answers, questions)} de ${questions.length}`;
    }
  };

  form.addEventListener("input", () => {
    if (unsavedNote) unsavedNote.hidden = false;
    updateAnsweredCount();
  });

  async function persistAnswers({ silent = false } = {}) {
    const answers = answersFromForm(form);
    await store.api.saveResponse(assignmentId, answers);
    if (!silent) toast("Respuestas guardadas.");
    if (unsavedNote) unsavedNote.hidden = true;
    return answers;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setButtonLoading(saveButton, true, "Guardando…");
    try {
      await persistAnswers();
    } catch (error) {
      setFormError(form, error.message || "No pudimos guardar tus respuestas.");
    } finally {
      setButtonLoading(saveButton, false);
    }
  });

  completeButton?.addEventListener("click", async () => {
    const answers = answersFromForm(form);
    const unanswered = questions.length - answeredCount(answers, questions);
    const confirmed = await confirmDialog({
      title: "Marcar lección como completada",
      message:
        unanswered > 0
          ? `Quedan <strong>${pluralize(
              unanswered,
              "pregunta sin responder",
              "preguntas sin responder",
            )}</strong>. Tus respuestas guardadas y las que escribiste ahora se conservarán. ¿Querés completar la lección igual?`
          : "Vas a marcar esta lección como completada. Después podrás seguir editando tus respuestas.",
      confirmLabel: "Completar lección",
    });
    if (!confirmed) return;

    setButtonLoading(completeButton, true, "Completando…");
    try {
      await persistAnswers({ silent: true });
      await store.api.completeAssignment(assignmentId);
      toast("¡Lección completada!");
      await renderAssignment(container, assignmentId);
    } catch (error) {
      setFormError(form, error.message || "No pudimos completar la lección.");
      setButtonLoading(completeButton, false);
    }
  });
}

/* ---------------- Mi progreso ---------------- */

function initialsOf(name) {
  return String(name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("es");
}

export async function renderProgress(container) {
  const assignments = await store.api.listMyAssignments();
  const total = assignments.length;
  const completed = assignments.filter((assignment) => assignment.estado === "completado").length;
  const pending = total - completed;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  if (!total) {
    container.innerHTML = `
      <section class="page">
        ${pageHeader({
          eyebrow: "Crecimiento",
          title: "Mi progreso",
          description: "Tu recorrido por las lecciones que te comparte tu discipulador.",
        })}
        ${emptyState({
          iconName: "trending",
          title: "Tu progreso va a aparecer acá",
          text: "Cuando tengas estudios asignados podrás ver cuántos completaste y cómo avanzás en cada etapa.",
        })}
      </section>`;
    return;
  }

  const completedAssignments = assignments
    .filter((assignment) => assignment.estado === "completado")
    .sort((a, b) =>
      String(b.fecha_completado || "").localeCompare(String(a.fecha_completado || "")),
    );

  const stages = ETAPAS.map((etapa) => {
    const stageAssignments = assignments.filter(
      (assignment) => assignment.estudio.etapa === etapa.id,
    );
    const stageCompleted = stageAssignments.filter(
      (assignment) => assignment.estado === "completado",
    ).length;
    return { ...etapa, total: stageAssignments.length, completed: stageCompleted };
  });

  container.innerHTML = `
    <section class="page">
      ${pageHeader({
        eyebrow: "Crecimiento",
        title: "Mi progreso",
        description: "Un panorama de tu recorrido y de los pasos que tenés por delante.",
      })}

      <div class="progress-hero">
        <div>
          <p class="eyebrow">Tu camino hasta hoy</p>
          <h2>
            Cada paso cuenta
          </h2>
          <p>
            La constancia en la Palabra y la disposición del corazón son parte del crecimiento.
            Seguí avanzando con paciencia y con otros.
          </p>
          <div class="progress-hero-stats">
            <div class="progress-hero-stat"><strong>${total}</strong><span>Asignados</span></div>
            <div class="progress-hero-stat"><strong>${completed}</strong><span>Completados</span></div>
            <div class="progress-hero-stat"><strong>${pending}</strong><span>Pendientes</span></div>
          </div>
        </div>
        <div class="ring ring-gold" style="--value: ${percent}" role="img" aria-label="Progreso general: ${percent}%">
          <span class="ring-inner">
            <span class="ring-value">${percent}%</span>
            <span class="ring-label">general</span>
          </span>
        </div>
      </div>

      <section class="mt-xl">
        <h2 class="section-title">Progreso por etapa</h2>
        <div class="stage-grid">
          ${stages
            .map(
              (stage) => `
              <article class="card stage-card">
                <div class="stage-card-head">
                  ${etapaBadge(stage.id)}
                  <span class="badge badge-neutral">${stage.completed}/${stage.total}</span>
                </div>
                <h3>
                  ${escapeHtml(stage.label)}
                </h3>
                <p>${escapeHtml(stage.description)}</p>
                <div class="mt-sm">
                  ${
                    stage.total
                      ? progressMarkup(stage.completed, stage.total)
                      : `<p class="text-muted text-xs">Sin estudios asignados en esta etapa.</p>`
                  }
                </div>
              </article>`,
            )
            .join("")}
        </div>
      </section>

      <section class="mt-xl">
        <h2 class="section-title">Lecciones completadas</h2>
        ${
          completedAssignments.length
            ? `<div class="card card-pad">
                <ul class="completed-list">
                  ${completedAssignments
                    .map(
                      (assignment) => `
                      <li class="completed-row">
                        <span class="completed-check">${icon("check")}</span>
                        <div class="completed-row-text">
                          <strong><a href="#/mis-estudios/${encodeURIComponent(
                            assignment.id,
                          )}">${escapeHtml(assignment.estudio.titulo)}</a></strong>
                          <small>${escapeHtml(
                            assignment.estudio.pasaje_biblico,
                          )} · Completada el ${escapeHtml(
                            formatDate(assignment.fecha_completado),
                          )}</small>
                        </div>
                        ${etapaBadge(assignment.estudio.etapa)}
                      </li>`,
                    )
                    .join("")}
                </ul>
              </div>`
            : infoNote("Todavía no completaste lecciones. Cuando lo hagas, vas a verlas acá.", {
                tone: "gold",
                iconName: "clock",
              })
        }
      </section>
    </section>`;
}
