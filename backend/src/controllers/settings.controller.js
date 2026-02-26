'use strict';

const BusinessModel  = require('../models/business.model');
const ServiceModel   = require('../models/service.model');
const FAQModel       = require('../models/faq.model');
const KeywordModel   = require('../models/keyword.model');
const { send, fail } = require('../utils/response.util');

// ─── Business ─────────────────────────────────────────────────────────────────

async function getBusiness(req, res, next) {
  try {
    const biz = await BusinessModel.findById(req.user.business_id);
    if (!biz) return fail(res, 'Business not found', 404);
    return send(res, { business: biz });
  } catch (err) { next(err); }
}

async function updateBusiness(req, res, next) {
  try {
    const { name, address, phone, website, category, tone, working_hours } = req.body;
    const updated = await BusinessModel.update(req.user.business_id, {
      name, address, phone, website, category, tone, working_hours,
    });
    if (!updated) return fail(res, 'Business not found', 404);
    return send(res, { business: updated }, 'Business settings updated');
  } catch (err) { next(err); }
}

// ─── Services ─────────────────────────────────────────────────────────────────

async function listServices(req, res, next) {
  try {
    const services = await ServiceModel.findAll(req.user.business_id);
    return send(res, { services });
  } catch (err) { next(err); }
}

async function createService(req, res, next) {
  try {
    const { name, price, description, duration } = req.body;
    if (!name) return fail(res, 'Service name is required', 400);

    const service = await ServiceModel.create(req.user.business_id, { name, price, description, duration });
    return send(res, { service }, 'Service created', 201);
  } catch (err) { next(err); }
}

async function updateService(req, res, next) {
  try {
    const { id }                                        = req.params;
    const { name, price, description, duration, is_active } = req.body;

    const updated = await ServiceModel.update(
      parseInt(id, 10),
      req.user.business_id,
      { name, price, description, duration, is_active }
    );
    if (!updated) return fail(res, 'Service not found', 404);
    return send(res, { service: updated }, 'Service updated');
  } catch (err) { next(err); }
}

async function deleteService(req, res, next) {
  try {
    const deleted = await ServiceModel.delete(parseInt(req.params.id, 10), req.user.business_id);
    if (!deleted) return fail(res, 'Service not found', 404);
    return send(res, { id: deleted.id }, 'Service deleted');
  } catch (err) { next(err); }
}

// ─── FAQs ─────────────────────────────────────────────────────────────────────

async function listFAQs(req, res, next) {
  try {
    const faqs = await FAQModel.findAll(req.user.business_id);
    return send(res, { faqs });
  } catch (err) { next(err); }
}

async function createFAQ(req, res, next) {
  try {
    const { question, answer } = req.body;
    if (!question || !answer) return fail(res, 'Question and answer are required', 400);

    const faq = await FAQModel.create(req.user.business_id, { question, answer });
    return send(res, { faq }, 'FAQ created', 201);
  } catch (err) { next(err); }
}

async function updateFAQ(req, res, next) {
  try {
    const { id }              = req.params;
    const { question, answer } = req.body;

    const updated = await FAQModel.update(parseInt(id, 10), req.user.business_id, { question, answer });
    if (!updated) return fail(res, 'FAQ not found', 404);
    return send(res, { faq: updated }, 'FAQ updated');
  } catch (err) { next(err); }
}

async function deleteFAQ(req, res, next) {
  try {
    const deleted = await FAQModel.delete(parseInt(req.params.id, 10), req.user.business_id);
    if (!deleted) return fail(res, 'FAQ not found', 404);
    return send(res, { id: deleted.id }, 'FAQ deleted');
  } catch (err) { next(err); }
}

// ─── Lead Keywords ────────────────────────────────────────────────────────────

async function listKeywords(req, res, next) {
  try {
    const keywords = await KeywordModel.findAll(req.user.business_id);
    return send(res, { keywords });
  } catch (err) { next(err); }
}

async function createKeyword(req, res, next) {
  try {
    const { keyword } = req.body;
    if (!keyword || !keyword.trim()) return fail(res, 'Keyword is required', 400);

    const created = await KeywordModel.create(req.user.business_id, keyword);
    if (!created) return fail(res, 'Keyword already exists', 409);
    return send(res, { keyword: created }, 'Keyword added', 201);
  } catch (err) { next(err); }
}

async function deleteKeyword(req, res, next) {
  try {
    const deleted = await KeywordModel.delete(parseInt(req.params.id, 10), req.user.business_id);
    if (!deleted) return fail(res, 'Keyword not found', 404);
    return send(res, { id: deleted.id }, 'Keyword deleted');
  } catch (err) { next(err); }
}

// ─── WhatsApp Connection ───────────────────────────────────────────────────────

const { pool } = require('../config/db');

async function getWhatsApp(req, res, next) {
  try {
    const biz = await BusinessModel.findById(req.user.business_id);
    if (!biz) return fail(res, 'Business not found', 404);
    return send(res, {
      whatsapp: {
        phone_number_id: biz.whatsapp_phone_number_id || '',
        token_set:       !!(biz.whatsapp_token),          // never expose the raw token
        connected:       !!(biz.whatsapp_phone_number_id && biz.whatsapp_token),
      },
    });
  } catch (err) { next(err); }
}

async function updateWhatsApp(req, res, next) {
  try {
    const { phone_number_id, token } = req.body;
    if (!phone_number_id || !token)
      return fail(res, 'phone_number_id and token are required', 400);

    await pool.query(
      `UPDATE businesses
          SET whatsapp_phone_number_id = ?,
              whatsapp_token           = ?
        WHERE id = ?`,
      [phone_number_id.trim(), token.trim(), req.user.business_id]
    );
    return send(res, { connected: true }, 'WhatsApp connected successfully');
  } catch (err) { next(err); }
}

async function disconnectWhatsApp(req, res, next) {
  try {
    await pool.query(
      `UPDATE businesses
          SET whatsapp_phone_number_id = NULL,
              whatsapp_token           = NULL
        WHERE id = ?`,
      [req.user.business_id]
    );
    return send(res, { connected: false }, 'WhatsApp disconnected');
  } catch (err) { next(err); }
}

module.exports = {
  getBusiness,    updateBusiness,
  listServices,   createService,  updateService,  deleteService,
  listFAQs,       createFAQ,      updateFAQ,      deleteFAQ,
  listKeywords,   createKeyword,  deleteKeyword,
  getWhatsApp,    updateWhatsApp, disconnectWhatsApp,
};
