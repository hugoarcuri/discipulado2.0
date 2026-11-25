/**
 * Configuración de DISCÍPULOS.
 *
 * MODO DEMOSTRACIÓN
 * Si estas dos credenciales quedan con los valores de ejemplo, la aplicación
 * funciona con datos locales guardados en el navegador. En ese modo se muestra
 * un aviso visible y no se intenta ninguna conexión con Supabase.
 *
 * MODO REAL
 * Completá SUPABASE_URL y SUPABASE_ANON_KEY con los datos de tu proyecto:
 * Supabase → Project Settings → API.
 *
 * La "anon key" es pública por diseño. La privacidad de los datos depende de
 * las políticas RLS incluidas en supabase/schema.sql.
 */

export const CONFIG = {
  SUPABASE_URL: "https://ztkluumuxpltxazgpziz.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0a2x1dW11eHBsdHhhemdweml6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU2MzAyMzMsImV4cCI6MjExMTIwNjIzM30.uL8S_3iJF1dTcysL75ga2mPPK-QrQueX4aJlD3jN2no",
  // Versión sugerida al abrir un pasaje en BibleGateway.
  BIBLE_VERSION: "RVR1960",
};

const url = CONFIG.SUPABASE_URL.trim();
const key = CONFIG.SUPABASE_ANON_KEY.trim();

export const isSupabaseConfigured =
  /^https:\/\//i.test(url) &&
  !url.includes("TU_SUPABASE") &&
  key.length > 30 &&
  !key.startsWith("TU_");
