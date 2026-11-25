/**
 * MODO REAL · Supabase
 * ------------------------------------------------------------------
 * Cliente de Supabase y acceso a datos. Este módulo solo se carga cuando
 * js/config.js tiene credenciales reales.
 *
 * Requiere haber ejecutado supabase/schema.sql en el proyecto de Supabase.
 */

import { CONFIG } from "./config.js";
import { createInviteToken } from "./invite.js";

const SUPABASE_ESM = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
const INVITATION_DAYS = 14;

function logError(context, error) {
  console.error(`[Supabase:${context}]`, error);
}

function friendlyDataError(context, fallback) {
  return (error) => {
    logError(context, error);
    const message = String(error?.message || "");
    if (/row-level security|permission denied|violates row-level/i.test(message)) {
      throw new Error("No tenés permisos para realizar esta acción.");
    }
    if (/duplicate key|unique constraint/i.test(message)) {
      throw new Error("Ese registro ya existe.");
    }
    if (/JWT expired|invalid JWT|refresh token/i.test(message)) {
      throw new Error("Tu sesión expiró. Volvé a iniciar sesión.");
    }
    if (/failed to fetch|network/i.test(message)) {
      throw new Error("No pudimos conectar con Supabase. Revisá tu conexión e intentá nuevamente.");
    }
    throw new Error(fallback || "No pudimos completar la operación. Intentá nuevamente.");
  };
}

function translateAuthError(error, fallback = "No pudimos completar la operación.") {
  logError("auth", error);
  const message = String(error?.message || "").toLowerCase();
  if (message.includes("invalid login credentials")) {
    return new Error("Email o contraseña incorrectos.");
  }
  if (message.includes("email not confirmed")) {
    return new Error(
      "Tenés que confirmar tu email antes de ingresar. Revisá tu bandeja de entrada.",
    );
  }
  if (message.includes("already registered") || message.includes("already been registered")) {
    return new Error("Ya existe una cuenta con ese email.");
  }
  if (message.includes("password should be at least")) {
    return new Error("La contraseña es demasiado corta.");
  }
  if (message.includes("unable to validate email") || message.includes("invalid email")) {
    return new Error("El email no es válido.");
  }
  if (message.includes("rate limit") || message.includes("too many requests")) {
    return new Error("Hubo demasiados intentos. Esperá un momento y volvé a intentar.");
  }
  if (message.includes("failed to fetch") || message.includes("network")) {
    return new Error("No pudimos conectar con Supabase. Revisá tu conexión e intentá nuevamente.");
  }
  return new Error(fallback);
}

