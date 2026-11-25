import { store } from "./store.js";
import {
  ETAPAS,
  bibleUrl,
  confirmDialog,
  emptyState,
  escapeHtml,
  etapaBadge,
  formatDate,
  formatDateTime,
  getEtapa,
  icon,
  infoNote,
  initials,
  linkifyText,
  openDialog,
  openFormDialog,
  pageHeader,
  pluralize,
  richText,
  setButtonLoading,
  setFormError,
  statusBadge,
  toast,
  uid,
} from "./ui.js";

/* ---------------- Piezas reutilizables de un estudio ---------------- */

export function answerFor(response, questionId) {
  const answers = response?.respuesta;
  if (!answers || typeof answers !== "object") return "";
  const value = answers[questionId];
  return typeof value === "string" ? value : "";
}

export function passageHtml(study) {
  const passage = String(study.pasaje_biblico || "").trim();
  if (!passage) return "";
  return `
    <div class="passage-callout">
      <p class="passage-callout-label">Pasaje bíblico principal</p>
      <p class="passage-callout-value">${escapeHtml(passage)}</p>
      <a href="${escapeHtml(bibleUrl(passage))}" target="_blank" rel="noopener noreferrer">
        ${icon("link")} Abrir pasaje en BibleGateway
      </a>
    </div>`;
}

export function coreContentHtml(study) {
  return `
    <section class="content-section">
      <h2>Introducción</h2>
      <div class="content-text">${richText(study.descripcion)}</div>
    </section>
    <section class="content-section">
      <div class="objective-box">
        <strong>Objetivo de la lección</strong>
        ${escapeHtml(study.objetivo)}
      </div>
    </section>
    <section class="content-section">
      <h2>Enseñanza</h2>
      <div class="content-text">${richText(study.contenido)}</div>
    </section>`;
}

export function questionsPreviewHtml(study) {
  const questions = Array.isArray(study.preguntas) ? study.preguntas : [];
  if (!questions.length) return "";
  return `
    <section class="content-section">
      <h2>Preguntas de reflexión</h2>
      <ul class="questions-preview">
        ${questions
          .map(
            (question, index) => `
            <li>
              <span class="question-number">${index + 1}</span>
              <span>${escapeHtml(question.texto)}</span>
            </li>`,
          )
          .join("")}
      </ul>
    </section>`;
}

export function activityHtml(study) {
  if (!study.actividad) return "";
  return `
    <section class="content-section">
      <h2>Actividad práctica</h2>
      <div class="material-box">${escapeHtml(study.actividad).replace(/\n/g, "<br>")}</div>
    </section>`;
}

export function materialHtml(study) {
  if (!study.material_complementario) return "";
  return `
    <section class="content-section">
      <h2>Material complementario</h2>
      <div class="material-box">${linkifyText(study.material_complementario).replace(/\n/g, "<br>")}</div>
    </section>`;
}

export function openResponsesDialog({ title, subtitle, study, assignment }) {
  const questions = Array.isArray(study.preguntas) ? study.preguntas : [];
  const hasResponse = Boolean(assignment.respuesta);
  const blocks = questions.length
    ? questions
        .map((question, index) => {
          const answer = answerFor(assignment.respuesta, question.id).trim();
          return `
            <div class="response-block">
              <div class="response-question">
                <span class="question-number">${index + 1}</span>
                <span>${escapeHtml(question.texto)}</span>
              </div>
              <div class="response-answer ${answer ? "" : "response-empty"}">
                ${answer ? escapeHtml(answer) : "Sin responder."}
              </div>
            </div>`;
        })
        .join("")
    : infoNote("Este estudio no tiene preguntas de reflexión.", { iconName: "info" });

  const meta = `
    <div class="meta-row meta-row-spaced">
      ${statusBadge(assignment.estado)}
      ${
        assignment.fecha_completado
          ? `<span>${icon("check-circle")} Completado el ${escapeHtml(
              formatDate(assignment.fecha_completado),
            )}</span>`
          : `<span>${icon("clock")} Asignado el ${escapeHtml(
              formatDate(assignment.fecha_asignacion),
            )}</span>`
      }
      ${
        hasResponse
          ? `<span>${icon("edit")} Actualizado el ${escapeHtml(
              formatDateTime(assignment.respuesta.fecha_actualizacion),
            )}</span>`
          : ""
      }
    </div>`;

  openDialog({
    title,
    subtitle,
    wide: true,
    content: `<div class="modal-content">${meta}${
      hasResponse
        ? blocks
        : questions.length
          ? infoNote("Todavía no hay respuestas guardadas para esta asignación.", {
              tone: "gold",
              iconName: "clock",
            })
          : blocks
    }</div>`,
    footer: `<div class="modal-actions"><button type="button" class="btn btn-secondary" data-dialog-close>Cerrar</button></div>`,
  });
}

