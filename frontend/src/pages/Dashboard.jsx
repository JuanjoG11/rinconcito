import { useState, useEffect } from 'react';
import { getDashboard } from '../api';
import PageHeader from '../components/PageHeader';
import InstallPWA from '../components/InstallPWA';

function formatPrice(n) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);
}

function formatFecha(iso) {
  return new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: color + '22', fontSize: '1.8rem' }}>{icon}</div>
      <div className="stat-info">
        <h3 style={{ color }}>{value}</h3>
        <p>{label}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const cargar = () => {
    setLoading(true);
    getDashboard().then(d => { setData(d); setLoading(false); });
  };

  useEffect(() => { cargar(); }, []);

  if (loading) return (
    <>
      <PageHeader icon="📊" title="Dashboard" subtitle="Rincóncito de la Costeña — Resumen del día" color="#059669" />
      <div className="spinner"><div className="spin" /><p>Cargando dashboard...</p></div>
    </>
  );

  const { total_pedidos, ventas_totales, por_estado = [], top_platos = [], pedidos = [] } = data;

  const enProceso = por_estado.filter(e => ['pendiente','en_preparacion','listo'].includes(e.estado))
    .reduce((s, e) => s + e.cantidad, 0);
  const cancelados = por_estado.find(e => e.estado === 'cancelado')?.cantidad || 0;
  const maxVenta = top_platos.length > 0 ? top_platos[0].total_vendido : 1;

  const pedidosPorHora = {};
  pedidos.forEach(p => {
    const hora = new Date(p.created_at).getHours();
    pedidosPorHora[hora] = (pedidosPorHora[hora] || 0) + 1;
  });

  const hoy = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: '2-digit', month: 'long' });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <PageHeader icon="📊" title="Dashboard" subtitle={`Rincóncito de la Costeña — ${hoy.charAt(0).toUpperCase() + hoy.slice(1)}`} color="#059669">
        <button className="btn btn-secondary btn-sm" onClick={cargar}>🔄 Actualizar</button>
      </PageHeader>
      <div className="page">

      {/* Stats principales */}
      <div className="stats-grid">
        <StatCard icon="💰" label="Ventas del día (entregados)" value={formatPrice(ventas_totales)} color="var(--green)" />
        <StatCard icon="📋" label="Total pedidos" value={total_pedidos} color="var(--ocean)" />
        <StatCard icon="⏳" label="En proceso ahora" value={enProceso} color="var(--sand)" />
        <StatCard icon="❌" label="Cancelados" value={cancelados} color="var(--red)" />
      </div>

      <div className="grid-2" style={{ gap: '20px' }}>
        {/* Top platos */}
        <div className="card">
          <div className="card-header">🏆 Platos Más Pedidos</div>
          <div className="card-body">
            {top_platos.length === 0 ? (
              <div className="empty" style={{ padding: '30px' }}>
                <p>Sin datos aún</p>
              </div>
            ) : top_platos.map((plato, i) => (
              <div key={i} className="chart-bar">
                <div className="chart-bar-label">
                  <span style={{ color: i < 3 ? 'var(--sand)' : 'inherit', fontWeight: i < 3 ? '700' : '500' }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`} {plato.nombre}
                  </span>
                </div>
                <div className="chart-bar-track">
                  <div className="chart-bar-fill" style={{ width: `${(plato.total_vendido / maxVenta) * 100}%` }} />
                </div>
                <div className="chart-bar-val">{plato.total_vendido} uds</div>
              </div>
            ))}
          </div>
        </div>

        {/* Estado de pedidos */}
        <div className="card">
          <div className="card-header">📈 Pedidos por Estado</div>
          <div className="card-body">
            {por_estado.length === 0 ? (
              <div className="empty" style={{ padding: '30px' }}>
                <p>Sin pedidos hoy</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {por_estado.map(e => {
                  const colores = {
                    pendiente: '#f59e0b',
                    en_preparacion: '#3b82f6',
                    listo: '#10b981',
                    entregado: '#059669',
                    cancelado: '#ef4444'
                  };
                  const labels = {
                    pendiente: '⏳ Pendiente',
                    en_preparacion: '🔥 En Preparación',
                    listo: '✅ Listo',
                    entregado: '🏁 Entregado',
                    cancelado: '❌ Cancelado'
                  };
                  const totalHoy = por_estado.reduce((s, x) => s + x.cantidad, 0);
                  const pct = Math.round((e.cantidad / totalHoy) * 100);
                  return (
                    <div key={e.estado} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '130px', fontSize: '0.85rem', fontWeight: '500' }}>{labels[e.estado] || e.estado}</div>
                      <div style={{ flex: 1, height: '22px', background: 'var(--gray-light)', borderRadius: '11px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: colores[e.estado] || '#999', borderRadius: '11px', transition: 'width 0.5s' }} />
                      </div>
                      <div style={{ minWidth: '40px', textAlign: 'right', fontWeight: '700', color: colores[e.estado] }}>{e.cantidad}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Ingresos por plato */}
        {top_platos.length > 0 && (
          <div className="card">
            <div className="card-header">💵 Ingresos por Plato</div>
            <div className="card-body">
              {top_platos.slice(0, 8).map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed var(--border)' }}>
                  <span style={{ fontSize: '0.875rem' }}>{p.nombre}</span>
                  <span style={{ fontWeight: '600', color: 'var(--green)' }}>
                    {formatPrice(p.ingresos)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Últimos pedidos del día */}
        <div className="card">
          <div className="card-header">🕐 Últimos Pedidos del Día</div>
          <div className="card-body" style={{ padding: 0 }}>
            {pedidos.length === 0 ? (
              <div className="empty" style={{ padding: '30px' }}>
                <p>Sin pedidos hoy</p>
              </div>
            ) : (
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {pedidos.slice(0, 15).map(p => (
                  <div key={p.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontWeight: '700', color: 'var(--ocean-dark)' }}>Mesa {p.mesa}</span>
                      <span style={{ color: 'var(--gray)', fontSize: '0.8rem', marginLeft: '8px' }}>{p.mesero}</span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray)', marginTop: '2px' }}>
                        {p.items?.length} item{p.items?.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '600', color: 'var(--ocean)' }}>{formatPrice(p.total)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>{formatFecha(p.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
      <InstallPWA appName="Admin Dashboard" color="#059669" />
    </div>
  );
}
