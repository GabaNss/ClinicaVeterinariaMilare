  create extension if not exists "pgcrypto";
  create extension if not exists pg_trgm;

  drop table if exists public.atendimento_attachments cascade;
  drop table if exists public.financeiro cascade;
  drop table if exists public.vacinas cascade;
  drop table if exists public.atendimentos cascade;
  drop table if exists public.agenda cascade;
  drop table if exists public.pets cascade;
  drop table if exists public.tutores cascade;
  drop table if exists public.audit_log cascade;
  drop table if exists public.workspace_backups cascade;
  drop table if exists public.estoque_itens cascade;

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'user_role'
  ) then
    create type public.user_role as enum ('ADMIN', 'VETERINARIO', 'ESTAGIARIO');
  end if;
end;
$$;

do $$
begin
  if exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'user_role'
      and e.enumlabel = 'RECEPCAO'
  ) and not exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'user_role'
      and e.enumlabel = 'ESTAGIARIO'
  ) then
    alter type public.user_role rename value 'RECEPCAO' to 'ESTAGIARIO';
  end if;
end;
$$;

  create table if not exists public.workspaces (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    created_at timestamptz not null default now()
  );

  create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    workspace_id uuid not null references public.workspaces(id) on delete restrict,
    full_name text,
    avatar_url text,
    role public.user_role not null default 'ADMIN',
    is_approved boolean not null default false,
    approved_at timestamptz,
    approved_by uuid references auth.users(id) on delete set null,
    theme_preference text not null default 'light' check (theme_preference in ('light', 'dark')),
    created_at timestamptz not null default now()
  );

  alter table public.profiles
    add column if not exists is_approved boolean not null default false,
    add column if not exists approved_at timestamptz,
    add column if not exists approved_by uuid references auth.users(id) on delete set null;

  create table public.tutores (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    nome text not null,
    cpf_cnpj text,
    telefone text,
    email text,
    endereco text,
    observacoes text,
    created_at timestamptz not null default now(),
    created_by uuid not null references auth.users(id) on delete restrict,
    created_by_name text not null,
    updated_at timestamptz not null default now(),
    updated_by uuid not null references auth.users(id) on delete restrict,
    updated_by_name text not null,
    deleted_at timestamptz,
    deleted_by uuid references auth.users(id) on delete restrict,
    deleted_by_name text
  );

  create table public.pets (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    tutor_id uuid not null references public.tutores(id) on delete restrict,
    nome text not null,
    especie text not null,
    raca text,
    sexo text,
    cor text,
    data_nascimento date,
    peso_kg numeric(8,3),
    microchip text,
    observacoes text,
    created_at timestamptz not null default now(),
    created_by uuid not null references auth.users(id) on delete restrict,
    created_by_name text not null,
    updated_at timestamptz not null default now(),
    updated_by uuid not null references auth.users(id) on delete restrict,
    updated_by_name text not null,
    deleted_at timestamptz,
    deleted_by uuid references auth.users(id) on delete restrict,
    deleted_by_name text
  );

  create table public.agenda (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    tutor_id uuid not null references public.tutores(id) on delete restrict,
    pet_id uuid not null references public.pets(id) on delete restrict,
    veterinario_id uuid references public.profiles(id) on delete restrict,
    titulo text not null,
    descricao text,
    data_hora timestamptz not null,
    status text not null default 'AGENDADO' check (status in ('AGENDADO', 'CONFIRMADO', 'EM_ATENDIMENTO', 'CONCLUIDO', 'CANCELADO')),
    created_at timestamptz not null default now(),
    created_by uuid not null references auth.users(id) on delete restrict,
    created_by_name text not null,
    updated_at timestamptz not null default now(),
    updated_by uuid not null references auth.users(id) on delete restrict,
    updated_by_name text not null,
    deleted_at timestamptz,
    deleted_by uuid references auth.users(id) on delete restrict,
    deleted_by_name text
  );

  create table public.atendimentos (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    tutor_id uuid not null references public.tutores(id) on delete restrict,
    pet_id uuid not null references public.pets(id) on delete restrict,
    veterinario_id uuid not null references public.profiles(id) on delete restrict,
    agenda_id uuid references public.agenda(id) on delete set null,
    queixa_principal text,
    anamnese text,
    diagnostico text,
    conduta text,
    prescricao text,
    retorno_em date,
    created_at timestamptz not null default now(),
    created_by uuid not null references auth.users(id) on delete restrict,
    created_by_name text not null,
    updated_at timestamptz not null default now(),
    updated_by uuid not null references auth.users(id) on delete restrict,
    updated_by_name text not null,
    deleted_at timestamptz,
    deleted_by uuid references auth.users(id) on delete restrict,
    deleted_by_name text
  );

  create table public.vacinas (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    pet_id uuid not null references public.pets(id) on delete restrict,
    atendimento_id uuid references public.atendimentos(id) on delete set null,
    nome text not null,
    lote text,
    fabricante text,
    data_aplicacao date not null,
    proxima_dose date,
    observacoes text,
    created_at timestamptz not null default now(),
    created_by uuid not null references auth.users(id) on delete restrict,
    created_by_name text not null,
    updated_at timestamptz not null default now(),
    updated_by uuid not null references auth.users(id) on delete restrict,
    updated_by_name text not null,
    deleted_at timestamptz,
    deleted_by uuid references auth.users(id) on delete restrict,
    deleted_by_name text
  );

  create table public.financeiro (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    atendimento_id uuid references public.atendimentos(id) on delete set null,
    tutor_id uuid not null references public.tutores(id) on delete restrict,
    pet_id uuid references public.pets(id) on delete set null,
    tipo text not null check (tipo in ('RECEITA', 'DESPESA')),
    categoria text not null,
    descricao text,
    valor numeric(14,2) not null check (valor >= 0),
    data_competencia date not null,
    status text not null default 'PENDENTE' check (status in ('PENDENTE', 'PAGO', 'CANCELADO')),
    data_pagamento date,
    created_at timestamptz not null default now(),
    created_by uuid not null references auth.users(id) on delete restrict,
    created_by_name text not null,
    updated_at timestamptz not null default now(),
    updated_by uuid not null references auth.users(id) on delete restrict,
    updated_by_name text not null,
    deleted_at timestamptz,
    deleted_by uuid references auth.users(id) on delete restrict,
    deleted_by_name text
  );

  create table public.atendimento_attachments (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    atendimento_id uuid not null references public.atendimentos(id) on delete cascade,
    file_name text not null,
    file_path text not null unique,
    mime_type text,
    size_bytes bigint,
    created_at timestamptz not null default now(),
    created_by uuid not null references auth.users(id) on delete restrict,
    created_by_name text not null,
    updated_at timestamptz not null default now(),
    updated_by uuid not null references auth.users(id) on delete restrict,
    updated_by_name text not null,
    deleted_at timestamptz,
    deleted_by uuid references auth.users(id) on delete restrict,
    deleted_by_name text
  );

  create table public.estoque_itens (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    nome text not null,
    categoria text,
    sku text,
    unidade text not null default 'UN',
    quantidade_atual numeric(12,3) not null default 0 check (quantidade_atual >= 0),
    quantidade_minima numeric(12,3) not null default 0 check (quantidade_minima >= 0),
    custo_medio numeric(14,2) check (custo_medio is null or custo_medio >= 0),
    valor_venda numeric(14,2) check (valor_venda is null or valor_venda >= 0),
    validade date,
    lote text,
    fornecedor text,
    observacoes text,
    created_at timestamptz not null default now(),
    created_by uuid not null references auth.users(id) on delete restrict,
    created_by_name text not null,
    updated_at timestamptz not null default now(),
    updated_by uuid not null references auth.users(id) on delete restrict,
    updated_by_name text not null,
    deleted_at timestamptz,
    deleted_by uuid references auth.users(id) on delete restrict,
    deleted_by_name text
  );

  create table public.audit_log (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    table_name text not null,
    record_id uuid not null,
    action text not null check (action in ('INSERT', 'UPDATE', 'SOFT_DELETE')),
    before_data jsonb,
    after_data jsonb,
    actor_id uuid references auth.users(id) on delete set null,
    actor_name text,
    actor_role text,
    created_at timestamptz not null default now()
  );

  create table public.workspace_backups (
    id uuid primary key default gen_random_uuid(),
    workspace_id uuid not null references public.workspaces(id) on delete cascade,
    file_name text not null,
    checksum_sha256 text not null,
    payload jsonb not null,
    created_at timestamptz not null default now(),
    created_by uuid not null references auth.users(id) on delete restrict
  );

  create index if not exists idx_profiles_workspace_id on public.profiles(workspace_id);
  create index if not exists idx_profiles_role on public.profiles(role);
  create index if not exists idx_tutores_workspace_deleted on public.tutores(workspace_id, deleted_at);
  create index if not exists idx_pets_workspace_deleted on public.pets(workspace_id, deleted_at);
  create index if not exists idx_pets_tutor_id on public.pets(tutor_id);
  create index if not exists idx_agenda_workspace_data on public.agenda(workspace_id, data_hora);
  create index if not exists idx_atendimentos_workspace_updated on public.atendimentos(workspace_id, updated_at);
  create index if not exists idx_atendimentos_pet on public.atendimentos(pet_id);
  create index if not exists idx_vacinas_pet on public.vacinas(pet_id);
  create index if not exists idx_financeiro_workspace_date on public.financeiro(workspace_id, data_competencia);
  create index if not exists idx_financeiro_status on public.financeiro(status);
  create index if not exists idx_attachments_atendimento on public.atendimento_attachments(atendimento_id);
  create index if not exists idx_estoque_workspace_deleted on public.estoque_itens(workspace_id, deleted_at);
  create index if not exists idx_estoque_qtd_minima on public.estoque_itens(workspace_id, quantidade_atual, quantidade_minima);
  create index if not exists idx_audit_workspace_record on public.audit_log(workspace_id, table_name, record_id, created_at desc);
  create index if not exists idx_workspace_backups_workspace_created on public.workspace_backups(workspace_id, created_at desc);

  create or replace function public.get_user_workspace()
  returns uuid
  language sql
  stable
  security definer
  set search_path = public
  as $$
    select p.workspace_id
    from public.profiles p
    where p.id = auth.uid();
  $$;

  create or replace function public.get_user_role()
  returns public.user_role
  language sql
  stable
  security definer
  set search_path = public
  as $$
    select p.role
    from public.profiles p
    where p.id = auth.uid();
  $$;

  create or replace function public.is_user_approved()
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
  as $$
    select coalesce(p.is_approved, false)
    from public.profiles p
    where p.id = auth.uid();
  $$;

  create or replace function public.has_any_role(roles public.user_role[])
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
  as $$
    select coalesce(public.get_user_role() = any(roles), false);
  $$;

  create or replace function public.get_actor_name()
  returns text
  language sql
  stable
  security definer
  set search_path = public
  as $$
    select coalesce(p.full_name, split_part(u.email, '@', 1), 'Usuario')
    from auth.users u
    left join public.profiles p on p.id = u.id
    where u.id = auth.uid();
  $$;

  create or replace function public.get_actor_role_text()
  returns text
  language sql
  stable
  security definer
  set search_path = public
  as $$
    select coalesce(public.get_user_role()::text, 'UNKNOWN');
  $$;

  create or replace function public.handle_new_user()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
  as $$
  declare
    selected_workspace_id uuid;
    total_users bigint;
  begin
    select count(*) into total_users from auth.users;

    select w.id
    into selected_workspace_id
    from public.workspaces w
    order by w.created_at asc
    limit 1;

    if selected_workspace_id is null then
      insert into public.workspaces(name)
      values ('Clinica Veterinaria Milaré')
      returning id into selected_workspace_id;
    end if;

    if total_users <= 1 then
      insert into public.profiles(id, workspace_id, full_name, role, is_approved, approved_at, approved_by)
      values (new.id, selected_workspace_id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'clinica'), 'ADMIN', true, now(), new.id);
    else
      insert into public.profiles(id, workspace_id, full_name, role, is_approved)
      values (new.id, selected_workspace_id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'usuario'), 'ESTAGIARIO', false);
    end if;

    return new;
  end;
  $$;

  drop trigger if exists on_auth_user_created on auth.users;
  create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

  create or replace function public.set_audit_metadata()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
  as $$
  declare
    actor_id uuid;
    actor_name text;
  begin
    actor_id := auth.uid();
    actor_name := coalesce(public.get_actor_name(), 'Usuario');

    if tg_op = 'INSERT' then
      new.created_at := coalesce(new.created_at, now());
      new.created_by := coalesce(new.created_by, actor_id);
      new.created_by_name := coalesce(nullif(new.created_by_name, ''), actor_name);
      new.updated_at := now();
      new.updated_by := coalesce(actor_id, new.created_by);
      new.updated_by_name := actor_name;
    elsif tg_op = 'UPDATE' then
      new.updated_at := now();
      new.updated_by := coalesce(actor_id, old.updated_by);
      new.updated_by_name := actor_name;

      if old.deleted_at is null and new.deleted_at is not null then
        new.deleted_by := coalesce(new.deleted_by, actor_id);
        new.deleted_by_name := coalesce(new.deleted_by_name, actor_name);
      end if;
    end if;

    return new;
  end;
  $$;

  create or replace function public.write_audit_log()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
  as $$
  declare
    actor_id uuid;
    actor_name text;
    actor_role text;
    action_name text;
  begin
    actor_id := auth.uid();
    actor_name := coalesce(public.get_actor_name(), 'Usuario');
    actor_role := public.get_actor_role_text();

    if tg_op = 'INSERT' then
      action_name := 'INSERT';
    elsif tg_op = 'UPDATE' then
      if old.deleted_at is null and new.deleted_at is not null then
        action_name := 'SOFT_DELETE';
      else
        action_name := 'UPDATE';
      end if;
    else
      return new;
    end if;

    insert into public.audit_log (
      workspace_id,
      table_name,
      record_id,
      action,
      before_data,
      after_data,
      actor_id,
      actor_name,
      actor_role
    )
    values (
      new.workspace_id,
      tg_table_name,
      new.id,
      action_name,
      case when tg_op = 'UPDATE' then to_jsonb(old) else null end,
      to_jsonb(new),
      actor_id,
      actor_name,
      actor_role
    );

    return new;
  end;
  $$;

  create or replace function public.write_profile_audit_log()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
  as $$
  declare
    actor_id uuid;
    actor_name text;
    actor_role text;
    action_name text;
  begin
    actor_id := auth.uid();
    actor_name := coalesce(public.get_actor_name(), 'Usuario');
    actor_role := public.get_actor_role_text();

    if tg_op = 'INSERT' then
      action_name := 'INSERT';
    else
      action_name := 'UPDATE';
    end if;

    insert into public.audit_log (
      workspace_id,
      table_name,
      record_id,
      action,
      before_data,
      after_data,
      actor_id,
      actor_name,
      actor_role
    )
    values (
      new.workspace_id,
      tg_table_name,
      new.id,
      action_name,
      case when tg_op = 'UPDATE' then to_jsonb(old) else null end,
      to_jsonb(new),
      actor_id,
      actor_name,
      actor_role
    );

    return new;
  end;
  $$;

  create or replace function public.enforce_profile_approval_write()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
  as $$
  begin
    if (
      coalesce(old.is_approved, false) is distinct from coalesce(new.is_approved, false)
      or old.approved_at is distinct from new.approved_at
      or old.approved_by is distinct from new.approved_by
    ) and auth.role() <> 'service_role' and not public.has_any_role(array['ADMIN'::public.user_role]) then
      raise exception 'Somente ADMIN pode alterar autorizacao de usuarios';
    end if;

    return new;
  end;
  $$;

  drop trigger if exists trg_profiles_enforce_approval_write on public.profiles;
  create trigger trg_profiles_enforce_approval_write
  before update on public.profiles
  for each row execute function public.enforce_profile_approval_write();

  drop trigger if exists trg_profiles_write_audit_log on public.profiles;
  create trigger trg_profiles_write_audit_log
  after insert or update on public.profiles
  for each row execute function public.write_profile_audit_log();

  drop trigger if exists trg_tutores_set_audit_metadata on public.tutores;
  create trigger trg_tutores_set_audit_metadata
  before insert or update on public.tutores
  for each row execute function public.set_audit_metadata();
  drop trigger if exists trg_tutores_write_audit_log on public.tutores;
  create trigger trg_tutores_write_audit_log
  after insert or update on public.tutores
  for each row execute function public.write_audit_log();

  drop trigger if exists trg_pets_set_audit_metadata on public.pets;
  create trigger trg_pets_set_audit_metadata
  before insert or update on public.pets
  for each row execute function public.set_audit_metadata();
  drop trigger if exists trg_pets_write_audit_log on public.pets;
  create trigger trg_pets_write_audit_log
  after insert or update on public.pets
  for each row execute function public.write_audit_log();

  drop trigger if exists trg_agenda_set_audit_metadata on public.agenda;
  create trigger trg_agenda_set_audit_metadata
  before insert or update on public.agenda
  for each row execute function public.set_audit_metadata();
  drop trigger if exists trg_agenda_write_audit_log on public.agenda;
  create trigger trg_agenda_write_audit_log
  after insert or update on public.agenda
  for each row execute function public.write_audit_log();

  drop trigger if exists trg_atendimentos_set_audit_metadata on public.atendimentos;
  create trigger trg_atendimentos_set_audit_metadata
  before insert or update on public.atendimentos
  for each row execute function public.set_audit_metadata();
  drop trigger if exists trg_atendimentos_write_audit_log on public.atendimentos;
  create trigger trg_atendimentos_write_audit_log
  after insert or update on public.atendimentos
  for each row execute function public.write_audit_log();

  drop trigger if exists trg_vacinas_set_audit_metadata on public.vacinas;
  create trigger trg_vacinas_set_audit_metadata
  before insert or update on public.vacinas
  for each row execute function public.set_audit_metadata();
  drop trigger if exists trg_vacinas_write_audit_log on public.vacinas;
  create trigger trg_vacinas_write_audit_log
  after insert or update on public.vacinas
  for each row execute function public.write_audit_log();

  drop trigger if exists trg_financeiro_set_audit_metadata on public.financeiro;
  create trigger trg_financeiro_set_audit_metadata
  before insert or update on public.financeiro
  for each row execute function public.set_audit_metadata();
  drop trigger if exists trg_financeiro_write_audit_log on public.financeiro;
  create trigger trg_financeiro_write_audit_log
  after insert or update on public.financeiro
  for each row execute function public.write_audit_log();

  drop trigger if exists trg_atendimento_attachments_set_audit_metadata on public.atendimento_attachments;
  create trigger trg_atendimento_attachments_set_audit_metadata
  before insert or update on public.atendimento_attachments
  for each row execute function public.set_audit_metadata();
  drop trigger if exists trg_atendimento_attachments_write_audit_log on public.atendimento_attachments;
  create trigger trg_atendimento_attachments_write_audit_log
  after insert or update on public.atendimento_attachments
  for each row execute function public.write_audit_log();

  drop trigger if exists trg_estoque_set_audit_metadata on public.estoque_itens;
  create trigger trg_estoque_set_audit_metadata
  before insert or update on public.estoque_itens
  for each row execute function public.set_audit_metadata();
  drop trigger if exists trg_estoque_write_audit_log on public.estoque_itens;
  create trigger trg_estoque_write_audit_log
  after insert or update on public.estoque_itens
  for each row execute function public.write_audit_log();

  alter table public.workspaces enable row level security;
  alter table public.profiles enable row level security;
  alter table public.tutores enable row level security;
  alter table public.pets enable row level security;
  alter table public.agenda enable row level security;
  alter table public.atendimentos enable row level security;
  alter table public.vacinas enable row level security;
  alter table public.financeiro enable row level security;
  alter table public.atendimento_attachments enable row level security;
  alter table public.estoque_itens enable row level security;
  alter table public.audit_log enable row level security;
  alter table public.workspace_backups enable row level security;

  drop policy if exists "workspaces_select_own" on public.workspaces;
  create policy "workspaces_select_own"
  on public.workspaces
  for select
  to authenticated
  using (id = public.get_user_workspace());

  drop policy if exists "profiles_select_workspace" on public.profiles;
  create policy "profiles_select_workspace"
  on public.profiles
  for select
  to authenticated
  using (workspace_id = public.get_user_workspace());

  drop policy if exists "profiles_update_own_or_admin" on public.profiles;
  create policy "profiles_update_own_or_admin"
  on public.profiles
  for update
  to authenticated
  using (
    workspace_id = public.get_user_workspace()
    and (
      id = auth.uid()
      or public.has_any_role(array['ADMIN'::public.user_role])
    )
  )
  with check (
    workspace_id = public.get_user_workspace()
    and (
      id = auth.uid()
      or public.has_any_role(array['ADMIN'::public.user_role])
    )
  );

  drop policy if exists "profiles_insert_self" on public.profiles;
  create policy "profiles_insert_self"
  on public.profiles
  for insert
  to authenticated
  with check (
    workspace_id = public.get_user_workspace()
    and id = auth.uid()
  );

  drop policy if exists "tutores_select" on public.tutores;
  create policy "tutores_select"
  on public.tutores
  for select
  to authenticated
  using (workspace_id = public.get_user_workspace());

  drop policy if exists "tutores_insert" on public.tutores;
  create policy "tutores_insert"
  on public.tutores
  for insert
  to authenticated
  with check (
    workspace_id = public.get_user_workspace()
    and public.has_any_role(array['ADMIN'::public.user_role, 'VETERINARIO'::public.user_role, 'ESTAGIARIO'::public.user_role])
  );

  drop policy if exists "tutores_update" on public.tutores;
  create policy "tutores_update"
  on public.tutores
  for update
  to authenticated
  using (
    workspace_id = public.get_user_workspace()
    and public.has_any_role(array['ADMIN'::public.user_role, 'VETERINARIO'::public.user_role, 'ESTAGIARIO'::public.user_role])
  )
  with check (
    workspace_id = public.get_user_workspace()
    and public.has_any_role(array['ADMIN'::public.user_role, 'VETERINARIO'::public.user_role, 'ESTAGIARIO'::public.user_role])
  );

  drop policy if exists "pets_select" on public.pets;
  create policy "pets_select"
  on public.pets
  for select
  to authenticated
  using (workspace_id = public.get_user_workspace());

  drop policy if exists "pets_insert" on public.pets;
  create policy "pets_insert"
  on public.pets
  for insert
  to authenticated
  with check (
    workspace_id = public.get_user_workspace()
    and public.has_any_role(array['ADMIN'::public.user_role, 'VETERINARIO'::public.user_role, 'ESTAGIARIO'::public.user_role])
  );

  drop policy if exists "pets_update" on public.pets;
  create policy "pets_update"
  on public.pets
  for update
  to authenticated
  using (
    workspace_id = public.get_user_workspace()
    and public.has_any_role(array['ADMIN'::public.user_role, 'VETERINARIO'::public.user_role, 'ESTAGIARIO'::public.user_role])
  )
  with check (
    workspace_id = public.get_user_workspace()
    and public.has_any_role(array['ADMIN'::public.user_role, 'VETERINARIO'::public.user_role, 'ESTAGIARIO'::public.user_role])
  );

  drop policy if exists "agenda_select" on public.agenda;
  create policy "agenda_select"
  on public.agenda
  for select
  to authenticated
  using (workspace_id = public.get_user_workspace());

  drop policy if exists "agenda_insert" on public.agenda;
  create policy "agenda_insert"
  on public.agenda
  for insert
  to authenticated
  with check (
    workspace_id = public.get_user_workspace()
    and public.has_any_role(array['ADMIN'::public.user_role, 'VETERINARIO'::public.user_role, 'ESTAGIARIO'::public.user_role])
  );

  drop policy if exists "agenda_update" on public.agenda;
  create policy "agenda_update"
  on public.agenda
  for update
  to authenticated
  using (
    workspace_id = public.get_user_workspace()
    and (
      public.has_any_role(array['ADMIN'::public.user_role, 'VETERINARIO'::public.user_role])
      or (
        public.has_any_role(array['ESTAGIARIO'::public.user_role])
        and created_by = auth.uid()
      )
    )
  )
  with check (
    workspace_id = public.get_user_workspace()
    and (
      public.has_any_role(array['ADMIN'::public.user_role, 'VETERINARIO'::public.user_role])
      or (
        public.has_any_role(array['ESTAGIARIO'::public.user_role])
        and created_by = auth.uid()
      )
    )
  );

  drop policy if exists "atendimentos_select" on public.atendimentos;
  create policy "atendimentos_select"
  on public.atendimentos
  for select
  to authenticated
  using (workspace_id = public.get_user_workspace());

  drop policy if exists "atendimentos_insert" on public.atendimentos;
  create policy "atendimentos_insert"
  on public.atendimentos
  for insert
  to authenticated
  with check (
    workspace_id = public.get_user_workspace()
    and public.has_any_role(array['ADMIN'::public.user_role, 'VETERINARIO'::public.user_role])
  );

  drop policy if exists "atendimentos_update" on public.atendimentos;
  create policy "atendimentos_update"
  on public.atendimentos
  for update
  to authenticated
  using (
    workspace_id = public.get_user_workspace()
    and public.has_any_role(array['ADMIN'::public.user_role, 'VETERINARIO'::public.user_role])
  )
  with check (
    workspace_id = public.get_user_workspace()
    and public.has_any_role(array['ADMIN'::public.user_role, 'VETERINARIO'::public.user_role])
  );

  drop policy if exists "vacinas_select" on public.vacinas;
  create policy "vacinas_select"
  on public.vacinas
  for select
  to authenticated
  using (workspace_id = public.get_user_workspace());

  drop policy if exists "vacinas_insert" on public.vacinas;
  create policy "vacinas_insert"
  on public.vacinas
  for insert
  to authenticated
  with check (
    workspace_id = public.get_user_workspace()
    and public.has_any_role(array['ADMIN'::public.user_role, 'VETERINARIO'::public.user_role])
  );

  drop policy if exists "vacinas_update" on public.vacinas;
  create policy "vacinas_update"
  on public.vacinas
  for update
  to authenticated
  using (
    workspace_id = public.get_user_workspace()
    and public.has_any_role(array['ADMIN'::public.user_role, 'VETERINARIO'::public.user_role])
  )
  with check (
    workspace_id = public.get_user_workspace()
    and public.has_any_role(array['ADMIN'::public.user_role, 'VETERINARIO'::public.user_role])
  );

  drop policy if exists "financeiro_select" on public.financeiro;
