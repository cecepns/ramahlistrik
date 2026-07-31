const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'ramah_listrik_secret_key';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure upload directory exists inside backend folder
const uploadDir = path.join(__dirname, 'uploads-ramah-listrik');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage });

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ramah_listrik',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Helper for sending standard response format required by rules
const sendPaginatedResponse = (res, data, page, limit, total) => {
  const totalPages = Math.ceil(total / limit) || 1;
  return res.json({
    success: true,
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(total),
      totalPages
    }
  });
};

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Akses ditolak, token tidak ditemukan' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: 'Token tidak valid' });
    req.user = user;
    next();
  });
};

// Role Checking Middleware
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Hak akses tidak mencukupi' });
    }
    next();
  };
};

// --- AUTH ENDPOINTS ---

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Lengkapi semua field wajib' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role === 'technician' ? 'technician' : 'customer';
    const userStatus = userRole === 'technician' ? 'pending' : 'active';

    const [result] = await pool.query(
      'INSERT INTO users (name, email, phone, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, phone, hashedPassword, userRole, userStatus]
    );

    const userId = result.insertId;

    if (userRole === 'technician') {
      const { address, working_area, experience_years } = req.body;
      await pool.query(
        'INSERT INTO technician_profiles (user_id, address, working_area, experience_years) VALUES (?, ?, ?, ?)',
        [userId, address || '', working_area || '', experience_years || 0]
      );
    }

    res.json({
      success: true,
      message: userRole === 'technician' 
        ? 'Pendaftaran berhasil! Akun Anda sedang menunggu persetujuan Admin.' 
        : 'Pendaftaran berhasil, silakan login.'
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Gagal melakukan pendaftaran' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Masukkan email dan password' });
    }

    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ success: false, message: 'Email atau password salah' });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ success: false, message: 'Email atau password salah' });
    }

    if (user.status === 'pending') {
      return res.status(403).json({ success: false, message: 'Akun Anda masih dalam status PENDING menanti persetujuan Admin' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Akun Anda sedang dinonaktifkan/suspend' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    let profile = null;
    if (user.role === 'technician') {
      const [profiles] = await pool.query('SELECT * FROM technician_profiles WHERE user_id = ?', [user.id]);
      if (profiles.length > 0) profile = profiles[0];
    }

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status,
          profile
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
});

// GET /api/auth/profile
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, name, email, phone, role, status, created_at FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });

    const user = users[0];
    let profile = null;
    if (user.role === 'technician') {
      const [profiles] = await pool.query('SELECT * FROM technician_profiles WHERE user_id = ?', [user.id]);
      if (profiles.length > 0) profile = profiles[0];
    }

    res.json({
      success: true,
      data: { ...user, profile }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mengambil profil' });
  }
});

// --- SERVICES ENDPOINTS ---

// GET /api/services
app.get('/api/services', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM services WHERE 1=1';
    let params = [];

    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (req.query.active_only === 'true') {
      query += ' AND is_active = 1';
    }

    const [countResult] = await pool.query(query.replace('SELECT *', 'SELECT COUNT(*) as total'), params);
    const total = countResult[0].total;

    query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [services] = await pool.query(query, params);

    sendPaginatedResponse(res, services, page, limit, total);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal mengambil daftar layanan' });
  }
});

// POST /api/services (Admin Only)
app.post('/api/services', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { name, description, price, icon, estimated_time } = req.body;
    if (!name || !price) return res.status(400).json({ success: false, message: 'Nama dan harga wajib diisi' });

    const [result] = await pool.query(
      'INSERT INTO services (name, description, price, icon, estimated_time) VALUES (?, ?, ?, ?, ?)',
      [name, description || '', price, icon || 'Wrench', estimated_time || '1-2 jam']
    );

    res.json({ success: true, message: 'Layanan berhasil ditambahkan', id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal menambah layanan' });
  }
});

