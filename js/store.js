/**
 * Selección del backend y estado de sesión.
 * La interfaz siempre habla con `store.api`, sin saber si los datos vienen de
 * Supabase o del modo demostración local.
 */

import { CONFIG, isSupabaseConfigured } from "./config.js";
import { createDemoBackend } from "./demo.js";
import { createSupabaseBackend } from "./supabase.js";

export const store = {
  mode: isSupabaseConfigured ? "supabase" : "demo",
  api: null,
  user: null,
  config: CONFIG,

  async init() {
    this.mode = isSupabaseConfigured ? "supabase" : "demo";
    this.api =
      this.mode === "supabase"
        ? await createSupabaseBackend()
        : await createDemoBackend();
    this.user = await this.api.getCurrentUser();
    return this.user;
  },

  setUser(user) {
    this.user = user;
  },

  async signIn(email, password) {
    this.user = await this.api.signIn(email, password);
    return this.user;
  },

  async signUp(data) {
    const result = await this.api.signUp(data);
    this.user = result.user;
    return result;
  },

  async signOut() {
    await this.api.signOut();
    this.user = null;
  },
};
