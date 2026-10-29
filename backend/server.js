require('dotenv').config();
const express  = require('express');
const http     = require('http');
const { Server } = require('socket.io');
const cors     = require('cors');
const { v4: uuidv4 } = require('uuid');
const supabase = require('./db');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }
});

app.use(cors());
app.use(express.json());

// ─── HELPERS ──────────────────────────────────────────────────────────────────
// Lanza error HTTP limpio si Supabase devuelve error
function check(error, res) {
  if (error) {
    console.error('[Supabase]', error.message);
    res.status(500).json({ error: error.message });
    return true;
  }
  return false;
}

// ─── MENÚ ──────────────────────────────────────────────────────────────────────
app.get('/api/menu', async (req, res) => {
  const { data, error } = await supabase
    .from('menu')
    .select('*')
    .eq('activo', true)
    .order('categoria')
    .order('nombre');
  if (check(error, res)) return;
  res.json(data);
});

app.post('/api/menu', async (req, res) => {
  const { nombre, categoria, precio } = req.body;
  if (!nombre || !categoria || !precio)
    return res.status(400).json({ error: 'Faltan datos' });

  const { data, error } = await supabase
    .from('menu')
    .insert({ nombre, categoria, precio, activo: true })
    .select()
    .single();
  if (check(error, res)) return;
  io.emit('menu_updated', data);
  res.json(data);
});

app.put('/api/menu/:id', async (req, res) => {
  const { nombre, categoria, precio, activo } = req.body;
  const { data, error } = await supabase
    .from('menu')
    .update({ nombre, categoria, precio, activo })
    .eq('id', req.params.id)
    .select()
    .single();
  if (check(error, res)) return;
  io.emit('menu_updated', data);
  res.json(data);
});

app.delete('/api/menu/:id', async (req, res) => {
  const { error } = await supabase
    .from('menu')
    .update({ activo: false })
    .eq('id', req.params.id);
  if (check(error, res)) return;
  io.emit('menu_deleted', req.params.id);
  res.json({ ok: true });
});

// ─── PEDIDOS ───────────────────────────────────────────────────────────────────

// Función interna: enriquece array de pedidos con sus items
async function conItems(pedidos) {
  if (!pedidos || pedidos.length === 0) return [];
  const ids = pedidos.map(p => p.id);
  const { data: items } = await supabase
    .from('pedido_items')
    .select('*')
    .in('pedido_id', ids);
  const mapa = {};
  (items || []).forEach(i => {
    if (!mapa[i.pedido_id]) mapa[i.pedido_id] = [];
    mapa[i.pedido_id].push(i);
  });
  return pedidos.map(p => ({ ...p, items: mapa[p.id] || [] }));
}

app.get('/api/pedidos', async (req, res) => {
  const { data, error } = await supabase
    .from('pedidos')
    .select('*')
    .order('created_at', { ascending: false });
  if (check(error, res)) return;
  res.json(await conItems(data));
});

app.get('/api/pedidos/activos', async (req, res) => {
  const { data, error } = await supabase
    .from('pedidos')
    .select('*')
    .neq('estado', 'entregado')
    .neq('estado', 'cancelado')
    .order('created_at', { ascending: true });
  if (check(error, res)) return;
  res.json(await conItems(data));
});

// Dashboard del día
app.get('/api/dashboard', async (req, res) => {
  const hoy = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
  const inicioHoy = `${hoy}T00:00:00.000Z`;
  const finHoy    = `${hoy}T23:59:59.999Z`;

  // Todos los pedidos del día
  const { data: pedidosHoy, error: e1 } = await supabase
    .from('pedidos')
    .select('*')
    .gte('created_at', inicioHoy)
    .lte('created_at', finHoy)
    .order('created_at', { ascending: false });
  if (check(e1, res)) return;

  // Pedidos entregados del día para sumar ventas
  const entregados = pedidosHoy.filter(p => p.estado === 'entregado');
  const ventas_totales = entregados.reduce((s, p) => s + (p.total || 0), 0);
  const total_pedidos  = pedidosHoy.length;

  // Por estado
  const estadoMap = {};
  pedidosHoy.forEach(p => {
    estadoMap[p.estado] = (estadoMap[p.estado] || 0) + 1;
  });
  const por_estado = Object.entries(estadoMap).map(([estado, cantidad]) => ({ estado, cantidad }));

  // Top platos (solo pedidos entregados)
  let top_platos = [];
  if (entregados.length > 0) {
    const idsEntregados = entregados.map(p => p.id);
    const { data: itemsEntregados } = await supabase
      .from('pedido_items')
      .select('nombre, precio, cantidad')
      .in('pedido_id', idsEntregados);

    const platoMap = {};
    (itemsEntregados || []).forEach(i => {
      if (!platoMap[i.nombre]) platoMap[i.nombre] = { nombre: i.nombre, total_vendido: 0, ingresos: 0 };
      platoMap[i.nombre].total_vendido += i.cantidad;
      platoMap[i.nombre].ingresos     += i.cantidad * i.precio;
    });
    top_platos = Object.values(platoMap)
      .sort((a, b) => b.total_vendido - a.total_vendido)
      .slice(0, 10);
  }

  const pedidosConItems = await conItems(pedidosHoy);

  res.json({
    fecha: hoy,
    total_pedidos,
    ventas_totales,
    por_estado,
    top_platos,
    pedidos: pedidosConItems
  });
});