// PUT /api/services/:id (Admin Only)
app.put('/api/services/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { name, description, price, icon, estimated_time, is_active } = req.body;
    await pool.query(
      'UPDATE services SET name=?, description=?, price=?, icon=?, estimated_time=?, is_active=? WHERE id=?',
      [name, description, price, icon, estimated_time, is_active ? 1 : 0, req.params.id]
    );
    res.json({ success: true, message: 'Layanan berhasil diperbarui' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mengupdate layanan' });
  }
});

// DELETE /api/services/:id (Admin Only)
app.delete('/api/services/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM services WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Layanan berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal menghapus layanan' });
  }
});

// --- TECHNICIANS & USERS ENDPOINTS ---

// GET /api/technicians (Available Technicians with GPS location search & distance sorting)
app.get('/api/technicians', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const userLat = parseFloat(req.query.lat);
    const userLng = parseFloat(req.query.lng);
    const offset = (page - 1) * limit;

    let distanceSelect = '';
    let distanceOrderBy = '';

    if (!isNaN(userLat) && !isNaN(userLng)) {
      // Haversine formula distance in kilometers
      distanceSelect = `, (
        6371 * acos(
          cos(radians(${userLat})) * cos(radians(tp.latitude)) *
          cos(radians(tp.longitude) - radians(${userLng})) +
          sin(radians(${userLat})) * sin(radians(tp.latitude))
        )
      ) AS distance_km`;
      distanceOrderBy = 'distance_km ASC,';
    }

    let query = `
      SELECT u.id, u.name, u.email, u.phone, u.status,
             tp.address, tp.working_area, tp.experience_years, tp.photo, tp.balance, tp.is_online, tp.rating_avg, tp.rating_count,
             tp.latitude, tp.longitude ${distanceSelect}
      FROM users u
      JOIN technician_profiles tp ON u.id = tp.user_id
      WHERE u.role = 'technician'
    `;
    let params = [];

    if (search) {
      query += ' AND (u.name LIKE ? OR tp.working_area LIKE ? OR tp.address LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (req.query.available_only === 'true') {
      query += ' AND u.status = "active" AND tp.is_online = 1 AND tp.balance > 0';
    }

    if (req.query.status) {
      query += ' AND u.status = ?';
      params.push(req.query.status);
    }

    const [countResult] = await pool.query(query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM'), params);
    const total = countResult[0].total;

    query += ` ORDER BY ${distanceOrderBy} u.id DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [technicians] = await pool.query(query, params);

    sendPaginatedResponse(res, technicians, page, limit, total);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data teknisi' });
  }
});

// GET /api/users (Admin Management)
app.get('/api/users', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const role = req.query.role || '';
    const offset = (page - 1) * limit;

    let query = 'SELECT id, name, email, phone, role, status, created_at FROM users WHERE 1=1';
    let params = [];

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    const [countResult] = await pool.query(query.replace('SELECT id, name, email, phone, role, status, created_at', 'SELECT COUNT(*) as total'), params);
    const total = countResult[0].total;

    query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [users] = await pool.query(query, params);

    sendPaginatedResponse(res, users, page, limit, total);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mengambil pengguna' });
  }
});

// PUT /api/users/:id (Admin Edit User & Reset Password)
app.put('/api/users/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, phone, role, password } = req.body;
    const userId = req.params.id;

    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        'UPDATE users SET name=?, email=?, phone=?, role=?, password=? WHERE id=?',
        [name, email, phone, role, hashedPassword, userId]
      );
    } else {
      await pool.query(
        'UPDATE users SET name=?, email=?, phone=?, role=? WHERE id=?',
        [name, email, phone, role, userId]
      );
    }

    res.json({ success: true, message: 'Data pengguna berhasil diperbarui' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal mengupdate data pengguna' });
  }
});

// DELETE /api/users/:id (Admin Delete User)
app.delete('/api/users/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Pengguna berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal menghapus pengguna' });
  }
});

// PUT /api/users/:id/status (Admin Suspend/Approve/Reject)
app.put('/api/users/:id/status', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { status } = req.body; // 'active', 'suspended', 'rejected'
    await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true, message: `Status pengguna berhasil diperbarui ke ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui status user' });
  }
});

