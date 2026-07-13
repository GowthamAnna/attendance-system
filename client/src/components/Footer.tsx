export function Footer() {
  return (
    <footer style={{
      textAlign: 'center',
      padding: '20px',
      fontSize: '0.78rem',
      color: 'var(--text-muted)',
      borderTop: '1px solid var(--border)',
      background: 'rgba(255,255,255,0.6)',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
      marginTop: 'auto',
    }}>
      © {new Date().getFullYear()} All rights reserved by MORABU HANSHIN Industry Co., Ltd.
    </footer>
  );
}
