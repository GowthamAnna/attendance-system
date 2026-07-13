import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { EmployeeListItem } from '@attendance/shared';
import { apiFetch } from '../api/client';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { EmployeeDetailPanel } from '../components/EmployeeDetailPanel';

type RoleFilter = 'all' | 'applicant' | 'admin';
type StatusFilter = 'all' | 'active' | 'deactivated';

export function AdminEmployeesPage() {
  const { t } = useTranslation();
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [panelMode, setPanelMode] = useState<'view' | 'create' | null>(null);
  const [selectedId, setSelectedId] = useState<string | undefined>();

  useEffect(() => {
    apiFetch('/api/admin/employees')
      .then(r => r.json())
      .then(setEmployees);
  }, []);

  const filtered = employees.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q || e.name_ja.toLowerCase().includes(q) || e.name_en.toLowerCase().includes(q) || e.employee_number.toLowerCase().includes(q);
    const matchRole = roleFilter === 'all' || e.role === roleFilter;
    const matchStatus = statusFilter === 'all' || (statusFilter === 'active' ? e.is_active : !e.is_active);
    return matchSearch && matchRole && matchStatus;
  });

  function openCreate() { setPanelMode('create'); setSelectedId(undefined); }
  function openView(id: string) { setPanelMode('view'); setSelectedId(id); }
  function closePanel() { setPanelMode(null); setSelectedId(undefined); }

  return (
    <div className="app-shell">
      <Navbar />
      <div style={{ flex: 1, padding: '32px 20px 48px', maxWidth: '980px', margin: '0 auto', width: '100%' }}>
        <div className="animate-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            </div>
            <h1 style={{ fontSize: '1.45rem' }}>{t('employees.title')}</h1>
          </div>
          <button
            onClick={openCreate}
            className="btn-primary"
            style={{ padding: '10px 20px', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            {t('employees.add')}
          </button>
        </div>

        {/* Filters */}
        <div className="card" style={{ display: 'flex', gap: '10px', padding: '13px 15px', marginBottom: '16px', flexWrap: 'wrap', borderRadius: 'var(--r)' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('employees.search_placeholder')}
            style={{ flex: 1, minWidth: '200px', padding: '9px 13px', border: '1px solid var(--border-strong)', borderRadius: '10px', fontSize: '0.9rem' }}
          />
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as RoleFilter)} style={{ padding: '9px 12px', border: '1px solid var(--border-strong)', borderRadius: '10px', fontSize: '0.86rem', background: '#fff', color: 'var(--text-soft)' }}>
            <option value="all">{t('employees.filter_role')}: {t('admin.all')}</option>
            <option value="applicant">{t('profile.roles.applicant')}</option>
            <option value="admin">{t('profile.roles.admin')}</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusFilter)} style={{ padding: '9px 12px', border: '1px solid var(--border-strong)', borderRadius: '10px', fontSize: '0.86rem', background: '#fff', color: 'var(--text-soft)' }}>
            <option value="all">{t('employees.filter_status')}: {t('admin.all')}</option>
            <option value="active">{t('employees.status_active')}</option>
            <option value="deactivated">{t('employees.status_deactivated')}</option>
          </select>
        </div>

        {/* Table */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                  <Th>{t('employees.fields.employee_number')}</Th>
                  <Th>{t('employees.fields.name_ja')}</Th>
                  <Th>{t('employees.fields.name_en')}</Th>
                  <Th>{t('employees.fields.email')}</Th>
                  <Th>{t('employees.fields.role')}</Th>
                  <Th>{t('employees.filter_status')}</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr
                    key={e.id}
                    onClick={() => openView(e.id)}
                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                    onMouseEnter={ev => (ev.currentTarget.style.background = 'var(--accent-soft)')}
                    onMouseLeave={ev => (ev.currentTarget.style.background = '')}
                  >
                    <Td>{e.employee_number}</Td>
                    <Td>{e.name_ja}</Td>
                    <Td>{e.name_en}</Td>
                    <Td>{e.email}</Td>
                    <Td>{t(`profile.roles.${e.role}`)}</Td>
                    <Td>
                      <span style={{
                        display: 'inline-block', padding: '3px 11px', borderRadius: '999px',
                        fontSize: '0.78rem', fontWeight: 600,
                        background: e.is_active ? '#dcfce7' : '#f1f5f9',
                        color: e.is_active ? '#166534' : '#64748b',
                      }}>
                        {e.is_active ? t('employees.status_active') : t('employees.status_deactivated')}
                      </span>
                    </Td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      {t('dashboard.no_requests')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Footer />

      {panelMode && (
        <EmployeeDetailPanel
          mode={panelMode}
          employeeId={selectedId}
          allUsers={employees}
          onClose={closePanel}
          onCreated={(emp) => setEmployees(prev => [...prev, emp])}
          onUpdated={(emp) => setEmployees(prev => prev.map(e => e.id === emp.id ? emp : e))}
          onDeleted={(id) => setEmployees(prev => prev.filter(e => e.id !== id))}
        />
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: '13px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: '13px 14px', color: 'var(--text-soft)', whiteSpace: 'nowrap' }}>{children}</td>;
}