// --- DEPOSIT & BALANCES ---

// PUT /api/technician/profile (Technician Update Name, Address, Working Area & GPS Location)
app.put('/api/technician/profile', authenticateToken, requireRole('technician'), async (req, res) => {
  try {
    const { name, phone, address, working_area, latitude, longitude } = req.body;
    const userId = req.user.id;

    await pool.query('UPDATE users SET name = ?, phone = ? WHERE id = ?', [name, phone, userId]);

    const [existing] = await pool.query('SELECT id FROM technician_profiles WHERE user_id = ?', [userId]);
    if (existing.length > 0) {
      await pool.query(
        'UPDATE technician_profiles SET address = ?, working_area = ?, latitude = ?, longitude = ? WHERE user_id = ?',
        [address || '', working_area || '', latitude || null, longitude || null, userId]
      );
    } else {
      await pool.query(
        'INSERT INTO technician_profiles (user_id, address, working_area, latitude, longitude) VALUES (?, ?, ?, ?, ?)',
        [userId, address || '', working_area || '', latitude || null, longitude || null]
      );
    }

    res.json({ success: true, message: 'Profil & lokasi berhasil diperbarui!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui profil' });
  }
});

// POST /api/technician/topup (Technician Submit Deposit Request with Proof Image)
app.post('/api/technician/topup', authenticateToken, requireRole('technician'), upload.single('proof_image'), async (req, res) => {
  try {
    const { amount, notes } = req.body;
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return res.status(400).json({ success: false, message: 'Nominal tidak valid' });

    const proofImage = req.file ? `/uploads/${req.file.filename}` : '';

    await pool.query(
      'INSERT INTO deposits (technician_id, amount, type, status, proof_image, notes) VALUES (?, ?, "topup", "pending", ?, ?)',
      [req.user.id, numAmount, proofImage, notes || 'Pengajuan Top Up oleh Teknisi']
    );

    res.json({ success: true, message: 'Pengajuan top up deposit berhasil dikirim! Menunggu verifikasi admin.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal mengajukan topup deposit' });
  }
});

// PUT /api/deposits/:id/status (Admin Approve or Reject Technician Topup Request)
app.put('/api/deposits/:id/status', authenticateToken, requireRole('admin'), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { status } = req.body; // 'approved', 'rejected'
    const depositId = req.params.id;

    const [deposits] = await connection.query('SELECT * FROM deposits WHERE id = ? FOR UPDATE', [depositId]);
    if (deposits.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Data deposit tidak ditemukan' });
    }

    const deposit = deposits[0];
    if (deposit.status !== 'pending') {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Deposit ini sudah diproses sebelumnya' });
    }

    if (status === 'approved') {
      const [tech] = await connection.query('SELECT balance FROM technician_profiles WHERE user_id = ? FOR UPDATE', [deposit.technician_id]);
      if (tech.length > 0) {
        const newBalance = parseFloat(tech[0].balance) + parseFloat(deposit.amount);
        await connection.query('UPDATE technician_profiles SET balance = ? WHERE user_id = ?', [newBalance, deposit.technician_id]);
      }
    }

    await connection.query(
      'UPDATE deposits SET status = ?, admin_id = ? WHERE id = ?',
      [status, req.user.id, depositId]
    );

    await connection.commit();
    res.json({ success: true, message: `Topup deposit berhasil ${status === 'approved' ? 'DISETUJUI' : 'DITOLAK'}` });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal memproses persetujuan deposit' });
  } finally {
    connection.release();
  }
});