/* ---------------- Lista de estudios ---------------- */

function studyCard(study) {
  const questions = Array.isArray(study.preguntas) ? study.preguntas.length : 0;
  const stats = study.stats || { total: 0, completados: 0 };
  return `
    <a class="card study-card" href="#/estudios/${encodeURIComponent(study.id)}" data-study-etapa="${escapeHtml(
      study.etapa,
    )}">
      <div class="study-card-top">
        ${etapaBadge(study.etapa)}
        ${
          stats.total
            ? `<span class="badge badge-completado">${stats.completados}/${stats.total} completados</span>`
            : `<span class="badge badge-neutral">Sin asignar</span>`
        }
      </div>
      <h2>${escapeHtml(study.titulo)}</h2>
      <p class="study-card-desc">${escapeHtml(study.descripcion)}</p>
      <div class="study-card-foot">
        <span class="passage">${icon("book")} ${escapeHtml(study.pasaje_biblico)}</span>
        <span>${pluralize(questions, "pregunta", "preguntas")}</span>
      </div>
    </a>`;
}

export async function renderStudies(container) {
  const studies = await store.api.listStudies();
  const countByStage = new Map(
    ETAPAS.map((etapa) => [
      etapa.id,
      studies.filter((study) => study.etapa === etapa.id).length,
    ]),
  );

  const createButton = `<a class="btn btn-primary" href="#/estudios/nuevo">${icon("plus")} Crear estudio</a>`;

  container.innerHTML = `
    <section class="page">
      ${pageHeader({
        eyebrow: "Formación",
        title: "Estudios bíblicos",
        description:
          "Creá lecciones, organizalas por etapa y compartilas con tus discípulos. Ellos podrán leerlas y responder desde su cuenta.",
        actions: createButton,
      })}
      ${
        studies.length
          ? `
            <div class="filter-bar" role="group" aria-label="Filtrar estudios por etapa">
              <button type="button" class="filter-chip active" data-filter="all" aria-pressed="true">
                Todos <span class="filter-count">${studies.length}</span>
              </button>
              ${ETAPAS.map(
                (etapa) => `
                <button type="button" class="filter-chip" data-filter="${etapa.id}" aria-pressed="false">
                  ${escapeHtml(etapa.label)} <span class="filter-count">${countByStage.get(etapa.id) || 0}</span>
                </button>`,
              ).join("")}
            </div>
            <div class="grid-cards" id="studies-grid">
              ${studies.map(studyCard).join("")}
            </div>
            <div id="stage-empty" class="mt-md" hidden>
              ${emptyState({
                iconName: "book",
                title: "No hay estudios en esta etapa",
                text: "Podés crear uno nuevo y asignarlo cuando esté listo.",
                action: `<a class="btn btn-secondary" href="#/estudios/nuevo">${icon("plus")} Crear estudio</a>`,
              })}
            </div>`
          : emptyState({
              iconName: "book",
              title: "Todavía no creaste estudios",
              text: "Prepará tu primera lección bíblica con objetivo, enseñanza, preguntas y una actividad práctica.",
              action: `<a class="btn btn-primary" href="#/estudios/nuevo">${icon("plus")} Crear primer estudio</a>`,
            })
      }
    </section>`;

  const buttons = container.querySelectorAll("[data-filter]");
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      buttons.forEach((candidate) => {
        const active = candidate === button;
        candidate.classList.toggle("active", active);
        candidate.setAttribute("aria-pressed", String(active));
      });
      const filter = button.dataset.filter;
      let visible = 0;
      container.querySelectorAll("[data-study-etapa]").forEach((card) => {
        const show = filter === "all" || card.dataset.studyEtapa === filter;
        card.hidden = !show;
        if (show) visible += 1;
      });
      const empty = container.querySelector("#stage-empty");
      if (empty) empty.hidden = visible > 0;
    });
  });
}

