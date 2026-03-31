import React, { useState, useRef } from 'react';
import { useTheme, useCardHover } from '../context/ThemeContext';
import useResponsive from '../hooks/useResponsive';
import { registerCustomer } from '../api';
import { fs, fh, fm } from '../utils/fontScale';

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components — defined OUTSIDE main component to prevent focus loss bug
// ─────────────────────────────────────────────────────────────────────────────

function Field({ label, value, onChange, placeholder, required, type = 'text', error, hintText, style = {}, inp, theme, primary, fieldRef, maxLength, inputMode, onKeyDown }) {
  const labelSt = {
    display: 'block', color: theme.textMuted, fontSize: fm.xs,
    letterSpacing: 2, textTransform: 'uppercase',
    fontFamily: "'Space Mono',monospace", marginBottom: 8,
  };
  return (
    <div style={{ flex: 1, ...style }}>
      <label style={labelSt}>
        {label}{required && <span style={{ color: primary }}> *</span>}
      </label>
      <input
        ref={fieldRef}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={inputMode}
        style={{
          ...inp, width: '100%', padding: '12px 14px', fontSize: fs.base,
          boxSizing: 'border-box',
          borderColor: error ? theme.errorText : theme.border,
        }}
        onFocus={e => e.target.style.borderColor = error ? theme.errorText : primary}
        onBlur={e  => e.target.style.borderColor = error ? theme.errorText : theme.border}
      />
      {error ? (
        <div style={{ color: theme.errorText, fontSize: fm.xs, marginTop: 4, fontFamily: "'Space Mono',monospace" }}>
          ⚠ {error}
        </div>
      ) : hintText ? (
        <div style={{ color: theme.textMuted, fontSize: fm.xs, marginTop: 4, fontFamily: "'Space Mono',monospace", opacity: 0.7 }}>
          {hintText}
        </div>
      ) : null}
    </div>
  );
}

function SelectField({ label, value, onChange, options, required, style = {}, inp, theme, primary }) {
  const labelSt = {
    display: 'block', color: theme.textMuted, fontSize: fm.xs,
    letterSpacing: 2, textTransform: 'uppercase',
    fontFamily: "'Space Mono',monospace", marginBottom: 8,
  };
  return (
    <div style={{ flex: 1, ...style }}>
      <label style={labelSt}>
        {label}{required && <span style={{ color: primary }}> *</span>}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          ...inp, width: '100%', padding: '12px 14px', fontSize: fs.base,
          boxSizing: 'border-box', cursor: 'pointer', appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center',
          paddingRight: 38,
        }}
        onFocus={e => e.target.style.borderColor = primary}
        onBlur={e  => e.target.style.borderColor = theme.border}
      >
        {options.map(o => (
          <option key={o.value} value={o.value} style={{ background: inp.background, color: theme.text }}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder, inp, theme, primary }) {
  const labelSt = {
    display: 'block', color: theme.textMuted, fontSize: fm.xs,
    letterSpacing: 2, textTransform: 'uppercase',
    fontFamily: "'Space Mono',monospace", marginBottom: 8,
  };
  return (
    <div style={{ flex: 1 }}>
      <label style={labelSt}>{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        style={{
          ...inp, width: '100%', padding: '12px 14px', fontSize: fs.base,
          boxSizing: 'border-box', resize: 'vertical', minHeight: 64,
        }}
        onFocus={e => e.target.style.borderColor = primary}
        onBlur={e  => e.target.style.borderColor = theme.border}
      />
    </div>
  );
}

function SectionDivider({ title, theme, primary }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '24px 0 16px' }}>
      <div style={{ width: 3, height: 14, background: primary, borderRadius: 2 }} />
      <span style={{
        color: primary, fontSize: fm.xs, letterSpacing: 3,
        textTransform: 'uppercase', fontFamily: "'Space Mono',monospace", fontWeight: 700,
      }}>{title}</span>
      <div style={{ flex: 1, height: 1, background: theme.border }} />
    </div>
  );
}

