import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { generateTimeOptions } from '../utils/timeOptions';
import type { RequestType, ReasonCategory, LeaveType } from '@attendance/shared';

const OPTIONAL_REASON_TYPES: RequestType[] = ['chokko', 'chokki', 'kyujitsu_shukkin', 'other_request'];

const REASONS_BY_TYPE: Record<RequestType, ReasonCategory[]> = {
  late:             ['illness', 'train_delay', 'oversleeping', 'other'],
  early_departure:  ['illness', 'other'],
  absence:          ['illness', 'family', 'personal', 'weather_transport', 'other'],
  other_request:    [],
  chokko:           ['client_meeting', 'different_office', 'work_event', 'other'],
  chokki:           ['client_meeting', 'work_event', 'other'],
  kyujitsu_shukkin: ['substitute_day', 'client_meeting', 'other'],
};

const NEEDS_DETAIL: ReasonCategory[] = ['illness', 'other'];
const TIME_TYPES: RequestType[] = ['late', 'early_departure', 'other_request', 'kyujitsu_shukkin'];
const LEAVE_TYPES: LeaveType[] = ['paid', 'unpaid', 'substitute', 'special'];
const TIME_OPTIONS = generateTimeOptions();
const today = new Date().toISOString().split('T')[0];

const DETAIL_PLACEHOLDERS: Partial<Record<ReasonCategory, { ja: string; en: string }>> = {
  illness: { ja: '例：内科を受診しました', en: 'e.g., Visited internal medicine clinic' },
  other:   { ja: '例：詳細を記入してください', en: 'e.g., Please describe the reason in detail' },
};

const ADMIN_MSG_PLACEHOLDERS: Record<RequestType, { ja: string; en: string }> = {
  late:             { ja: '任意：管理者へのコメント', en: 'Optional: note to admin' },
  early_departure:  { ja: '任意：管理者へのコメント', en: 'Optional: note to admin' },
  absence:          { ja: '任意：管理者へのコメント', en: 'Optional: note to admin' },
  other_request:    { ja: '理由を明確に説明してください。', en: 'Please explain the reason clearly.' },
  chokko:           { ja: '任意：管理者へのコメント', en: 'Optional: note to admin' },
  chokki:           { ja: '任意：管理者へのコメント', en: 'Optional: note to admin' },
  kyujitsu_shukkin: { ja: '任意：管理者へのコメント', en: 'Optional: note to admin' },
};

const inputStyle = {
  width: '100%', padding: '11px 13px', border: '1px solid var(--border-strong)',
  borderRadius: '10px', fontSize: '0.95rem', boxSizing: 'border-box' as const,
  background: '#fff', color: 'var(--text)',
};

interface FormState {
  requestType: RequestType;
  startDate: string;
  endDate: string;
  timeFrom: string;
  timeTo: string;
  reasonCategory: ReasonCategory | '';
  reasonDetail: string;
  leaveType: LeaveType | '';
  adminMessage: string;
  file: File | null;
  fileError: string;
  trainLineName: string;
}

