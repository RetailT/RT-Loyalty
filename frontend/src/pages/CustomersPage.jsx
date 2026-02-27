import React, { useState } from 'react';
import CustomerCard from '../components/CustomerCard';
import CustomerDetail from '../components/CustomerDetail';
import { useTheme } from '../context/ThemeContext';
import { mockCustomers } from '../utils/mockData';

const tiers = ['All', 'Platinum', 'Gold', 'Silver', 'Bronze'];
const tierAccent = { All: '#FF6B00', Platinum: '#8b5cf6', Gold: '#f59e0b', Silver: '#64748b', Bronze: '#d97706' };

export default function CustomersPage() {
  const { theme } = useTheme();
  const [search, setSearch]             = useState('');
  const [selectedTier, setSelectedTier] = useState('All');
  const [selected, setSelected]         = useState(null);

  const filtered = mockCustomers.filter(c => {
    const matchSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.membershipId.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search);
    return matchSearch && (selectedTier === 'All' || c.membershipTier === selectedTier);
  });

  return (
    <div style={{ padding: 32, maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ color: '#FF6B00', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', fontFamily: "'Space Mono', monospace", marginBottom: 8 }}>◈ Directory</div>
        <h1 style={{ color: theme.text, fontSize: 36, fontWeight: 900, fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 2, margin: '0 0 4px 0' }}>CUSTOMER DATABASE</h1>
        <p style={{ color: theme.textMuted, margin: 0, fontSize: 13 }}>{mockCustomers.length} registered loyalty members</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: theme.textMuted, fontSize: 14 }}>⌕</span>
          <input
            type="text" placeholder="Search by name, email, ID or phone..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '11px 14px 11px 38px', background: theme.bgInput, border: `1px solid ${theme.inputBorder}`, borderRadius: 10, color: theme.text, fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.2s, background 0.3s' }}
            onFocus={e => (e.target.style.borderColor = '#FF6B00')}
            onBlur={e  => (e.target.style.borderColor = theme.inputBorder)}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {tiers.map(tier => {
            const ac = tierAccent[tier];
            const active = selectedTier === tier;
            return (
              <button key={tier} onClick={() => setSelectedTier(tier)} style={{
                padding: '8px 16px',
                background: active ? `${ac}14` : theme.bgSubtle,
                border: `1px solid ${active ? ac + '55' : theme.border}`,
                borderRadius: 8, color: active ? ac : theme.textMuted,
                fontSize: 11, fontFamily: "'Space Mono', monospace",
                letterSpacing: 1, cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase',
              }}>
                {tier !== 'All' ? '★ ' : ''}{tier}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ color: theme.textMuted, fontSize: 12, fontFamily: "'Space Mono', monospace", marginBottom: 16 }}>
        {filtered.length} customer{filtered.length !== 1 ? 's' : ''} found
      </div>

      {filtered.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filtered.map(c => <CustomerCard key={c.id} customer={c} onClick={() => setSelected(c)} />)}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '80px 20px', background: theme.bgCard, border: `1px dashed ${theme.border}`, borderRadius: 16 }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.2 }}>◈</div>
          <div style={{ color: theme.textMuted, fontSize: 16, marginBottom: 8 }}>No customers found</div>
          <div style={{ color: theme.textFaint, fontSize: 13 }}>Try adjusting your search or filters</div>
        </div>
      )}

      {selected && <CustomerDetail customer={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}