// POST /api/deposits (Admin Topup/Deduct Deposit Teknisi)
app.post('/api/deposits', authenticateToken, requireRole('admin'), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { technician_id, amount, type, notes } = req.body; // type: 'topup', 'deduct_fee', 'manual_adjust'
    const numAmount = parseFloat(amount);
    if (!technician_id || isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Nominal atau teknisi tidak valid' });
    }

    const [tech] = await connection.query('SELECT balance FROM technician_profiles WHERE user_id = ? FOR UPDATE', [technician_id]);
    if (tech.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Profil teknisi tidak ditemukan' });
    }

    let newBalance = parseFloat(tech[0].balance);
    if (type === 'topup') {
      newBalance += numAmount;
    } else {
      newBalance -= numAmount;
    }

    await connection.query('UPDATE technician_profiles SET balance = ? WHERE user_id = ?', [newBalance, technician_id]);
    await connection.query(
      'INSERT INTO deposits (technician_id, admin_id, amount, type, notes) VALUES (?, ?, ?, ?, ?)',
      [technician_id, req.user.id, numAmount, type, notes || 'Penyesuaian oleh Admin']
    );

    await connection.commit();
    res.json({ success: true, message: 'Transaksi deposit berhasil disimpan', newBalance });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal memproses deposit' });
  } finally {
    connection.release();
  }
});

// GET /api/deposits/history (Admin or Technician)
app.get('/api/deposits/history', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let query = `
      SELECT d.*, u.name as technician_name, a.name as admin_name 
      FROM deposits d
      JOIN users u ON d.technician_id = u.id
      LEFT JOIN users a ON d.admin_id = a.id
      WHERE 1=1
    `;
    let params = [];

    if (req.user.role === 'technician') {
      query += ' AND d.technician_id = ?';
      params.push(req.user.id);
    } else if (req.query.technician_id) {
      query += ' AND d.technician_id = ?';
      params.push(req.query.technician_id);
    }

    const [countResult] = await pool.query(query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM'), params);
    const total = countResult[0].total;

    query += ' ORDER BY d.id DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [deposits] = await pool.query(query, params);
    sendPaginatedResponse(res, deposits, page, limit, total);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mengambil histori deposit' });
  }
});

// --- ORDERS ENDPOINTS ---