/* ---------------- Detalle de un estudio ---------------- */

async function openAssignStudyDialog(study, detail, container) {
  const disciples = await store.api.listDisciples();
  const assignedIds = new Set(detail.assignments.map((assignment) => assignment.discipulo_id));
  const available = disciples.filter((link) => !assignedIds.has(link.discipulo.id));

  if (!available.length) {
    toast("Ya asignaste este estudio a todos tus discípulos.", "info");
    return;
  }

  openFormDialog({
    title: "Asignar estudio",
    subtitle: study.titulo,
    fields: `
      <div class="assignment-check-list">
        ${available
          .map(
            (link) => `
            <label class="check-row">
              <input type="checkbox" name="discipulos" value="${escapeHtml(link.discipulo.id)}">
              <span>
                ${escapeHtml(link.discipulo.nombre)}
                <small>${escapeHtml(link.discipulo.email)}</small>
              </span>
            </label>`,
          )
          .join("")}
      </div>`,
    submitLabel: "Asignar a seleccionados",
    onSubmit: async (form) => {
      const selected = [...form.querySelectorAll('input[name="discipulos"]:checked')].map(
        (input) => input.value,
      );
      if (!selected.length) throw new Error("Seleccioná al menos un discípulo.");
      const result = await store.api.assignStudy(study.id, selected);
      toast(
        result.asignados
          ? `${pluralize(result.asignados, "asignación creada", "asignaciones creadas")}.`
          : "Las asignaciones ya existían.",
      );
      await renderStudy(container, study.id);
    },
  });
}

