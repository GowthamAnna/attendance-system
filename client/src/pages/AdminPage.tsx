import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { RequestDetailPanel } from '../components/RequestDetailPanel';
import { apiFetch } from '../api/client';
import type { Request as AttendanceRequest, RequestType } from '@attendance/shared';

type SortKey = 'newest' | 'oldest' | 'name';

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

export function AdminPage() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<AttendanceRequest[]>([]);
  const [selected, setSelected] = useState<AttendanceRequest | null>(null);
  const [filterType, setFilterType] = useState<RequestType | ''>('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo]     = useState('');
  const [filterUnread, setFilterUnread] = useState(false);
  const [search, setSearch]         = useState('');
  const [sortBy, setSortBy]         = useState<SortKey>('newest');

  const fetchRequests = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterType) params.set('type', filterType);
    if (filterFrom) params.set('from', filterFrom);
    if (filterTo)   params.set('to',   filterTo);
    const res = await apiFetch(`/api/admin/requests?${params}`);
    if (res.ok) setRequests(await res.json());
  }, [filterType, filterFrom, filterTo]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  function handleRead(id: string) {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, is_read: true } : r));
  }

  function handleUnread(id: string) {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, is_read: false } : r));
  }

  function handleDelete(id: string) {
    setRequests(prev => prev.filter(r => r.id !== id));
    setSelected(null);
  }

  const stats = useMemo(() => ({
    total: requests.length,
  }), [requests]);

  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...requests]
      .filter(r => {
        if (filterUnread && r.is_read) return false;
        if (!q) return true;
        return (
          r.employee_name_ja.toLowerCase().includes(q) ||
          r.employee_name_en.toLowerCase().includes(q) ||
          r.employee_number.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'oldest') return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
        if (sortBy === 'name')   return a.employee_name_en.localeCompare(b.employee_name_en);
        return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
      });
  }, [requests, search, sortBy, filterUnread]);

  const hasFilters = filterType || filterFrom || filterTo || filterUnread;

  function clearFilters() {
    setFilterType(''); setFilterFrom(''); setFilterTo(''); setFilterUnread(false);
  }

  function handleClose() {
    setSelected(null);
  }

  return (
    <div className="app-shell">
      <Navbar />
      <div style={{ flex: 1, padding: '32px 20px 48px', maxWidth: '1160px', margin: '0 auto', width: '100%' }}>

        {/* Header */}
        <div className="animate-in" style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '22px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><rect x="7" y="12" width="3" height="6" /><rect x="12" y="8" width="3" height="10" /><rect x="17" y="5" width="3" height="13" /></svg>
          </div>
          <h1 style={{ fontSize: '1.45rem' }}>{t('admin.title')}</h1>
        </div>

        {/* Stat card — Total only */}
        <div className="card animate-in" style={{ padding: '18px 22px', marginBottom: '20px', maxWidth: '240px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'var(--accent-grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {t('admin.stats.total')}
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1.1 }}>{stats.total}</div>
          </div>
        </div>

        {/* Search + sort row */}
        <div className="card" style={{ padding: '13px 15px', marginBottom: '10px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', borderRadius: 'var(--r)' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('admin.filter_name')}
            style={{ flex: '1 1 200px', padding: '9px 13px', border: '1px solid var(--border-strong)', borderRadius: '10px', fontSize: '0.9rem' }}
          />
          <select value={sortBy} onChange={e => setSortBy(e.target.value as SortKey)} style={selectStyle}>
            <option value="newest">{t('admin.sort_newest')}</option>
            <option value="oldest">{t('admin.sort_oldest')}</option>
            <option value="name">{t('admin.sort_name')}</option>
          </select>
          {search && (
            <button onClick={() => setSearch('')} className="btn-ghost" style={{ padding: '9px 13px', fontSize: '0.82rem' }}>
              ✕ Clear search
            </button>
          )}
        </div>

        {/* Filter row */}
        <div className="card" style={{ padding: '13px 15px', marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', borderRadius: 'var(--r)' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '4px' }}>Filter</span>
          <select value={filterType} onChange={e => setFilterType(e.target.value as RequestType | '')} style={selectStyle}>
            <option value="">{t('admin.all')} ({t('form.request_type')})</option>
            {(['late', 'early_departure', 'absence', 'chokko', 'chokki', 'kyujitsu_shukkin', 'other_request'] as RequestType[]).map(type => (
              <option key={type} value={type}>{t(`request_type.${type}`)}</option>
            ))}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85em', color: '#6b7280' }}>
            <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} style={{ ...selectStyle, color: filterFrom ? '#111' : '#9ca3af' }} />
            <span>→</span>
            <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} style={{ ...selectStyle, color: filterTo ? '#111' : '#9ca3af' }} />
          </div>
          <button
            onClick={() => setFilterUnread(prev => !prev)}
            style={{
              padding: '8px 15px', borderRadius: '999px', fontSize: '0.82rem', fontWeight: 600,
              background: filterUnread ? 'var(--accent-grad)' : 'transparent',
              color: filterUnread ? '#fff' : 'var(--text-soft)',
              border: filterUnread ? 'none' : '1px solid var(--border-strong)',
              boxShadow: filterUnread ? '0 4px 12px rgba(37,99,235,0.28)' : 'none',
            }}
          >
            {t('admin.filter_unread')}
          </button>
          {hasFilters && (
            <button onClick={clearFilters} className="btn-ghost" style={{ padding: '9px 13px', fontSize: '0.82rem' }}>
              ✕ Clear filters
            </button>
          )}
        </div>

        {/* Table */}
        <div className="card" style={{ overflow: 'hidden' }}>
          {displayed.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.2rem', marginBottom: '12px' }}>🔍</div>
              <p style={{ fontSize: '0.92rem' }}>No requests found</p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                      {['name', 'employee_number', 'date', 'time_from', 'time_to', 'type', 'reason', 'submitted'].map(col => (
                        <th key={col} style={{ padding: '13px 14px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                          {t(`admin.columns.${col}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayed.map((r, i) => {
                      const isUnread = !r.is_read;
                      const tint = TYPE_TINT[r.request_type] ?? TYPE_TINT.other_request;
                      return (
                        <tr
                          key={r.id}
                          onClick={() => setSelected(r)}
                          style={{ borderBottom: i < displayed.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer', background: isUnread ? 'rgba(37,99,235,0.03)' : '' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-soft)')}
                          onMouseLeave={e => (e.currentTarget.style.background = isUnread ? 'rgba(37,99,235,0.03)' : '')}
                        >
                          <td style={{ padding: '13px 14px', whiteSpace: 'nowrap' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: isUnread ? 700 : 500, color: 'var(--text)' }}>{r.employee_name_ja}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: isUnread ? 600 : 400 }}>{r.employee_name_en}</div>
                          </td>
                          <td style={{ padding: '13px 14px', fontSize: '0.82rem', color: 'var(--text-soft)', fontWeight: isUnread ? 700 : 400 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {isUnread && (
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', flexShrink: 0 }} />
                              )}
                              {r.employee_number}
                            </div>
                          </td>
                          <td style={{ padding: '13px 14px', fontSize: '0.88rem', fontWeight: isUnread ? 700 : 400, whiteSpace: 'nowrap' }}>{r.start_date}{r.end_date ? ` – ${r.end_date}` : ''}</td>
                          <td style={{ padding: '13px 14px', fontSize: '0.88rem', color: 'var(--text-soft)', fontWeight: isUnread ? 700 : 400 }}>{r.time_from ? r.time_from.slice(0, 5) : '—'}</td>
                          <td style={{ padding: '13px 14px', fontSize: '0.88rem', color: 'var(--text-soft)', fontWeight: isUnread ? 700 : 400 }}>{r.time_to ? r.time_to.slice(0, 5) : '—'}</td>
                          <td style={{ padding: '13px 14px', whiteSpace: 'nowrap' }}>
                            <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 600, background: tint.bg, color: tint.fg }}>
                              {t(`request_type.${r.request_type}`)}
                            </span>
                          </td>
                          <td style={{ padding: '13px 14px', fontSize: '0.88rem', color: 'var(--text-soft)', fontWeight: isUnread ? 700 : 400 }}>{r.reason_category ? t(`form.reasons.${r.reason_category}`) : '—'}</td>
                          <td style={{ padding: '13px 14px', fontSize: '0.88rem', color: 'var(--text-soft)', fontWeight: isUnread ? 700 : 400, whiteSpace: 'nowrap' }}>{new Date(r.submitted_at).toLocaleDateString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: '11px 14px', borderTop: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {displayed.length} / {requests.length} {t('admin.stats.total').toLowerCase()}
              </div>
            </>
          )}
        </div>

        <RequestDetailPanel
          request={selected}
          onClose={handleClose}
          onRead={handleRead}
          onUnread={handleUnread}
          onDelete={handleDelete}
        />
      </div>
      <Footer />
    </div>
  );
}
