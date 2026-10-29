-- Habilitar Realtime en las tablas de pedidos
-- Ejecutar en: Supabase Dashboard → SQL Editor

alter publication supabase_realtime add table pedidos;
alter publication supabase_realtime add table pedido_items;
