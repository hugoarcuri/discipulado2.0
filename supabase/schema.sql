-- ============================================================
-- DISCÍPULOS · Esquema para Supabase
-- Ejecutar en Supabase → SQL Editor sobre un proyecto nuevo.
--
-- Incluye:
--   - Tablas del discipulado
--   - Perfiles vinculados a Supabase Auth
--   - Funciones auxiliares y triggers
--   - Políticas RLS (Row Level Security)
--
-- La contraseña NUNCA se guarda en estas tablas: la gestiona auth.users.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1. TABLAS
-- ------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null check (char_length(trim(nombre)) between 2 and 80),
  email text not null,
  rol text not null check (rol in ('discipulador', 'discipulo')),
  fecha_creacion timestamptz not null default now()
);

create unique index if not exists profiles_email_lower_key
  on public.profiles (lower(email));

create table if not exists public.discipleships (
  id uuid primary key default gen_random_uuid(),
  discipulador_id uuid not null references public.profiles (id) on delete cascade,
  discipulo_id uuid not null references public.profiles (id) on delete cascade,
  fecha_inicio date not null default current_date,
  estado text not null default 'activo'
    check (estado in ('activo', 'pausado', 'finalizado')),
  constraint discipleships_no_self check (discipulador_id <> discipulo_id),
  constraint discipleships_unique_pair unique (discipulador_id, discipulo_id)
);

create table if not exists public.studies (
  id uuid primary key default gen_random_uuid(),
  titulo text not null check (char_length(trim(titulo)) between 4 and 120),
  descripcion text not null,
  etapa text not null
    check (etapa in ('nuevos-comienzos', 'crecimiento', 'caracter', 'compromiso')),
  pasaje_biblico text not null,
  objetivo text not null,
  contenido text not null,
  preguntas jsonb not null default '[]'::jsonb
    check (jsonb_typeof(preguntas) = 'array' and jsonb_array_length(preguntas) >= 1),
  actividad text not null,
  material_complementario text not null default '',
  creador_id uuid not null references public.profiles (id) on delete cascade,
  fecha_creacion timestamptz not null default now()
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  estudio_id uuid not null references public.studies (id) on delete cascade,
  discipulo_id uuid not null references public.profiles (id) on delete cascade,
  asignado_por uuid not null references public.profiles (id) on delete cascade,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'completado')),
  fecha_asignacion timestamptz not null default now(),
  fecha_completado timestamptz,
  constraint assignments_unique_pair unique (estudio_id, discipulo_id)
);

create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  asignacion_id uuid not null references public.assignments (id) on delete cascade,
  discipulo_id uuid not null references public.profiles (id) on delete cascade,
  respuesta jsonb not null default '{}'::jsonb
    check (jsonb_typeof(respuesta) = 'object'),
  fecha_actualizacion timestamptz not null default now(),
  constraint responses_assignment_unique unique (asignacion_id)
);

create table if not exists public.observations (
  id uuid primary key default gen_random_uuid(),
  discipulador_id uuid not null references public.profiles (id) on delete cascade,
  discipulo_id uuid not null references public.profiles (id) on delete cascade,
  observacion text not null check (char_length(trim(observacion)) > 0),
  fecha_creacion timestamptz not null default now()
);

create index if not exists discipleships_discipulador_idx
  on public.discipleships (discipulador_id);
create index if not exists discipleships_discipulo_idx
  on public.discipleships (discipulo_id);
create index if not exists studies_creador_idx
  on public.studies (creador_id);
create index if not exists studies_etapa_idx
  on public.studies (etapa);
create index if not exists assignments_discipulo_idx
  on public.assignments (discipulo_id);
create index if not exists assignments_asignado_por_idx
  on public.assignments (asignado_por);
create index if not exists assignments_estudio_idx
  on public.assignments (estudio_id);
create index if not exists responses_discipulo_idx
  on public.responses (discipulo_id);
create index if not exists observations_discipulador_idx
  on public.observations (discipulador_id);
create index if not exists observations_discipulo_idx
  on public.observations (discipulo_id);

-- ------------------------------------------------------------
-- 2. PERFIL AUTOMÁTICO AL REGISTRARSE
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

  insert into public.profiles (id, nombre, email, rol)
  values (new.id, left(v_nombre, 80), lower(new.email), v_rol)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- El rol y el email del perfil no se pueden cambiar desde la aplicación.
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
as $$
begin
  if new.rol is distinct from old.rol then
    raise exception 'El rol del perfil no se puede modificar.';
  end if;
  if new.email is distinct from old.email then
    raise exception 'El email del perfil no se puede modificar desde la aplicación.';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_fields_trigger on public.profiles;
create trigger protect_profile_fields_trigger
  before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- Una asignación no puede cambiar de estudio, discípulo ni autor.
