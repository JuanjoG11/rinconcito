import { useState, useEffect } from 'react';
import { getPedidos, updateEstado, cancelarPedido } from '../api';
import socket from '../socket';
import { useToast, ToastContainer } from '../components/Toast';
import PageHeader from '../components/PageHeader';

function formatPrice(n) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
}

function formatFecha(iso) {
  return new Date(iso).toLocaleString('es-CO', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  });
}

const ESTADOS = [
  { valor: 'pendiente', label: '⏳ Pendiente', cls: 'badge-pendiente' },
  { valor: 'en_preparacion', label: '🔥 En Preparación', cls: 'badge-en_preparacion' },
  { valor: 'listo', label: '✅ Listo', cls: 'badge-listo' },
  { valor: 'entregado', label: '🏁 Entregado', cls: 'badge-entregado' },
  { valor: 'cancelado', label: '❌ Cancelado', cls: 'badge-cancelado' },
];

function BadgeEstado({ estado }) {
  const e = ESTADOS.find(e => e.valor === estado) || { label: estado, cls: '' };
  return <span className={`badge ${e.cls}`}>{e.label}</span>;
}

function ModalPedido({ pedido, onClose, onCambiarEstado, onCancelar }) {
  if (!pedido) return null;
  const timeline = ESTADOS.filter(e => e.valor !== 'cancelado').map(e => e.valor);
  const currentIdx = timeline.indexOf(pedido.estado);
  const canChange = !['entregado', 'cancelado'].includes(pedido.estado);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <span>📋 Pedido — Mesa {pedido.mesa}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {/* Info básica */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <p className="text-sm text-gray">Mesa</p>
              <p className="font-bold" style={{ fontSize: '1.2rem', color: 'var(--ocean-dark)' }}>{pedido.mesa}</p>
            </div>
            <div>
              <p className="text-sm text-gray">Mesero</p>
              <p className="font-bold">{pedido.mesero}</p>
            </div>
            <div>
              <p className="text-sm text-gray">Hora del pedido</p>
              <p className="font-bold">{formatFecha(pedido.created_at)}</p>
            </div>
            <div>
              <p className="text-sm text-gray">Última actualización</p>
              <p className="font-bold">{formatFecha(pedido.updated_at)}</p>
            </div>
          </div>

          {/* Timeline de estado */}
          {pedido.estado !== 'cancelado' && (
            <div style={{ marginBottom: '20px' }}>
              <p className="text-sm text-gray" style={{ marginBottom: '10px', fontWeight: '600' }}>TRAZABILIDAD</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
                {timeline.map((est, i) => {
                  const done = i <= currentIdx;
                  const active = i === currentIdx;
                  return (
                    <div key={est} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          background: active ? 'var(--ocean)' : done ? 'var(--green)' : 'var(--border)',
                          color: (done || active) ? 'white' : 'var(--gray)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.8rem', fontWeight: '700',
                          border: active ? '3px solid var(--ocean-dark)' : 'none',
                          transition: 'all 0.3s'
                        }}>
                          {done ? (active ? i + 1 : '✓') : i + 1}
                        </div>
                        <div style={{ fontSize: '0.65rem', textAlign: 'center', marginTop: '4px', color: done ? '#1f2937' : 'var(--gray)' }}>
                          {ESTADOS.find(e => e.valor === est)?.label.split(' ').slice(1).join(' ')}
                        </div>
                      </div>
                      {i < timeline.length - 1 && (
                        <div style={{ height: '2px', flex: 2, background: i < currentIdx ? 'var(--green)' : 'var(--border)', margin: '0 4px', marginBottom: '24px' }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Items del pedido */}
          <div>
            <p className="text-sm text-gray" style={{ marginBottom: '10px', fontWeight: '600' }}>ITEMS</p>
            {pedido.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed var(--border)' }}>
                <div>
                  <span style={{ fontWeight: '500' }}>{item.cantidad}× {item.nombre}</span>
                  {item.notas && <div style={{ fontSize: '0.8rem', color: 'var(--sand)', fontStyle: 'italic' }}>📝 {item.notas}</div>}
                </div>
                <span style={{ color: 'var(--ocean)', fontWeight: '600' }}>{formatPrice(item.precio * item.cantidad)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', fontWeight: '700', fontSize: '1.1rem' }}>
              <span>Total</span>
              <span style={{ color: 'var(--ocean)' }}>{formatPrice(pedido.total)}</span>
            </div>
          </div>
        </div>

        {canChange && (
          <div className="modal-footer" style={{ flexWrap: 'wrap' }}>
            <button className="btn btn-danger btn-sm" onClick={() => onCancelar(pedido.id)}>❌ Cancelar</button>
            <div style={{ flex: 1 }} />
            {pedido.estado !== 'pendiente' && (
              <button className="btn btn-secondary btn-sm" onClick={() => onCambiarEstado(pedido.id, timeline[currentIdx - 1])}>
                ← Retroceder
              </button>
            )}
            {currentIdx < timeline.length - 1 && (
              <button className="btn btn-primary btn-sm" onClick={() => onCambiarEstado(pedido.id, timeline[currentIdx + 1])}>
                Avanzar →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Historial() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const { toasts, addToast } = useToast();

  useEffect(() => {
    getPedidos().then(data => { setPedidos(data); setLoading(false); });

    socket.on('nuevo_pedido', (p) => setPedidos(prev => [p, ...prev]));
    socket.on('pedido_actualizado', (p) => {
      setPedidos(prev => prev.map(x => x.id === p.id ? p : x));
      setPedidoSeleccionado(prev => prev?.id === p.id ? p : prev);
    });
    socket.on('pedido_cancelado', (id) => {
      setPedidos(prev => prev.map(x => x.id === id ? { ...x, estado: 'cancelado' } : x));
    });

    return () => {
      socket.off('nuevo_pedido');
      socket.off('pedido_actualizado');
      socket.off('pedido_cancelado');
    };
  }, []);

  async function cambiarEstado(id, estado) {
    await updateEstado(id, estado);
    addToast(`Estado actualizado: ${estado}`, 'success');
    setPedidos(prev => prev.map(p => p.id === id ? { ...p, estado } : p));
    setPedidoSeleccionado(prev => prev?.id === id ? { ...prev, estado } : prev);
  }

  async function cancelar(id) {
    if (!window.confirm('¿Cancelar este pedido?')) return;
    await cancelarPedido(id);
    addToast('Pedido cancelado', 'error');
    setPedidos(prev => prev.map(p => p.id === id ? { ...p, estado: 'cancelado' } : p));
    setPedidoSeleccionado(null);
  }

  const filtrados = pedidos.filter(p => {
    const matchEstado = filtroEstado === 'todos' || p.estado === filtroEstado;
    const matchBusqueda = busqueda === '' ||
      p.mesero.toLowerCase().includes(busqueda.toLowerCase()) ||
      String(p.mesa).includes(busqueda);
    return matchEstado && matchBusqueda;
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <PageHeader icon="📜" title="Historial de Pedidos" subtitle={`Rincóncito de la Costeña — ${pedidos.length} pedidos en total`} color="#7c3aed">
      </PageHeader>
      <div className="page">

      {/* Filtros */}
      <div className="card mb-16" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input className="form-control" style={{ maxWidth: '240px' }}
            placeholder="🔍 Buscar mesa o mesero..."
            value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button className={`cat-btn ${filtroEstado === 'todos' ? 'active' : ''}`} onClick={() => setFiltroEstado('todos')}>Todos</button>
            {ESTADOS.map(e => (
              <button key={e.valor} className={`cat-btn ${filtroEstado === e.valor ? 'active' : ''}`}
                onClick={() => setFiltroEstado(e.valor)}>
                {e.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="spinner"><div className="spin" /><p>Cargando...</p></div>
      ) : filtrados.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📭</div>
          <h3>Sin resultados</h3>
          <p>No hay pedidos que coincidan con el filtro</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Mesa</th>
                  <th>Mesero</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Hora</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map(p => (
                  <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => setPedidoSeleccionado(p)}>
                    <td style={{ fontWeight: '700', color: 'var(--ocean-dark)', fontSize: '1.1rem' }}>
                      Mesa {p.mesa}
                    </td>
                    <td>{p.mesero}</td>
                    <td style={{ maxWidth: '200px' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>
                        {p.items?.slice(0, 2).map(i => `${i.cantidad}× ${i.nombre}`).join(', ')}
                        {p.items?.length > 2 ? ` +${p.items.length - 2} más` : ''}
                      </div>
                    </td>
                    <td style={{ fontWeight: '600', color: 'var(--ocean)' }}>{formatPrice(p.total)}</td>
                    <td><BadgeEstado estado={p.estado} /></td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>{formatFecha(p.created_at)}</td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={e => { e.stopPropagation(); setPedidoSeleccionado(p); }}>
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ModalPedido
        pedido={pedidoSeleccionado}
        onClose={() => setPedidoSeleccionado(null)}
        onCambiarEstado={cambiarEstado}
        onCancelar={cancelar}
      />

      <ToastContainer toasts={toasts} />
      </div>
    </div>
  );
}
