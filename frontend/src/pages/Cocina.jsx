import { useState, useEffect } from 'react';
import { getPedidosActivos, updateEstado } from '../api';
import { suscribirPedidos, desuscribir } from '../realtime';
import InstallPWA from '../components/InstallPWA';

function tiempoTranscurrido(created_at) {
  const diff = Math.floor((Date.now() - new Date(created_at).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  return `${Math.floor(diff / 60)}m ${diff % 60}s`;
}

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 800;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(); osc.stop(ctx.currentTime + 0.5);
  } catch (_) {}
}

function BadgeEstado({ estado }) {
  const labels = {
    pendiente: '⏳ Pendiente', en_preparacion: '🔥 En Preparación',
    listo: '✅ Listo', entregado: '🏁 Entregado', cancelado: '❌ Cancelado',
  };
  return <span className={`badge badge-${estado}`}>{labels[estado] || estado}</span>;
}

function TarjetaCocina({ pedido, onCambiarEstado }) {
  const [timer, setTimer] = useState(() => tiempoTranscurrido(pedido.created_at));

  useEffect(() => {
    const iv = setInterval(() => setTimer(tiempoTranscurrido(pedido.created_at)), 1000);
    return () => clearInterval(iv);
  }, [pedido.created_at]);

  const siguiente = {
    pendiente:     { estado: 'en_preparacion', label: '🔥 Iniciar Preparación', cls: 'btn-primary' },
    en_preparacion:{ estado: 'listo',          label: '✅ Marcar Listo',         cls: 'btn-success' },
    listo:         { estado: 'entregado',      label: '🏁 Marcar Entregado',     cls: 'btn-warning' },
  }[pedido.estado];

  const urgente = pedido.estado === 'pendiente' &&
    (Date.now() - new Date(pedido.created_at).getTime()) > 600_000;

  return (
    <div className={`cocina-card ${pedido.estado}`}
      style={urgente ? { borderLeftColor: '#ef4444', animation: 'pulse 1s infinite' } : {}}>
      <div className="cocina-card-header">
        <div>
          <div className="cocina-mesa">Mesa {pedido.mesa}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--gray)', marginTop: '2px' }}>
            Mesero: {pedido.mesero}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <BadgeEstado estado={pedido.estado} />
          <div className="cocina-timer" style={{ justifyContent: 'flex-end', marginTop: '4px' }}>
            ⏱️ {timer}
          </div>
        </div>
      </div>

      <div className="cocina-card-body">
        {pedido.items.map((item, i) => (
          <div key={i} className="cocina-item">
            <div className="cocina-qty">{item.cantidad}</div>
            <div>
              <div className="cocina-item-nombre">{item.nombre}</div>
              {item.notas && <div className="cocina-item-nota">📝 {item.notas}</div>}
            </div>
          </div>
        ))}
      </div>

      {siguiente && (
        <div className="cocina-actions">
          <button className={`btn ${siguiente.cls} w-full`}
            onClick={() => onCambiarEstado(pedido.id, siguiente.estado)}>
            {siguiente.label}
          </button>
        </div>
      )}
    </div>
  );
}

export default function Cocina() {
  const [pedidos, setPedidos]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [nuevos, setNuevos]     = useState(0);

  useEffect(() => {
    getPedidosActivos().then(data => { setPedidos(data); setLoading(false); });

    const canal = suscribirPedidos({
      onNuevo: (pedido) => {
        setPedidos(prev => [pedido, ...prev]);
        setNuevos(n => n + 1);
        beep();
      },
      onActualizado: (pedido) => {
        if (['entregado', 'cancelado'].includes(pedido.estado)) {
          setPedidos(prev => prev.filter(p => p.id !== pedido.id));
        } else {
          setPedidos(prev => prev.map(p => p.id === pedido.id ? pedido : p));
        }
      },
      onCancelado: (id) => setPedidos(prev => prev.filter(p => p.id !== id)),
    });

    return () => desuscribir(canal);
  }, []);

  async function cambiarEstado(id, estado) {
    await updateEstado(id, estado);
    // El Realtime actualizará automáticamente — optimistic también:
    if (estado === 'entregado') {
      setPedidos(prev => prev.filter(p => p.id !== id));
    } else {
      setPedidos(prev => prev.map(p => p.id === id ? { ...p, estado } : p));
    }
  }

  const pendientes = pedidos.filter(p => p.estado === 'pendiente');
  const enPrep     = pedidos.filter(p => p.estado === 'en_preparacion');
  const listos     = pedidos.filter(p => p.estado === 'listo');

  return (
    <div className="cocina-page">
      <div className="cocina-header">
        <div className="cocina-header-title">
          🔥 Pantalla de Cocina — Rincóncito de la Costeña
        </div>
        <div className="cocina-header-stats">
          {[['Pendientes', pendientes.length], ['En Cocina', enPrep.length], ['Listos', listos.length]]
            .map(([label, n]) => (
              <div key={label} className="cocina-stat">
                <div className="cocina-stat-num">{n}</div>
                <div className="cocina-stat-label">{label}</div>
              </div>
            ))}
        </div>
      </div>

      {nuevos > 0 && (
        <div className="notification-badge" onClick={() => setNuevos(0)}>
          🆕 {nuevos} nuevo{nuevos !== 1 ? 's' : ''} pedido{nuevos !== 1 ? 's' : ''} — clic para cerrar
        </div>
      )}

      <div className="cocina-body">
        {loading ? (
          <div className="spinner" style={{ color: 'rgba(255,255,255,0.7)' }}>
            <div className="spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'var(--ocean-light)' }} />
            <p>Cargando pedidos...</p>
          </div>
        ) : pedidos.length === 0 ? (
          <div className="empty" style={{ color: 'rgba(255,255,255,0.6)' }}>
            <div className="empty-icon">🏖️</div>
            <h3 style={{ color: 'rgba(255,255,255,0.9)' }}>Sin pedidos activos</h3>
            <p>Los nuevos pedidos aparecerán aquí automáticamente</p>
          </div>
        ) : (
          <>
            {pendientes.length > 0 && (
              <div className="mb-16">
                <h2 style={{ color: '#fbbf24', marginBottom: '16px', fontSize: '1.1rem' }}>
                  ⏳ Pendientes ({pendientes.length})
                </h2>
                <div className="cocina-grid">
                  {pendientes.map(p => <TarjetaCocina key={p.id} pedido={p} onCambiarEstado={cambiarEstado} />)}
                </div>
              </div>
            )}
            {enPrep.length > 0 && (
              <div className="mb-16">
                <h2 style={{ color: '#60a5fa', marginBottom: '16px', fontSize: '1.1rem' }}>
                  🔥 En Preparación ({enPrep.length})
                </h2>
                <div className="cocina-grid">
                  {enPrep.map(p => <TarjetaCocina key={p.id} pedido={p} onCambiarEstado={cambiarEstado} />)}
                </div>
              </div>
            )}
            {listos.length > 0 && (
              <div>
                <h2 style={{ color: '#34d399', marginBottom: '16px', fontSize: '1.1rem' }}>
                  ✅ Listos para Servir ({listos.length})
                </h2>
                <div className="cocina-grid">
                  {listos.map(p => <TarjetaCocina key={p.id} pedido={p} onCambiarEstado={cambiarEstado} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <InstallPWA appName="Cocina" color="#1d4ed8" />
    </div>
  );
}
