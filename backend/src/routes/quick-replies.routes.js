'use strict';

const router = require('express').Router();
const {
  listQuickReplies,
  createQuickReply,
  updateQuickReply,
  deleteQuickReply,
} = require('../controllers/quick-replies.controller');

// GET    /api/quick-replies
// POST   /api/quick-replies
// PUT    /api/quick-replies/:id
// DELETE /api/quick-replies/:id
router.get   ('/',    listQuickReplies);
router.post  ('/',    createQuickReply);
router.put   ('/:id', updateQuickReply);
router.delete('/:id', deleteQuickReply);

module.exports = router;
