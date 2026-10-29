import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Mapa de ruta → manifest
const MANIFESTS = {
  '/pedidos':   '/manifest-mesero.json',
  '/cocina':    '/manifest-cocina.json',
  '/dashboard': '/manifest-admin.json',
  '/historial': '/manifest-admin.json',
  '/admin':     '/manifest-admin.json',
};

// Colores del theme por ruta
const THEMES = {
  '/pedidos':   '#0077b6',
  '/cocina':    '#0a1628',
  '/dashboard': '#059669',
  '/historial': '#059669',
  '/admin':     '#b45309',
};

export function usePWAManifest() {
  const { pathname } = useLocation();

  useEffect(() => {
    // ── Inyectar / actualizar el <link rel="manifest"> ──────────────────────
    const manifestHref = MANIFESTS[pathname] || '/manifest-mesero.json';
    let link = document.querySelector('link[rel="manifest"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      document.head.appendChild(link);
    }
    link.href = manifestHref;

    // ── Actualizar theme-color ───────────────────────────────────────────────
    const themeColor = THEMES[pathname] || '#0077b6';
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = themeColor;
  }, [pathname]);
}