export async function renderStudy(container, studyId) {
  const detail = await store.api.getStudy(studyId);
  const { study, assignments } = detail;
  const total = assignments.length;
  const completed = assignments.filter((assignment) => assignment.estado === "completado").length;
  const assignmentsById = new Map(assignments.map((assignment) => [assignment.id, assignment]));

  container.innerHTML = `
    <section class="page">
      <a class="breadcrumb" href="#/estudios">${icon("arrow-left")} Estudios bíblicos</a>

      <header class="detail-head">
        <div class="meta-row meta-row-tight">
          ${etapaBadge(study.etapa)}
          <span>${icon("calendar")} Creado el ${escapeHtml(formatDate(study.fecha_creacion))}</span>
        </div>
        <h1>${escapeHtml(study.titulo)}</h1>
        <p class="lede">${escapeHtml(study.descripcion)}</p>
      </header>

      <div class="detail-layout">
        <article class="card study-body">
          ${passageHtml(study)}
          ${coreContentHtml(study)}
          ${questionsPreviewHtml(study)}
          ${activityHtml(study)}
          ${materialHtml(study)}
        </article>

        <aside class="side-stack">
          <article class="card status-card">
            <div class="card-head">
              <div>
                <h2>Asignaciones</h2>
                <p class="text-muted text-xs">
                  ${total ? `${completed} de ${total} completadas` : "Sin asignaciones"}
                </p>
              </div>
              <button type="button" class="btn btn-secondary btn-sm" data-assign-study>
                ${icon("plus")} Asignar
              </button>
            </div>
            ${
              assignments.length
                ? `<ul class="assignment-list">
                    ${assignments
                      .map(
                        (assignment) => `
                        <li class="assignment-row">
                          <span class="avatar avatar-sm">${escapeHtml(
                            initials(assignment.discipulo?.nombre || "?"),
                          )}</span>
                          <div class="assignment-row-text">
                            <strong>${escapeHtml(
                              assignment.discipulo?.nombre || "Discípulo sin perfil",
                            )}</strong>
                            <small>${statusBadge(assignment.estado)}</small>
                          </div>
                          <button type="button" class="btn btn-ghost btn-sm" data-view-responses="${escapeHtml(
                            assignment.id,
                          )}" aria-label="Ver respuestas de ${escapeHtml(
                            assignment.discipulo?.nombre || "discípulo",
                          )}">
                            ${icon("eye")}
                          </button>
                        </li>`,
                      )
                      .join("")}
                  </ul>`
                : `<p class="text-muted text-sm">Compartí este estudio con uno o más discípulos para comenzar.</p>`
            }
          </article>

          <article class="card card-pad">
            <h2 class="card-title">Acciones</h2>
            <div class="actions-stack mt-sm">
              <a class="btn btn-secondary" href="#/estudios/${encodeURIComponent(
                study.id,
              )}/editar">${icon("edit")} Editar estudio</a>
              <button type="button" class="btn btn-danger-ghost" data-delete-study>
                ${icon("trash")} Eliminar estudio
              </button>
            </div>
            <div class="mt-sm">
              ${infoNote(
                total
                  ? "Este estudio tiene asignaciones y respuestas. Si lo eliminás, también se eliminarán."
                  : "Este estudio todavía no tiene asignaciones.",
                { tone: total ? "danger" : "neutral", iconName: total ? "alert" : "info" },
              )}
            </div>
          </article>
        </aside>
      </div>
    </section>`;

  container.querySelector("[data-assign-study]").addEventListener("click", () => {
    openAssignStudyDialog(study, detail, container);
  });

  container.querySelectorAll("[data-view-responses]").forEach((button) => {
    button.addEventListener("click", () => {
      const assignment = assignmentsById.get(button.dataset.viewResponses);
      if (!assignment) return;
      openResponsesDialog({
        title: study.titulo,
        subtitle: assignment.discipulo?.nombre
          ? `Respuestas de ${assignment.discipulo.nombre}`
          : "Respuestas del discípulo",
        study,
        assignment,
      });
    });
  });

  container.querySelector("[data-delete-study]").addEventListener("click", async () => {
    const confirmed = await confirmDialog({
      title: "Eliminar estudio",
      message: total
        ? `Vas a eliminar <strong>${escapeHtml(study.titulo)}</strong>. También se eliminarán <strong>${pluralize(
            total,
            "asignación",
            "asignaciones",
          )}</strong> y las respuestas guardadas de tus discípulos. Esta acción no se puede deshacer.`
        : `Vas a eliminar <strong>${escapeHtml(study.titulo)}</strong>. Esta acción no se puede deshacer.`,
      confirmLabel: "Eliminar estudio",
      danger: true,
    });
    if (!confirmed) return;
    try {
      await store.api.deleteStudy(study.id);
      toast("Estudio eliminado.");
      window.location.hash = "#/estudios";
    } catch (error) {
      toast(error.message || "No pudimos eliminar el estudio.", "error");
    }
  });
}

/* ---------------- Crear / editar estudio ---------------- */

function option(value, label, selected) {
  return `<option value="${escapeHtml(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(
    label,
  )}</option>`;
}

function questionRowHtml(question = {}) {
  return `
    <div class="question-row" data-question-id="${escapeHtml(question.id || uid("q"))}">
      <span class="question-number">1</span>
      <input type="text" value="${escapeHtml(question.texto || "")}" placeholder="Escribí una pregunta de reflexión" maxlength="300" aria-label="Pregunta de reflexión">
      <button type="button" class="btn btn-icon btn-ghost" data-remove-question aria-label="Eliminar pregunta">
        ${icon("trash")}
      </button>
    </div>`;
}

function renumberQuestions(container) {
  container.querySelectorAll(".question-row").forEach((row, index) => {
    const number = row.querySelector(".question-number");
    if (number) number.textContent = String(index + 1);
  });
}

