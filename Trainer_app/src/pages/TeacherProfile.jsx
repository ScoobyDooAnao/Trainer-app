-- =====================================================
-- MEU TREINO DO PROFESSOR — tabelas privadas
-- Execute no Supabase SQL Editor
-- =====================================================

create table if not exists teacher_workout_plans (
  id         uuid        default gen_random_uuid() primary key,
  teacher_id uuid        references auth.users(id) on delete cascade,
  title      text        not null default 'Meu Plano de Treino',
  status     text        default 'active',
  created_at timestamptz default now()
);

create table if not exists teacher_workout_days (
  id          uuid    default gen_random_uuid() primary key,
  plan_id     uuid    references teacher_workout_plans(id) on delete cascade,
  name        text    not null,
  focus       text,
  day_of_week text,
  order_index integer default 0
);

create table if not exists teacher_exercises (
  id          uuid    default gen_random_uuid() primary key,
  day_id      uuid    references teacher_workout_days(id) on delete cascade,
  name        text    not null,
  sets        text,
  reps        text,
  rest        text,
  tip         text,
  type        text,
  order_index integer default 0
);

create table if not exists teacher_progress (
  id           uuid        default gen_random_uuid() primary key,
  teacher_id   uuid        references auth.users(id) on delete cascade,
  date         date        default current_date,
  weight       decimal,
  notes        text,
  measurements jsonb,
  created_at   timestamptz default now()
);

create table if not exists teacher_exercise_logs (
  id          uuid        default gen_random_uuid() primary key,
  teacher_id  uuid        references auth.users(id) on delete cascade,
  exercise_id uuid        references teacher_exercises(id) on delete cascade,
  date        date        not null default current_date,
  sets        jsonb       not null default '[]',
  created_at  timestamptz default now()
);

create table if not exists teacher_attendance (
  id         uuid        default gen_random_uuid() primary key,
  teacher_id uuid        references auth.users(id) on delete cascade,
  date       date        not null default current_date,
  created_at timestamptz default now(),
  unique (teacher_id, date)
);

-- RLS: todas as tabelas privadas — só o próprio professor vê/edita
alter table teacher_workout_plans  enable row level security;
alter table teacher_workout_days   enable row level security;
alter table teacher_exercises      enable row level security;
alter table teacher_progress       enable row level security;
alter table teacher_exercise_logs  enable row level security;
alter table teacher_attendance     enable row level security;

create policy "Prof. gerencia planos"     on teacher_workout_plans  for all using (teacher_id = auth.uid());
create policy "Prof. gerencia dias"       on teacher_workout_days   for all using (exists (select 1 from teacher_workout_plans where id = plan_id and teacher_id = auth.uid()));
create policy "Prof. gerencia exercícios" on teacher_exercises       for all using (exists (select 1 from teacher_workout_days d join teacher_workout_plans p on p.id = d.plan_id where d.id = day_id and p.teacher_id = auth.uid()));
create policy "Prof. gerencia progresso"  on teacher_progress        for all using (teacher_id = auth.uid());
create policy "Prof. gerencia ex. logs"   on teacher_exercise_logs   for all using (teacher_id = auth.uid());
create policy "Prof. gerencia presença"   on teacher_attendance      for all using (teacher_id = auth.uid());