// Crear pedido
app.post('/api/pedidos', async (req, res) => {
  const { mesa, mesero, items } = req.body;
  if (!mesa || !mesero || !items || items.length === 0)
    return res.status(400).json({ error: 'Datos incompletos' });

  const id    = uuidv4();
  const now   = new Date().toISOString();
  const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0);

  const { error: e1 } = await supabase.from('pedidos').insert({
    id, mesa, mesero, estado: 'pendiente', total, created_at: now, updated_at: now
  });
  if (check(e1, res)) return;

  const rows = items.map(i => ({
    pedido_id: id,
    menu_id:   i.menu_id,
    nombre:    i.nombre,
    precio:    i.precio,
    cantidad:  i.cantidad,
    notas:     i.notas || ''
  }));
  const { error: e2 } = await supabase.from('pedido_items').insert(rows);
  if (check(e2, res)) return;

  const { data: itemsGuardados } = await supabase
    .from('pedido_items').select('*').eq('pedido_id', id);

  const pedido = {
    id, mesa, mesero, estado: 'pendiente', total,
    created_at: now, updated_at: now,
    items: itemsGuardados || []
  };

  io.emit('nuevo_pedido', pedido);
  res.json(pedido);
});

// Cambiar estado
app.put('/api/pedidos/:id/estado', async (req, res) => {
  const { estado } = req.body;
  const estadosValidos = ['pendiente', 'en_preparacion', 'listo', 'entregado'];
  if (!estadosValidos.includes(estado))
    return res.status(400).json({ error: 'Estado inválido' });

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('pedidos')
    .update({ estado, updated_at: now })
    .eq('id', req.params.id)
    .select()
    .single();
  if (check(error, res)) return;

  const { data: items } = await supabase
    .from('pedido_items').select('*').eq('pedido_id', req.params.id);

  const full = { ...data, items: items || [] };
  io.emit('pedido_actualizado', full);
  res.json(full);
});

// Cancelar pedido
app.delete('/api/pedidos/:id', async (req, res) => {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('pedidos')
    .update({ estado: 'cancelado', updated_at: now })
    .eq('id', req.params.id);
  if (check(error, res)) return;
  io.emit('pedido_cancelado', req.params.id);
  res.json({ ok: true });
});

// ─── SOCKET ────────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`  🔌 Cliente conectado:    ${socket.id}`);
  socket.on('disconnect', () => console.log(`  ❌ Cliente desconectado: ${socket.id}`));
});

// ─── START ─────────────────────────────────────────────────────────────────────
const os = require('os');

function getLocalIP() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return 'localhost';
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIP();
  console.log('\n🌊  Rincóncito de la Costeña — Servidor iniciado\n');
  console.log(`   ☁️  Supabase: ${process.env.SUPABASE_URL}`);
  console.log(`   Local:     http://localhost:${PORT}`);
  console.log(`   Red LAN:   http://${ip}:${PORT}\n`);
  console.log('   Rutas por dispositivo:\n');
  console.log(`   📋 Mesero      →  http://${ip}:5173/pedidos`);
  console.log(`   👨‍🍳 Cocina      →  http://${ip}:5173/cocina`);
  console.log(`   📊 Dashboard   →  http://${ip}:5173/dashboard`);
  console.log(`   ⚙️  Admin       →  http://${ip}:5173/admin\n`);
});
