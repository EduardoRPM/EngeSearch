const { request, response } = require('express');
const mongoose = require('mongoose');
const UserSavedArticle = require('../models/userSavedArticle.model');

const logRequest = (req, label) => {
  try {
    const now = new Date().toISOString();
    const params = JSON.stringify(req.params || {});
    const query = JSON.stringify(req.query || {});
    const body = JSON.stringify(req.body || {});
    console.log(`[Controller] ${now} ${label} ${req.method} ${req.originalUrl} params=${params} query=${query} body=${body}`);
  } catch (err) {
    console.log('[Controller] Error logging request', err && err.stack ? err.stack : err);
  }
};

const sanitizeObjectId = (value) => {
  if (!value) return null;
  return mongoose.Types.ObjectId.isValid(value) ? value : null;
};

const getSavedArticles = async (req = request, res = response) => {
  logRequest(req, 'getSavedArticles');
  const filters = {};
  const userId = sanitizeObjectId(req.query.user_id);
  const articleId = sanitizeObjectId(req.query.article_id);

  if (userId) {
    filters.user_id = userId;
  }

  if (articleId) {
    filters.article_id = articleId;
  }

  try {
    const records = await UserSavedArticle.find(filters).lean();
    res.status(200).json(records);
  } catch (error) {
    console.log('[getSavedArticles] Error', error && error.stack ? error.stack : error);
    res.status(500).json({
      msg: 'Error retrieving saved articles'
    });
  }
};

const getSavedArticleById = async (req = request, res = response) => {
  logRequest(req, 'getSavedArticleById');
  const { id } = req.params;

  try {
    const record = await UserSavedArticle.findById(id);

    if (!record) {
      return res.status(404).json({
        msg: 'Saved article not found'
      });
    }

    res.status(200).json(record);
  } catch (error) {
    console.log('[getSavedArticleById] Error', error && error.stack ? error.stack : error);
    res.status(500).json({
      msg: 'Error retrieving saved article'
    });
  }
};

const createSavedArticle = async (req = request, res = response) => {
  logRequest(req, 'createSavedArticle');
  const { user_id, article_id } = req.body || {};

  if (!sanitizeObjectId(user_id) || !sanitizeObjectId(article_id)) {
    return res.status(400).json({
      msg: 'user_id and article_id are required and must be valid IDs'
    });
  }

  try {
    const savedArticle = new UserSavedArticle({ user_id, article_id });
    await savedArticle.save();
    res.status(201).json({
      msg: 'Saved article created',
      savedArticle
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({
        msg: 'Article already saved for this user'
      });
    }
    console.log('[createSavedArticle] Error', error && error.stack ? error.stack : error);
    res.status(500).json({
      msg: 'Error creating saved article'
    });
  }
};

const updateSavedArticle = async (req = request, res = response) => {
  logRequest(req, 'updateSavedArticle');
  const { id } = req.params;
  const payload = req.body || {};
  const updateFields = {};

  if (sanitizeObjectId(payload.user_id)) {
    updateFields.user_id = payload.user_id;
  }

  if (sanitizeObjectId(payload.article_id)) {
    updateFields.article_id = payload.article_id;
  }

  if (Object.keys(updateFields).length === 0) {
    return res.status(400).json({
      msg: 'Provide user_id or article_id to update'
    });
  }

  try {
    const updated = await UserSavedArticle.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({
        msg: 'Saved article not found'
      });
    }

    res.status(200).json({
      msg: 'Saved article updated',
      savedArticle: updated
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({
        msg: 'Article already saved for this user'
      });
    }
    console.log('[updateSavedArticle] Error', error && error.stack ? error.stack : error);
    res.status(500).json({
      msg: 'Error updating saved article'
    });
  }
};

const deleteSavedArticle = async (req = request, res = response) => {
  logRequest(req, 'deleteSavedArticle');
  const { id } = req.params;

  try {
    const deleted = await UserSavedArticle.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        msg: 'Saved article not found'
      });
    }

    res.status(200).json({
      msg: 'Saved article removed'
    });
  } catch (error) {
    console.log('[deleteSavedArticle] Error', error && error.stack ? error.stack : error);
    res.status(500).json({
      msg: 'Error deleting saved article'
    });
  }
};

module.exports = {
  getSavedArticles,
  getSavedArticleById,
  createSavedArticle,
  updateSavedArticle,
  deleteSavedArticle
};
