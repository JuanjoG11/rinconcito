import { useState, useEffect } from 'react';

/**
 * Muestra un banner "Instalar app" cuando el navegador dispara
 * el evento beforeinstallprompt (Chrome/Android/Edge).
 * En iOS muestra instrucciones manuales.
 */
export default function InstallPWA({ appName, color = 'var(--ocean)' }) {
  const [prompt, setPrompt]     = useState(null);   // evento nativo
  const [visible, setVisible]   = useState(false);
  const [isIOS, setIsIOS]       = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Detectar si ya está instalada
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    // iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.navigator.standalone;
    setIsIOS(ios);

    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // En iOS no hay evento, mostramos instrucciones después de 3s
    if (ios) {
      const t = setTimeout(() => setVisible(true), 3000);
      return () => clearTimeout(t);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function instalar() {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setVisible(false);
  }

  if (installed || !visible) return null;

  return (
    <div style={{
      position: 'fixed', bottom: '16px', left: '50%', transform: 'translateX(-50%)',
      background: color, color: 'white',
      borderRadius: '14px', padding: '14px 20px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      display: 'flex', alignItems: 'center', gap: '12px',
      zIndex: 9999, maxWidth: '360px', width: 'calc(100% - 32px)',
      animation: 'slideIn 0.3s ease',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>
          📲 Instalar {appName}
        </div>
        {isIOS ? (
          <div style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '4px' }}>
            Toca <strong>Compartir</strong> → <strong>Agregar a inicio</strong>
          </div>
        ) : (
          <div style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '4px' }}>
            Instala la app para acceso rápido sin navegador
          </div>
        )}
      </div>
      {!isIOS && (
        <button onClick={instalar} style={{
          background: 'white', color, border: 'none', borderRadius: '8px',
          padding: '8px 14px', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem',
          fontFamily: 'inherit', flexShrink: 0,
        }}>
          Instalar
        </button>
      )}
      <button onClick={() => setVisible(false)} style={{
        background: 'none', border: 'none', color: 'white', cursor: 'pointer',
        fontSize: '1.2rem', lineHeight: 1, padding: '0', flexShrink: 0,
      }}>×</button>
    </div>
  );
}