create policy "financeiro_select"
on public.financeiro
for select
to authenticated
using (
  workspace_id = public.get_user_workspace()
  and public.has_any_role(array['ADMIN'::public.user_role, 'VETERINARIO'::public.user_role])
);

  drop policy if exists "financeiro_insert" on public.financeiro;
  create policy "financeiro_insert"
  on public.financeiro
  for insert
  to authenticated
  with check (
    workspace_id = public.get_user_workspace()
    and public.has_any_role(array['ADMIN'::public.user_role, 'VETERINARIO'::public.user_role])
  );

  drop policy if exists "financeiro_update" on public.financeiro;
  create policy "financeiro_update"
  on public.financeiro
  for update
  to authenticated
  using (
    workspace_id = public.get_user_workspace()
    and public.has_any_role(array['ADMIN'::public.user_role, 'VETERINARIO'::public.user_role])
  )
  with check (
    workspace_id = public.get_user_workspace()
    and public.has_any_role(array['ADMIN'::public.user_role, 'VETERINARIO'::public.user_role])
  );

  drop policy if exists "attachments_select" on public.atendimento_attachments;
  create policy "attachments_select"
  on public.atendimento_attachments
  for select
  to authenticated
  using (workspace_id = public.get_user_workspace());

  drop policy if exists "attachments_insert" on public.atendimento_attachments;
  create policy "attachments_insert"
  on public.atendimento_attachments
  for insert
  to authenticated
  with check (
    workspace_id = public.get_user_workspace()
    and public.has_any_role(array['ADMIN'::public.user_role, 'VETERINARIO'::public.user_role])
  );

  drop policy if exists "attachments_update" on public.atendimento_attachments;
  create policy "attachments_update"
  on public.atendimento_attachments
  for update
  to authenticated
  using (
    workspace_id = public.get_user_workspace()
    and public.has_any_role(array['ADMIN'::public.user_role, 'VETERINARIO'::public.user_role])
  )
  with check (
    workspace_id = public.get_user_workspace()
    and public.has_any_role(array['ADMIN'::public.user_role, 'VETERINARIO'::public.user_role])
  );

  drop policy if exists "estoque_select" on public.estoque_itens;
  create policy "estoque_select"
  on public.estoque_itens
  for select
  to authenticated
  using (workspace_id = public.get_user_workspace());

  drop policy if exists "estoque_insert" on public.estoque_itens;
  create policy "estoque_insert"
  on public.estoque_itens
  for insert
  to authenticated
  with check (
    workspace_id = public.get_user_workspace()
    and public.has_any_role(array['ADMIN'::public.user_role, 'VETERINARIO'::public.user_role, 'ESTAGIARIO'::public.user_role])
  );

  drop policy if exists "estoque_update" on public.estoque_itens;
  create policy "estoque_update"
  on public.estoque_itens
  for update
  to authenticated
  using (
    workspace_id = public.get_user_workspace()
    and public.has_any_role(array['ADMIN'::public.user_role, 'VETERINARIO'::public.user_role, 'ESTAGIARIO'::public.user_role])
  )
  with check (
    workspace_id = public.get_user_workspace()
    and public.has_any_role(array['ADMIN'::public.user_role, 'VETERINARIO'::public.user_role, 'ESTAGIARIO'::public.user_role])
  );

  drop policy if exists "audit_log_select" on public.audit_log;
  create policy "audit_log_select"
  on public.audit_log
  for select
  to authenticated
  using (workspace_id = public.get_user_workspace());

  drop policy if exists "audit_log_insert" on public.audit_log;
  create policy "audit_log_insert"
  on public.audit_log
  for insert
  to authenticated
  with check (workspace_id = public.get_user_workspace());

  drop policy if exists "workspace_backups_select" on public.workspace_backups;
  create policy "workspace_backups_select"
  on public.workspace_backups
  for select
  to authenticated
  using (
    workspace_id = public.get_user_workspace()
    and public.has_any_role(array['ADMIN'::public.user_role])
  );

  drop policy if exists "workspace_backups_insert" on public.workspace_backups;
  create policy "workspace_backups_insert"
  on public.workspace_backups
  for insert
  to authenticated
  with check (
    workspace_id = public.get_user_workspace()
    and public.has_any_role(array['ADMIN'::public.user_role])
  );

  drop policy if exists "workspace_backups_delete" on public.workspace_backups;
  create policy "workspace_backups_delete"
  on public.workspace_backups
  for delete
  to authenticated
  using (
    workspace_id = public.get_user_workspace()
    and public.has_any_role(array['ADMIN'::public.user_role])
  );

  insert into storage.buckets (id, name, public)
  values ('atendimento-anexos', 'atendimento-anexos', false)
  on conflict (id) do nothing;

  drop policy if exists "atendimento_anexos_read" on storage.objects;
  create policy "atendimento_anexos_read"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'atendimento-anexos');

  drop policy if exists "atendimento_anexos_insert" on storage.objects;
  create policy "atendimento_anexos_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'atendimento-anexos'
    and owner = auth.uid()
  );

  drop policy if exists "atendimento_anexos_update" on storage.objects;
  create policy "atendimento_anexos_update"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'atendimento-anexos' and owner = auth.uid())
  with check (bucket_id = 'atendimento-anexos' and owner = auth.uid());

  drop policy if exists "atendimento_anexos_delete" on storage.objects;
  create policy "atendimento_anexos_delete"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'atendimento-anexos' and owner = auth.uid());
