export const MOCK_USER = {
  name:                 'Kavinda Perera',
  mobile_number:        '0712345678',
  email:                'kavinda@gmail.com',
  date_of_birth:        '1992-05-15',
  join_date:            '2023-01-10',
  current_points:       3450,
  lifetime_points:      12800,
  tier_level:           'Silver',
  tier_expiry:          '2025-12-31',
  status:               'active',
  last_transaction_date:'2024-12-18',
};

export const TIER_CONFIG = {
  Bronze:   { color: '#92400e', bg: '#fef3c7', border: '#fde68a', gradient: 'linear-gradient(135deg,#92400e,#b45309)', nextPoints: 5000,  next: 'Silver',   icon: '🥉', min: 0     },
  Silver:   { color: '#475569', bg: '#f1f5f9', border: '#cbd5e1', gradient: 'linear-gradient(135deg,#475569,#64748b)', nextPoints: 10000, next: 'Gold',     icon: '🥈', min: 5000  },
  Gold:     { color: '#b45309', bg: '#fef9c3', border: '#fde047', gradient: 'linear-gradient(135deg,#b45309,#d97706)', nextPoints: 25000, next: 'Platinum', icon: '🥇', min: 10000 },
  Platinum: { color: '#4338ca', bg: '#ede9fe', border: '#c4b5fd', gradient: 'linear-gradient(135deg,#4338ca,#6366f1)', nextPoints: null,  next: null,       icon: '💎', min: 25000 },
};

export const MOCK_TRANSACTIONS = [
  { id:1,  date:'2024-12-18', shop:'Keells Super – Nugegoda',           amount:4500, points:45,    type:'earn'   },
  { id:2,  date:'2024-12-15', shop:'Cargills Food City – Maharagama',   amount:2300, points:23,    type:'earn'   },
  { id:3,  date:'2024-12-10', shop:'Keells Super – Borella',            amount:8900, points:89,    type:'earn'   },
  { id:4,  date:'2024-12-05', shop:'Rewards Redemption',                amount:0,    points:-500,  type:'redeem' },
  { id:5,  date:'2024-11-28', shop:'Cargills Food City – Kottawa',      amount:6700, points:67,    type:'earn'   },
  { id:6,  date:'2024-11-20', shop:'Keells Super – Wattala',            amount:3200, points:32,    type:'earn'   },
  { id:7,  date:'2024-11-12', shop:'Cargills Food City – Colombo 3',    amount:5400, points:54,    type:'earn'   },
  { id:8,  date:'2024-11-05', shop:'Rewards Redemption',                amount:0,    points:-1000, type:'redeem' },
  { id:9,  date:'2024-10-29', shop:'Keells Super – Nugegoda',           amount:7800, points:78,    type:'earn'   },
  { id:10, date:'2024-10-15', shop:'Birthday Bonus',                    amount:0,    points:200,   type:'bonus'  },
];

export const MOCK_REWARDS = [
  { id:1, title:'Rs. 250 Voucher',     points:2500, category:'Voucher',  icon:'🎟️' },
  { id:2, title:'Rs. 500 Voucher',     points:5000, category:'Voucher',  icon:'🎫' },
  { id:3, title:'Free Ice Cream',      points:800,  category:'Food',     icon:'🍦' },
  { id:4, title:'10% Off Next Bill',   points:1500, category:'Discount', icon:'💰' },
  { id:5, title:'Free Coffee',         points:600,  category:'Food',     icon:'☕' },
  { id:6, title:'Rs. 1,000 Voucher',   points:9000, category:'Voucher',  icon:'🏆' },
];
