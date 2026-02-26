'use strict';

const { Router } = require('express');
const {
  listConversations,
  getConversation,
  updateLeadStatus,
  markContacted,
  sendReply,
} = require('../controllers/conversation.controller');

const router = Router();

router.get('/',                    listConversations);
router.get('/:id',                 getConversation);
router.patch('/:id/status',        updateLeadStatus);
router.patch('/:id/contacted',     markContacted);
router.post('/:id/reply',          sendReply);

module.exports = router;