// POST /api/orders (Customer Create Order)
app.post('/api/orders', authenticateToken, requireRole('customer'), async (req, res) => {
  try {
    const { technician_id, service_id, address, notes, scheduled_at } = req.body;
    if (!technician_id || !service_id || !address || !scheduled_at) {
      return res.status(400).json({ success: false, message: 'Mohon lengkapi detail pesanan' });
    }

    // Check Service
    const [services] = await pool.query('SELECT price FROM services WHERE id = ? AND is_active = 1', [service_id]);
    if (services.length === 0) return res.status(400).json({ success: false, message: 'Layanan tidak ditemukan atau tidak aktif' });
    const servicePrice = services[0].price;

    // Check Technician Status & Balance
    const [techs] = await pool.query(
      'SELECT tp.balance, u.status FROM technician_profiles tp JOIN users u ON u.id = tp.user_id WHERE tp.user_id = ?',
      [technician_id]
    );
    if (techs.length === 0 || techs[0].status !== 'active') {
      return res.status(400).json({ success: false, message: 'Teknisi tidak tersedia' });
    }
    if (parseFloat(techs[0].balance) <= 0) {
      return res.status(400).json({ success: false, message: 'Teknisi yang dipilih tidak memiliki cukup saldo untuk menerima order' });
    }

    // Get Admin Fee Percent
    const [settings] = await pool.query('SELECT fee_percentage FROM site_settings WHERE id = 1');
    const feePercent = settings.length > 0 ? parseFloat(settings[0].fee_percentage) : 10.0;
    const feeAmount = (servicePrice * feePercent) / 100;

    const orderCode = 'RL-' + Date.now().toString().slice(-6) + Math.floor(100 + Math.random() * 900);

    const [result] = await pool.query(
      `INSERT INTO orders (order_code, customer_id, technician_id, service_id, service_price, admin_fee_percent, admin_fee_amount, address, notes, scheduled_at, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [orderCode, req.user.id, technician_id, service_id, servicePrice, feePercent, feeAmount, address, notes || '', scheduled_at]
    );

    res.json({ success: true, message: 'Order berhasil dibuat!', order_code: orderCode, id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal membuat pesanan' });
  }
});

// GET /api/orders (List with filter & pagination)
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || '';
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    let query = `
      SELECT o.*, 
             s.name as service_name, s.icon as service_icon,
             c.name as customer_name, c.phone as customer_phone,
             t.name as technician_name, t.phone as technician_phone
      FROM orders o
      JOIN services s ON o.service_id = s.id
      JOIN users c ON o.customer_id = c.id
      JOIN users t ON o.technician_id = t.id
      WHERE 1=1
    `;
    let params = [];

    if (req.user.role === 'customer') {
      query += ' AND o.customer_id = ?';
      params.push(req.user.id);
    } else if (req.user.role === 'technician') {
      query += ' AND o.technician_id = ?';
      params.push(req.user.id);
    }

    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (o.order_code LIKE ? OR c.name LIKE ? OR t.name LIKE ? OR s.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [countResult] = await pool.query(query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM'), params);
    const total = countResult[0].total;

    query += ' ORDER BY o.id DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [orders] = await pool.query(query, params);

    sendPaginatedResponse(res, orders, page, limit, total);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal mengambil daftar order' });
  }
});

// PUT /api/orders/:id/status (State Machine + Atomic Balance Deduction)
app.put('/api/orders/:id/status', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { status } = req.body; // 'accepted', 'heading_to_location', 'in_progress', 'completed', 'rejected', 'cancelled'
    const orderId = req.params.id;

    const [orders] = await connection.query('SELECT * FROM orders WHERE id = ? FOR UPDATE', [orderId]);
    if (orders.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });
    }

    const order = orders[0];

    // Access authorization check
    if (req.user.role === 'technician' && order.technician_id !== req.user.id) {
      await connection.rollback();
      return res.status(403).json({ success: false, message: 'Bukan order Anda' });
    }
    if (req.user.role === 'customer' && order.customer_id !== req.user.id && status !== 'cancelled') {
      await connection.rollback();
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }

    // Special logic when Technician completes order (Deduct 10% deposit)
    if (status === 'completed' && order.status !== 'completed') {
      const [tech] = await connection.query('SELECT balance FROM technician_profiles WHERE user_id = ? FOR UPDATE', [order.technician_id]);
      if (tech.length === 0) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: 'Profil teknisi tidak ditemukan' });
      }

      const currentBalance = parseFloat(tech[0].balance);
      const feeAmount = parseFloat(order.admin_fee_amount);

      if (currentBalance < feeAmount) {
        await connection.rollback();
        return res.status(400).json({ 
          success: false, 
          message: `Saldo deposit Anda (Rp${currentBalance.toLocaleString()}) tidak mencukupi untuk menyelesaikan order ini (Potongan Fee 10%: Rp${feeAmount.toLocaleString()}). Silakan deposit terlebih dahulu.` 
        });
      }

      const newBalance = currentBalance - feeAmount;
      await connection.query('UPDATE technician_profiles SET balance = ? WHERE user_id = ?', [newBalance, order.technician_id]);
      
      // Log deposit deduction
      await connection.query(
        'INSERT INTO deposits (technician_id, amount, type, notes) VALUES (?, ?, "deduct_fee", ?)',
        [order.technician_id, feeAmount, `Potongan Fee Admin (10%) untuk Order #${order.order_code}`]
      );

      // Update completed timestamp
      await connection.query('UPDATE orders SET status = ?, completed_at = NOW() WHERE id = ?', [status, orderId]);
    } else {
      await connection.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
    }

    await connection.commit();
    res.json({ success: true, message: `Status order berhasil diperbarui ke ${status}` });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui status order' });
  } finally {
    connection.release();
  }
});

