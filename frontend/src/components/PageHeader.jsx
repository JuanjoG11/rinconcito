// Header independiente por página — sin links de navegación global
export default function PageHeader({ icon, title, subtitle, children, color = 'var(--ocean)' }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, var(--ocean-dark), ${color})`,
      color: 'white',
      padding: '14px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '1.5rem' }}>{icon}</span>
        <div>
          <div style={{ fontWeight: '800', fontSize: '1.05rem', lineHeight: 1.2 }}>{title}</div>
          {subtitle && <div style={{ fontSize: '0.78rem', opacity: 0.85, marginTop: '1px' }}>{subtitle}</div>}
        </div>
      </div>
      {children && <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>{children}</div>}
    </div>
  );
}
