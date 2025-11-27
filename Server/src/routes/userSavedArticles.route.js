const { Router } = require('express');
const {
  getSavedArticles,
  getSavedArticleById,
  createSavedArticle,
  updateSavedArticle,
  deleteSavedArticle
} = require('../controllers/userSavedArticles.controller');
const { verifyJWT } = require('../../middlewares/verifyJWT');

const router = Router();

router.get('/', [verifyJWT], getSavedArticles);
router.get('/:id', [verifyJWT], getSavedArticleById);
router.post('/', [verifyJWT], createSavedArticle);
router.put('/:id', [verifyJWT], updateSavedArticle);
router.delete('/:id', [verifyJWT], deleteSavedArticle);

module.exports = router;