create or replace function public.protect_assignment_identity()
returns trigger
language plpgsql
as $$
begin
  if new.estudio_id is distinct from old.estudio_id
     or new.discipulo_id is distinct from old.discipulo_id
     or new.asignado_por is distinct from old.asignado_por
     or new.fecha_asignacion is distinct from old.fecha_asignacion then
    raise exception 'No se pueden modificar los datos de origen de una asignación.';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_assignment_identity_trigger on public.assignments;
create trigger protect_assignment_identity_trigger
  before update on public.assignments
  for each row execute function public.protect_assignment_identity();

-- Una respuesta no puede cambiar de asignación ni de discípulo.
create or replace function public.protect_response_identity()
returns trigger
language plpgsql
as $$
begin
  if new.asignacion_id is distinct from old.asignacion_id
     or new.discipulo_id is distinct from old.discipulo_id then
    raise exception 'No se pueden modificar los datos de origen de una respuesta.';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_response_identity_trigger on public.responses;
create trigger protect_response_identity_trigger
  before update on public.responses
  for each row execute function public.protect_response_identity();

-- ------------------------------------------------------------
-- 3. FUNCIONES AUXILIARES PARA RLS
-- Se declaran SECURITY DEFINER para consultar vínculos sin que las
-- propias políticas de las tablas relacionadas bloqueen la verificación.
-- ------------------------------------------------------------

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select rol from public.profiles where id = auth.uid();
$$;

