import { store } from "./store.js";
import { openResponsesDialog } from "./estudios.js";
import { copyText, invitationUrl, whatsappInviteUrl } from "./invite.js";
import {
  ETAPAS,
  escapeHtml,
  emptyState,
  formatDate,
  icon,
  infoNote,
  initials,
  openDialog,
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

function invitationRow(invitation) {
  const link = invitationUrl(invitation.token);
  const whatsapp = whatsappInviteUrl({
    nombre: invitation.nombre,
    discipler: store.user?.nombre || "tu discipulador",
    link,
  });
  return `
    <li class="invite-row">
      <div class="invite-identity">
        <span class="avatar avatar-sm">${escapeHtml(initials(invitation.nombre))}</span>
        <div class="invite-identity-text">
          <strong>${escapeHtml(invitation.nombre)}</strong>
          <small>${escapeHtml(invitation.email)}</small>
        </div>
      </div>
      <span class="invite-expiry">${icon("clock")} Vence el ${escapeHtml(
        formatDate(invitation.fecha_vencimiento),
      )}</span>
      <div class="invite-actions">
        <button type="button" class="btn btn-ghost btn-sm" data-copy-invite="${escapeHtml(
          invitation.id,
        )}">${icon("copy")} Copiar link</button>
        <a class="btn btn-ghost btn-sm" href="${escapeHtml(
          whatsapp,
        )}" target="_blank" rel="noopener noreferrer">${icon("whatsapp")} WhatsApp</a>
        <button type="button" class="btn btn-danger-ghost btn-sm" data-revoke-invite="${escapeHtml(
          invitation.id,
        )}">${icon("x")} Revocar</button>
      </div>
    </li>`;
}

function invitationsSection(invitations) {
  if (!invitations.length) return "";
  return `
    <article class="card card-pad invitations-card">
      <div class="card-head">
        <div>
          <h2 class="card-title">Invitaciones pendientes</h2>
          <p>Links personales que todavía no fueron aceptados.</p>
        </div>
        <span class="badge badge-neutral">${invitations.length}</span>
      </div>
      <ul class="invite-list">${invitations.map(invitationRow).join("")}</ul>
    </article>`;
}

function openShareDialog(invitation) {
  const link = invitationUrl(invitation.token);
  const whatsapp = whatsappInviteUrl({
    nombre: invitation.nombre,
    discipler: store.user?.nombre || "tu discipulador",
    link,
  });

  const dialogElement = openDialog({
    title: "Compartir invitación",
    subtitle: `Link personal para ${invitation.nombre}`,
    content: `
      <div class="modal-content">
        <div class="field">
          <label for="invite-link">Link de invitación</label>
          <input type="text" id="invite-link" readonly value="${escapeHtml(link)}">
          <p class="field-hint">Solo puede aceptarlo una cuenta con el email ${escapeHtml(
            invitation.email,
          )}.</p>
        </div>
        <div class="invite-share-actions">
          <button type="button" class="btn btn-secondary" data-copy-link>${icon(
            "copy",
          )} Copiar link</button>
          <a class="btn btn-primary" href="${escapeHtml(
            whatsapp,
          )}" target="_blank" rel="noopener noreferrer">${icon(
            "whatsapp",
          )} Compartir por WhatsApp</a>
        </div>
        ${infoNote(
          `Vence el ${escapeHtml(
            formatDate(invitation.fecha_vencimiento),
          )}. Si lo revocás, el link deja de funcionar.`,
          { tone: "gold", iconName: "clock" },
        )}
      </div>`,
    footer: `<div class="modal-actions"><button type="button" class="btn btn-ghost" data-dialog-close>Listo</button></div>`,
  });

  dialogElement.querySelector("[data-copy-link]")?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    try {
      await copyText(link);
      toast("Link copiado.");
      button.innerHTML = `${icon("check")} Copiado`;
    } catch (error) {
      toast(error.message || "No pudimos copiar el link.", "error");
    }
  });
}

