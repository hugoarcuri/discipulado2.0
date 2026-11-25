-- ============================================================
-- DISCÍPULOS · Corrección: permisos de invitación
-- Ejecutar en Supabase → SQL Editor.
-- Reemplaza la política de inserción de invitaciones para no depender
-- de la función current_user_role(), que en algunos proyectos devolvía null.
-- ============================================================

drop policy if exists "invitations_insert_by_discipler" on public.invitations;

create policy "invitations_insert_by_discipler"
  on public.invitations for insert
  to authenticated
  with check (
    discipulador_id = auth.uid()
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and rol = 'discipulador'
    )
    and estado = 'pendiente'
  );

-- Asegurar permisos de las funciones de invitación.
grant execute on function public.get_invitation(text) to anon, authenticated;
grant execute on function public.accept_invitation(text) to authenticated;

notify pgrst, 'reload schema';
