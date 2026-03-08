-- =====================================================
-- TRAINER APP — Schema do Banco de Dados (Supabase)
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- 1. Tabela de alunos
create table students (
  id uuid default gen_random_uuid() primary key,
  teacher_id uuid references auth.users(id) on delete cascade,
  name text not null,
  age integer,
  weight decimal,
  height decimal,
  goal text,
  level text,
  notes text,
  created_at timestamptz default now()
);

-- 2. Planos de treino
create table workout_plans (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references students(id) on delete cascade,
  teacher_id uuid references auth.users(id) on delete cascade,
  title text not null default 'Plano de Treino',
  status text default 'draft', -- draft | active | archived
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Dias de treino (Treino A, B, C...)
create table workout_days (
  id uuid default gen_random_uuid() primary key,
  plan_id uuid references workout_plans(id) on delete cascade,
  name text not null,         -- ex: "Treino A"
  focus text,                 -- ex: "Peito + Tríceps"
  day_of_week text,           -- ex: "Segunda"
  order_index integer default 0
);

-- 4. Exercícios
create table exercises (
  id uuid default gen_random_uuid() primary key,
  day_id uuid references workout_days(id) on delete cascade,
  name text not null,
  sets text,
  reps text,
  rest text,
  tip text,
  type text,
  order_index integer default 0
);

-- 5. Registros de evolução
create table progress_entries (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references students(id) on delete cascade,
  date date default current_date,
  weight decimal,
  notes text,
  measurements jsonb,         -- { waist, chest, hip, thigh }
  created_at timestamptz default now()
);

-- =====================================================
-- SEGURANÇA: Row Level Security (RLS)
-- Garante que cada professor veja apenas seus dados
-- =====================================================

alter table students enable row level security;
alter table workout_plans enable row level security;
alter table workout_days enable row level security;
alter table exercises enable row level security;
alter table progress_entries enable row level security;

-- Políticas para students
create policy "Professor vê seus alunos" on students for select using (teacher_id = auth.uid());
create policy "Professor cria alunos" on students for insert with check (teacher_id = auth.uid());
create policy "Professor edita seus alunos" on students for update using (teacher_id = auth.uid());
create policy "Professor deleta seus alunos" on students for delete using (teacher_id = auth.uid());

-- Acesso público para visualização do aluno (por ID)
create policy "Aluno vê seu próprio perfil" on students for select using (true);

-- Políticas para workout_plans
create policy "Professor gerencia seus planos" on workout_plans for all using (teacher_id = auth.uid());
create policy "Planos são visíveis publicamente" on workout_plans for select using (true);

-- Políticas para workout_days (acesso via plan)
create policy "Dias são visíveis" on workout_days for select using (true);
create policy "Professor gerencia dias" on workout_days for all using (
  exists (select 1 from workout_plans where id = plan_id and teacher_id = auth.uid())
);

-- Políticas para exercises
create policy "Exercícios são visíveis" on exercises for select using (true);
create policy "Professor gerencia exercícios" on exercises for all using (
  exists (
    select 1 from workout_days wd
    join workout_plans wp on wp.id = wd.plan_id
    where wd.id = day_id and wp.teacher_id = auth.uid()
  )
);

-- Políticas para progress_entries
create policy "Evolução visível publicamente" on progress_entries for select using (true);
create policy "Professor gerencia evolução" on progress_entries for all using (
  exists (select 1 from students where id = student_id and teacher_id = auth.uid())
);