function openInviteDialog(container) {
  openFormDialog({
    title: "Invitar discípulo",
    subtitle:
      "Creá un link personal para que la persona active su cuenta y quede vinculada a vos.",
    fields: `
      <div class="field">
        <label for="invite-name">Nombre y apellido</label>
        <input type="text" id="invite-name" name="nombre" autocomplete="off" placeholder="Nombre de la persona" maxlength="80" required>
      </div>
      <div class="field">
        <label for="invite-email">Email</label>
        <input type="email" id="invite-email" name="email" inputmode="email" autocomplete="off" placeholder="nombre@correo.com" required>
        <p class="field-hint">El link solo podrá aceptarse con este email.</p>
      </div>
      ${infoNote(
        "Después de crearlo vas a poder copiar el link o compartirlo por WhatsApp.",
        { tone: "gold", iconName: "link" },
      )}`,
    submitLabel: "Crear link de invitación",
    onSubmit: async (form) => {
      const nombre = form.elements.nombre.value.trim().replace(/\s+/g, " ");
      const email = form.elements.email.value.trim();
      if (nombre.length < 2) throw new Error("Ingresá el nombre de la persona.");
      if (!validateEmail(email)) throw new Error("Ingresá un email válido.");
      const invitation = await store.api.createInvitation({ nombre, email });
      toast("Invitación creada.");
      await renderDisciples(container);
      openShareDialog(invitation);
      return false;
    },
  });
}

function openRevokeDialog(invitation, container) {
  openFormDialog({
    title: "Revocar invitación",
    subtitle: `El link de ${invitation.nombre} dejará de funcionar.`,
    fields: infoNote(
      "La persona ya no podrá aceptar esta invitación. Si la necesitás, podés generar un link nuevo más adelante.",
      { tone: "danger", iconName: "alert" },
    ),
    submitLabel: "Revocar link",
    submitClass: "btn-danger",
    onSubmit: async () => {
      await store.api.revokeInvitation(invitation.id);
      toast("Invitación revocada.", "info");
      await renderDisciples(container);
    },
  });
}

export async function renderDisciples(container) {
  const [disciples, invitations] = await Promise.all([
    store.api.listDisciples(),
    store.api.listInvitations(),
  ]);

  const inviteButton = `<button type="button" class="btn btn-primary" data-invite-disciple>${icon(
    "plus",
  )} Invitar discípulo</button>`;

  container.innerHTML = `
    <section class="page">
      ${pageHeader({
        eyebrow: "Acompañamiento",
        title: "Mis discípulos",
        description:
          "Las personas que estás acompañando. Compartí un link personal para sumar a alguien nuevo y entrá en cada ficha para ver su progreso.",
        actions: inviteButton,
      })}
      ${invitationsSection(invitations)}
      ${
        disciples.length
          ? `<div class="grid-cards">${disciples.map(discipleCard).join("")}</div>`
          : emptyState({
              iconName: "users",
              title: "Todavía no acompañás a nadie",
              text: "Invitá a tu primer discípulo con un link personal. Al abrirlo podrá crear su cuenta y quedar vinculado a vos.",
              action: `<button type="button" class="btn btn-primary" data-invite-disciple>${icon(
                "plus",
              )} Invitar primer discípulo</button>`,
            })
      }
    </section>`;

  const invitationsById = new Map(invitations.map((invitation) => [invitation.id, invitation]));

  container.querySelectorAll("[data-invite-disciple]").forEach((button) => {
    button.addEventListener("click", () => openInviteDialog(container));
  });

  container.querySelectorAll("[data-copy-invite]").forEach((button) => {
    button.addEventListener("click", async () => {
      const invitation = invitationsById.get(button.dataset.copyInvite);
      if (!invitation) return;
      try {
        await copyText(invitationUrl(invitation.token));
        toast("Link copiado.");
      } catch (error) {
        toast(error.message || "No pudimos copiar el link.", "error");
      }
    });
  });

  container.querySelectorAll("[data-revoke-invite]").forEach((button) => {
    button.addEventListener("click", () => {
      const invitation = invitationsById.get(button.dataset.revokeInvite);
      if (invitation) openRevokeDialog(invitation, container);
    });
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
