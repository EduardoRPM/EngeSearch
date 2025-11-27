const mongoose = require('mongoose');

const userSavedArticleSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    article_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'item',
      required: true
    }
  },
  {
    timestamps: true,
    collection: 'user_saved_articles'
  }
);

userSavedArticleSchema.index(
  { user_id: 1, article_id: 1 },
  { unique: true }
);

module.exports = mongoose.model('user_saved_article', userSavedArticleSchema);
