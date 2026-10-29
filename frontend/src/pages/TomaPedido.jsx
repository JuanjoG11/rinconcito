import { useState, useEffect } from 'react';
import { getMenu, createPedido } from '../api';
import { useToast, ToastContainer } from '../components/Toast';
import PageHeader from '../components/PageHeader';
import InstallPWA from '../components/InstallPWA';

const CATEGORIAS_ORDER = ['Ceviches', 'Espaguetis', 'Cazuelas', 'Patacones', 'Bandeja', 'Arroces', 'Ejecutivo', 'Adicionales', 'Bebidas'];

const MESEROS = ['Ana Maria', 'Julian Alejandro', 'Carolina'];

function formatPrice(n) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
}

export default function TomaPedido() {
  const [menu, setMenu] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState('Todas');
  const [carrito, setCarrito] = useState([]);
  const [mesa, setMesa] = useState('');
  const [mesero, setMesero] = useState(() => localStorage.getItem('mesero_activo') || '');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [notaModal, setNotaModal] = useState(null); // { item }
  const [nota, setNota] = useState('');
  const { toasts, addToast } = useToast();

  useEffect(() => {
    getMenu().then(data => { setMenu(data); setLoading(false); });
  }, []);

  function handleMesero(nombre) {
    setMesero(nombre);
    localStorage.setItem('mesero_activo', nombre);
  }

  const categorias = ['Todas', ...CATEGORIAS_ORDER.filter(c => menu.some(m => m.categoria === c))];

  const menuFiltrado = categoriaActiva === 'Todas'
    ? menu
    : menu.filter(m => m.categoria === categoriaActiva);

  // Agrupar por categoría para display
  const porCategoria = {};
  menuFiltrado.forEach(item => {
    if (!porCategoria[item.categoria]) porCategoria[item.categoria] = [];
    porCategoria[item.categoria].push(item);
  });

  function agregarAlCarrito(item) {
    setCarrito(prev => {
      const idx = prev.findIndex(c => c.menu_id === item.id);
      if (idx >= 0) {
        const nuevo = [...prev];
        nuevo[idx] = { ...nuevo[idx], cantidad: nuevo[idx].cantidad + 1 };
        return nuevo;
      }
      return [...prev, { menu_id: item.id, nombre: item.nombre, precio: item.precio, cantidad: 1, notas: '' }];
    });
  }

  function cambiarCantidad(menu_id, delta) {
    setCarrito(prev => {
      const nuevo = prev.map(c => c.menu_id === menu_id ? { ...c, cantidad: c.cantidad + delta } : c)
        .filter(c => c.cantidad > 0);
      return nuevo;
    });
  }

  function abrirNota(item) {
    setNota(item.notas || '');
    setNotaModal(item);
  }

  function guardarNota() {
    setCarrito(prev => prev.map(c => c.menu_id === notaModal.menu_id ? { ...c, notas: nota } : c));
    setNotaModal(null);
  }

  const total = carrito.reduce((s, c) => s + c.precio * c.cantidad, 0);
  const cantItems = carrito.reduce((s, c) => s + c.cantidad, 0);

  async function enviarPedido() {
    if (!mesa) { addToast('Ingresa el número de mesa', 'error'); return; }
    if (!mesero) { addToast('Ingresa el nombre del mesero', 'error'); return; }
    if (carrito.length === 0) { addToast('El carrito está vacío', 'error'); return; }

    setEnviando(true);
    try {
      await createPedido({ mesa: parseInt(mesa), mesero, items: carrito });
      addToast(`✅ Pedido Mesa ${mesa} enviado a cocina!`, 'success');
      setCarrito([]);
      setMesa('');
    } catch (e) {
      addToast('Error al enviar pedido', 'error');
    }
    setEnviando(false);
  }

  if (loading) return (
    <>
      <PageHeader icon="📋" title="Tomar Pedido" subtitle="Rincóncito de la Costeña" />
      <div className="spinner"><div className="spin"/><p>Cargando menú...</p></div>
    </>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <PageHeader icon="📋" title="Tomar Pedido" subtitle={mesero ? `Rincóncito — ${mesero}` : 'Rincóncito de la Costeña'} />
      <div className="page">

      <div className="pedido-layout">
        {/* ─── MENÚ ─────────────────────────────────── */}
        <div>
          <div className="menu-categorias">
            {categorias.map(cat => (
              <button key={cat} className={`cat-btn ${categoriaActiva === cat ? 'active' : ''}`}
                onClick={() => setCategoriaActiva(cat)}>
                {cat}
              </button>
            ))}
          </div>

          {Object.entries(porCategoria).map(([cat, items]) => (
            <div key={cat} className="mb-16">
              <h3 style={{ color: 'var(--ocean-dark)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '4px', height: '20px', background: 'var(--ocean)', display: 'inline-block', borderRadius: '2px' }}/>
                {cat}
              </h3>
              <div className="menu-grid">
                {items.map(item => {
                  const enCarrito = carrito.find(c => c.menu_id === item.id);
                  return (
                    <div key={item.id}
                      className="menu-item-card"
                      onClick={() => agregarAlCarrito(item)}
                      style={{ borderColor: enCarrito ? 'var(--ocean)' : '' }}>
                      <div className="menu-item-cat">{item.categoria}</div>
                      <div className="menu-item-nombre">{item.nombre}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                        <div className="menu-item-precio">{formatPrice(item.precio)}</div>
                        {enCarrito && (
                          <span style={{
                            background: 'var(--ocean)', color: 'white', borderRadius: '20px',
                            padding: '2px 10px', fontSize: '0.75rem', fontWeight: '700'
                          }}>×{enCarrito.cantidad}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ─── CARRITO ──────────────────────────────── */}
        <div className="carrito">
          <div className="carrito-header">
            <span>🛒 Pedido Actual</span>
            {cantItems > 0 && (
              <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: '20px', padding: '2px 10px', fontSize: '0.85rem' }}>
                {cantItems} ítem{cantItems !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="carrito-form">
            <div>
              <label className="form-label">🍽️ Mesa N°</label>
              <input className="form-control" type="number" min="1" max="50"
                placeholder="Ej: 5" value={mesa} onChange={e => setMesa(e.target.value)} />
            </div>
            <div>
              <label className="form-label">👤 Mesero</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {MESEROS.map(nombre => (
                  <button
                    key={nombre}
                    type="button"
                    onClick={() => handleMesero(nombre)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '20px',
                      border: '2px solid',
                      borderColor: mesero === nombre ? 'var(--ocean)' : 'var(--border)',
                      background: mesero === nombre ? 'var(--ocean)' : 'white',
                      color: mesero === nombre ? 'white' : '#374151',
                      fontWeight: '600',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all 0.15s',
                    }}
                  >
                    {nombre}
                  </button>
                ))}
              </div>
              {mesero && (
                <div style={{ fontSize: '0.78rem', color: 'var(--ocean)', marginTop: '6px', fontWeight: '500' }}>
                  ✓ Atendiendo: {mesero}
                </div>
              )}
            </div>
          </div>

          <div className="carrito-items">
            {carrito.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--gray)' }}>
                <div style={{ fontSize: '2rem' }}>🍽️</div>
                <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>Selecciona platos del menú</p>
              </div>
            ) : carrito.map(item => (
              <div key={item.menu_id} className="carrito-item">
                <div className="carrito-item-nombre">
                  {item.nombre}
                  {item.notas && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--sand)', fontStyle: 'italic' }}>📝 {item.notas}</div>
                  )}
                </div>
                <button
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--gray)' }}
                  onClick={() => abrirNota(item)} title="Agregar nota">✏️</button>
                <div className="qty-control">
                  <button className="qty-btn" onClick={() => cambiarCantidad(item.menu_id, -1)}>−</button>
                  <span className="qty-num">{item.cantidad}</span>
                  <button className="qty-btn" onClick={() => cambiarCantidad(item.menu_id, 1)}>+</button>
                </div>
                <div className="carrito-item-precio">{formatPrice(item.precio * item.cantidad)}</div>
              </div>
            ))}
          </div>

          {carrito.length > 0 && (
            <div className="carrito-total">
              <span>Total</span>
              <span style={{ color: 'var(--ocean)' }}>{formatPrice(total)}</span>
            </div>
          )}

          <div className="carrito-actions">
            <button className="btn btn-secondary btn-sm" onClick={() => setCarrito([])} disabled={carrito.length === 0}>
              🗑️ Limpiar
            </button>
            <button className="btn btn-primary w-full" onClick={enviarPedido} disabled={enviando || carrito.length === 0}>
              {enviando ? '⏳ Enviando...' : '🚀 Enviar a Cocina'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de nota */}
      {notaModal && (
        <div className="modal-overlay" onClick={() => setNotaModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span>📝 Nota para "{notaModal.nombre}"</span>
              <button className="modal-close" onClick={() => setNotaModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <textarea className="form-control" rows="3"
                placeholder="Ej: sin picante, extra limón, término 3/4..."
                value={nota} onChange={e => setNota(e.target.value)} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setNotaModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardarNota}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} />
      <InstallPWA appName="Mesero" color="#0077b6" />
    </div>
    </div>
  );
}
