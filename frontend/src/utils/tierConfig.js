// src/utils/tierConfig.js
export const TIER_CONFIG = {
  Bronze:   { color:'#92400e', gradient:'linear-gradient(135deg,#92400e,#b45309)', nextPoints:5000,  next:'Silver',   icon:'🥉', min:0     },
  Silver:   { color:'#475569', gradient:'linear-gradient(135deg,#475569,#64748b)', nextPoints:10000, next:'Gold',     icon:'🥈', min:5000  },
  Gold:     { color:'#b45309', gradient:'linear-gradient(135deg,#b45309,#d97706)', nextPoints:25000, next:'Platinum', icon:'🥇', min:10000 },
  Platinum: { color:'#4338ca', gradient:'linear-gradient(135deg,#4338ca,#6366f1)', nextPoints:null,  next:null,       icon:'💎', min:25000 },
};

export const TIER_BENEFITS = {
  Bronze:   ['1 point per Rs. 100 spent','Birthday bonus: 2× points','Access to member-only offers','Monthly newsletter & deals'],
  Silver:   ['1.5× points per Rs. 100 spent','Birthday bonus: 3× points','Early access to sales','Priority customer support','Exclusive Silver member offers'],
  Gold:     ['2× points per Rs. 100 spent','Birthday bonus: 5× points','Free delivery on partner apps','Dedicated Gold helpline','Quarterly bonus points','Gold-only flash sales'],
  Platinum: ['3× points per Rs. 100 spent','Birthday bonus: 10× points','Personal shopping concierge','VIP event invitations','Annual bonus: 5,000 pts','Platinum gift hamper','Unlimited rewards redemption'],
};

export const TIER_ORDER = ['Bronze','Silver','Gold','Platinum'];