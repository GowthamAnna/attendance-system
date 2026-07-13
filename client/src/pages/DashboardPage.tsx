import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useRequests } from '../hooks/useRequests';
import type { RequestType } from '@attendance/shared';

type SortKey = 'newest' | 'oldest';

const selectStyle: React.CSSProperties = {
  padding: '9px 12px', border: '1px solid var(--border-strong)', borderRadius: '10px',
  fontSize: '0.86rem', background: '#fff', color: 'var(--text-soft)', cursor: 'pointer',
};

const TYPE_TINT: Record<string, { bg: string; fg: string }> = {
  late:             { bg: '#fef3c7', fg: '#92400e' },
  early_departure:  { bg: '#ffedd5', fg: '#9a3412' },
  absence:          { bg: '#e0e7ff', fg: '#3730a3' },
  chokko:           { bg: '#dbeafe', fg: '#1e40af' },
  chokki:           { bg: '#cffafe', fg: '#155e75' },
  kyujitsu_shukkin: { bg: '#dcfce7', fg: '#166534' },
  other_request:    { bg: '#f1f5f9', fg: '#475569' },
};

export function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { requests, loading, fetchRequests } = useRequests();

  const [search, setSearch]         = useState('');
  const [filterType, setFilterType] = useState<RequestType | ''>('');
  const [sortBy, setSortBy]         = useState<SortKey>('newest');

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const stats = useMemo(() => ({
    total: requests.length,
  }), [requests]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests
      .filter(r => {
        if (filterType && r.request_type !== filterType) return false;
        if (q && !r.start_date.includes(q) &&
            !t(`request_type.${r.request_type}`).toLowerCase().includes(q) &&
            !t(`form.reasons.${r.reason_category}`).toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'oldest') return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
        return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
      });
  }, [requests, search, filterType, sortBy, t]);

  return (
    <div className="app-shell">
      <Navbar />
      <div style={{ flex: 1, padding: '32px 20px 48px', maxWidth: '980px', margin: '0 auto', width: '100%' }}>

        {/* Header */}
        <div className="animate-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
            </div>
            <h1 style={{ fontSize: '1.45rem' }}>{t('dashboard.title')}</h1>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={fetchRequests} disabled={loading} className="btn-ghost" style={{ padding: '9px 15px', fontSize: '0.85rem' }}>
              {loading ? '…' : t('dashboard.refresh')}
            </button>
            <button onClick={() => navigate('/request/new')} className="btn-primary" style={{ padding: '9px 18px', fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              {t('nav.new_request')}
            </button>
          </div>
        </div>

        {/* Stat card */}
        <div className="card animate-in" style={{ padding: '18px 22px', marginBottom: '20px', maxWidth: '230px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'var(--accent-grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M9 13h6M9 17h4" /></svg>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {t('dashboard.stats.total')}
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1.1 }}>{stats.total}</div>
          </div>
        </div>

        {/* Search + filters */}
        <div className="card" style={{ padding: '13px 15px', marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', borderRadius: 'var(--r)' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('dashboard.search_placeholder')}
            style={{ flex: '1 1 200px', padding: '9px 13px', border: '1px solid var(--border-strong)', borderRadius: '10px', fontSize: '0.9rem', minWidth: '150px' }}
          />
          <select value={filterType} onChange={e => setFilterType(e.target.value as RequestType | '')} style={selectStyle}>
            <option value="">{t('admin.all')} ({t('form.request_type')})</option>
            {(['late', 'early_departure', 'absence', 'chokko', 'chokki', 'kyujitsu_shukkin', 'other_request'] as RequestType[]).map(type => (
              <option key={type} value={type}>{t(`request_type.${type}`)}</option>
            ))}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as SortKey)} style={selectStyle}>
            <option value="newest">{t('dashboard.sort_newest')}</option>
            <option value="oldest">{t('dashboard.sort_oldest')}</option>
          </select>
          {(search || filterType) && (
            <button
              onClick={() => { setSearch(''); setFilterType(''); }}
              className="btn-ghost"
              style={{ padding: '9px 13px', fontSize: '0.82rem' }}
            >
              ✕ Clear
            </button>
          )}
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '64px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2.4rem', marginBottom: '12px' }}>📭</div>
            <p style={{ fontSize: '0.92rem' }}>{t('dashboard.no_requests')}</p>
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                    {['date', 'time_from', 'time_to', 'type', 'reason', 'submitted'].map(col => (
                      <th key={col} style={{ padding: '13px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                        {t(`dashboard.columns.${col}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => {
                    const tint = TYPE_TINT[r.request_type] ?? TYPE_TINT.other_request;
                    return (
                      <tr
                        key={r.id}
                        style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}
                      >
                        <td style={{ padding: '14px 16px', fontSize: '0.9rem', fontWeight: 500, whiteSpace: 'nowrap' }}>
                          {r.start_date}{r.end_date ? ` – ${r.end_date}` : ''}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '0.88rem', color: 'var(--text-soft)' }}>
                          {r.time_from ? r.time_from.slice(0, 5) : '—'}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '0.88rem', color: 'var(--text-soft)' }}>
                          {r.time_to ? r.time_to.slice(0, 5) : '—'}
                        </td>
                        <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                          <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 600, background: tint.bg, color: tint.fg }}>
                            {t(`request_type.${r.request_type}`)}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '0.88rem', color: 'var(--text-soft)' }}>{r.reason_category ? t(`form.reasons.${r.reason_category}`) : '—'}</td>
                        <td style={{ padding: '14px 16px', fontSize: '0.88rem', color: 'var(--text-soft)', whiteSpace: 'nowrap' }}>{new Date(r.submitted_at).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '11px 16px', borderTop: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {filtered.length} / {requests.length} {t('dashboard.stats.total').toLowerCase()}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