export async function createSupabaseBackend() {
  let createClient;
  try {
    ({ createClient } = await import(SUPABASE_ESM));
  } catch (error) {
    logError("import", error);
    throw new Error(
      "No pudimos cargar la librería de Supabase. Revisá tu conexión a internet y volvé a intentar.",
    );
  }

  const client = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  let cachedUser = null;

  client.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") cachedUser = null;
  });

  function metadataProfile(authUser) {
    const metadata = authUser.user_metadata || {};
    const email = String(authUser.email || "").toLowerCase();
    const fallbackName = email.split("@")[0].replace(/[._-]+/g, " ").trim();
    return {
      id: authUser.id,
      nombre: String(metadata.nombre || fallbackName || "Sin nombre").trim(),
      email,
      rol: metadata.rol === "discipulador" ? "discipulador" : "discipulo",
      fecha_creacion: new Date().toISOString(),
    };
  }

  async function loadProfile(authUser) {
    const { data, error } = await client
      .from("profiles")
      .select("id, nombre, email, rol, fecha_creacion")
      .eq("id", authUser.id)
      .maybeSingle();
    if (error) friendlyDataError("loadProfile", "No pudimos cargar tu perfil.")(error);
    if (data) return data;

    // Respaldo para proyectos donde el trigger de alta aún no está instalado.
    const fallback = metadataProfile(authUser);
    const { data: created, error: insertError } = await client
      .from("profiles")
      .insert(fallback)
      .select("id, nombre, email, rol, fecha_creacion")
      .single();
    if (insertError) {
      friendlyDataError(
        "createProfile",
        "No pudimos crear tu perfil. Verificá que el esquema de Supabase esté instalado.",
      )(insertError);
    }
    return created;
  }

  async function getCurrentUser() {
    const { data, error } = await client.auth.getSession();
    if (error) {
      logError("getSession", error);
      return null;
    }
    if (!data.session?.user) return null;
    const profile = await loadProfile(data.session.user);
    cachedUser = profile;
    return profile;
  }

  async function requireUser() {
    if (cachedUser) return cachedUser;
    const profile = await getCurrentUser();
    if (!profile) throw new Error("Tu sesión expiró. Volvé a iniciar sesión.");
    return profile;
  }

  async function signIn(email, password) {
    const { data, error } = await client.auth.signInWithPassword({
      email: String(email ?? "").trim().toLowerCase(),
      password,
    });
    if (error) throw translateAuthError(error, "No pudimos iniciar sesión. Intentá nuevamente.");
    const profile = await loadProfile(data.user);
    cachedUser = profile;
    return profile;
  }

  async function signUp({ nombre, email, password, rol }) {
    const { data, error } = await client.auth.signUp({
      email: String(email ?? "").trim().toLowerCase(),
      password,
      options: {
        data: {
          nombre: String(nombre ?? "").trim(),
          rol,
        },
      },
    });
    if (error) throw translateAuthError(error, "No pudimos crear la cuenta. Intentá nuevamente.");

    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      throw new Error("Ya existe una cuenta con ese email.");
    }

    if (!data.session) {
      return { user: null, needsConfirmation: true };
    }

    const profile = await loadProfile(data.user);
    cachedUser = profile;
    return { user: profile, needsConfirmation: false };
  }

  async function signOut() {
    const { error } = await client.auth.signOut();
    cachedUser = null;
    if (error) throw translateAuthError(error, "No pudimos cerrar sesión. Intentá nuevamente.");
  }

  async function updateProfile({ nombre }) {
    const me = await requireUser();
    const cleanName = String(nombre ?? "").trim();
    if (cleanName.length < 2) throw new Error("Ingresá un nombre válido.");
    const { data, error } = await client
      .from("profiles")
      .update({ nombre: cleanName })
      .eq("id", me.id)
      .select("id, nombre, email, rol, fecha_creacion")
      .single();
    if (error) {
      friendlyDataError("updateProfile", "No pudimos actualizar tu perfil.")(error);
    }
    cachedUser = data;
    return data;
  }

  async function listDisciples() {
    const me = await requireUser();
    const { data: links, error } = await client
      .from("discipleships")
      .select("id, discipulador_id, discipulo_id, fecha_inicio, estado")
      .eq("discipulador_id", me.id)
      .order("fecha_inicio", { ascending: false });
    if (error) {
      friendlyDataError("listDisciples", "No pudimos cargar tus discípulos.")(error);
    }
    if (!links.length) return [];

    const discipleIds = links.map((link) => link.discipulo_id);
    const [profilesResult, assignmentsResult] = await Promise.all([
      client
        .from("profiles")
        .select("id, nombre, email, rol, fecha_creacion")
        .in("id", discipleIds),
      client
        .from("assignments")
        .select("discipulo_id, estado")
        .eq("asignado_por", me.id)
        .in("discipulo_id", discipleIds),
    ]);
    if (profilesResult.error) {
      friendlyDataError("listDisciples.profiles", "No pudimos cargar los perfiles.")(
        profilesResult.error,
      );
    }
    if (assignmentsResult.error) {
      friendlyDataError("listDisciples.assignments", "No pudimos cargar el progreso.")(
        assignmentsResult.error,
      );
    }

    const profilesById = new Map(profilesResult.data.map((profile) => [profile.id, profile]));
    const assignments = assignmentsResult.data;

    return links
      .filter((link) => profilesById.has(link.discipulo_id))
      .map((link) => {
        const ownAssignments = assignments.filter(
          (assignment) => assignment.discipulo_id === link.discipulo_id,
        );
        return {
          ...link,
          discipulo: profilesById.get(link.discipulo_id),
          stats: {
            total: ownAssignments.length,
            completados: ownAssignments.filter((assignment) => assignment.estado === "completado")
              .length,
          },
        };
      })
      .sort((a, b) =>
        String(a.discipulo.nombre).localeCompare(String(b.discipulo.nombre), "es"),
      );
  }

  async function createInvitation({ nombre, email }) {
    const me = await requireUser();
    if (me.rol !== "discipulador") {
      throw new Error("Solo un discipulador puede invitar discípulos.");
    }
    const cleanName = String(nombre ?? "").trim().replace(/\s+/g, " ");
    const normalizedEmail = String(email ?? "").trim().toLowerCase();
    if (cleanName.length < 2) throw new Error("Ingresá el nombre de la persona.");
    if (cleanName.length > 80) throw new Error("El nombre no puede superar los 80 caracteres.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizedEmail)) {
      throw new Error("Ingresá un email válido.");
    }

    const { data: found, error: searchError } = await client.rpc(
      "buscar_discipulo_por_email",
      { p_email: normalizedEmail },
    );
    if (searchError) {
      friendlyDataError("createInvitation.search", "No pudimos verificar esa cuenta.")(searchError);
    }
    const disciple = Array.isArray(found) ? found[0] : found;
    if (disciple) {
      const { data: existing, error: existingError } = await client
        .from("discipleships")
        .select("id")
        .eq("discipulador_id", me.id)
        .eq("discipulo_id", disciple.id)
        .maybeSingle();
      if (existingError) {
        friendlyDataError("createInvitation.existing", "No pudimos verificar el vínculo.")(
          existingError,
        );
      }
      if (existing) throw new Error("Ese discípulo ya está en tu lista.");
    }

    const { data: pending, error: pendingError } = await client
      .from("invitations")
      .select("id")
      .eq("discipulador_id", me.id)
      .eq("email", normalizedEmail)
      .eq("estado", "pendiente")
      .maybeSingle();
    if (pendingError) {
      friendlyDataError("createInvitation.pending", "No pudimos verificar las invitaciones.")(
        pendingError,
      );
    }
    if (pending) throw new Error("Ya tenés una invitación pendiente para ese email.");

    const expires = new Date();
    expires.setDate(expires.getDate() + INVITATION_DAYS);

    const { data, error } = await client
      .from("invitations")
      .insert({
        token: createInviteToken(),
        discipulador_id: me.id,
        nombre: cleanName,
        email: normalizedEmail,
        estado: "pendiente",
        fecha_vencimiento: expires.toISOString(),
      })
      .select(
        "id, token, discipulador_id, nombre, email, estado, discipulo_id, fecha_creacion, fecha_vencimiento, fecha_aceptacion",
      )
      .single();
    if (error) {
      friendlyDataError(
        "createInvitation.insert",
        "No pudimos crear la invitación. Verificá que la tabla y las políticas estén instaladas.",
      )(error);
    }
    return data;
  }

  async function listInvitations() {
    const me = await requireUser();
    if (me.rol !== "discipulador") return [];
    const { data, error } = await client
      .from("invitations")
      .select(
        "id, token, discipulador_id, nombre, email, estado, discipulo_id, fecha_creacion, fecha_vencimiento, fecha_aceptacion",
      )
      .eq("discipulador_id", me.id)
      .eq("estado", "pendiente")
      .order("fecha_creacion", { ascending: false });
    if (error) {
      friendlyDataError("listInvitations", "No pudimos cargar las invitaciones.")(error);
    }

    const now = new Date();
    const expired = data.filter((invitation) => new Date(invitation.fecha_vencimiento) < now);
    if (expired.length) {
      // Se marca el vencimiento sin bloquear la vista si la actualización falla.
      await client
        .from("invitations")
        .update({ estado: "expirada" })
        .in(
          "id",
          expired.map((invitation) => invitation.id),
        )
        .eq("estado", "pendiente");
    }
    const expiredIds = new Set(expired.map((invitation) => invitation.id));
    return data.filter((invitation) => !expiredIds.has(invitation.id));
  }

  async function getInvitation(token) {
    const { data, error } = await client.rpc("get_invitation", {
      p_token: String(token ?? ""),
    });
    if (error) {
      friendlyDataError("getInvitation", "No pudimos verificar la invitación.")(error);
    }
    if (!data) return null;
    return data;
  }

  async function acceptInvitation(token) {
    const { data, error } = await client.rpc("accept_invitation", {
      p_token: String(token ?? ""),
    });
    if (error) {
      const message = String(error.message || "").replace(/^P0001:\s*/, "");
      if (/invitaci[oó]n|disc[ií]pulo|sesi[oó]n|perfil|email/i.test(message)) {
        throw new Error(message);
      }
      friendlyDataError("acceptInvitation", "No pudimos aceptar la invitación.")(error);
    }
    return data;
  }

  async function revokeInvitation(invitationId) {
    const me = await requireUser();
    if (me.rol !== "discipulador") {
      throw new Error("Solo un discipulador puede revocar invitaciones.");
    }
    const { data, error } = await client
      .from("invitations")
      .update({ estado: "revocada" })
      .eq("id", invitationId)
      .eq("discipulador_id", me.id)
      .eq("estado", "pendiente")
      .select("id, estado")
      .maybeSingle();
    if (error) {
      friendlyDataError("revokeInvitation", "No pudimos revocar la invitación.")(error);
    }
    if (!data) throw new Error("Esa invitación ya no está pendiente.");
    return data;
  }

  async function getDiscipleDetail(discipleId) {
    const me = await requireUser();
    const { data: link, error: linkError } = await client
      .from("discipleships")
      .select("id, discipulador_id, discipulo_id, fecha_inicio, estado")
      .eq("discipulador_id", me.id)
      .eq("discipulo_id", discipleId)
      .maybeSingle();
    if (linkError) {
      friendlyDataError("getDiscipleDetail.link", "No pudimos cargar el vínculo.")(linkError);
    }
    if (!link) throw new Error("Este discípulo no está vinculado a tu cuenta.");

    const [profileResult, assignmentsResult, observationsResult] = await Promise.all([
      client
        .from("profiles")
        .select("id, nombre, email, rol, fecha_creacion")
        .eq("id", discipleId)
        .maybeSingle(),
      client
        .from("assignments")
        .select(
          "id, estudio_id, discipulo_id, asignado_por, estado, fecha_asignacion, fecha_completado",
        )
        .eq("discipulo_id", discipleId)
        .eq("asignado_por", me.id)
        .order("fecha_asignacion", { ascending: false }),
      client
        .from("observations")
        .select("id, discipulador_id, discipulo_id, observacion, fecha_creacion")
        .eq("discipulador_id", me.id)
        .eq("discipulo_id", discipleId)
        .order("fecha_creacion", { ascending: false }),
    ]);
    if (profileResult.error) {
      friendlyDataError("getDiscipleDetail.profile", "No pudimos cargar el perfil.")(
        profileResult.error,
      );
    }
    if (!profileResult.data) throw new Error("No encontramos el perfil del discípulo.");
    if (assignmentsResult.error) {
      friendlyDataError("getDiscipleDetail.assignments", "No pudimos cargar los estudios.")(
        assignmentsResult.error,
      );
    }
    if (observationsResult.error) {
      friendlyDataError("getDiscipleDetail.observations", "No pudimos cargar las observaciones.")(
        observationsResult.error,
      );
    }

    const assignments = assignmentsResult.data;
    let studiesById = new Map();
    let responsesByAssignment = new Map();

    if (assignments.length) {
      const studyIds = [...new Set(assignments.map((assignment) => assignment.estudio_id))];
      const assignmentIds = assignments.map((assignment) => assignment.id);
      const [studiesResult, responsesResult] = await Promise.all([
        client.from("studies").select("*").in("id", studyIds),
        client.from("responses").select("*").in("asignacion_id", assignmentIds),
      ]);
      if (studiesResult.error) {
        friendlyDataError("getDiscipleDetail.studies", "No pudimos cargar los estudios.")(
          studiesResult.error,
        );
      }
      if (responsesResult.error) {
        friendlyDataError("getDiscipleDetail.responses", "No pudimos cargar las respuestas.")(
          responsesResult.error,
        );
      }
      studiesById = new Map(studiesResult.data.map((study) => [study.id, study]));
      responsesByAssignment = new Map(
        responsesResult.data.map((response) => [response.asignacion_id, response]),
      );
    }

    return {
      profile: profileResult.data,
      discipleship: link,
      assignments: assignments.map((assignment) => ({
        ...assignment,
        estudio: studiesById.get(assignment.estudio_id) || null,
        respuesta: responsesByAssignment.get(assignment.id) || null,
      })),
      observations: observationsResult.data,
    };
  }

  async function listObservations(discipleId) {
    const me = await requireUser();
    const { data, error } = await client
      .from("observations")
      .select("id, discipulador_id, discipulo_id, observacion, fecha_creacion")
      .eq("discipulador_id", me.id)
      .eq("discipulo_id", discipleId)
      .order("fecha_creacion", { ascending: false });
    if (error) {
      friendlyDataError("listObservations", "No pudimos cargar las observaciones.")(error);
    }
    return data;
  }

  async function addObservation(discipleId, observacion) {
    const me = await requireUser();
    const text = String(observacion ?? "").trim();
    if (!text) throw new Error("Escribí una observación antes de guardar.");
    if (text.length > 2000) throw new Error("La observación no puede superar los 2000 caracteres.");
    const { data, error } = await client
      .from("observations")
      .insert({
        discipulador_id: me.id,
        discipulo_id: discipleId,
        observacion: text,
      })
      .select("id, discipulador_id, discipulo_id, observacion, fecha_creacion")
      .single();
    if (error) {
      friendlyDataError(
        "addObservation",
        "No pudimos guardar la observación. Verificá el vínculo con el discípulo.",
      )(error);
    }
    return data;
  }

  async function listStudies() {
    const me = await requireUser();
    const { data: studies, error } = await client
      .from("studies")
      .select("*")
      .eq("creador_id", me.id)
      .order("fecha_creacion", { ascending: false });
    if (error) {
      friendlyDataError("listStudies", "No pudimos cargar los estudios.")(error);
    }
    if (!studies.length) return [];

    const { data: assignments, error: assignmentsError } = await client
      .from("assignments")
      .select("estudio_id, estado")
      .eq("asignado_por", me.id)
      .in(
        "estudio_id",
        studies.map((study) => study.id),
      );
    if (assignmentsError) {
      friendlyDataError("listStudies.assignments", "No pudimos cargar las asignaciones.")(
        assignmentsError,
      );
    }

    return studies.map((study) => {
      const ownAssignments = assignments.filter(
        (assignment) => assignment.estudio_id === study.id,
      );
      return {
        ...study,
        stats: {
          total: ownAssignments.length,
          completados: ownAssignments.filter((assignment) => assignment.estado === "completado")
            .length,
        },
      };
    });
  }

  async function getStudy(studyId) {
    const me = await requireUser();
    const { data: study, error } = await client
      .from("studies")
      .select("*")
      .eq("id", studyId)
      .eq("creador_id", me.id)
      .maybeSingle();
    if (error) {
      friendlyDataError("getStudy", "No pudimos cargar el estudio.")(error);
    }
    if (!study) throw new Error("Estudio no encontrado.");

    const { data: assignments, error: assignmentsError } = await client
      .from("assignments")
      .select(
        "id, estudio_id, discipulo_id, asignado_por, estado, fecha_asignacion, fecha_completado",
      )
      .eq("estudio_id", studyId)
      .eq("asignado_por", me.id)
      .order("fecha_asignacion", { ascending: true });
    if (assignmentsError) {
      friendlyDataError("getStudy.assignments", "No pudimos cargar las asignaciones.")(
        assignmentsError,
      );
    }

    let profilesById = new Map();
    let responsesByAssignment = new Map();
    if (assignments.length) {
      const discipleIds = [...new Set(assignments.map((assignment) => assignment.discipulo_id))];
      const assignmentIds = assignments.map((assignment) => assignment.id);
      const [profilesResult, responsesResult] = await Promise.all([
        client
          .from("profiles")
          .select("id, nombre, email")
          .in("id", discipleIds),
        client.from("responses").select("*").in("asignacion_id", assignmentIds),
      ]);
      if (profilesResult.error) {
        friendlyDataError("getStudy.profiles", "No pudimos cargar los discípulos.")(
          profilesResult.error,
        );
      }
      if (responsesResult.error) {
        friendlyDataError("getStudy.responses", "No pudimos cargar las respuestas.")(
          responsesResult.error,
        );
      }
      profilesById = new Map(profilesResult.data.map((profile) => [profile.id, profile]));
      responsesByAssignment = new Map(
        responsesResult.data.map((response) => [response.asignacion_id, response]),
      );
    }

    return {
      study,
      assignments: assignments
        .map((assignment) => ({
          ...assignment,
          discipulo: profilesById.get(assignment.discipulo_id) || null,
          respuesta: responsesByAssignment.get(assignment.id) || null,
        }))
        .sort((a, b) =>
          String(a.discipulo?.nombre || "").localeCompare(String(b.discipulo?.nombre || ""), "es"),
        ),
    };
  }

  async function createStudy(data) {
    const me = await requireUser();
    if (me.rol !== "discipulador") throw new Error("Solo un discipulador puede crear estudios.");
    const { data: study, error } = await client
      .from("studies")
      .insert({
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
      })
      .select("*")
      .single();
    if (error) {
      friendlyDataError("createStudy", "No pudimos crear el estudio.")(error);
    }
    return study;
  }

  async function updateStudy(studyId, data) {
    const me = await requireUser();
    const { data: study, error } = await client
      .from("studies")
      .update({
        titulo: data.titulo,
        descripcion: data.descripcion,
        etapa: data.etapa,
        pasaje_biblico: data.pasaje_biblico,
        objetivo: data.objetivo,
        contenido: data.contenido,
        preguntas: data.preguntas,
        actividad: data.actividad,
        material_complementario: data.material_complementario || "",
      })
      .eq("id", studyId)
      .eq("creador_id", me.id)
      .select("*")
      .maybeSingle();
    if (error) {
      friendlyDataError("updateStudy", "No pudimos actualizar el estudio.")(error);
    }
    if (!study) throw new Error("Estudio no encontrado o sin permisos para editarlo.");
    return study;
  }

  async function deleteStudy(studyId) {
    const me = await requireUser();
    const { data, error } = await client
      .from("studies")
      .delete()
      .eq("id", studyId)
      .eq("creador_id", me.id)
      .select("id");
    if (error) {
      friendlyDataError("deleteStudy", "No pudimos eliminar el estudio.")(error);
    }
    if (!data.length) throw new Error("Estudio no encontrado o sin permisos para eliminarlo.");
  }

  async function assignStudy(studyId, discipleIds) {
    const me = await requireUser();
    if (!Array.isArray(discipleIds) || !discipleIds.length) {
      throw new Error("Seleccioná al menos un discípulo.");
    }

    const { data: study, error: studyError } = await client
      .from("studies")
      .select("id")
      .eq("id", studyId)
      .eq("creador_id", me.id)
      .maybeSingle();
    if (studyError) {
      friendlyDataError("assignStudy.study", "No pudimos verificar el estudio.")(studyError);
    }
    if (!study) throw new Error("Estudio no encontrado o sin permisos para asignarlo.");

    const [linksResult, existingResult] = await Promise.all([
      client
        .from("discipleships")
        .select("discipulo_id")
        .eq("discipulador_id", me.id)
        .in("discipulo_id", discipleIds),
      client
        .from("assignments")
        .select("discipulo_id")
        .eq("estudio_id", studyId)
        .eq("asignado_por", me.id)
        .in("discipulo_id", discipleIds),
    ]);
    if (linksResult.error) {
      friendlyDataError("assignStudy.links", "No pudimos verificar los discípulos.")(
        linksResult.error,
      );
    }
    if (existingResult.error) {
      friendlyDataError("assignStudy.existing", "No pudimos verificar las asignaciones.")(
        existingResult.error,
      );
    }

    const linkedIds = new Set(linksResult.data.map((link) => link.discipulo_id));
    const existingIds = new Set(existingResult.data.map((assignment) => assignment.discipulo_id));
    const newIds = discipleIds.filter((id) => linkedIds.has(id) && !existingIds.has(id));
    if (!newIds.length) return { asignados: 0 };

    const { error } = await client.from("assignments").insert(
      newIds.map((discipleId) => ({
        estudio_id: studyId,
        discipulo_id: discipleId,
        asignado_por: me.id,
        estado: "pendiente",
      })),
    );
    if (error) {
      friendlyDataError("assignStudy.insert", "No pudimos asignar el estudio.")(error);
    }
    return { asignados: newIds.length };
  }

  async function listMyAssignments() {
    const me = await requireUser();
    const { data: assignments, error } = await client
      .from("assignments")
      .select(
        "id, estudio_id, discipulo_id, asignado_por, estado, fecha_asignacion, fecha_completado",
      )
      .eq("discipulo_id", me.id)
      .order("fecha_asignacion", { ascending: false });
    if (error) {
      friendlyDataError("listMyAssignments", "No pudimos cargar tus estudios.")(error);
    }
    if (!assignments.length) return [];

    const studyIds = [...new Set(assignments.map((assignment) => assignment.estudio_id))];
    const assignmentIds = assignments.map((assignment) => assignment.id);
    const [studiesResult, responsesResult] = await Promise.all([
      client.from("studies").select("*").in("id", studyIds),
      client.from("responses").select("*").in("asignacion_id", assignmentIds),
    ]);
    if (studiesResult.error) {
      friendlyDataError("listMyAssignments.studies", "No pudimos cargar los estudios.")(
        studiesResult.error,
      );
    }
    if (responsesResult.error) {
      friendlyDataError("listMyAssignments.responses", "No pudimos cargar tus respuestas.")(
        responsesResult.error,
      );
    }

    const studiesById = new Map(studiesResult.data.map((study) => [study.id, study]));
    const responsesByAssignment = new Map(
      responsesResult.data.map((response) => [response.asignacion_id, response]),
    );

    return assignments
      .map((assignment) => ({
        ...assignment,
        estudio: studiesById.get(assignment.estudio_id) || null,
        respuesta: responsesByAssignment.get(assignment.id) || null,
      }))
      .filter((assignment) => assignment.estudio);
  }

  async function getAssignment(assignmentId) {
    const me = await requireUser();
    const { data: assignment, error } = await client
      .from("assignments")
      .select(
        "id, estudio_id, discipulo_id, asignado_por, estado, fecha_asignacion, fecha_completado",
      )
      .eq("id", assignmentId)
      .eq("discipulo_id", me.id)
      .maybeSingle();
    if (error) {
      friendlyDataError("getAssignment", "No pudimos cargar la lección.")(error);
    }
    if (!assignment) throw new Error("No encontramos esta lección entre tus estudios asignados.");

    const [studyResult, responseResult] = await Promise.all([
      client.from("studies").select("*").eq("id", assignment.estudio_id).maybeSingle(),
      client
        .from("responses")
        .select("*")
        .eq("asignacion_id", assignment.id)
        .maybeSingle(),
    ]);
    if (studyResult.error) {
      friendlyDataError("getAssignment.study", "No pudimos cargar el estudio.")(studyResult.error);
    }
    if (!studyResult.data) throw new Error("El estudio de esta asignación ya no está disponible.");
    if (responseResult.error) {
      friendlyDataError("getAssignment.response", "No pudimos cargar tus respuestas.")(
        responseResult.error,
      );
    }

    return {
      assignment,
      estudio: studyResult.data,
      respuesta: responseResult.data || null,
    };
  }

  async function saveResponse(assignmentId, respuestas) {
    const me = await requireUser();
    const { data: assignment, error: assignmentError } = await client
      .from("assignments")
      .select("id")
      .eq("id", assignmentId)
      .eq("discipulo_id", me.id)
      .maybeSingle();
    if (assignmentError) {
      friendlyDataError("saveResponse.assignment", "No pudimos verificar la asignación.")(
        assignmentError,
      );
    }
    if (!assignment) throw new Error("No tenés permiso para responder esta asignación.");

    const { data, error } = await client
      .from("responses")
      .upsert(
        {
          asignacion_id: assignmentId,
          discipulo_id: me.id,
          respuesta: respuestas,
          fecha_actualizacion: new Date().toISOString(),
        },
        { onConflict: "asignacion_id" },
      )
      .select("*")
      .single();
    if (error) {
      friendlyDataError("saveResponse", "No pudimos guardar tus respuestas.")(error);
    }
    return data;
  }

  async function completeAssignment(assignmentId) {
    const me = await requireUser();
    const { data, error } = await client
      .from("assignments")
      .update({
        estado: "completado",
        fecha_completado: new Date().toISOString(),
      })
      .eq("id", assignmentId)
      .eq("discipulo_id", me.id)
      .select(
        "id, estudio_id, discipulo_id, asignado_por, estado, fecha_asignacion, fecha_completado",
      )
      .maybeSingle();
    if (error) {
      friendlyDataError("completeAssignment", "No pudimos completar la lección.")(error);
    }
    if (!data) throw new Error("No tenés permiso para completar esta asignación.");
    return data;
  }

  async function getMyDiscipler() {
    const me = await requireUser();
    const { data: link, error } = await client
      .from("discipleships")
      .select("discipulador_id")
      .eq("discipulo_id", me.id)
      .order("fecha_inicio", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) {
      friendlyDataError("getMyDiscipler", "No pudimos cargar los datos de tu discipulador.")(error);
    }
    if (!link) return null;
    const { data: profile, error: profileError } = await client
      .from("profiles")
      .select("id, nombre, email, rol, fecha_creacion")
      .eq("id", link.discipulador_id)
      .maybeSingle();
    if (profileError) {
      friendlyDataError("getMyDiscipler.profile", "No pudimos cargar el perfil.")(profileError);
    }
    return profile || null;
  }

  return {
    mode: "supabase",
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
