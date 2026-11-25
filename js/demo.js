/**
 * MODO DEMOSTRACIÓN
 * ------------------------------------------------------------------
 * Este backend guarda todo en localStorage del navegador. NO se conecta a
 * Supabase y NO debe confundirse con datos reales: la interfaz lo indica de
 * forma permanente y las cuentas son de ejemplo.
 *
 * Este archivo queda separado del backend real (js/supabase.js) para que la
 * diferencia entre ambos sea explícita.
 */

import { createInviteToken } from "./invite.js";

const DB_KEY = "discipulos.demo.db.v1";
const SESSION_KEY = "discipulos.demo.session.v1";
const APP_SALT = "discipulos-demo-local";
const INVITATION_DAYS = 14;

// Cuentas de ejemplo de versiones anteriores. Se eliminan al abrir la app
// para que la demostración arranque vacía, sin borrar cuentas propias.
const LEGACY_DEMO_EMAILS = ["ana@demo.com", "lucas@demo.com", "sofia@demo.com"];
const LEGACY_DEMO_IDS = ["u_ana_demo", "u_lucas_demo", "u_sofia_demo"];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

async function hashPassword(password) {
  const bytes = new TextEncoder().encode(`${APP_SALT}::${password}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function readSessionId() {
  return localStorage.getItem(SESSION_KEY);
}

function writeSessionId(id) {
  if (id) localStorage.setItem(SESSION_KEY, id);
  else localStorage.removeItem(SESSION_KEY);
}

function readDb() {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn("Datos de demostración ilegibles. Se reiniciarán.", error);
    localStorage.removeItem(DB_KEY);
    return null;
  }
}

function writeDb(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function publicUser(user) {
  if (!user) return null;
  const { password_hash: _password, ...profile } = user;
  return clone(profile);
}

function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value ?? "").trim());
}

function invitationState(invitation) {
  if (invitation.estado === "pendiente" && new Date(invitation.fecha_vencimiento) < new Date()) {
    return "expirada";
  }
  return invitation.estado;
}

function invitationDaysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function nameOf(profile) {
  return String(profile?.nombre ?? "").trim();
}

function requireSession(db) {
  const sessionId = readSessionId();
  const user = db.users.find((candidate) => candidate.id === sessionId);
  if (!user) throw new Error("Tu sesión de demostración expiró. Volvé a iniciar sesión.");
  return user;
}

function buildSeed() {
  return {
    users: [],
    discipleships: [],
    studies: [],
    assignments: [],
    responses: [],
    observations: [],
    invitations: [],
  };
}

function removeLegacyDemoData(db) {
  if (!Array.isArray(db.users)) return false;
  const legacyUsers = db.users.filter(
    (user) =>
      LEGACY_DEMO_IDS.includes(user.id) ||
      LEGACY_DEMO_EMAILS.includes(normalizeEmail(user.email)),
  );
  if (!legacyUsers.length) return false;

  const ids = new Set(legacyUsers.map((user) => user.id));
  const removedStudyIds = new Set(
    (db.studies || []).filter((study) => ids.has(study.creador_id)).map((study) => study.id),
  );
  const removedAssignmentIds = new Set(
    (db.assignments || [])
      .filter(
        (assignment) =>
          ids.has(assignment.discipulo_id) ||
          ids.has(assignment.asignado_por) ||
          removedStudyIds.has(assignment.estudio_id),
      )
      .map((assignment) => assignment.id),
  );

  db.users = db.users.filter((user) => !ids.has(user.id));
  db.discipleships = (db.discipleships || []).filter(
    (link) => !ids.has(link.discipulador_id) && !ids.has(link.discipulo_id),
  );
  db.studies = (db.studies || []).filter((study) => !removedStudyIds.has(study.id));
  db.assignments = (db.assignments || []).filter(
    (assignment) => !removedAssignmentIds.has(assignment.id),
  );
  db.responses = (db.responses || []).filter(
    (response) =>
      !ids.has(response.discipulo_id) && !removedAssignmentIds.has(response.asignacion_id),
  );
  db.observations = (db.observations || []).filter(
    (observation) =>
      !ids.has(observation.discipulador_id) && !ids.has(observation.discipulo_id),
  );
  db.invitations = (db.invitations || []).filter(
    (invitation) =>
      !ids.has(invitation.discipulador_id) &&
      !LEGACY_DEMO_EMAILS.includes(normalizeEmail(invitation.email)),
  );

  const sessionId = readSessionId();
  if (sessionId && ids.has(sessionId)) writeSessionId(null);
  return true;
}

async function ensureSeed() {
  let db = readDb();
  if (db) {
    let changed = removeLegacyDemoData(db);
    if (!Array.isArray(db.invitations)) {
      db.invitations = [];
      changed = true;
    }
    if (changed) writeDb(db);
    return db;
  }
  db = buildSeed();
  writeDb(db);
  return db;
}

export async function createDemoBackend() {
  await ensureSeed();

  function getUserFromSession(db) {
    const sessionId = readSessionId();
    return db.users.find((user) => user.id === sessionId) || null;
  }

  async function getCurrentUser() {
    const db = readDb();
    if (!db) return null;
    const user = getUserFromSession(db);
    if (!user) {
      writeSessionId(null);
      return null;
    }
    return publicUser(user);
  }

  async function signIn(email, password) {
    const db = readDb();
    const normalizedEmail = normalizeEmail(email);
    const user = db.users.find((candidate) => candidate.email === normalizedEmail);
    if (!user) {
      throw new Error(
        "No encontramos una cuenta con ese email en este navegador. En modo demostración las cuentas son locales: creá una nueva.",
      );
    }
    const hash = await hashPassword(password);
    if (hash !== user.password_hash) {
      throw new Error("La contraseña no es correcta. Intentá nuevamente.");
    }
    writeSessionId(user.id);
    return publicUser(user);
  }

  async function signUp({ nombre, email, password, rol }) {
    const db = readDb();
    const cleanName = String(nombre ?? "").trim();
    const normalizedEmail = normalizeEmail(email);
    if (cleanName.length < 2) throw new Error("Ingresá tu nombre completo.");
    if (!normalizedEmail) throw new Error("Ingresá un email válido.");
    if (String(password ?? "").length < 8) {
      throw new Error("La contraseña debe tener al menos 8 caracteres.");
    }
    if (!["discipulador", "discipulo"].includes(rol)) {
      throw new Error("Seleccioná cómo vas a usar la aplicación.");
    }
    if (db.users.some((user) => user.email === normalizedEmail)) {
      throw new Error("Ya existe una cuenta con ese email.");
    }

    const user = {
      id: `u_${crypto.randomUUID()}`,
      nombre: cleanName,
      email: normalizedEmail,
      password_hash: await hashPassword(password),
      rol,
      fecha_creacion: new Date().toISOString(),
    };
    db.users.push(user);
    writeDb(db);
    writeSessionId(user.id);
    return { user: publicUser(user), needsConfirmation: false };
  }

  async function signOut() {
    writeSessionId(null);
  }

  async function updateProfile({ nombre }) {
    const db = readDb();
    const me = requireSession(db);
    const cleanName = String(nombre ?? "").trim();
    if (cleanName.length < 2) throw new Error("Ingresá un nombre válido.");
    me.nombre = cleanName;
    writeDb(db);
    return publicUser(me);
  }

  async function listDisciples() {
    const db = readDb();
    const me = requireSession(db);
    const links = db.discipleships.filter((link) => link.discipulador_id === me.id);
    const result = links
      .map((link) => {
        const disciple = db.users.find((user) => user.id === link.discipulo_id);
        if (!disciple) return null;
        const assignments = db.assignments.filter(
          (assignment) =>
            assignment.discipulo_id === link.discipulo_id && assignment.asignado_por === me.id,
        );
        return {
          ...clone(link),
          discipulo: publicUser(disciple),
          stats: {
            total: assignments.length,
            completados: assignments.filter((assignment) => assignment.estado === "completado")
              .length,
          },
        };
      })
      .filter(Boolean)
      .sort((a, b) => nameOf(a.discipulo).localeCompare(nameOf(b.discipulo), "es"));
    return result;
  }

  async function createInvitation({ nombre, email }) {
    const db = readDb();
    const me = requireSession(db);
    if (me.rol !== "discipulador") {
      throw new Error("Solo un discipulador puede invitar discípulos.");
    }
    const cleanName = String(nombre ?? "").trim().replace(/\s+/g, " ");
    const normalizedEmail = normalizeEmail(email);
    if (cleanName.length < 2) throw new Error("Ingresá el nombre de la persona.");
    if (cleanName.length > 80) throw new Error("El nombre no puede superar los 80 caracteres.");
    if (!isValidEmail(normalizedEmail)) throw new Error("Ingresá un email válido.");

    const existingUser = db.users.find((user) => user.email === normalizedEmail);
    if (existingUser) {
      const alreadyLinked = db.discipleships.some(
        (link) => link.discipulador_id === me.id && link.discipulo_id === existingUser.id,
      );
      if (alreadyLinked) throw new Error("Ese discípulo ya está en tu lista.");
    }

    const duplicate = db.invitations.find(
      (invitation) =>
        invitation.discipulador_id === me.id &&
        invitation.email === normalizedEmail &&
        invitationState(invitation) === "pendiente",
    );
    if (duplicate) {
      throw new Error("Ya tenés una invitación pendiente para ese email.");
    }

    let token = createInviteToken();
    while (db.invitations.some((invitation) => invitation.token === token)) {
      token = createInviteToken();
    }

    const invitation = {
      id: `i_${crypto.randomUUID()}`,
      token,
      discipulador_id: me.id,
      nombre: cleanName,
      email: normalizedEmail,
      estado: "pendiente",
      discipulo_id: null,
      fecha_creacion: new Date().toISOString(),
      fecha_vencimiento: invitationDaysFromNow(INVITATION_DAYS),
      fecha_aceptacion: null,
    };
    db.invitations.push(invitation);
    writeDb(db);
    return clone(invitation);
  }

  async function listInvitations() {
    const db = readDb();
    const me = requireSession(db);
    if (me.rol !== "discipulador") return [];
    let changed = false;
    const pending = db.invitations
      .filter((invitation) => invitation.discipulador_id === me.id)
      .filter((invitation) => {
        if (invitation.estado === "pendiente" && invitationState(invitation) === "expirada") {
          invitation.estado = "expirada";
          changed = true;
        }
        return invitation.estado === "pendiente";
      })
      .sort((a, b) => String(b.fecha_creacion).localeCompare(String(a.fecha_creacion)))
      .map(clone);
    if (changed) writeDb(db);
    return pending;
  }

  async function getInvitation(token) {
    const db = readDb();
    if (!db) return null;
    const invitation = db.invitations.find((item) => item.token === String(token ?? ""));
    if (!invitation) return null;
    const discipler = db.users.find((user) => user.id === invitation.discipulador_id);
    return {
      id: invitation.id,
      nombre: invitation.nombre,
      email: invitation.email,
      estado: invitationState(invitation),
      discipulo_id: invitation.discipulo_id || null,
      fecha_creacion: invitation.fecha_creacion,
      fecha_vencimiento: invitation.fecha_vencimiento,
      discipulador: discipler ? publicUser(discipler) : null,
    };
  }

  async function acceptInvitation(token) {
    const db = readDb();
    const me = requireSession(db);
    const invitation = db.invitations.find((item) => item.token === String(token ?? ""));
    if (!invitation) throw new Error("No encontramos esta invitación.");

    const state = invitationState(invitation);
    if (state === "aceptada") {
      if (invitation.discipulo_id === me.id) {
        return { invitation: clone(invitation), alreadyAccepted: true };
      }
      throw new Error("Esta invitación ya fue utilizada por otra persona.");
    }
    if (state === "revocada") {
      throw new Error("Esta invitación fue revocada por el discipulador.");
    }
    if (state === "expirada") {
      throw new Error("Esta invitación venció. Pedile al discipulador que genere un link nuevo.");
    }
    if (me.rol !== "discipulo") {
      throw new Error("Esta invitación es para una cuenta de discípulo.");
    }
    if (normalizeEmail(me.email) !== invitation.email) {
      throw new Error(
        `Esta invitación es para ${invitation.email}. Iniciá sesión con esa cuenta para aceptarla.`,
      );
    }

    let link = db.discipleships.find(
      (candidate) =>
        candidate.discipulador_id === invitation.discipulador_id &&
        candidate.discipulo_id === me.id,
    );
    if (!link) {
      link = {
        id: `ds_${crypto.randomUUID()}`,
        discipulador_id: invitation.discipulador_id,
        discipulo_id: me.id,
        fecha_inicio: new Date().toISOString().slice(0, 10),
        estado: "activo",
      };
      db.discipleships.push(link);
    }
    invitation.estado = "aceptada";
    invitation.discipulo_id = me.id;
    invitation.fecha_aceptacion = new Date().toISOString();
    writeDb(db);
    return { invitation: clone(invitation), discipleship: clone(link), alreadyAccepted: false };
  }

  async function revokeInvitation(invitationId) {
    const db = readDb();
    const me = requireSession(db);
    if (me.rol !== "discipulador") {
      throw new Error("Solo un discipulador puede revocar invitaciones.");
    }
    const invitation = db.invitations.find(
      (candidate) => candidate.id === invitationId && candidate.discipulador_id === me.id,
    );
    if (!invitation) throw new Error("No encontramos esa invitación.");
    if (invitation.estado !== "pendiente") {
      throw new Error("Esa invitación ya no está pendiente.");
    }
    invitation.estado = "revocada";
    writeDb(db);
    return clone(invitation);
  }

  async function getDiscipleDetail(discipleId) {
    const db = readDb();
    const me = requireSession(db);
    const link = db.discipleships.find(
      (candidate) =>
        candidate.discipulador_id === me.id && candidate.discipulo_id === discipleId,
    );
    if (!link) throw new Error("Este discípulo no está vinculado a tu cuenta.");
    const profile = db.users.find((user) => user.id === discipleId);
    if (!profile) throw new Error("No encontramos el perfil del discípulo.");
    const assignments = db.assignments
      .filter(
        (assignment) =>
          assignment.discipulo_id === discipleId && assignment.asignado_por === me.id,
      )
      .map((assignment) => ({
        ...clone(assignment),
        estudio: clone(db.studies.find((study) => study.id === assignment.estudio_id) || null),
        respuesta: clone(
          db.responses.find((response) => response.asignacion_id === assignment.id) || null,
        ),
      }))
      .sort((a, b) => String(b.fecha_asignacion).localeCompare(String(a.fecha_asignacion)));

    return {
      profile: publicUser(profile),
      discipleship: clone(link),
      assignments,
    };
  }

  async function listObservations(discipleId) {
    const db = readDb();
    const me = requireSession(db);
    return db.observations
      .filter(
        (observation) =>
          observation.discipulador_id === me.id && observation.discipulo_id === discipleId,
      )
      .sort((a, b) => String(b.fecha_creacion).localeCompare(String(a.fecha_creacion)))
      .map(clone);
  }

  async function addObservation(discipleId, observacion) {
    const db = readDb();
    const me = requireSession(db);
    const text = String(observacion ?? "").trim();
    if (!text) throw new Error("Escribí una observación antes de guardar.");
    if (text.length > 2000) throw new Error("La observación no puede superar los 2000 caracteres.");
    const link = db.discipleships.find(
      (candidate) =>
        candidate.discipulador_id === me.id && candidate.discipulo_id === discipleId,
    );
    if (!link) throw new Error("No tenés permiso para agregar observaciones a este discípulo.");
    const observation = {
      id: `o_${crypto.randomUUID()}`,
      discipulador_id: me.id,
      discipulo_id: discipleId,
      observacion: text,
      fecha_creacion: new Date().toISOString(),
    };
    db.observations.push(observation);
    writeDb(db);
    return clone(observation);
  }

  async function listStudies() {
    const db = readDb();
    const me = requireSession(db);
    return db.studies
      .filter((study) => study.creador_id === me.id)
      .sort((a, b) => String(b.fecha_creacion).localeCompare(String(a.fecha_creacion)))
      .map((study) => {
        const assignments = db.assignments.filter(
          (assignment) => assignment.estudio_id === study.id && assignment.asignado_por === me.id,
        );
        return {
          ...clone(study),
          stats: {
            total: assignments.length,
            completados: assignments.filter((assignment) => assignment.estado === "completado")
              .length,
          },
        };
      });
  }

  async function getStudy(studyId) {
    const db = readDb();
    const me = requireSession(db);
    const study = db.studies.find(
      (candidate) => candidate.id === studyId && candidate.creador_id === me.id,
    );
    if (!study) throw new Error("Estudio no encontrado.");
    const assignments = db.assignments
      .filter((assignment) => assignment.estudio_id === studyId && assignment.asignado_por === me.id)
      .map((assignment) => {
        const disciple = db.users.find((user) => user.id === assignment.discipulo_id);
        return {
          ...clone(assignment),
          discipulo: disciple ? publicUser(disciple) : null,
          respuesta: clone(
            db.responses.find((response) => response.asignacion_id === assignment.id) || null,
          ),
        };
      })
      .sort((a, b) => nameOf(a.discipulo).localeCompare(nameOf(b.discipulo), "es"));
    return { study: clone(study), assignments };
  }

  async function createStudy(data) {
    const db = readDb();
    const me = requireSession(db);
    if (me.rol !== "discipulador") throw new Error("Solo un discipulador puede crear estudios.");
    const study = {
      id: `s_${crypto.randomUUID()}`,
      titulo: data.titulo,
      descripcion: data.descripcion,
      etapa: data.etapa,
      pasaje_biblico: data.pasaje_biblico,
      objetivo: data.objetivo,
      contenido: data.contenido,
      preguntas: data.preguntas,
      actividad: data.actividad,
      material_complementario: data.material_complementario || "",
      creador_id: me.id,
      fecha_creacion: new Date().toISOString(),
    };
    db.studies.push(study);
    writeDb(db);
    return clone(study);
  }

  async function updateStudy(studyId, data) {
    const db = readDb();
    const me = requireSession(db);
    const study = db.studies.find(
      (candidate) => candidate.id === studyId && candidate.creador_id === me.id,
    );
    if (!study) throw new Error("Estudio no encontrado o sin permisos para editarlo.");
    Object.assign(study, {
      titulo: data.titulo,
      descripcion: data.descripcion,
      etapa: data.etapa,
      pasaje_biblico: data.pasaje_biblico,
      objetivo: data.objetivo,
      contenido: data.contenido,
      preguntas: data.preguntas,
      actividad: data.actividad,
      material_complementario: data.material_complementario || "",
    });
    writeDb(db);
    return clone(study);
  }

  async function deleteStudy(studyId) {
    const db = readDb();
    const me = requireSession(db);
    const study = db.studies.find(
      (candidate) => candidate.id === studyId && candidate.creador_id === me.id,
    );
    if (!study) throw new Error("Estudio no encontrado o sin permisos para eliminarlo.");
    const assignmentIds = db.assignments
      .filter((assignment) => assignment.estudio_id === studyId)
      .map((assignment) => assignment.id);
    db.responses = db.responses.filter(
      (response) => !assignmentIds.includes(response.asignacion_id),
    );
    db.assignments = db.assignments.filter((assignment) => assignment.estudio_id !== studyId);
    db.studies = db.studies.filter((candidate) => candidate.id !== studyId);
    writeDb(db);
  }

  async function assignStudy(studyId, discipleIds) {
    const db = readDb();
    const me = requireSession(db);
    const study = db.studies.find(
      (candidate) => candidate.id === studyId && candidate.creador_id === me.id,
    );
    if (!study) throw new Error("Estudio no encontrado o sin permisos para asignarlo.");
    if (!Array.isArray(discipleIds) || !discipleIds.length) {
      throw new Error("Seleccioná al menos un discípulo.");
    }
    const linkedIds = new Set(
      db.discipleships
        .filter((link) => link.discipulador_id === me.id)
        .map((link) => link.discipulo_id),
    );
    const existing = new Set(
      db.assignments
        .filter((assignment) => assignment.estudio_id === studyId && assignment.asignado_por === me.id)
        .map((assignment) => assignment.discipulo_id),
    );
    let count = 0;
    for (const discipleId of discipleIds) {
      if (!linkedIds.has(discipleId) || existing.has(discipleId)) continue;
      db.assignments.push({
        id: `a_${crypto.randomUUID()}`,
        estudio_id: studyId,
        discipulo_id: discipleId,
        asignado_por: me.id,
        estado: "pendiente",
        fecha_asignacion: new Date().toISOString(),
        fecha_completado: null,
      });
      count += 1;
    }
    writeDb(db);
    return { asignados: count };
  }

  async function listMyAssignments() {
    const db = readDb();
    const me = requireSession(db);
    return db.assignments
      .filter((assignment) => assignment.discipulo_id === me.id)
      .map((assignment) => ({
        ...clone(assignment),
        estudio: clone(db.studies.find((study) => study.id === assignment.estudio_id) || null),
        respuesta: clone(
          db.responses.find((response) => response.asignacion_id === assignment.id) || null,
        ),
      }))
      .sort((a, b) => String(b.fecha_asignacion).localeCompare(String(a.fecha_asignacion)));
  }

  async function getAssignment(assignmentId) {
    const db = readDb();
    const me = requireSession(db);
    const assignment = db.assignments.find(
      (candidate) => candidate.id === assignmentId && candidate.discipulo_id === me.id,
    );
    if (!assignment) throw new Error("No encontramos esta lección entre tus estudios asignados.");
    const study = db.studies.find((candidate) => candidate.id === assignment.estudio_id);
    if (!study) throw new Error("El estudio de esta asignación ya no está disponible.");
    const response = db.responses.find(
      (candidate) => candidate.asignacion_id === assignment.id,
    );
    return {
      assignment: clone(assignment),
      estudio: clone(study),
      respuesta: response ? clone(response) : null,
    };
  }

  async function saveResponse(assignmentId, respuestas) {
    const db = readDb();
    const me = requireSession(db);
    const assignment = db.assignments.find(
      (candidate) => candidate.id === assignmentId && candidate.discipulo_id === me.id,
    );
    if (!assignment) throw new Error("No tenés permiso para responder esta asignación.");
    let response = db.responses.find((candidate) => candidate.asignacion_id === assignmentId);
    if (response) {
      response.respuesta = respuestas;
      response.fecha_actualizacion = new Date().toISOString();
    } else {
      response = {
        id: `r_${crypto.randomUUID()}`,
        asignacion_id: assignmentId,
        discipulo_id: me.id,
        respuesta: respuestas,
        fecha_actualizacion: new Date().toISOString(),
      };
      db.responses.push(response);
    }
    writeDb(db);
    return clone(response);
  }

  async function completeAssignment(assignmentId) {
    const db = readDb();
    const me = requireSession(db);
    const assignment = db.assignments.find(
      (candidate) => candidate.id === assignmentId && candidate.discipulo_id === me.id,
    );
    if (!assignment) throw new Error("No tenés permiso para completar esta asignación.");
    if (assignment.estado !== "completado") {
      assignment.estado = "completado";
      assignment.fecha_completado = new Date().toISOString();
      writeDb(db);
    }
    return clone(assignment);
  }

  async function getMyDiscipler() {
    const db = readDb();
    const me = requireSession(db);
    const link = db.discipleships
      .filter((candidate) => candidate.discipulo_id === me.id)
      .sort((a, b) => String(a.fecha_inicio).localeCompare(String(b.fecha_inicio)))[0];
    if (!link) return null;
    const discipler = db.users.find((user) => user.id === link.discipulador_id);
    return discipler ? publicUser(discipler) : null;
  }

  return {
    mode: "demo",
    getCurrentUser,
    signIn,
    signUp,
    signOut,
    updateProfile,
    listDisciples,
    createInvitation,
    listInvitations,
    getInvitation,
    acceptInvitation,
    revokeInvitation,
    getDiscipleDetail,
    listObservations,
    addObservation,
    listStudies,
    getStudy,
    createStudy,
    updateStudy,
    deleteStudy,
    assignStudy,
    listMyAssignments,
    getAssignment,
    saveResponse,
    completeAssignment,
    getMyDiscipler,
  };
}