function Spin() {
  return (
    <div style={{
      width: 14, height: 14,
      border: '2px solid rgba(255,255,255,0.3)',
      borderTopColor: '#fff', borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Static option lists
// ─────────────────────────────────────────────────────────────────────────────

const TYPE_OPTIONS = [
  { value: '',      label: '— Select —' },
  { value: 'MR',    label: 'Mr.' },
  { value: 'MRS',   label: 'Mrs.' },
  { value: 'MS',    label: 'Ms.' },
  { value: 'DR',    label: 'Dr.' },
  { value: 'REV',   label: 'Rev.' },
  { value: 'PROF',  label: 'Prof.' },
  { value: 'OTHER', label: 'Other' },
];

const CIVIL_OPTIONS = [
  { value: '',        label: '— Select —' },
  { value: 'SINGLE',  label: 'Single' },
  { value: 'MARRIED', label: 'Married' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Phone number helpers — numbers only, max 10 digits
// ─────────────────────────────────────────────────────────────────────────────

// onChange: strip non-digits, cap at 10
const handlePhoneChange = (val, setter, clearErrFn) => {
  const digitsOnly = val.replace(/\D/g, '').slice(0, 10);
  setter(digitsOnly);
  if (clearErrFn) clearErrFn();
};

// onKeyDown: block non-numeric keys (allow control keys & shortcuts)
const phoneKeyDown = (e) => {
  const controlKeys = [
    'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
    'Home', 'End',
  ];
  if (controlKeys.includes(e.key)) return;
  if (e.ctrlKey || e.metaKey) return; // allow Ctrl+C, Ctrl+V, etc.
  if (!/^\d$/.test(e.key)) e.preventDefault();
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function RegisterPage({ onNavigate }) {
  const { theme, mode } = useTheme();
  const { isMobile }    = useResponsive();
  const { cardProps }   = useCardHover({ borderRadius: 20, padding: isMobile ? '28px 20px' : '36px 32px' });

  const primary = 'var(--primary)';

  const inp = {
    background: mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
    border: `1px solid ${theme.border}`,
    borderRadius: 10, color: theme.text,
    fontFamily: 'inherit', outline: 'none',
    transition: 'border-color 0.2s',
  };

  const shared = { inp, theme, primary };

  // ── Field refs for auto-focus on error ────────────────────────────────────
  const refs = {
    custDisplayName: useRef(null),
    custFullName:    useRef(null),
    mobileNo:        useRef(null),
    nic:             useRef(null),
    passport:        useRef(null),
  };

  const [form, setForm] = useState({
    type:             '',
    custDisplayName:  '',
    custFullName:     '',
    dob:              '',
    postalAddress:    '',
    permanentAddress: '',
    city:             '',
    civilStatus:      '',
    nic:              '',
    passport:         '',
    email:            '',
    occupation:       '',
    homeNo:           '',
    officeNo:         '',
    mobileNo:         '',
  });

  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);

  const set      = (key) => (val) => setForm(f => ({ ...f, [key]: val }));
  const clearErr = (key) => setErrors(e => ({ ...e, [key]: '' }));

  // ── Focus first error field ────────────────────────────────────────────────
  const focusFirstError = (errorObj) => {
    const priority = ['custDisplayName', 'custFullName', 'mobileNo', 'nic', 'passport'];
    for (const key of priority) {
      if (errorObj[key] && refs[key]?.current) {
        refs[key].current.focus();
        refs[key].current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      }
    }
  };

  const validate = () => {
    const e = {};
    if (!form.custDisplayName.trim())
      e.custDisplayName = 'Display name is required.';
    if (!form.custFullName.trim())
      e.custFullName = 'Full name is required.';
    if (!form.mobileNo.trim())
      e.mobileNo = 'Mobile number is required.';
    else if (!/^0\d{9}$/.test(form.mobileNo.trim()))
      e.mobileNo = 'Enter a valid mobile number (e.g. 07XXXXXXXX).';
    const hasNic      = form.nic.trim().length > 0;
    const hasPassport = form.passport.trim().length > 0;
    if (!hasNic && !hasPassport)
      e.nic = 'NIC or Passport number is required.';
    else if (hasNic && !/^(\d{9}[VvXx]|\d{12})$/.test(form.nic.trim()))
      e.nic = 'Enter a valid NIC (9 digits + V/X, or 12 digits).';
    else if (hasPassport && !/^[A-Z]\d{6,7}$/.test(form.passport.trim()))
      e.passport = 'Enter a valid passport number (e.g. N1234567).';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    setErrors(e);
    focusFirstError(e);
    if (Object.keys(e).length > 0) return;

    setLoading(true);
    try {
      await registerCustomer(form);
      setDone(true);
    } catch (err) {
      const dupFieldMap = {
        mobile:   'mobileNo',
        nic:      'nic',
        passport: 'passport',
      };

      let newErrors = {};

      if (err.field && dupFieldMap[err.field]) {
        const formKey = dupFieldMap[err.field];
        newErrors[formKey] = err.message;
        setErrors(newErrors);
        if (refs[formKey]?.current) {
          refs[formKey].current.focus();
          refs[formKey].current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        newErrors.submit = err.message || 'Registration failed. Please try again.';
        setErrors(newErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Pending Approval Screen ────────────────────────────────────────────────
  if (done) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 64px)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        padding: isMobile ? '24px 16px' : '48px 16px',
      }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          <div {...cardProps} style={{ ...cardProps.style, cursor: 'default', textAlign: 'center' }}>

            <div style={{
              width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
              background: 'rgba(255, 180, 0, 0.1)',
              border: '2px solid rgba(255, 180, 0, 0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32,
            }}>⏳</div>

            <h2 style={{
              color: theme.text, fontFamily: "'Bebas Neue',sans-serif",
              fontSize: fh.h4, letterSpacing: 3, marginBottom: 12,
            }}>
              REQUEST SUBMITTED
            </h2>

            <div style={{
              display: 'inline-block', padding: '4px 14px',
              background: 'rgba(255, 180, 0, 0.1)',
              border: '1px solid rgba(255, 180, 0, 0.35)',
              borderRadius: 20, marginBottom: 20,
            }}>
              <span style={{
                color: '#ffb400', fontSize: fm.xs, letterSpacing: 3,
                fontFamily: "'Space Mono',monospace", textTransform: 'uppercase',
              }}>
                Pending Approval
              </span>
            </div>

            <p style={{
              color: theme.textMuted, fontSize: fs.sm,
              fontFamily: "'Space Mono',monospace",
              lineHeight: 1.9, marginBottom: 28,
            }}>
              Your registration request has been received.<br />
              Once the shop approves your account,<br />
              you will be able to log in.
            </p>

            <div style={{
              padding: '12px 16px', marginBottom: 28,
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${theme.border}`,
              borderRadius: 10, textAlign: 'left',
            }}>
              <div style={{ color: theme.textMuted, fontSize: fm.xs, fontFamily: "'Space Mono',monospace", lineHeight: 2 }}>
                <div>&nbsp;Name &nbsp;&nbsp;— <span style={{ color: theme.text }}>{form.custFullName}</span></div>
                <div>&nbsp;Mobile — <span style={{ color: theme.text }}>{form.mobileNo}</span></div>
                {form.nic && <div>&nbsp;NIC &nbsp;&nbsp;&nbsp;— <span style={{ color: theme.text }}>{form.nic}</span></div>}
              </div>
            </div>

            <button
              onClick={() => onNavigate('login')}
              style={{
                width: '100%', padding: '14px',
                background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                border: 'none', borderRadius: 10, color: '#fff',
                fontFamily: "'Space Mono',monospace", fontSize: fm.base,
                letterSpacing: 2, textTransform: 'uppercase',
                cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              }}
            >
              Back to Login →
            </button>

          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: isMobile ? '24px 16px' : '48px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        <div {...cardProps} style={{ ...cardProps.style, cursor: 'default' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 56, height: 50, margin: '0 auto 14px',
              background: `linear-gradient(135deg, var(--primary), var(--primary-dark))`,
              borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 900, color: '#fff',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 1,
            }}>RT</div>
            <h1 style={{ color: theme.text, fontFamily: "'Bebas Neue',sans-serif", fontSize: fh.h4, letterSpacing: 2, marginBottom: 4 }}>
              NEW REGISTRATION
            </h1>
            <p style={{ color: theme.textMuted, fontSize: fm.sm, fontFamily: "'Space Mono',monospace" }}>
              Create your loyalty account
            </p>
          </div>

          {/* ── PERSONAL INFO ── */}
          <SectionDivider title="Personal Information" {...shared} />

          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <SelectField
              label="Type" value={form.type} onChange={set('type')}
              options={TYPE_OPTIONS} style={{ flex: '0 0 140px' }} {...shared}
            />
            <Field
              label="Display Name" value={form.custDisplayName} required
              onChange={v => { set('custDisplayName')(v); clearErr('custDisplayName'); }}
              placeholder="e.g. John"
              error={errors.custDisplayName}
              fieldRef={refs.custDisplayName}
              {...shared}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <Field
              label="Full Name" value={form.custFullName} required
              onChange={v => { set('custFullName')(v); clearErr('custFullName'); }}
              placeholder="Full name"
              error={errors.custFullName}
              fieldRef={refs.custFullName}
              {...shared}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <Field label="Date of Birth" value={form.dob} onChange={set('dob')} type="date" {...shared} />
            <SelectField label="Civil Status" value={form.civilStatus} onChange={set('civilStatus')} options={CIVIL_OPTIONS} {...shared} />
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <Field
              label="NIC Number" value={form.nic} required
              onChange={v => { set('nic')(v); clearErr('nic'); }}
              placeholder="e.g. 200212345678"
              error={errors.nic}
              fieldRef={refs.nic}
              {...shared}
            />
            <Field
              label="Passport No" value={form.passport}
              onChange={v => { set('passport')(v); clearErr('nic'); clearErr('passport'); }}
              placeholder="e.g. N1234567"
              error={errors.passport}
              fieldRef={refs.passport}
              {...shared}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <Field label="Occupation" value={form.occupation} onChange={set('occupation')} placeholder="e.g. Engineer" {...shared} />
            <Field label="Email" value={form.email} onChange={set('email')} placeholder="email@example.com" type="email" {...shared} />
          </div>

          {/* ── CONTACT ── */}
          <SectionDivider title="Contact Details" {...shared} />

          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            {/* Mobile No — numbers only, max 10 */}
            <Field
              label="Mobile No" value={form.mobileNo} required
              onChange={v => handlePhoneChange(v, set('mobileNo'), () => clearErr('mobileNo'))}
              onKeyDown={phoneKeyDown}
              placeholder="07XXXXXXXX"
              error={errors.mobileNo}
              fieldRef={refs.mobileNo}
              maxLength={10}
              inputMode="numeric"
              {...shared}
            />
            {/* Home No — numbers only, max 10 */}
            <Field
              label="Home No" value={form.homeNo}
              onChange={v => handlePhoneChange(v, set('homeNo'), null)}
              onKeyDown={phoneKeyDown}
              placeholder="0XXXXXXXXX"
              maxLength={10}
              inputMode="numeric"
              {...shared}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            {/* Office No — numbers only, max 10 */}
            <Field
              label="Office No" value={form.officeNo}
              onChange={v => handlePhoneChange(v, set('officeNo'), null)}
              onKeyDown={phoneKeyDown}
              placeholder="0XXXXXXXXX"
              maxLength={10}
              inputMode="numeric"
              {...shared}
            />
          </div>

          {/* ── ADDRESS ── */}
          <SectionDivider title="Address" {...shared} />

          <div style={{ marginBottom: 14 }}>
            <TextArea label="Postal Address" value={form.postalAddress} onChange={set('postalAddress')} placeholder="No. XX, Street Name, Area" {...shared} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <TextArea label="Permanent Address" value={form.permanentAddress} onChange={set('permanentAddress')} placeholder="No. XX, Street Name, Area" {...shared} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <Field label="City" value={form.city} onChange={set('city')} placeholder="e.g. Colombo" {...shared} />
          </div>

          {/* Generic submit error */}
          {errors.submit && (
            <div style={{
              color: theme.errorText, fontSize: fm.base, marginBottom: 12,
              fontFamily: "'Space Mono',monospace",
              padding: '10px 14px',
              background: 'rgba(255,77,77,0.06)',
              border: '1px solid rgba(255,77,77,0.2)',
              borderRadius: 8,
            }}>
              ⚠ {errors.submit}
            </div>
          )}

          {/* ── SUBMIT ── */}
          <div style={{ marginTop: 28 }}>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: '100%', padding: '14px',
                background: !loading ? 'linear-gradient(135deg, var(--primary), var(--primary-dark))' : theme.bgAccent,
                border: 'none', borderRadius: 10,
                color: !loading ? '#fff' : theme.textFaint,
                fontFamily: "'Space Mono',monospace", fontSize: fm.base,
                letterSpacing: 2, textTransform: 'uppercase',
                cursor: !loading ? 'pointer' : 'not-allowed',
                boxShadow: !loading ? '0 8px 24px rgba(0,0,0,0.2)' : 'none',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {loading ? <><Spin /> Submitting...</> : 'Submit Registration →'}
            </button>

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${theme.border}`, textAlign: 'center' }}>
              <span style={{ color: theme.textMuted, fontSize: fm.base, fontFamily: "'Space Mono',monospace" }}>
                Already have an account?{' '}
              </span>
              <button
                onClick={() => onNavigate('login')}
                style={{
                  background: 'none', border: 'none',
                  color: 'var(--primary)', fontSize: fm.base,
                  cursor: 'pointer', fontFamily: "'Space Mono',monospace",
                  fontWeight: 700, letterSpacing: 1, padding: 0,
                }}
              >
                Login →
              </button>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}