export function RequestFormPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isJa = i18n.language === 'ja';

  const [fileInputKey, setFileInputKey] = useState(0);

  const [form, setForm] = useState<FormState>(location.state?.form ?? {
    requestType: 'late',
    startDate: today,
    endDate: '',
    timeFrom: '09:00',
    timeTo: '10:00',
    reasonCategory: '',
    reasonDetail: '',
    leaveType: '',
    adminMessage: '',
    file: null,
    fileError: '',
    trainLineName: '',
  });

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function handleTypeChange(type: RequestType) {
    setForm(prev => ({ ...prev, requestType: type, reasonCategory: '', reasonDetail: '', leaveType: '', endDate: '', trainLineName: '' }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      if (!allowed.includes(file.type)) return set('fileError', 'Only PDF or XLSX files are allowed');
      if (file.size > 3 * 1024 * 1024) return set('fileError', 'File must be under 3 MB');
    }
    setForm(prev => ({ ...prev, file, fileError: '' }));
  }

  const hasTrainLines = (user?.trainLines?.length ?? 0) > 0;
  const reasons = REASONS_BY_TYPE[form.requestType].filter(
    r => r !== 'train_delay' || hasTrainLines
  );
  const showTime = TIME_TYPES.includes(form.requestType);
  const showDetail = form.reasonCategory !== '' && NEEDS_DETAIL.includes(form.reasonCategory as ReasonCategory);
  const showTrainLinePicker = form.requestType === 'late' && form.reasonCategory === 'train_delay';
  const showLeaveType = form.requestType === 'absence';
  const showEndDate = form.requestType === 'absence';
  const isOtherRequest = form.requestType === 'other_request';
  const hasOptionalReason = OPTIONAL_REASON_TYPES.includes(form.requestType);

  const reasonRequired = !hasOptionalReason;
  const endDateRequired = showEndDate;
  const adminMessageRequired = isOtherRequest;

  const isValid = isOtherRequest
    ? form.adminMessage.trim() !== ''
    : hasOptionalReason
      ? true
      : form.reasonCategory !== '' &&
        (!showLeaveType || form.leaveType !== '') &&
        (!showDetail || form.reasonDetail.trim() !== '') &&
        (!showEndDate || form.endDate !== '') &&
        (!showTrainLinePicker || form.trainLineName !== '');

  function handleNext() {
    if (!isValid || !user) return;
    navigate('/request/confirm', {
      state: {
        form: { ...form, inputLanguage: i18n.language as 'ja' | 'en' },
        user,
      },
    });
  }

  const detailPlaceholder = form.reasonCategory
    ? (DETAIL_PLACEHOLDERS[form.reasonCategory as ReasonCategory]?.[isJa ? 'ja' : 'en'] ?? '')
    : '';
  const adminMsgPlaceholder = ADMIN_MSG_PLACEHOLDERS[form.requestType][isJa ? 'ja' : 'en'];

  return (
    <div className="app-shell">
      <Navbar />

      <div style={{ flex: 1, padding: '32px 20px 48px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
        <div className="animate-in" style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '22px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M9 15h6M9 11h2" /></svg>
          </div>
          <div>
            <h1 style={{ fontSize: '1.45rem' }}>{t('form.title')}</h1>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-soft)', marginTop: '2px' }}>{t('form.request_type')}</p>
          </div>
        </div>

        <div className="card animate-in" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Request Type */}
          <div>
            <Label htmlFor="requestType" required>{t('form.request_type')}</Label>
            <select id="requestType" value={form.requestType} onChange={e => handleTypeChange(e.target.value as RequestType)} style={inputStyle}>
              {(['late', 'early_departure', 'absence', 'chokko', 'chokki', 'kyujitsu_shukkin', 'other_request'] as RequestType[]).map(type => (
                <option key={type} value={type}>{t(`request_type.${type}`)}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <Label htmlFor="startDate" required>{showEndDate ? t('form.start_date') : t('form.date')}</Label>
            <input id="startDate" type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} style={inputStyle} required />
          </div>

          {/* End Date (absence) */}
          {showEndDate && (
            <div>
              <Label htmlFor="endDate" required={endDateRequired}>{t('form.end_date')}</Label>
              <input id="endDate" type="date" value={form.endDate} min={form.startDate} onChange={e => set('endDate', e.target.value)} style={inputStyle} />
            </div>
          )}

          {/* Time From / To */}
          {showTime && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <Label htmlFor="timeFrom" required={!isOtherRequest && !hasOptionalReason}>{t('form.time_from')}</Label>
                <select id="timeFrom" value={form.timeFrom} onChange={e => set('timeFrom', e.target.value)} style={inputStyle}>
                  {TIME_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="timeTo" required={!isOtherRequest && !hasOptionalReason}>{t('form.time_to')}</Label>
                <select id="timeTo" value={form.timeTo} onChange={e => set('timeTo', e.target.value)} style={inputStyle}>
                  {TIME_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Reason — hidden for other_request which has no reason list */}
          {reasons.length > 0 && (
            <div>
              <Label htmlFor="reasonCategory" required={reasonRequired}>{t('form.reason')}</Label>
              <select id="reasonCategory" value={form.reasonCategory} onChange={e => {
                const cat = e.target.value as ReasonCategory;
                setForm(prev => ({ ...prev, reasonCategory: cat, trainLineName: '' }));
              }} style={inputStyle}>
                <option value="">--</option>
                {reasons.map(r => (
                  <option key={r} value={r}>{t(`form.reasons.${r}`)}</option>
                ))}
              </select>
            </div>
          )}

          {/* Reason detail */}
          {showDetail && (
            <div>
              <Label htmlFor="reasonDetail" required={!hasOptionalReason}>{t('form.reason_detail')}</Label>
              <textarea
                id="reasonDetail" value={form.reasonDetail}
                onChange={e => set('reasonDetail', e.target.value)}
                rows={3} placeholder={detailPlaceholder}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
          )}

          {/* Train line picker — shown for late arrival with train_delay reason */}
          {showTrainLinePicker && (
            <div>
              <Label htmlFor="trainLine" required>{t('form.train_line')}</Label>
              {user?.trainLines && user.trainLines.length > 0 ? (
                <select
                  id="trainLine"
                  value={form.trainLineName}
                  onChange={e => set('trainLineName', e.target.value)}
                  style={inputStyle}
                >
                  <option value="">--</option>
                  {user.trainLines.map(line => (
                    <option key={line.id} value={line.line_name_ja}>
                      {isJa ? line.line_name_ja : line.line_name_en}
                    </option>
                  ))}
                </select>
              ) : (
                <p style={{ fontSize: '0.85em', color: '#6b7280', margin: 0 }}>
                  {isJa ? '登録済みの路線がありません。' : 'No registered train lines.'}
                </p>
              )}
            </div>
          )}

          {/* Leave type (absence) */}
          {showLeaveType && (
            <div>
              <Label htmlFor="leaveType" required>{t('form.leave_type')}</Label>
              <select id="leaveType" value={form.leaveType} onChange={e => set('leaveType', e.target.value as LeaveType)} style={inputStyle}>
                <option value="">--</option>
                {LEAVE_TYPES.map(lt => (
                  <option key={lt} value={lt}>{t(`form.leave_types.${lt}`)}</option>
                ))}
              </select>
            </div>
          )}

          {/* Admin message */}
          <div>
            <Label htmlFor="adminMessage" required={adminMessageRequired}>{t('form.admin_message')}</Label>
            <textarea
              id="adminMessage" value={form.adminMessage}
              onChange={e => set('adminMessage', e.target.value)}
              rows={2} placeholder={adminMsgPlaceholder}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {/* File upload */}
          <div>
            <label style={{ display: 'block', marginBottom: '7px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-soft)' }}>
              {t('form.attach_file')}
            </label>
            {form.file ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 13px', background: 'var(--success-soft)', border: '1px solid #bbf7d0', borderRadius: '10px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M20 6 9 17l-5-5" /></svg>
                <span style={{ color: 'var(--success)', fontSize: '0.88rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.file.name}</span>
                <button
                  type="button"
                  onClick={() => { setForm(prev => ({ ...prev, file: null, fileError: '' })); setFileInputKey(k => k + 1); }}
                  style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '1.05rem', lineHeight: 1, padding: '2px 4px' }}
                  title="Remove file"
                >✕</button>
              </div>
            ) : (
              <label
                htmlFor={`file-upload-${fileInputKey}`}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px',
                  padding: '14px', background: 'var(--surface-2)', border: '1.5px dashed var(--border-strong)',
                  borderRadius: '10px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 500,
                  color: 'var(--text-soft)',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m17 8-5-5-5 5" /><path d="M12 3v12" /></svg>
                {t('form.choose_file')}
                <input
                  id={`file-upload-${fileInputKey}`}
                  key={fileInputKey}
                  type="file"
                  accept=".pdf,.xlsx"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </label>
            )}
            {form.fileError && <p style={{ color: 'var(--danger)', fontSize: '0.82rem', marginTop: '6px' }}>{form.fileError}</p>}
          </div>

          {/* Required note */}
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
            <span style={{ color: 'var(--danger)' }}>*</span> {isJa ? '必須項目' : 'Required fields'}
          </p>

          <button
            onClick={handleNext}
            disabled={!isValid}
            className="btn-primary"
            style={{ padding: '13px', fontSize: '0.98rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {t('form.next')}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function Label({ htmlFor, children, required }: { htmlFor?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} style={{ display: 'block', marginBottom: '7px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-soft)' }}>
      {children}
      {required && <span style={{ color: 'var(--danger)', marginLeft: '3px' }}>*</span>}
    </label>
  );
}