export async function renderStudyForm(container, studyId = null) {
  let study = null;
  let assignmentCount = 0;
  if (studyId) {
    const detail = await store.api.getStudy(studyId);
    study = detail.study;
    assignmentCount = detail.assignments.length;
  }

  const isEdit = Boolean(study);
  const questions = Array.isArray(study?.preguntas) && study.preguntas.length
    ? study.preguntas
    : [{ id: uid("q"), texto: "" }];

  container.innerHTML = `
    <section class="page">
      <a class="breadcrumb" href="${
        isEdit ? `#/estudios/${encodeURIComponent(study.id)}` : "#/estudios"
      }">${icon("arrow-left")} ${isEdit ? "Volver al estudio" : "Estudios bíblicos"}</a>

      ${pageHeader({
        eyebrow: isEdit ? "Editar estudio" : "Nuevo estudio",
        title: isEdit ? "Editar estudio bíblico" : "Crear estudio bíblico",
        description:
          "Completá la lección con claridad. Después podrás asignarla a uno o varios discípulos.",
      })}

      <form id="study-form" class="card card-pad study-form" novalidate>
        <div class="form-error" data-form-error role="alert" hidden></div>

        ${
          isEdit && assignmentCount
            ? infoNote(
                `Este estudio tiene ${pluralize(
                  assignmentCount,
                  "asignación activa",
                  "asignaciones activas",
                )}. Si eliminás una pregunta, las respuestas que ya existan para esa pregunta dejarán de mostrarse, pero no se borrarán de la base.`,
                { tone: "gold", iconName: "alert" },
              )
            : ""
        }

        <div class="field">
          <label for="study-title">Título</label>
          <input type="text" id="study-title" name="titulo" maxlength="120" placeholder="Ej.: El regalo de la gracia" value="${escapeHtml(
            study?.titulo || "",
          )}" required>
        </div>

        <div class="field">
          <label for="study-description">Descripción o introducción</label>
          <textarea id="study-description" name="descripcion" rows="3" maxlength="600" placeholder="Presentá brevemente de qué trata la lección." required>${escapeHtml(
            study?.descripcion || "",
          )}</textarea>
        </div>

        <div class="field-grid">
          <div class="field">
            <label for="study-stage">Etapa</label>
            <select id="study-stage" name="etapa" required>
              <option value="">Seleccioná una etapa</option>
              ${ETAPAS.map((etapa) => option(etapa.id, etapa.label, study?.etapa)).join("")}
            </select>
          </div>
          <div class="field">
            <label for="study-passage">Pasaje bíblico principal</label>
            <input type="text" id="study-passage" name="pasaje_biblico" maxlength="120" placeholder="Ej.: Efesios 2:1-10" value="${escapeHtml(
              study?.pasaje_biblico || "",
            )}" required>
          </div>
        </div>

        <div class="field">
          <label for="study-objective">Objetivo de la lección</label>
          <textarea id="study-objective" name="objetivo" rows="2" maxlength="400" placeholder="¿Qué querés que el discípulo comprenda o ponga en práctica?" required>${escapeHtml(
            study?.objetivo || "",
          )}</textarea>
        </div>

        <div class="field">
          <label for="study-content">Contenido de la enseñanza</label>
          <textarea id="study-content" name="contenido" rows="10" maxlength="12000" placeholder="Desarrollá la enseñanza. Podés separar párrafos con una línea en blanco." required>${escapeHtml(
            study?.contenido || "",
          )}</textarea>
          <p class="field-hint">Los saltos de párrafo se respetan al mostrar el estudio.</p>
        </div>

        <div class="form-section">
          <div class="form-section-head">
            <h2>Preguntas de reflexión</h2>
            <p>Agregá al menos una pregunta. Las respuestas quedarán vinculadas a cada pregunta.</p>
          </div>
          <div class="question-editor" id="questions-list">
            ${questions.map(questionRowHtml).join("")}
          </div>
          <button type="button" class="btn btn-ghost btn-sm mt-sm" id="add-question">
            ${icon("plus")} Agregar pregunta
          </button>
        </div>

        <div class="form-section">
          <div class="field">
            <label for="study-activity">Actividad o tarea práctica</label>
            <textarea id="study-activity" name="actividad" rows="3" maxlength="1200" placeholder="Proponé un paso concreto para esta semana." required>${escapeHtml(
              study?.actividad || "",
            )}</textarea>
          </div>
        </div>

        <div class="form-section">
          <div class="field">
            <label for="study-material">Material complementario <span class="text-muted">(opcional)</span></label>
            <textarea id="study-material" name="material_complementario" rows="3" maxlength="2000" placeholder="Lecturas, enlaces o recursos para profundizar.">${escapeHtml(
              study?.material_complementario || "",
            )}</textarea>
          </div>
        </div>

        <div class="form-actions">
          <a class="btn btn-ghost form-actions-left" href="${
            isEdit ? `#/estudios/${encodeURIComponent(study.id)}` : "#/estudios"
          }">Cancelar</a>
          <button type="submit" class="btn btn-primary" id="study-submit">
            ${icon("save")} ${isEdit ? "Guardar cambios" : "Crear estudio"}
          </button>
        </div>
      </form>
    </section>`;

  const form = container.querySelector("#study-form");
  const questionsList = container.querySelector("#questions-list");

  function addQuestionRow(value = "") {
    const wrapper = document.createElement("div");
    wrapper.className = "question-row";
    wrapper.dataset.questionId = uid("q");
    wrapper.innerHTML = `
      <span class="question-number">1</span>
      <input type="text" placeholder="Escribí una pregunta de reflexión" maxlength="300" aria-label="Pregunta de reflexión">
      <button type="button" class="btn btn-icon btn-ghost" data-remove-question aria-label="Eliminar pregunta">
        ${icon("trash")}
      </button>`;
    wrapper.querySelector("input").value = value;
    questionsList.appendChild(wrapper);
    renumberQuestions(container);
    wrapper.querySelector("input").focus();
  }

  container.querySelector("#add-question").addEventListener("click", () => addQuestionRow());

  questionsList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-question]");
    if (!button) return;
    const row = button.closest(".question-row");
    row?.remove();
    if (!questionsList.querySelector(".question-row")) addQuestionRow();
    renumberQuestions(container);
  });

  renumberQuestions(container);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = container.querySelector("#study-submit");

    const titulo = form.elements.titulo.value.trim();
    const descripcion = form.elements.descripcion.value.trim();
    const etapa = form.elements.etapa.value;
    const pasaje = form.elements.pasaje_biblico.value.trim();
    const objetivo = form.elements.objetivo.value.trim();
    const contenido = form.elements.contenido.value.trim();
    const actividad = form.elements.actividad.value.trim();
    const material = form.elements.material_complementario.value.trim();
    const preguntas = [...questionsList.querySelectorAll(".question-row")]
      .map((row) => ({
        id: row.dataset.questionId,
        texto: row.querySelector("input").value.trim(),
      }))
      .filter((question) => question.texto);

    const invalid = (message, fieldId) => {
      setFormError(form, message);
      if (fieldId) container.querySelector(`#${fieldId}`)?.focus();
    };

    if (titulo.length < 4) {
      invalid("El título debe tener al menos 4 caracteres.", "study-title");
      return;
    }
    if (descripcion.length < 10) {
      invalid("La descripción debe tener al menos 10 caracteres.", "study-description");
      return;
    }
    if (!getEtapa(etapa)) {
      invalid("Seleccioná una de las cuatro etapas.", "study-stage");
      return;
    }
    if (pasaje.length < 3) {
      invalid("Ingresá el pasaje bíblico principal.", "study-passage");
      return;
    }
    if (objetivo.length < 10) {
      invalid("El objetivo debe tener al menos 10 caracteres.", "study-objective");
      return;
    }
    if (contenido.length < 30) {
      invalid("La enseñanza debe tener al menos 30 caracteres.", "study-content");
      return;
    }
    if (!preguntas.length) {
      invalid("Agregá al menos una pregunta de reflexión.", "questions-list");
      return;
    }
    if (preguntas.length > 20) {
      invalid("Podés agregar hasta 20 preguntas por estudio.", "questions-list");
      return;
    }
    if (actividad.length < 5) {
      invalid("Ingresá una actividad o tarea práctica.", "study-activity");
      return;
    }

    const payload = {
      titulo,
      descripcion,
      etapa,
      pasaje_biblico: pasaje,
      objetivo,
      contenido,
      preguntas,
      actividad,
      material_complementario: material,
    };

    setButtonLoading(submit, true, "Guardando…");
    try {
      const saved = isEdit
        ? await store.api.updateStudy(study.id, payload)
        : await store.api.createStudy(payload);
      toast(isEdit ? "Cambios guardados." : "Estudio creado.");
      window.location.hash = `#/estudios/${encodeURIComponent(saved.id)}`;
    } catch (error) {
      setFormError(form, error.message || "No pudimos guardar el estudio.");
    } finally {
      setButtonLoading(submit, false);
    }
  });
}
