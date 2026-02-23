# Template Admin Dashboard (Next.js + Supabase)

Template completo de Site de Gerenciamento (Admin Dashboard), com App Router, TypeScript, Server Actions, Supabase Auth + Postgres + RLS, pronto para deploy na Vercel.

## Stack

- Next.js 14+ (App Router) + TypeScript
- React + TailwindCSS
- Componentes estilo shadcn/ui (`Button`, `Card`, `Table`, `Dialog`, `Input`, `Select`, `Dropdown`, `Toast`)
- Supabase (Auth, Postgres, RLS, Storage opcional)
- Node.js runtime no server do Next

## Arquitetura

```txt
app/
  (public)/login/page.tsx
  (protected)/layout.tsx
  (protected)/dashboard/page.tsx
  (protected)/projects/page.tsx
  (protected)/tasks/page.tsx
  (protected)/profile/page.tsx
actions/
  auth.ts
  projects.ts
  tasks.ts
  profile.ts
  seed.ts
lib/
  auth/requireUser.ts
  supabase/server.ts
  supabase/client.ts
  db/*.ts
schemas/
  *.ts (zod)
components/
  ui/*
  layout/*
  auth/*
  projects/*
  tasks/*
  profile/*
supabase/
  migrations.sql
```

## Regras atendidas

- Sem API REST publica (`/api/*` nao existe)
- Mutacoes apenas com Server Actions (`"use server"`)
- Listagens em Server Components + camada `lib/db`
- Validacao de entrada com Zod no server
- Protecao de rotas server-side (`requireUser`)
- Multi-tenant por workspace com RLS
- Chaves privadas nao expostas no client

## Setup local

1. Criar projeto no Supabase.
2. Em `SQL Editor`, rodar `supabase/migrations.sql`.
3. Em `Authentication > Providers`, manter Email habilitado.
4. Copiar `.env.example` para `.env.local` e preencher:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=... # opcional; nao usada no fluxo principal
```

5. Instalar e rodar:

```bash
pnpm i
pnpm dev
```

6. Acessar `http://localhost:3000/login`.

## Fluxo MVP

- Login/Logout com email+senha (Supabase Auth)
- Dashboard com cards:
  - total de projetos
  - tarefas abertas
  - tarefas concluidas
- CRUD de Projetos (criar, editar, arquivar, excluir)
- CRUD de Tarefas (status, prioridade, data limite)
- Filtro por status e busca textual em tarefas
- Perfil do usuario:
  - nome
  - avatar_url (Storage opcional)
  - tema claro/escuro
- Auditoria:
  - `created_at`, `updated_at`, `created_by`

## Seed (opcional)

Na tela `Dashboard`, use o botao `Gerar dados de exemplo`.

Esse seed roda server-side com a sessao atual (sem service role), criando projetos e tarefas no workspace do usuario logado.

## Deploy Vercel (checklist)

1. Subir o repositorio no GitHub.
2. Criar projeto na Vercel e conectar o repo.
3. Configurar env vars no projeto Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (opcional)
4. Build command: `pnpm build`.
5. Output padrão do Next.js.
6. Deploy.
7. Validar:
   - login e logout
   - bloqueio de rota protegida sem sessao
   - CRUD com RLS respeitando workspace

## Observacoes de seguranca

- O client usa apenas `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Regras de acesso sensivel sao impostas por RLS + sessao autenticada.
- Nao ha endpoint publico de backend para bypass.
- `SUPABASE_SERVICE_ROLE_KEY` esta no `.env.example` para cenarios futuros, mas nao e usada no fluxo atual.

## Scripts

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm typecheck
```
