const fs   = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'userdb.js');

// ---------- seed data ----------
const seed = {
  users: [
    {
      id: 'u001',
      name: 'Admin User',
      email: 'admin@retailco.lk',
      // bcrypt of "admin1234"
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'admin',
      createdAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'u002',
      name: 'Staff User',
      email: 'staff@retailco.lk',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      role: 'staff',
      createdAt: '2024-01-01T00:00:00.000Z',
    },
  ],
  customers: [
    {
      id: 'c001',
      name: 'Nuwan Perera',
      email: 'nuwan.perera@gmail.com',
      phone: '+94 77 123 4567',
      membershipId: 'LYL-2024-001',
      membershipTier: 'Gold',
      totalPoints: 15420,
      availablePoints: 8750,
      redeemedPoints: 6670,
      joinDate: '2022-03-15',
      lastActivity: '2024-01-20',
      qrCode: 'c001',
      status: 'active',
    },
    {
      id: 'c002',
      name: 'Dilani Fernando',
      email: 'dilani.f@yahoo.com',
      phone: '+94 71 987 6543',
      membershipId: 'LYL-2023-089',
      membershipTier: 'Platinum',
      totalPoints: 45200,
      availablePoints: 22100,
      redeemedPoints: 23100,
      joinDate: '2021-07-10',
      lastActivity: '2024-01-22',
      qrCode: 'c002',
      status: 'active',
    },
    {
      id: 'c003',
      name: 'Kasun Silva',
      email: 'kasun.silva@hotmail.com',
      phone: '+94 76 555 1234',
      membershipId: 'LYL-2024-156',
      membershipTier: 'Silver',
      totalPoints: 4200,
      availablePoints: 4200,
      redeemedPoints: 0,
      joinDate: '2024-01-01',
      lastActivity: '2024-01-19',
      qrCode: 'c003',
      status: 'active',
    },
    {
      id: 'c004',
      name: 'Amali Wickramasinghe',
      email: 'amali.w@gmail.com',
      phone: '+94 78 333 9876',
      membershipId: 'LYL-2022-042',
      membershipTier: 'Bronze',
      totalPoints: 1850,
      availablePoints: 1350,
      redeemedPoints: 500,
      joinDate: '2022-11-20',
      lastActivity: '2024-01-16',
      qrCode: 'c004',
      status: 'active',
    },
    {
      id: 'c005',
      name: 'Chamara Bandara',
      email: 'chamara.b@gmail.com',
      phone: '+94 70 444 5678',
      membershipId: 'LYL-2023-201',
      membershipTier: 'Gold',
      totalPoints: 12800,
      availablePoints: 9300,
      redeemedPoints: 3500,
      joinDate: '2023-02-14',
      lastActivity: '2024-01-21',
      qrCode: 'c005',
      status: 'active',
    },
  ],
  transactions: [
    { id: 't001', customerId: 'c001', date: '2024-01-20', description: 'Purchase at Colombo 7 Branch', points: 250,   type: 'earned',   store: 'Colombo 7',     amount: 5000  },
    { id: 't002', customerId: 'c001', date: '2024-01-15', description: 'Redeemed for Discount',        points: -500,  type: 'redeemed', store: 'Nugegoda',      amount: 0     },
    { id: 't003', customerId: 'c001', date: '2024-01-10', description: 'Birthday Bonus Points',        points: 1000,  type: 'bonus',    store: 'System',        amount: 0     },
    { id: 't004', customerId: 'c001', date: '2024-01-05', description: 'Purchase at Nugegoda Branch',  points: 180,   type: 'earned',   store: 'Nugegoda',      amount: 3600  },
    { id: 't005', customerId: 'c001', date: '2023-12-28', description: 'Christmas Special Purchase',   points: 420,   type: 'earned',   store: 'Kandy',         amount: 8400  },
    { id: 't006', customerId: 'c002', date: '2024-01-22', description: 'Purchase at One Galle Face',   points: 850,   type: 'earned',   store: 'One Galle Face',amount: 17000 },
    { id: 't007', customerId: 'c002', date: '2024-01-18', description: 'Redeemed for Free Item',       points: -1500, type: 'redeemed', store: 'One Galle Face',amount: 0     },
    { id: 't008', customerId: 'c002', date: '2024-01-12', description: 'Double Points Weekend',        points: 600,   type: 'bonus',    store: 'System',        amount: 0     },
    { id: 't009', customerId: 'c003', date: '2024-01-19', description: 'Purchase at Maharagama',       points: 200,   type: 'earned',   store: 'Maharagama',    amount: 4000  },
    { id: 't010', customerId: 'c003', date: '2024-01-10', description: 'Welcome Bonus',                points: 500,   type: 'bonus',    store: 'System',        amount: 0     },
    { id: 't011', customerId: 'c004', date: '2024-01-16', description: 'Purchase at Gampaha',          points: 120,   type: 'earned',   store: 'Gampaha',       amount: 2400  },
    { id: 't012', customerId: 'c004', date: '2023-12-20', description: 'Redeemed for Cashback',        points: -500,  type: 'redeemed', store: 'Gampaha',       amount: 0     },
    { id: 't013', customerId: 'c005', date: '2024-01-21', description: 'Purchase at Kandy City Centre',points: 340,   type: 'earned',   store: 'Kandy',         amount: 6800  },
    { id: 't014', customerId: 'c005', date: '2024-01-08', description: 'New Year Bonus',               points: 750,   type: 'bonus',    store: 'System',        amount: 0     },
  ],
};

// ---------- helpers ----------
function readDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      // strip "module.exports = " wrapper if present
      const json = raw.replace(/^module\.exports\s*=\s*/, '').replace(/;?\s*$/, '');
      return JSON.parse(json);
    }
  } catch (e) {
    console.error('DB read error, using seed:', e.message);
  }
  return JSON.parse(JSON.stringify(seed)); // deep copy
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, 'module.exports = ' + JSON.stringify(data, null, 2) + ';', 'utf8');
  } catch (e) {
    console.error('DB write error:', e.message);
  }
}

// Initialise file if missing
if (!fs.existsSync(DB_FILE)) {
  writeDB(seed);
}

module.exports = { readDB, writeDB };