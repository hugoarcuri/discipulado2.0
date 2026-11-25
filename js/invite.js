/**
 * Utilidades compartidas para invitaciones de discípulos.
 * El token es la parte secreta del link: se genera en el navegador y se
 * guarda en el backend. No se deriva del email ni de datos previsibles.
 */

export function createInviteToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function invitationUrl(token) {
  const path = window.location.pathname.replace(/index\.html?$/i, "");
  return `${window.location.origin}${path}#/invitacion/${encodeURIComponent(token)}`;
}

export function whatsappInviteUrl({ nombre, discipler, link }) {
  const message = `Hola ${nombre}, ${discipler} te invita a su espacio de discipulado en Discípulos. Activá tu cuenta con este link personal: ${link}`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch (error) {
    // Si el navegador bloquea el portapapeles, probamos el respaldo clásico.
  }

  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  const copied = document.execCommand("copy");
  area.remove();
  if (!copied) throw new Error("No pudimos copiar el link. Seleccionalo y copialo manualmente.");
}
