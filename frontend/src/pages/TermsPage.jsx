import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import useResponsive from '../hooks/useResponsive';
import { fs, fh, fm } from '../utils/fontScale';

function getSlug() {
  const host  = window.location.hostname;
  const parts = host.split('.');
  if (host === 'localhost' || host === '127.0.0.1' || host.includes('vercel.app'))
    return new URLSearchParams(window.location.search).get('shop') || 'keells-nugegoda';
  return parts[0];
}

export default function TermsPage() {
  const { theme, mode } = useTheme();
  const { isMobile }    = useResponsive();
  const [company, setCompany] = useState(null);

  useEffect(() => {
    const API  = process.env.REACT_APP_API_URL || 'http://localhost:10000';
    const slug = getSlug();

    fetch(`${API}/api/portal/company`, {
      headers: { 'X-Shop-Slug': slug },
    })
      .then(r => r.json())
      .then(d => { if (d.success) setCompany(d.company); })
      .catch(() => {});
  }, []);

  const companyName = company?.name || 'RT Loyalty';
  const address     = company?.address || '';
  const phone       = company?.phone || '';

  const terms = [
    {
      icon: '🛒',
      title: 'Card Presentation',
      desc: `This card must be presented at the point of purchase to accumulate and redeem points.`,
    },
    {
      icon: '📋',
      title: 'Governing Terms',
      desc: `Use of this card is governed by the terms and conditions of the ${companyName} Loyalty Program, which may be changed from time to time without any notice to the card holder.`,
    },
    {
      icon: '🚫',
      title: 'Card Type',
      desc: `This is not a credit, debit or a charge card.`,
    },
    {
      icon: '📞',
      title: 'Contact Us',
      desc: `For any queries regarding your loyalty account, please contact us${phone ? ' at ' + phone : ''}${address ? '. Address: ' + address : ''}.`,
    },
  ];

  return (
    <div style={{ maxWidth:800, margin:'0 auto', padding: isMobile?'24px 16px 100px':'32px 32px 60px' }}>

      <div style={{ marginBottom:32 }}>
        <div style={{ color:theme.textMuted, fontSize:14, fontFamily:"'Space Mono',monospace", marginBottom:4 }}>Legal</div>
        <h1 style={{ color:theme.text, fontFamily:"'Bebas Neue',sans-serif", fontSize: isMobile?37:46, letterSpacing:2, lineHeight:1, marginBottom:8 }}>
          TERMS & CONDITIONS
        </h1>
        <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(255,107,0,0.08)', border:'1px solid rgba(255,107,0,0.2)', padding:'5px 14px', borderRadius:40 }}>
          <span>🏪</span>
          <span style={{ color:'#FF6B00', fontSize:13, fontFamily:"'Space Mono',monospace", letterSpacing:1 }}>{companyName}</span>
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {terms.map((t, i) => (
          <div key={i} style={{
            background: theme.bgCard,
            border: `1px solid ${theme.border}`,
            borderRadius: 14,
            padding: isMobile ? '16px' : '20px 24px',
            display: 'flex', gap: 16, alignItems: 'flex-start',
          }}>
            <div style={{ width:40, height:40, borderRadius:10, background:'rgba(255,107,0,0.08)', border:'1px solid rgba(255,107,0,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:21, flexShrink:0 }}>
              {t.icon}
            </div>
            <div>
              <div style={{ color:theme.text, fontWeight:700, fontSize:15, marginBottom:6, fontFamily:"'Space Mono',monospace", letterSpacing:0.5 }}>
                {String(i + 1).padStart(2,'0')}. {t.title}
              </div>
              <div style={{ color:theme.textMuted, fontSize:15, lineHeight:1.7 }}>
                {t.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop:28, padding:'16px 20px', background: mode==='dark'?'rgba(255,255,255,0.03)':'rgba(0,0,0,0.02)', border:`1px solid ${theme.border}`, borderRadius:12, textAlign:'center' }}>
        <div style={{ color:theme.textFaint, fontSize:13, fontFamily:"'Space Mono',monospace", lineHeight:1.8 }}>
          These terms and conditions are subject to change without notice.<br/>
        </div>
      </div>

    </div>
  );
}