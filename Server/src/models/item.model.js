const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  title: String,
  pmcid: String,
  pmid: String,
  doi: String,

  results: [String],
  conclusions: [String],
  abstract: [String],

  source: String,
  title_pubmed: String,
  journal: String,
  year: String,

  authors: [String],
  keywords: [String],
  mesh_terms: [String],
  topics: [String],

  link: String,

  citations: {
    type: Object,
    default: {}
  },

  formatted_citations: {
    type: Object,
    default: {}
  }
});


module.exports = mongoose.model('item', itemSchema); 

