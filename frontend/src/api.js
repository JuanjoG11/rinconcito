// Detecta la IP/host desde donde se abrió el frontend y apunta al backend en el mismo host.
// Así funciona tanto en localhost como desde otro dispositivo en la red (tablet, TV, etc.)
const BACKEND_HOST = window.location.hostname;
const BASE = `http://${BACKEND_HOST}:3001/api`;

export const getMenu = () => fetch(`${BASE}/menu`).then(r => r.json());
export const getMenuAll = () => fetch(`${BASE}/menu`).then(r => r.json());
export const createMenuItem = (data) => fetch(`${BASE}/menu`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
}).then(r => r.json());
export const updateMenuItem = (id, data) => fetch(`${BASE}/menu/${id}`, {
  method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
}).then(r => r.json());
export const deleteMenuItem = (id) => fetch(`${BASE}/menu/${id}`, { method: 'DELETE' }).then(r => r.json());

export const getPedidos = () => fetch(`${BASE}/pedidos`).then(r => r.json());
export const getPedidosActivos = () => fetch(`${BASE}/pedidos/activos`).then(r => r.json());
export const createPedido = (data) => fetch(`${BASE}/pedidos`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
}).then(r => r.json());
export const updateEstado = (id, estado) => fetch(`${BASE}/pedidos/${id}/estado`, {
  method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado })
}).then(r => r.json());
export const cancelarPedido = (id) => fetch(`${BASE}/pedidos/${id}`, { method: 'DELETE' }).then(r => r.json());

export const getDashboard = () => fetch(`${BASE}/dashboard`).then(r => r.json());
