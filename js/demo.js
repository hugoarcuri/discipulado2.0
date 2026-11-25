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
const DEMO_PASSWORD = "demo1234";
const APP_SALT = "discipulos-demo-local";
const INVITATION_DAYS = 14;

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

function buildSeed(passwordHash) {
  return {
    users: [
      {
        id: "u_ana_demo",
        nombre: "Ana Martínez",
        email: "ana@demo.com",
        password_hash: passwordHash,
        rol: "discipulador",
        fecha_creacion: "2026-07-15T10:00:00.000Z",
      },
      {
        id: "u_lucas_demo",
        nombre: "Lucas Fernández",
        email: "lucas@demo.com",
        password_hash: passwordHash,
        rol: "discipulo",
        fecha_creacion: "2026-08-02T14:30:00.000Z",
      },
      {
        id: "u_sofia_demo",
        nombre: "Sofía Ramírez",
        email: "sofia@demo.com",
        password_hash: passwordHash,
        rol: "discipulo",
        fecha_creacion: "2026-09-08T09:15:00.000Z",
      },
    ],
    discipleships: [
      {
        id: "ds_lucas",
        discipulador_id: "u_ana_demo",
        discipulo_id: "u_lucas_demo",
        fecha_inicio: "2026-08-03",
        estado: "activo",
      },
      {
        id: "ds_sofia",
        discipulador_id: "u_ana_demo",
        discipulo_id: "u_sofia_demo",
        fecha_inicio: "2026-09-10",
        estado: "activo",
      },
    ],
    studies: [
      {
        id: "s_gracia",
        titulo: "El regalo de la gracia",
        descripcion:
          "Un primer acercamiento al regalo de la salvación y a lo que significa vivir desde la gracia de Dios.",
        etapa: "nuevos-comienzos",
        pasaje_biblico: "Efesios 2:1-10",
        objetivo:
          "Comprender que la salvación es un regalo de Dios y no un logro personal, para responder con gratitud y no con culpa.",
        contenido:
          "La salvación no comienza con lo que hacemos por Dios, sino con lo que Dios hizo por nosotros. Pablo recuerda a los efesios que estaban muertos en sus delitos y que fueron vivificados por gracia. No había nada que pudieran ofrecer para merecer ese regalo.\n\nLa gracia es un regalo: no se gana, no se merece y no se paga. Por eso la vida cristiana no es un intento de ganar el amor de Dios, sino una respuesta agradecida a un amor que ya nos alcanzó. Esta verdad nos libera del orgullo y también de la desesperanza.\n\nCuando comprendemos la gracia, cambia nuestra manera de acercarnos a Dios y de acompañar a otros. Dejamos de medirnos con la vara del mérito y aprendemos a descansar en Cristo, sabiendo que las buenas obras son el fruto de una vida transformada, no el precio de la salvación.",
        preguntas: [
          {
            id: "q_gracia_1",
            texto:
              "¿Qué diferencia hay entre intentar ganar el favor de Dios y recibirlo como un regalo?",
          },
          {
            id: "q_gracia_2",
            texto:
              "Según Efesios 2:10, ¿para qué preparó Dios las buenas obras en nuestra vida?",
          },
          {
            id: "q_gracia_3",
            texto:
              "¿Cómo cambia tu forma de verte a vos mismo y a los demás saber que la salvación es por gracia?",
          },
        ],
        actividad:
          "Durante esta semana, anotá tres momentos en los que intentaste ganarte el amor de Dios. Al lado de cada uno, escribí una frase de Efesios 2 que te recuerde la verdad de la gracia.",
        material_complementario:
          "Leé Romanos 8:1-4 y anotá una frase que te ayude a descansar en la obra de Cristo.",
        creador_id: "u_ana_demo",
        fecha_creacion: "2026-08-05T13:00:00.000Z",
      },
      {
        id: "s_oracion",
        titulo: "Una vida de oración",
        descripcion:
          "Aprender a orar con sinceridad, dependencia y constancia, tomando como modelo la enseñanza de Jesús.",
        etapa: "crecimiento",
        pasaje_biblico: "Mateo 6:5-13",
        objetivo:
          "Incorporar la oración como un hábito cotidiano de comunión con Dios, más allá de las palabras o las circunstancias.",
        contenido:
          "Jesús enseñó a orar a personas comunes. No buscaba discursos elocuentes ni fórmulas mágicas, sino una relación honesta con el Padre. La oración es, ante todo, una conversación donde aprendemos a escuchar y a hablar con confianza.\n\nEn el Padrenuestro, Jesús comienza por el carácter y el reino de Dios antes de presentar las necesidades personales. Esa estructura nos recuerda que la oración no es solo un pedido de ayuda, sino una forma de alinear el corazón con la voluntad del Padre.\n\nLa constancia importa. Habrá días de sequedad y días de alegría; la fidelidad de Dios no depende de nuestras emociones. Orar es volver una y otra vez, con sencillez, sabiendo que él escucha.",
        preguntas: [
          {
            id: "q_oracion_1",
            texto:
              "¿Qué lugar ocupa la oración en tu rutina diaria y qué te cuesta más sostener?",
          },
          {
            id: "q_oracion_2",
            texto:
              "¿Por qué creés que Jesús nos enseña a comenzar por el carácter de Dios y no por nuestras necesidades?",
          },
          {
            id: "q_oracion_3",
            texto: "¿Qué pedido concreto querés presentarle a Dios esta semana?",
          },
        ],
        actividad:
          "Elegí un horario fijo para orar durante diez minutos cada día de esta semana. Escribí al final una frase sobre lo que Dios te mostró en ese tiempo.",
        material_complementario: "Leé Lucas 11:1-13 como complemento de Mateo 6:5-13.",
        creador_id: "u_ana_demo",
        fecha_creacion: "2026-08-20T10:30:00.000Z",
      },
      {
        id: "s_fruto",
        titulo: "El fruto del Espíritu en las relaciones",
        descripcion:
          "Reconocer cómo el Espíritu de Dios forma en nosotros un carácter que se expresa en la manera de tratar a los demás.",
        etapa: "caracter",
        pasaje_biblico: "Gálatas 5:16-26",
        objetivo:
          "Identificar un área concreta de nuestra manera de relacionarnos donde el Espíritu quiere formar su fruto.",
        contenido:
          "Pablo contrasta las obras de la carne con el fruto del Espíritu. No se trata simplemente de una lista de virtudes que debemos fabricar por esfuerzo propio, sino del resultado de una vida que se deja guiar por el Espíritu.\n\nEl amor, el gozo, la paz, la paciencia, la benignidad, la bondad, la fe, la mansedumbre y la templanza se prueban especialmente en las relaciones. Es en la convivencia diaria, en las diferencias y en las heridas donde se ve si estamos dando fruto.\n\nCrecer en carácter no significa esconder las dificultades, sino llevarlas a la luz de Dios y permitir que él transforme nuestras reacciones. Es un proceso, no una actuación.",
        preguntas: [
          {
            id: "q_fruto_1",
            texto:
              "¿Cuál de las actitudes del fruto del Espíritu reconocés que más necesitás desarrollar en tus relaciones?",
          },
          {
            id: "q_fruto_2",
            texto:
              "¿Qué diferencia hay entre esforzarte por ser bueno y dejar que el Espíritu forme su fruto?",
          },
          {
            id: "q_fruto_3",
            texto:
              "¿Con qué persona o situación concreta necesitás pedirle a Dios una reacción distinta esta semana?",
          },
        ],
        actividad:
          "Elegí una relación concreta y esta semana practicá una actitud del fruto del Espíritu que te resulte difícil. Al final de la semana, anotá qué aprendiste.",
        material_complementario:
          "Escuchá o leé Colosenses 3:12-17 y anotá una frase que quieras recordar.",
        creador_id: "u_ana_demo",
        fecha_creacion: "2026-09-15T16:00:00.000Z",
      },
      {
        id: "s_servicio",
        titulo: "Llamados a servir",
        descripcion:
          "Descubrir que el liderazgo que Jesús nos propone no busca ser servido, sino servir y acompañar a otros en su crecimiento.",
        etapa: "compromiso",
        pasaje_biblico: "Marcos 10:42-45",
        objetivo:
          "Comprender el servicio como respuesta al ejemplo de Jesús y dar un paso concreto para acompañar a otra persona.",
        contenido:
          "Jesús invirtió la lógica del poder. Mientras los líderes de las naciones dominaban, él eligió servir. Su autoridad no se construyó sobre el control, sino sobre la entrega.\n\nServir no es sinónimo de hacer todo por los demás ni de olvidarnos de nuestros límites. Es usar lo que Dios nos dio para el bien de otros, con humildad y responsabilidad. El servicio madura cuando nace del amor y no de la búsqueda de reconocimiento.\n\nEl discipulado es un servicio: acompañar a alguien, escuchar, enseñar con paciencia y señalar a Cristo. No se trata de tener todas las respuestas, sino de caminar junto a otro con fidelidad.",
        preguntas: [
          {
            id: "q_servicio_1",
            texto:
              "¿Cómo describirías la diferencia entre servir con amor y servir buscando aprobación?",
          },
          {
            id: "q_servicio_2",
            texto:
              "¿Qué recurso, talento o tiempo podés poner hoy al servicio de otra persona?",
          },
          {
            id: "q_servicio_3",
            texto:
              "¿A quién podrías acompañar en un paso concreto de su crecimiento durante este mes?",
          },
        ],
        actividad:
          "Elegí una persona de tu entorno y hacé algo concreto por ella esta semana, sin esperar nada a cambio. Luego anotá cómo te hizo sentir y qué te mostró Dios.",
        material_complementario:
          "Leé Juan 13:1-17 y compará el gesto de Jesús con tu manera de servir.",
        creador_id: "u_ana_demo",
        fecha_creacion: "2026-10-02T11:00:00.000Z",
      },
    ],
    assignments: [
      {
        id: "a_lucas_gracia",
        estudio_id: "s_gracia",
        discipulo_id: "u_lucas_demo",
        asignado_por: "u_ana_demo",
        estado: "completado",
        fecha_asignacion: "2026-08-06T10:00:00.000Z",
        fecha_completado: "2026-08-13T18:20:00.000Z",
      },
      {
        id: "a_lucas_oracion",
        estudio_id: "s_oracion",
        discipulo_id: "u_lucas_demo",
        asignado_por: "u_ana_demo",
        estado: "pendiente",
        fecha_asignacion: "2026-09-01T09:30:00.000Z",
        fecha_completado: null,
      },
      {
        id: "a_lucas_fruto",
        estudio_id: "s_fruto",
        discipulo_id: "u_lucas_demo",
        asignado_por: "u_ana_demo",
        estado: "pendiente",
        fecha_asignacion: "2026-10-05T15:10:00.000Z",
        fecha_completado: null,
      },
      {
        id: "a_sofia_gracia",
        estudio_id: "s_gracia",
        discipulo_id: "u_sofia_demo",
        asignado_por: "u_ana_demo",
        estado: "completado",
        fecha_asignacion: "2026-09-12T11:00:00.000Z",
        fecha_completado: "2026-09-19T20:00:00.000Z",
      },
      {
        id: "a_sofia_oracion",
        estudio_id: "s_oracion",
        discipulo_id: "u_sofia_demo",
        asignado_por: "u_ana_demo",
        estado: "completado",
        fecha_asignacion: "2026-09-20T10:00:00.000Z",
        fecha_completado: "2026-10-01T19:40:00.000Z",
      },
    ],
    responses: [
      {
        id: "r_lucas_gracia",
        asignacion_id: "a_lucas_gracia",
        discipulo_id: "u_lucas_demo",
        respuesta: {
          q_gracia_1:
            "Antes pensaba que tenía que portarme bien para que Dios me aceptara. Ahora entiendo que él me acepta primero y que mi obediencia es una respuesta de amor.",
          q_gracia_2:
            "Dios preparó las obras para que caminemos en ellas, no para que nos salvemos por ellas. Son el fruto de estar en Cristo.",
          q_gracia_3:
            "Me hace más humilde y más paciente con los demás. También me quita la culpa de sentir que nunca es suficiente.",
        },
        fecha_actualizacion: "2026-08-13T18:20:00.000Z",
      },
      {
        id: "r_sofia_gracia",
        asignacion_id: "a_sofia_gracia",
        discipulo_id: "u_sofia_demo",
        respuesta: {
          q_gracia_1:
            "Ganar el favor de Dios implica esfuerzo y miedo a fallar; recibirlo como regalo implica descanso y gratitud.",
          q_gracia_2:
            "Para que anduviéramos en ellas. Creo que las obras son el camino donde Dios nos invita a caminar, no el precio de la entrada.",
          q_gracia_3:
            "Me ayuda a dejar de compararme con otros y a recibir el amor de Dios con más libertad.",
        },
        fecha_actualizacion: "2026-09-19T20:00:00.000Z",
      },
      {
        id: "r_sofia_oracion",
        asignacion_id: "a_sofia_oracion",
        discipulo_id: "u_sofia_demo",
        respuesta: {
          q_oracion_1:
            "Orar me cuesta cuando estoy cansada. A veces lo hago rápido antes de dormir, sin detenerme a escuchar.",
          q_oracion_2:
            "Porque nos ayuda a recordar quién es Dios y a confiar antes de pedir. Cambia la perspectiva de la necesidad.",
          q_oracion_3:
            "Quiero pedirle paz para una situación familiar y ánimo para sostener el hábito.",
        },
        fecha_actualizacion: "2026-10-01T19:40:00.000Z",
      },
    ],
    observations: [
      {
        id: "o_lucas_1",
        discipulador_id: "u_ana_demo",
        discipulo_id: "u_lucas_demo",
        observacion:
          "Lucas mostró mucha apertura al compartir su historia. Le cuesta descansar en la gracia y tiende a medirse por su rendimiento. Conviene volver sobre la identidad en Cristo.",
        fecha_creacion: "2026-09-01T19:00:00.000Z",
      },
      {
        id: "o_lucas_2",
        discipulador_id: "u_ana_demo",
        discipulo_id: "u_lucas_demo",
        observacion:
          "Está sosteniendo la lectura bíblica entre semana. Propuse orar juntos al inicio de nuestro próximo encuentro.",
        fecha_creacion: "2026-10-10T17:30:00.000Z",
      },
      {
        id: "o_sofia_1",
        discipulador_id: "u_ana_demo",
        discipulo_id: "u_sofia_demo",
        observacion:
          "Sofía camina con constancia y honestidad. Valora mucho los espacios de escucha. Le sugerí escribir sus oraciones para poder revisar después cómo Dios fue respondiendo.",
        fecha_creacion: "2026-10-02T20:00:00.000Z",
      },
    ],
    invitations: [],
  };
}

async function ensureSeed() {
  let db = readDb();
  if (db) {
    let changed = false;
    if (!Array.isArray(db.invitations)) {
      db.invitations = [];
      changed = true;
    }
    if (changed) writeDb(db);
    return db;
  }
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  db = buildSeed(passwordHash);
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
    if (!user) throw new Error("Email o contraseña incorrectos.");
    const hash = await hashPassword(password);
    if (hash !== user.password_hash) {
      throw new Error("Email o contraseña incorrectos.");
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
    demoCredentials: {
      discipulador: { email: "ana@demo.com", password: DEMO_PASSWORD },
      discipulo: { email: "lucas@demo.com", password: DEMO_PASSWORD },
    },
  };
}
