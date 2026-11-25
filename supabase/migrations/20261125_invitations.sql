-- ============================================================
-- DISCÍPULOS · Migración: invitaciones de discípulos por link
-- Ejecutar en Supabase → SQL Editor sobre un proyecto ya creado
-- con supabase/schema.sql.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1. TABLA DE INVITACIONES
-- ------------------------------------------------------------

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  token text not null unique check (char_length(token) between 32 and 128),
  discipulador_id uuid not null references public.profiles (id) on delete cascade,
  nombre text not null check (char_length(trim(nombre)) between 2 and 80),
  email text not null,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'aceptada', 'revocada', 'expirada')),
  discipulo_id uuid references public.profiles (id) on delete set null,
  fecha_creacion timestamptz not null default now(),
  fecha_vencimiento timestamptz not null,
  fecha_aceptacion timestamptz
);

create index if not exists invitations_discipulador_idx
  on public.invitations (discipulador_id);
create index if not exists invitations_email_idx
  on public.invitations (lower(email));
create index if not exists invitations_estado_idx
  on public.invitations (estado);

-- ------------------------------------------------------------
-- 2. PERFIL AUTOMÁTICO: EL INVITADO SIEMPRE ENTRA COMO DISCÍPULO
-- ------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nombre text;
  v_rol text;
begin
  v_nombre := nullif(trim(coalesce(new.raw_user_meta_data ->> 'nombre', '')), '');
  if v_nombre is null or char_length(v_nombre) < 2 then
    v_nombre := split_part(coalesce(new.email, ''), '@', 1);
  end if;

  v_rol := case
    when new.raw_user_meta_data ->> 'rol' = 'discipulador' then 'discipulador'
    else 'discipulo'
  end;

  if exists (
    select 1
    from public.invitations
    where lower(email) = lower(new.email)
      and estado = 'pendiente'
      and fecha_vencimiento > now()
  ) then
    v_rol := 'discipulo';
  end if;

  insert into public.profiles (id, nombre, email, rol)
  values (new.id, left(v_nombre, 80), lower(new.email), v_rol)
  on conflict (id) do nothing;

  return new;
end;
$$;

-- ------------------------------------------------------------
-- 3. FUNCIONES DE INVITACIÓN
-- ------------------------------------------------------------

create or replace function public.get_invitation(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_inv record;
begin
  select
    i.id,
    i.nombre,
    i.email,
    case
      when i.estado = 'pendiente' and i.fecha_vencimiento < now() then 'expirada'
      else i.estado
    end as estado,
    i.fecha_creacion,
    i.fecha_vencimiento,
    i.discipulo_id,
    p.nombre as discipulador_nombre
  into v_inv
  from public.invitations i
  left join public.profiles p on p.id = i.discipulador_id
  where i.token = trim(coalesce(p_token, ''))
  limit 1;

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'id', v_inv.id,
    'nombre', v_inv.nombre,
    'email', v_inv.email,
    'estado', v_inv.estado,
    'fecha_creacion', v_inv.fecha_creacion,
    'fecha_vencimiento', v_inv.fecha_vencimiento,
    'discipulo_id', v_inv.discipulo_id,
    'discipulador', jsonb_build_object(
      'nombre', coalesce(v_inv.discipulador_nombre, 'Tu discipulador')
    )
  );
end;
$$;

create or replace function public.accept_invitation(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_inv public.invitations%rowtype;
  v_profile public.profiles%rowtype;
begin
  if v_uid is null then
    raise exception 'Necesitás iniciar sesión para aceptar la invitación.';
  end if;

  select *
  into v_inv
  from public.invitations
  where token = trim(coalesce(p_token, ''))
  for update;

  if not found then
    raise exception 'No encontramos esta invitación.';
  end if;

  if v_inv.estado = 'aceptada' then
    if v_inv.discipulo_id = v_uid then
      return jsonb_build_object(
        'invitation_id', v_inv.id,
        'discipulador_id', v_inv.discipulador_id,
        'discipulo_id', v_uid,
        'already_accepted', true
      );
    end if;
    raise exception 'Esta invitación ya fue utilizada por otra persona.';
  end if;

  if v_inv.estado = 'revocada' then
    raise exception 'Esta invitación fue revocada por el discipulador.';
  end if;

  if v_inv.estado = 'expirada' or v_inv.fecha_vencimiento < now() then
    raise exception 'Esta invitación venció. Pedile al discipulador que genere un link nuevo.';
  end if;

  select *
  into v_profile
  from public.profiles
  where id = v_uid;

  if not found then
    raise exception 'No encontramos tu perfil.';
  end if;

  if v_profile.rol <> 'discipulo' then
    raise exception 'Esta invitación es para una cuenta de discípulo.';
  end if;

  if lower(v_profile.email) <> lower(v_inv.email) then
    raise exception 'Esta invitación es para otro email. Iniciá sesión con la cuenta invitada.';
  end if;

  insert into public.discipleships (discipulador_id, discipulo_id, estado)
  values (v_inv.discipulador_id, v_uid, 'activo')
  on conflict (discipulador_id, discipulo_id) do nothing;

  update public.invitations
  set estado = 'aceptada',
      discipulo_id = v_uid,
      fecha_aceptacion = now()
  where id = v_inv.id;

  return jsonb_build_object(
    'invitation_id', v_inv.id,
    'discipulador_id', v_inv.discipulador_id,
    'discipulo_id', v_uid,
    'already_accepted', false
  );
end;
$$;

-- ------------------------------------------------------------
-- 4. RLS
-- ------------------------------------------------------------

alter table public.invitations enable row level security;

drop policy if exists "invitations_select_own" on public.invitations;
create policy "invitations_select_own"
  on public.invitations for select
  to authenticated
  using (
    discipulador_id = auth.uid()
    or discipulo_id = auth.uid()
  );

drop policy if exists "invitations_insert_by_discipler" on public.invitations;
create policy "invitations_insert_by_discipler"
  on public.invitations for insert
  to authenticated
  with check (
    discipulador_id = auth.uid()
    and public.current_user_role() = 'discipulador'
    and estado = 'pendiente'
  );

drop policy if exists "invitations_update_by_discipler" on public.invitations;
create policy "invitations_update_by_discipler"
  on public.invitations for update
  to authenticated
  using (discipulador_id = auth.uid())
  with check (discipulador_id = auth.uid());

drop policy if exists "invitations_delete_by_discipler" on public.invitations;
create policy "invitations_delete_by_discipler"
  on public.invitations for delete
  to authenticated
  using (discipulador_id = auth.uid());

-- ------------------------------------------------------------
-- 5. PERMISOS
-- ------------------------------------------------------------

grant select, insert, update, delete on public.invitations to authenticated;
revoke all on public.invitations from anon;

revoke all on function public.get_invitation(text) from public;
grant execute on function public.get_invitation(text) to anon, authenticated;

revoke all on function public.accept_invitation(text) from public;
grant execute on function public.accept_invitation(text) to authenticated;

notify pgrst, 'reload schema';
