import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { usePWAManifest } from './hooks/usePWAManifest';
import Home from './pages/Home';
import TomaPedido from './pages/TomaPedido';
import Cocina from './pages/Cocina';
import Historial from './pages/Historial';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';

// Aplica el manifest y theme-color correcto según la ruta activa
function PWARouter() {
  usePWAManifest();
  return (
    <Routes>
      <Route path="/"          element={<Home />} />
      <Route path="/pedidos"   element={<TomaPedido />} />
      <Route path="/cocina"    element={<Cocina />} />
      <Route path="/historial" element={<Historial />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/admin"     element={<Admin />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <PWARouter />
    </BrowserRouter>
  );
}
