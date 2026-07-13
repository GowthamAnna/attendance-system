import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { LanguageToggle } from '../components/LanguageToggle';

type Mode = 'login' | 'reset' | 'sent';

const wrapStyle: React.CSSProperties = {
  minHeight: '100vh', display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center', padding: '24px',
  position: 'relative',
};

const cardStyle: React.CSSProperties = {
  background: 'var(--surface)', padding: '38px 34px', borderRadius: 'var(--r-lg)',
  width: '100%', maxWidth: '400px', border: '1px solid var(--border)',
  boxShadow: 'var(--shadow-lg)',
};

const labelStyle: React.CSSProperties = {
  display: 'block', marginBottom: '7px', fontSize: '0.82rem',
  fontWeight: 600, color: 'var(--text-soft)',
};

const fieldStyle: React.CSSProperties = {
  width: '100%', padding: '11px 13px', border: '1px solid var(--border-strong)',
  borderRadius: 'var(--r-sm)', background: '#fff', fontSize: '0.95rem',
};

const primaryBtn: React.CSSProperties = {
  width: '100%', padding: '12px', fontSize: '0.98rem',
};

function BrandMark() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '26px' }}>
      <div
        style={{
          width: '58px', height: '58px', borderRadius: '16px',
          background: 'var(--accent-grad)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', boxShadow: '0 10px 24px rgba(37,99,235,0.35)',
          marginBottom: '16px',
        }}
      >
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      </div>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.14em', color: 'var(--accent)', textTransform: 'uppercase' }}>
        MORABU HANSHIN
      </div>
    </div>
  );
}

export function LoginPage() {
  const { t } = useTranslation();
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>('login');

  const [employeeNumber, setEmployeeNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [resetEmpNo, setResetEmpNo] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  if (user) {
    navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    return null;
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(employeeNumber, password);
    } catch {
      setError(t('login.error'));
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: FormEvent) {
    e.preventDefault();
    setError('');
    setResetLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_number: resetEmpNo, email: resetEmail }),
      });
      if (!res.ok) {
        setError(t('login.error'));
        return;
      }
      setMode('sent');
    } catch {
      setError(t('login.error'));
    } finally {
      setResetLoading(false);
    }
  }

  const langToggle = (
    <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
      <LanguageToggle />
    </div>
  );

  const errorBox = error && (
    <div
      role="alert"
      style={{
        background: 'var(--danger-soft)', border: '1px solid #fecaca', color: 'var(--danger)',
        borderRadius: 'var(--r-sm)', padding: '9px 12px', fontSize: '0.85rem', marginBottom: '16px',
      }}
    >
      {error}
    </div>
  );

  const footer = (
    <p style={{ marginTop: '26px', textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
      © {new Date().getFullYear()} MORABU HANSHIN Industry Co., Ltd.
    </p>
  );

  if (mode === 'sent') {
    return (
      <div style={wrapStyle}>
        {langToggle}
        <div style={cardStyle} className="animate-in">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: 'var(--success-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            </div>
            <h1 style={{ marginBottom: '10px', fontSize: '1.25rem' }}>{t('login.reset_title')}</h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-soft)', marginBottom: '24px' }}>
              {t('login.reset_sent')}
            </p>
          </div>
          <button
            onClick={() => { setMode('login'); setResetEmpNo(''); setResetEmail(''); setError(''); }}
            className="btn-primary"
            style={primaryBtn}
          >
            {t('login.reset_back')}
          </button>
        </div>
        {footer}
      </div>
    );
  }

  if (mode === 'reset') {
    return (
      <div style={wrapStyle}>
        {langToggle}
        <div style={cardStyle} className="animate-in">
          <BrandMark />
          <h1 style={{ marginBottom: '6px', fontSize: '1.3rem', textAlign: 'center' }}>{t('login.reset_title')}</h1>
          <p style={{ marginBottom: '24px', fontSize: '0.88rem', color: 'var(--text-soft)', textAlign: 'center' }}>
            {t('login.reset_email')}
          </p>
          <form onSubmit={handleReset}>
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="reset_emp" style={labelStyle}>{t('login.employee_number')}</label>
              <input id="reset_emp" value={resetEmpNo} onChange={e => setResetEmpNo(e.target.value)} style={fieldStyle} required />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="reset_email" style={labelStyle}>{t('login.reset_email')}</label>
              <input id="reset_email" type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} style={fieldStyle} required />
            </div>
            {errorBox}
            <button type="submit" disabled={resetLoading} className="btn-primary" style={{ ...primaryBtn, marginBottom: '12px' }}>
              {resetLoading ? t('login.reset_submitting') : t('login.reset_submit')}
            </button>
          </form>
          <button
            onClick={() => { setMode('login'); setError(''); }}
            className="btn-ghost"
            style={{ width: '100%', padding: '11px', fontSize: '0.9rem' }}
          >
            {t('login.reset_back')}
          </button>
        </div>
        {footer}
      </div>
    );
  }

  return (
    <div style={wrapStyle}>
      {langToggle}
      <div style={cardStyle} className="animate-in">
        <BrandMark />
        <h1 style={{ marginBottom: '6px', fontSize: '1.4rem', textAlign: 'center' }}>{t('login.title')}</h1>
        <p style={{ marginBottom: '28px', fontSize: '0.9rem', color: 'var(--text-soft)', textAlign: 'center' }}>{t('login.welcome')}</p>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="employee_number" style={labelStyle}>{t('login.employee_number')}</label>
            <input id="employee_number" value={employeeNumber} onChange={e => setEmployeeNumber(e.target.value)} style={fieldStyle} required autoFocus />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="password" style={labelStyle}>{t('login.password')}</label>
            <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} style={fieldStyle} required />
          </div>
          {errorBox}
          <button type="submit" disabled={loading} className="btn-primary" style={{ ...primaryBtn, marginBottom: '16px' }}>
            {loading ? '…' : t('login.submit')}
          </button>
        </form>
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => setMode('reset')}
            style={{ background: 'none', border: 'none', color: 'var(--text-soft)', fontSize: '0.85rem', fontWeight: 500, padding: '4px' }}
          >
            {t('login.forgot_password')}
          </button>
        </div>
      </div>
      {footer}
    </div>
  );
}
