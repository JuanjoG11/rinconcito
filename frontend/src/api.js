import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

// ─── helpers ────────────────────────────────────────────────────────────────
function check(error, msg) {
  if (error) { console.error(msg, error.message); throw new Error(error.message); }
}

// Enriquece pedidos con sus items en una sola query
async function conItems(pedidos) {
  if (!pedidos?.length) return [];
  const ids = pedidos.map(p => p.id);
  const { data: items, error } = await supabase
    .from('pedido_items')
    .select('*')
    .in('pedido_id', ids);
  check(error, 'conItems');
  const mapa = {};
  (items || []).forEach(i => {
    if (!mapa[i.pedido_id]) mapa[i.pedido_id] = [];
    mapa[i.pedido_id].push(i);
  });
  return pedidos.map(p => ({ ...p, items: mapa[p.id] || [] }));
}

// ─── MENÚ ────────────────────────────────────────────────────────────────────
export async function getMenu() {
  const { data, error } = await supabase
    .from('menu')
    .select('*')
    .eq('activo', true)
    .order('categoria')
    .order('nombre');
  check(error, 'getMenu');
  return data;
}

export async function createMenuItem({ nombre, categoria, precio }) {
  const { data, error } = await supabase
    .from('menu')
    .insert({ nombre, categoria, precio, activo: true })
    .select().single();
  check(error, 'createMenuItem');
  return data;
}

export async function updateMenuItem(id, { nombre, categoria, precio, activo }) {
  const { data, error } = await supabase
    .from('menu')
    .update({ nombre, categoria, precio, activo: activo !== undefined ? activo : true })
    .eq('id', id)
    .select().single();
  check(error, 'updateMenuItem');
  return data;
}

export async function deleteMenuItem(id) {
  const { error } = await supabase
    .from('menu')
    .update({ activo: false })
    .eq('id', id);
  check(error, 'deleteMenuItem');
  return { ok: true };
}

// ─── PEDIDOS ─────────────────────────────────────────────────────────────────
export async function getPedidos() {
  const { data, error } = await supabase
    .from('pedidos')
    .select('*')
    .order('created_at', { ascending: false });
  check(error, 'getPedidos');
  return conItems(data);
}

export async function getPedidosActivos() {
  const { data, error } = await supabase
    .from('pedidos')
    .select('*')
    .neq('estado', 'entregado')
    .neq('estado', 'cancelado')
    .order('created_at', { ascending: true });
  check(error, 'getPedidosActivos');
  return conItems(data);
}

export async function createPedido({ mesa, mesero, items }) {
  const id    = uuidv4();
  const now   = new Date().toISOString();
  const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0);

  const { error: e1 } = await supabase
    .from('pedidos')
    .insert({ id, mesa, mesero, estado: 'pendiente', total, created_at: now, updated_at: now });
  check(e1, 'createPedido:insert');

  const rows = items.map(i => ({
    pedido_id: id,
    menu_id:   i.menu_id,
    nombre:    i.nombre,
    precio:    i.precio,
    cantidad:  i.cantidad,
    notas:     i.notas || '',
  }));
  const { error: e2 } = await supabase.from('pedido_items').insert(rows);
  check(e2, 'createPedido:items');

  const { data: itemsGuardados } = await supabase
    .from('pedido_items').select('*').eq('pedido_id', id);

  return { id, mesa, mesero, estado: 'pendiente', total, created_at: now, updated_at: now, items: itemsGuardados || [] };
}

export async function updateEstado(id, estado) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('pedidos')
    .update({ estado, updated_at: now })
    .eq('id', id)
    .select().single();
  check(error, 'updateEstado');
  const { data: items } = await supabase.from('pedido_items').select('*').eq('pedido_id', id);
  return { ...data, items: items || [] };
}

export async function cancelarPedido(id) {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('pedidos')
    .update({ estado: 'cancelado', updated_at: now })
    .eq('id', id);
  check(error, 'cancelarPedido');
  return { ok: true };
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
export async function getDashboard() {
  const hoy     = new Date().toISOString().slice(0, 10);
  const inicio  = `${hoy}T00:00:00.000Z`;
  const fin     = `${hoy}T23:59:59.999Z`;

  const { data: pedidosHoy, error: e1 } = await supabase
    .from('pedidos').select('*')
    .gte('created_at', inicio).lte('created_at', fin)
    .order('created_at', { ascending: false });
  check(e1, 'dashboard:pedidos');

  const entregados    = pedidosHoy.filter(p => p.estado === 'entregado');
  const ventas_totales = entregados.reduce((s, p) => s + Number(p.total), 0);
  const total_pedidos  = pedidosHoy.length;

  // Por estado
  const estadoMap = {};
  pedidosHoy.forEach(p => { estadoMap[p.estado] = (estadoMap[p.estado] || 0) + 1; });
  const por_estado = Object.entries(estadoMap).map(([estado, cantidad]) => ({ estado, cantidad }));

  // Top platos
  let top_platos = [];
  if (entregados.length > 0) {
    const { data: itemsE } = await supabase
      .from('pedido_items').select('nombre, precio, cantidad')
      .in('pedido_id', entregados.map(p => p.id));
    const pmap = {};
    (itemsE || []).forEach(i => {
      if (!pmap[i.nombre]) pmap[i.nombre] = { nombre: i.nombre, total_vendido: 0, ingresos: 0 };
      pmap[i.nombre].total_vendido += i.cantidad;
      pmap[i.nombre].ingresos     += i.cantidad * i.precio;
    });
    top_platos = Object.values(pmap).sort((a, b) => b.total_vendido - a.total_vendido).slice(0, 10);
  }

  const pedidos = await conItems(pedidosHoy);
  return { fecha: hoy, total_pedidos, ventas_totales, por_estado, top_platos, pedidos };
}
