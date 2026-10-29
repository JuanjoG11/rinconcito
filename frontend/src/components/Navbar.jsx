import { NavLink } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar-brand">
        <span>🐚</span>
        Rincóncito de la Costeña
      </NavLink>
      <ul className="navbar-links">
        <li><NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>Inicio</NavLink></li>
        <li><NavLink to="/pedidos" className={({ isActive }) => isActive ? 'active' : ''}>📋 Tomar Pedido</NavLink></li>
        <li><NavLink to="/cocina" className={({ isActive }) => isActive ? 'active' : ''}>👨‍🍳 Cocina</NavLink></li>
        <li><NavLink to="/historial" className={({ isActive }) => isActive ? 'active' : ''}>📜 Historial</NavLink></li>
        <li><NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>📊 Dashboard</NavLink></li>
        <li><NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''}>⚙️ Admin</NavLink></li>
      </ul>
    </nav>
  );
}
