import { useState, useEffect } from 'react';
import { getMenu, createMenuItem, updateMenuItem, deleteMenuItem } from '../api';
import { useToast, ToastContainer } from '../components/Toast';
import PageHeader from '../components/PageHeader';

const CATEGORIAS = ['Ceviches', 'Espaguetis', 'Cazuelas', 'Patacones', 'Bandeja', 'Arroces', 'Ejecutivo', 'Adicionales', 'Bebidas'];

function formatPrice(n) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
}

const FORM_INICIAL = { nombre: '', categoria: 'Ceviches', precio: '' };

export default function Admin() {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);
  const [editId, setEditId] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const { toasts, addToast } = useToast();

  const cargar = () => {
    setLoading(true);
    getMenu().then(data => { setMenu(data); setLoading(false); });
  };

  useEffect(() => { cargar(); }, []);

  function abrirCrear() {
    setForm(FORM_INICIAL);
    setEditId(null);
    setModal(true);
  }

  function abrirEditar(item) {
    setForm({ nombre: item.nombre, categoria: item.categoria, precio: String(item.precio) });
    setEditId(item.id);
    setModal(true);
  }

  async function guardar() {
    if (!form.nombre.trim() || !form.precio) {
      addToast('Completa todos los campos', 'error'); return;
    }
    const data = { nombre: form.nombre.trim(), categoria: form.categoria, precio: parseFloat(form.precio), activo: 1 };
    setGuardando(true);
    try {
      if (editId) {
        const updated = await updateMenuItem(editId, data);
        setMenu(prev => prev.map(m => m.id === editId ? updated : m));
        addToast('Plato actualizado', 'success');
      } else {
        const created = await createMenuItem(data);
        setMenu(prev => [...prev, created]);
        addToast('Plato agregado', 'success');
      }
      setModal(false);
    } catch (e) {
      addToast('Error al guardar', 'error');
    }
    setGuardando(false);
  }

  async function eliminar(id, nombre) {
    if (!window.confirm(`¿Eliminar "${nombre}" del menú?`)) return;
    await deleteMenuItem(id);
    setMenu(prev => prev.filter(m => m.id !== id));
    addToast('Plato eliminado', 'success');
  }

  const porCategoria = {};
  CATEGORIAS.forEach(cat => {
    const items = menu.filter(m => m.categoria === cat);
    if (items.length > 0) porCategoria[cat] = items;
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <PageHeader icon="⚙️" title="Administrar Menú" subtitle="Rincóncito de la Costeña" color="#b45309">
        <button className="btn btn-primary btn-sm" onClick={abrirCrear}>+ Agregar Plato</button>
      </PageHeader>
      <div className="page">

      {loading ? (
        <div className="spinner"><div className="spin" /><p>Cargando menú...</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {Object.entries(porCategoria).map(([cat, items]) => (
            <div key={cat} className="card">
              <div className="card-header">
                <span style={{ color: 'var(--ocean-dark)' }}>🍽️ {cat}</span>
                <span style={{ color: 'var(--gray)', fontSize: '0.85rem' }}>{items.length} platos</span>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Precio</th>
                      <th style={{ width: '120px' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: '500' }}>{item.nombre}</td>
                        <td style={{ color: 'var(--ocean)', fontWeight: '600' }}>{formatPrice(item.precio)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => abrirEditar(item)}>✏️</button>
                            <button className="btn btn-danger btn-sm" onClick={() => eliminar(item.id, item.nombre)}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal crear/editar */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span>{editId ? '✏️ Editar Plato' : '➕ Agregar Plato'}</span>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nombre del plato</label>
                <input className="form-control" placeholder="Ej: Ceviche de Camarón"
                  value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select className="form-control"
                  value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Precio (COP)</label>
                <input className="form-control" type="number" min="0" placeholder="Ej: 25000"
                  value={form.precio} onChange={e => setForm(f => ({ ...f, precio: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardar} disabled={guardando}>
                {guardando ? 'Guardando...' : editId ? 'Actualizar' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} />
      </div>
    </div>
  );
}