// --- RATING & REVIEWS ---

// POST /api/ratings
app.post('/api/ratings', authenticateToken, requireRole('customer'), async (req, res) => {
  try {
    const { order_id, rating, comment } = req.body;
    if (!order_id || !rating) return res.status(400).json({ success: false, message: 'Order ID dan rating bintang wajib diisi' });

    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ? AND customer_id = ? AND status = "completed"', [order_id, req.user.id]);
    if (orders.length === 0) return res.status(400).json({ success: false, message: 'Order belum selesai atau tidak valid' });

    const order = orders[0];

    const [existing] = await pool.query('SELECT id FROM ratings WHERE order_id = ?', [order_id]);
    if (existing.length > 0) return res.status(400).json({ success: false, message: 'Anda sudah memberi rating untuk order ini' });

    await pool.query(
      'INSERT INTO ratings (order_id, customer_id, technician_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [order_id, req.user.id, order.technician_id, rating, comment || '']
    );

    // Update Average Rating Technician
    const [avgResult] = await pool.query(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM ratings WHERE technician_id = ?',
      [order.technician_id]
    );

    const newAvg = avgResult[0].avg_rating || 0;
    const newCount = avgResult[0].count || 0;

    await pool.query(
      'UPDATE technician_profiles SET rating_avg = ?, rating_count = ? WHERE user_id = ?',
      [newAvg, newCount, order.technician_id]
    );

    res.json({ success: true, message: 'Terima kasih atas ulasan dan rating Anda!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal menambahkan ulasan' });
  }
});

// --- ADMIN DASHBOARD & SETTINGS ---

// GET /api/admin/dashboard-stats
app.get('/api/admin/dashboard-stats', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const [[custCount]] = await pool.query('SELECT COUNT(*) as total FROM users WHERE role = "customer"');
    const [[techActive]] = await pool.query('SELECT COUNT(*) as total FROM users WHERE role = "technician" AND status = "active"');
    const [[techPending]] = await pool.query('SELECT COUNT(*) as total FROM users WHERE role = "technician" AND status = "pending"');
    const [[totalOrder]] = await pool.query('SELECT COUNT(*) as total FROM orders');
    const [[completedOrder]] = await pool.query('SELECT COUNT(*) as total FROM orders WHERE status = "completed"');
    const [[feeResult]] = await pool.query('SELECT SUM(admin_fee_amount) as total FROM orders WHERE status = "completed"');
    const [[depositResult]] = await pool.query('SELECT SUM(balance) as total FROM technician_profiles');

    res.json({
      success: true,
      data: {
        total_customers: custCount.total,
        active_technicians: techActive.total,
        pending_technicians: techPending.total,
        total_orders: totalOrder.total,
        completed_orders: completedOrder.total,
        total_fee_income: feeResult.total || 0,
        total_technician_deposit: depositResult.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mengambil statistik dashboard' });
  }
});

// GET & PUT /api/settings
app.get('/api/settings', async (req, res) => {
  try {
    const [settings] = await pool.query('SELECT * FROM site_settings WHERE id = 1');
    res.json({ success: true, data: settings[0] || {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mengambil pengaturan site' });
  }
});

app.put('/api/settings', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { app_name, whatsapp_number, email, bank_account, fee_percentage, operational_hours } = req.body;
    await pool.query(
      `UPDATE site_settings 
       SET app_name=?, whatsapp_number=?, email=?, bank_account=?, fee_percentage=?, operational_hours=? 
       WHERE id=1`,
      [app_name, whatsapp_number, email, bank_account, fee_percentage, operational_hours]
    );
    res.json({ success: true, message: 'Pengaturan web berhasil diperbarui' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mengupdate pengaturan' });
  }
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`Server Ramah Listrik running on http://localhost:${PORT}`);
});
