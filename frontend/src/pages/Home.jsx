import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, var(--ocean-dark) 0%, var(--ocean) 60%, var(--ocean-light) 100%)',
        color: 'white',
        padding: '48px 24px 40px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>🌊🐚🦞</div>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: 0 }}>Rincóncito de la Costeña</h1>
        <p style={{ opacity: 0.9, marginTop: '8px', fontSize: '1rem' }}>Sistema de pedidos en tiempo real</p>
      </div>

      {/* Cards de acceso directo */}
      <div style={{ flex: 1, padding: '32px 24px', maxWidth: '860px', margin: '0 auto', width: '100%' }}>
        <p style={{ textAlign: 'center', color: 'var(--gray)', marginBottom: '24px', fontSize: '0.95rem' }}>
          Selecciona la vista para tu dispositivo
        </p>

        <div className="home-grid">
          <Link to="/pedidos" className="home-card" style={{ borderTop: '4px solid var(--ocean)' }}>
            <div className="icon">📋</div>
            <h2>Tomar Pedido</h2>
            <p>Para el mesero — selecciona platos y envía a cocina</p>
            <div style={{ marginTop: '16px', background: 'var(--ocean)', color: 'white', borderRadius: '8px', padding: '8px', fontSize: '0.8rem', fontWeight: '600' }}>
              /pedidos
            </div>
          </Link>

          <Link to="/cocina" className="home-card" style={{ borderTop: '4px solid #ef4444' }}>
            <div className="icon">👨‍🍳</div>
            <h2>Pantalla Cocina</h2>
            <p>Para la cocina — pedidos en tiempo real</p>
            <div style={{ marginTop: '16px', background: '#ef4444', color: 'white', borderRadius: '8px', padding: '8px', fontSize: '0.8rem', fontWeight: '600' }}>
              /cocina
            </div>
          </Link>

          <Link to="/historial" className="home-card" style={{ borderTop: '4px solid #7c3aed' }}>
            <div className="icon">📜</div>
            <h2>Historial</h2>
            <p>Trazabilidad completa de todos los pedidos</p>
            <div style={{ marginTop: '16px', background: '#7c3aed', color: 'white', borderRadius: '8px', padding: '8px', fontSize: '0.8rem', fontWeight: '600' }}>
              /historial
            </div>
          </Link>

          <Link to="/dashboard" className="home-card" style={{ borderTop: '4px solid #059669' }}>
            <div className="icon">📊</div>
            <h2>Dashboard Admin</h2>
            <p>Ventas, platos más pedidos y estadísticas del día</p>
            <div style={{ marginTop: '16px', background: '#059669', color: 'white', borderRadius: '8px', padding: '8px', fontSize: '0.8rem', fontWeight: '600' }}>
              /dashboard
            </div>
          </Link>
        </div>

        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <Link to="/admin" style={{ color: 'var(--gray)', fontSize: '0.85rem', textDecoration: 'none' }}>
            ⚙️ Administrar menú → <span style={{ color: 'var(--ocean)' }}>/admin</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
