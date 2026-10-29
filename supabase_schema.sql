-- ============================================================
-- RINCÓNCITO DE LA COSTEÑA — Schema Supabase (PostgreSQL)
-- Ejecuta esto en: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. MENÚ
create table if not exists menu (
  id        serial primary key,
  nombre    text    not null,
  categoria text    not null,
  precio    numeric not null,
  activo    boolean not null default true
);

-- 2. PEDIDOS
create table if not exists pedidos (
  id         text primary key,         -- UUID generado en el backend
  mesa       integer not null,
  mesero     text    not null,
  estado     text    not null default 'pendiente',
  total      numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. ITEMS DE PEDIDO
create table if not exists pedido_items (
  id         serial primary key,
  pedido_id  text    not null references pedidos(id) on delete cascade,
  menu_id    integer not null,
  nombre     text    not null,
  precio     numeric not null,
  cantidad   integer not null,
  notas      text    not null default ''
);

-- ─── ÍNDICES para performance ───────────────────────────────────────────────
create index if not exists idx_pedidos_estado     on pedidos(estado);
create index if not exists idx_pedidos_created_at on pedidos(created_at);
create index if not exists idx_items_pedido_id    on pedido_items(pedido_id);

-- ─── RLS: desactivar para uso interno (backend usa service_role key) ─────────
alter table menu         disable row level security;
alter table pedidos      disable row level security;
alter table pedido_items disable row level security;

-- ─── DATOS SEMILLA: Menú del Rincóncito ─────────────────────────────────────
insert into menu (nombre, categoria, precio) values
  -- Ceviches
  ('Ceviche de Camarón',               'Ceviches',    25000),
  ('Ceviche Bomba',                    'Ceviches',    23000),
  -- Espaguetis
  ('Espaguetis Marinero',              'Espaguetis',  27000),
  ('Espaguetis Camarón',               'Espaguetis',  29000),
  -- Cazuelas
  ('Cazuela de Mariscos',              'Cazuelas',    27000),
  ('Cazuela de Camarón',               'Cazuelas',    29000),
  -- Patacones
  ('Patacón Marinero',                 'Patacones',   27000),
  ('Patacón Camarón',                  'Patacones',   27000),
  -- Bandeja
  ('Bandeja Caribeña',                 'Bandeja',     30000),
  ('Pescado en Salsa de Camarones',    'Bandeja',     30000),
  ('Pescado al Ajillo o Gratinados',   'Bandeja',     30000),
  -- Arroces
  ('Arroz con Camarón',                'Arroces',     29000),
  ('Arroz a la Marinera',              'Arroces',     27000),
  ('Arroz Marinera Especial',          'Arroces',     36000),
  -- Ejecutivo
  ('Ejecutivo Mar (Mojarra / Trucha / Bagre / Sierra)',    'Ejecutivo', 20000),
  ('Ejecutivo Tierra (Res / Cerdo / Pollo / Chicharrón)', 'Ejecutivo', 15000),
  -- Adicionales
  ('Porción de Arroz Blanco',          'Adicionales',  3000),
  ('Porción de Arroz Coco',            'Adicionales',  3000),
  ('Porción Patacón',                  'Adicionales',  2000),
  ('Porción de Ensalada',              'Adicionales',  2000),
  ('Porción de Pescado',               'Adicionales',  3000),
  ('Porción Frijol',                   'Adicionales',  3000),
  -- Bebidas
  ('Gaseosa',                          'Bebidas',      4000),
  ('Jugos Naturales en Agua',          'Bebidas',      8000),
  ('Jugos Naturales en Leche',         'Bebidas',     10000)
on conflict do nothing;
