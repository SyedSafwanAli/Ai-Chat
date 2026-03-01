'use strict';

const { pool }       = require('../config/db');
const { send, fail } = require('../utils/response.util');

// GET /api/quick-replies
async function listQuickReplies(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT id, title, body, created_at, updated_at FROM quick_replies WHERE business_id = ? ORDER BY created_at DESC',
      [req.user.business_id]
    );
    return send(res, { replies: rows });
  } catch (err) {
    next(err);
  }
}

// POST /api/quick-replies
async function createQuickReply(req, res, next) {
  try {
    const { title, body } = req.body;
    if (!title || !title.trim()) return fail(res, 'Title is required.', 400);
    if (!body  || !body.trim())  return fail(res, 'Body is required.', 400);

    const [result] = await pool.query(
      'INSERT INTO quick_replies (business_id, title, body) VALUES (?, ?, ?)',
      [req.user.business_id, title.trim(), body.trim()]
    );
    const [[created]] = await pool.query(
      'SELECT id, title, body, created_at, updated_at FROM quick_replies WHERE id = ?',
      [result.insertId]
    );
    return send(res, { reply: created }, 'Quick reply created.');
  } catch (err) {
    next(err);
  }
}

// PUT /api/quick-replies/:id
async function updateQuickReply(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const { title, body } = req.body;
    if (!title || !title.trim()) return fail(res, 'Title is required.', 400);
    if (!body  || !body.trim())  return fail(res, 'Body is required.', 400);

    const [result] = await pool.query(
      'UPDATE quick_replies SET title = ?, body = ? WHERE id = ? AND business_id = ?',
      [title.trim(), body.trim(), id, req.user.business_id]
    );
    if (result.affectedRows === 0) return fail(res, 'Quick reply not found.', 404);

    const [[updated]] = await pool.query(
      'SELECT id, title, body, created_at, updated_at FROM quick_replies WHERE id = ?',
      [id]
    );
    return send(res, { reply: updated }, 'Quick reply updated.');
  } catch (err) {
    next(err);
  }
}

// DELETE /api/quick-replies/:id
async function deleteQuickReply(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const [result] = await pool.query(
      'DELETE FROM quick_replies WHERE id = ? AND business_id = ?',
      [id, req.user.business_id]
    );
    if (result.affectedRows === 0) return fail(res, 'Quick reply not found.', 404);
    return send(res, null, 'Quick reply deleted.');
  } catch (err) {
    next(err);
  }
}

module.exports = { listQuickReplies, createQuickReply, updateQuickReply, deleteQuickReply };