create or replace function public.role_of(p_user uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select rol from public.profiles where id = p_user;
$$;

create or replace function public.is_discipler_of(p_disciple uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.discipleships
    where discipulador_id = auth.uid()
      and discipulo_id = p_disciple
      and estado = 'activo'
  );
$$;

create or replace function public.has_discipler(p_discipler uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.discipleships
    where discipulo_id = auth.uid()
      and discipulador_id = p_discipler
      and estado = 'activo'
  );
$$;

create or replace function public.owns_study(p_study uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.studies
    where id = p_study and creador_id = auth.uid()
  );
$$;

create or replace function public.has_study_assignment(p_study uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.assignments
    where estudio_id = p_study and discipulo_id = auth.uid()
  );
$$;

create or replace function public.is_my_disciple(p_disciple uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.discipleships
    where discipulador_id = auth.uid()
      and discipulo_id = p_disciple
      and estado = 'activo'
  );
$$;

create or replace function public.is_my_assignment(p_assignment uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.assignments
    where id = p_assignment and discipulo_id = auth.uid()
  );
$$;

create or replace function public.is_assignment_assigner(p_assignment uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.assignments
    where id = p_assignment and asignado_por = auth.uid()
  );
$$;

-- Permite que un discipulador encuentre por email a una cuenta de discípulo
-- antes de vincularla. Solo devuelve coincidencias exactas.
create or replace function public.buscar_discipulo_por_email(p_email text)
returns table (id uuid, nombre text, email text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.nombre, p.email
  from public.profiles p
  where lower(p.email) = lower(trim(p_email))
    and p.rol = 'discipulo'
    and public.current_user_role() = 'discipulador'
  limit 1;
$$;

-- ------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- ------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.discipleships enable row level security;
alter table public.studies enable row level security;
alter table public.assignments enable row level security;
alter table public.responses enable row level security;
alter table public.observations enable row level security;

-- profiles
drop policy if exists "profiles_select_related" on public.profiles;
create policy "profiles_select_related"
  on public.profiles for select
  to authenticated
  using (
    id = auth.uid()
    or public.is_discipler_of(id)
    or public.has_discipler(id)
  );

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- discipleships
drop policy if exists "discipleships_select_related" on public.discipleships;
create policy "discipleships_select_related"
  on public.discipleships for select
  to authenticated
  using (discipulador_id = auth.uid() or discipulo_id = auth.uid());

drop policy if exists "discipleships_insert_by_discipler" on public.discipleships;
create policy "discipleships_insert_by_discipler"
  on public.discipleships for insert
  to authenticated
  with check (
    discipulador_id = auth.uid()
    and public.current_user_role() = 'discipulador'
    and public.role_of(discipulo_id) = 'discipulo'
  );

-- studies
drop policy if exists "studies_select_own_or_assigned" on public.studies;
create policy "studies_select_own_or_assigned"
  on public.studies for select
  to authenticated
  using (
    creador_id = auth.uid()
    or public.has_study_assignment(id)
  );

drop policy if exists "studies_insert_by_creator" on public.studies;
create policy "studies_insert_by_creator"
  on public.studies for insert
  to authenticated
  with check (
    creador_id = auth.uid()
    and public.current_user_role() = 'discipulador'
  );

drop policy if exists "studies_update_by_creator" on public.studies;
create policy "studies_update_by_creator"
  on public.studies for update
  to authenticated
  using (creador_id = auth.uid())
  with check (creador_id = auth.uid());

drop policy if exists "studies_delete_by_creator" on public.studies;
create policy "studies_delete_by_creator"
  on public.studies for delete
  to authenticated
  using (creador_id = auth.uid());

-- assignments
drop policy if exists "assignments_select_related" on public.assignments;
create policy "assignments_select_related"
  on public.assignments for select
  to authenticated
  using (asignado_por = auth.uid() or discipulo_id = auth.uid());

drop policy if exists "assignments_insert_by_discipler" on public.assignments;
create policy "assignments_insert_by_discipler"
  on public.assignments for insert
  to authenticated
  with check (
    asignado_por = auth.uid()
    and public.owns_study(estudio_id)
    and public.is_my_disciple(discipulo_id)
  );

drop policy if exists "assignments_update_by_disciple" on public.assignments;
create policy "assignments_update_by_disciple"
  on public.assignments for update
  to authenticated
  using (discipulo_id = auth.uid())
  with check (discipulo_id = auth.uid());

-- responses
drop policy if exists "responses_select_owner_or_discipler" on public.responses;
create policy "responses_select_owner_or_discipler"
  on public.responses for select
  to authenticated
  using (
    discipulo_id = auth.uid()
    or public.is_assignment_assigner(asignacion_id)
  );

drop policy if exists "responses_insert_by_disciple" on public.responses;
create policy "responses_insert_by_disciple"
  on public.responses for insert
  to authenticated
  with check (
    discipulo_id = auth.uid()
    and public.is_my_assignment(asignacion_id)
  );

drop policy if exists "responses_update_by_disciple" on public.responses;
create policy "responses_update_by_disciple"
  on public.responses for update
  to authenticated
  using (
    discipulo_id = auth.uid()
    and public.is_my_assignment(asignacion_id)
  )
  with check (
    discipulo_id = auth.uid()
    and public.is_my_assignment(asignacion_id)
  );

-- observations (privadas del discipulador)
drop policy if exists "observations_select_own" on public.observations;
create policy "observations_select_own"
  on public.observations for select
  to authenticated
  using (
    discipulador_id = auth.uid()
    and public.is_my_disciple(discipulo_id)
  );

drop policy if exists "observations_insert_own" on public.observations;
create policy "observations_insert_own"
  on public.observations for insert
  to authenticated
  with check (
    discipulador_id = auth.uid()
    and public.is_my_disciple(discipulo_id)
  );

drop policy if exists "observations_update_own" on public.observations;
create policy "observations_update_own"
  on public.observations for update
  to authenticated
  using (
    discipulador_id = auth.uid()
    and public.is_my_disciple(discipulo_id)
  )
  with check (
    discipulador_id = auth.uid()
    and public.is_my_disciple(discipulo_id)
  );

drop policy if exists "observations_delete_own" on public.observations;
create policy "observations_delete_own"
  on public.observations for delete
  to authenticated
  using (
    discipulador_id = auth.uid()
    and public.is_my_disciple(discipulo_id)
  );

-- ------------------------------------------------------------
-- 5. PERMISOS
-- RLS filtra las filas; estos permisos habilitan las operaciones.
-- ------------------------------------------------------------

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.discipleships to authenticated;
grant select, insert, update, delete on public.studies to authenticated;
grant select, insert, update, delete on public.assignments to authenticated;
grant select, insert, update, delete on public.responses to authenticated;
grant select, insert, update, delete on public.observations to authenticated;

revoke all on public.profiles from anon;
revoke all on public.discipleships from anon;
revoke all on public.studies from anon;
revoke all on public.assignments from anon;
revoke all on public.responses from anon;
revoke all on public.observations from anon;

revoke all on function public.buscar_discipulo_por_email(text) from public;
grant execute on function public.buscar_discipulo_por_email(text) to authenticated;

revoke all on function public.handle_new_user() from public;
revoke all on function public.protect_profile_fields() from public;
revoke all on function public.protect_assignment_identity() from public;
revoke all on function public.protect_response_identity() from public;

-- Las funciones auxiliares se usan desde las políticas RLS y la app.
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.role_of(uuid) to authenticated;
grant execute on function public.is_discipler_of(uuid) to authenticated;
grant execute on function public.has_discipler(uuid) to authenticated;
grant execute on function public.owns_study(uuid) to authenticated;
grant execute on function public.has_study_assignment(uuid) to authenticated;
grant execute on function public.is_my_disciple(uuid) to authenticated;
grant execute on function public.is_my_assignment(uuid) to authenticated;
grant execute on function public.is_assignment_assigner(uuid) to authenticated;

-- Recargar el esquema en la API de Supabase.
notify pgrst, 'reload schema';

-- ============================================================
-- FIN
-- Después de ejecutar este archivo:
--   1. Configurá js/config.js con la URL y la anon key del proyecto.
--   2. En Authentication → URL Configuration, cargá la URL del sitio.
--   3. Registrate como discipulador y como discípulo para probar.
-- ============================================================
