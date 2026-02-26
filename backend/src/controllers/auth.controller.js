'use strict';

const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const UserModel = require('../models/user.model');
const { pool }  = require('../config/db');
const { send, fail } = require('../utils/response.util');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function generateToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set in environment variables.');
  }
  // Include business_id so middleware can use it without extra DB call
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, business_id: user.business_id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
}

/** POST /api/auth/signup — public */
async function signup(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return fail(res, 'Name, email, and password are required.', 400);
    }
    if (!EMAIL_RE.test(email)) {
      return fail(res, 'Invalid email format.', 400);
    }
    if (password.length < 8) {
      return fail(res, 'Password must be at least 8 characters.', 400);
    }

    await conn.beginTransaction();

    // Check email uniqueness inside transaction
    const [existing] = await conn.query(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email.toLowerCase().trim()]
    );
    if (existing.length > 0) {
      await conn.rollback();
      return fail(res, 'An account with this email already exists.', 409);
    }

    // Create business row (package='none' until admin activates)
    const [bizResult] = await conn.query(
      'INSERT INTO businesses (name, package) VALUES (?, ?)',
      [name.trim(), 'none']
    );
    const businessId = bizResult.insertId;

    // Hash password + create user (role='manager', status='pending')
    const hashed = await bcrypt.hash(password, 10);
    const [userResult] = await conn.query(
      'INSERT INTO users (email, password, role, status, business_id) VALUES (?, ?, ?, ?, ?)',
      [email.toLowerCase().trim(), hashed, 'manager', 'pending', businessId]
    );

    await conn.commit();

    return send(res, {
      user: {
        id:          userResult.insertId,
        email:       email.toLowerCase().trim(),
        role:        'manager',
        status:      'pending',
        business_id: businessId,
      },
    }, 'Account created. Please contact support to activate your package.', 201);

  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

/** POST /api/auth/login */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return fail(res, 'Email and password are required.', 400);
    }

    const user = await UserModel.findByEmail(email.toLowerCase().trim());
    if (!user) {
      return fail(res, 'Invalid email or password.', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return fail(res, 'Invalid email or password.', 401);
    }

    // Block suspended accounts entirely
    if (user.status === 'blocked') {
      return fail(res, 'Your account has been suspended. Please contact support.', 403);
    }

    const token = generateToken(user);
    const { password: _pw, ...safeUser } = user;

    return send(res, { token, user: safeUser }, 'Login successful');
  } catch (err) {
    next(err);
  }
}

/** GET /api/auth/me — requires authenticate middleware */
async function me(req, res, next) {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) return fail(res, 'User not found.', 404);
    return send(res, { user }, 'OK');
  } catch (err) {
    next(err);
  }
}

/** POST /api/auth/logout — stateless JWT: just confirm on server */
function logout(req, res) {
  return send(res, null, 'Logged out successfully.');
}

/** PUT /api/auth/password — change own password */
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return fail(res, 'Both current and new password are required.', 400);
    if (newPassword.length < 8)
      return fail(res, 'New password must be at least 8 characters.', 400);

    const [[user]] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return fail(res, 'Current password is incorrect.', 400);

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);

    return send(res, {}, 'Password changed successfully.');
  } catch (err) { next(err); }
}

module.exports = { signup, login, me, logout, changePassword };
