const { randomUUID } = require("crypto");
const { request, response } = require("express");
const item = require("../models/item.model");

// Small helper to log controller activity for incoming requests
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

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 40;
const PUBLIC_PREVIEW_LIMIT = 3;

const getAllItems = async (req = request, res = response) => {
    logRequest(req, 'getAllItems');
    const { search, status } = req.query;

    try {
        const filters = buildSearchFilters(search);
        const query = { ...filters };
        const statuses = parseStatusFilter(status);

        if (statuses.length === 1) {
            query.status = statuses[0];
        } else if (statuses.length > 1) {
            query.status = { $in: statuses };
        }

        const result = await item.find(query).lean();
        console.log(`[getAllItems] returned ${Array.isArray(result) ? result.length : 0} items`);
        res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            msg: "Error retrieving items"
        });
    }
};

const getItemById = async (req = request, res = response) => {
    const { id } = req.params;

    logRequest(req, 'getItemById');

    try {
        const result = await item.findOne({ _id: id });

        if (!result) {
            return res.status(404).json({
                msg: "Item not found"
            });
        }

        console.log(`[getItemById] found=${!!result} id=${id}`);
        res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            msg: "Error retrieving item by ID"
        });
    }
};

const createItem = async (req = request, res = response) => {
    const {
        title,
        pmcid,
        pmid,
        doi,
        status = 'En revision',
        results,
        conclusions,
        abstract,
        source,
        title_pubmed,
        journal,
        year,
        authors,
        keywords,
        mesh_terms,
        topics,
        link,
        citations,
        formatted_citations,
        feedback
    } = req.body;

    logRequest(req, 'createItem');

    if (!title) {
        return res.status(400).json({
            msg: "Title is required"
        });
    }

    try {
        const newItem = new item({
            title,
            pmcid,
            pmid,
            doi,
            results,
            conclusions,
            abstract,
            source,
            title_pubmed,
            journal,
            year,
            authors,
            keywords,
            mesh_terms,
            topics,
            link,
            citations,
            formatted_citations,
            status,
            feedback,
            createdBy: req.user?.id || null
        });
        await newItem.save();
        console.log(`[createItem] created id=${newItem._id}`);
        res.status(201).json({
            msg: "item created",
            item: newItem
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            msg: "Error creating item"
        });
    }
};

const deleteItem = async (req = request, res = response) => {
    const { id } = req.params;
    logRequest(req, 'deleteItem');
    try {
        const result = await item.deleteOne({ _id: id });
        if (result.deletedCount === 1) {
            res.status(200).json({
                msg: "Item deleted"
            });
        } else {
            res.status(404).json({
                msg: "Item not found"
            });
        }
    } catch (error) {
        console.log('[deleteItem] Error', error && error.stack ? error.stack : error);
        res.status(500).json({
            msg: "Error deleting item"
        });
    }
};

const updateItem = async (req = request, res = response) => {
    const { id } = req.params;
    logRequest(req, 'updateItem');

    const allowedFields = [
        "title",
        "pmcid",
        "pmid",
        "doi",
        "results",
        "conclusions",
        "abstract",
        "source",
        "title_pubmed",
        "journal",
        "year",
        "authors",
        "keywords",
        "mesh_terms",
        "topics",
        "link",
        "citations",
        "formatted_citations",
        "status",
        "feedback"
    ];

    const payload = req.body || {};
    const updateFields = {};

    allowedFields.forEach((field) => {
        if (typeof payload[field] !== "undefined") {
            updateFields[field] = payload[field];
        }
    });

    if (Object.keys(updateFields).length === 0) {
        return res.status(400).json({
            msg: "Provide at least one field to update"
        });
    }

    try {
        const updatedItem = await item.findByIdAndUpdate(
            id,
            updateFields,
            { new: true, runValidators: true }
        );

        if (!updatedItem) {
            return res.status(404).json({
                msg: "Item not found"
            });
        }

        console.log(`[updateItem] updated id=${id}`);
        res.status(200).json({
            msg: "Item updated",
            item: updatedItem
        });
    } catch (error) {
        console.log('[updateItem] Error', error && error.stack ? error.stack : error);
        res.status(500).json({
            msg: "Error updating item"
        });
    }
};

const searchItems = async (req = request, res = response) => {
    const payload = req.body || {};
    logRequest(req, 'searchItems');
    const { terms } = buildSearchTerms(payload);
    const limit = parseLimit(payload.limit);

    if (terms.length === 0) {
        return res.status(400).json({
            msg: "Provide at least one keyword or text term to search"
        });
    }

    try {
        const results = await runScoredSearch(terms);
        const limited = results.slice(0, limit);
        console.log(`[searchItems] returning ${limited.length} results (limit=${limit})`);
        res.status(200).json(limited);
    } catch (error) {
        console.log('[searchItems] Error', error && error.stack ? error.stack : error);
        res.status(500).json({
            msg: "Error searching items"
        });
    }
};

const searchItemsPreview = async (req = request, res = response) => {
    const payload = req.body || {};
    logRequest(req, 'searchItemsPreview');
    const { terms } = buildSearchTerms(payload);

    if (terms.length === 0) {
        return res.status(400).json({
            msg: "Provide at least one keyword or text term to search"
        });
    }

    try {
        const results = await runScoredSearch(terms);
        const preview = results.slice(0, PUBLIC_PREVIEW_LIMIT);
        const lockedCount = Math.max(results.length - preview.length, 0);
        console.log(`[searchItemsPreview] returning ${preview.length} preview results (locked=${lockedCount})`);
        res.status(200).json({
            results: preview,
            totalMatches: results.length,
            lockedCount,
            previewLimit: PUBLIC_PREVIEW_LIMIT
        });
    } catch (error) {
        console.log('[searchItemsPreview] Error', error && error.stack ? error.stack : error);
        res.status(500).json({
            msg: "Error searching items (preview)"
        });
    }
};

const buildSearchFilters = (search) => {
    if (!search || typeof search !== "string") {
        return {};
    }
    const trimmed = search.trim();
    if (!trimmed) {
        return {};
    }
    return {
        title: {
            $regex: escapeRegex(trimmed),
            $options: "i"
        }
    };
};

const parseStatusFilter = (status) => {
    if (!status) {
        return [];
    }

    const validStatuses = ["En edicion", "En revision", "Aceptado", "Rechazado"];
    const normalize = (value) => String(value).trim();

    const values = Array.isArray(status)
        ? status.map(normalize)
        : String(status)
            .split(",")
            .map(normalize);

    return values.filter((value) => validStatuses.includes(value));
};

const escapeRegex = (value) => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const parseLimit = (limit) => {
    const parsed = Number.parseInt(limit, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
        return DEFAULT_LIMIT;
    }
    return Math.min(parsed, MAX_LIMIT);
};

const tokenizeArray = (values = []) => {
    return values
        .flatMap((value) => String(value).split(/[\s,;\n]+/))
        .map((token) => token.trim().toLowerCase())
        .filter((token) => token.length > 1);
};

const tokenizeText = (text = "") => {
    if (!text) {
        return [];
    }
    return tokenizeArray([text]);
};

const buildSearchTerms = (payload = {}) => {
    const keywords = Array.isArray(payload.keywords) ? payload.keywords : [];
    const text = typeof payload.text === "string" ? payload.text : "";
    const keywordTokens = tokenizeArray(keywords);
    const textTokens = tokenizeText(text);
    const terms = Array.from(new Set([...keywordTokens, ...textTokens]));
    return { terms };
};

const runScoredSearch = async (terms = []) => {
    const articles = await item.find({}).lean();
    return articles
        .map((article) => {
            const haystack = collectKeywords(article);
            const matchCount = terms.reduce((count, term) => {
                return haystack.some((field) => field.includes(term)) ? count + 1 : count;
            }, 0);
            return { article, matchCount };
        })
        .filter(({ matchCount }) => matchCount > 0)
        .sort((a, b) => b.matchCount - a.matchCount)
        .map(({ article, matchCount }) => toResult(article, matchCount));
};

const safeArray = (value) => {
    if (Array.isArray(value)) {
        return value.filter((item) => typeof item === "string");
    }
    return [];
};

const collectKeywords = (article) => {
    const keywords = new Set();

    safeArray(article.keywords).forEach((kw) => keywords.add(kw.toLowerCase()));
    safeArray(article.mesh_terms).forEach((kw) => keywords.add(kw.toLowerCase()));
    safeArray(article.topics).forEach((kw) => keywords.add(kw.toLowerCase()));

    if (article.title) keywords.add(String(article.title).toLowerCase());
    if (article.title_pubmed) keywords.add(String(article.title_pubmed).toLowerCase());

    safeArray(article.abstract).forEach((section) => keywords.add(section.toLowerCase()));
    safeArray(article.results).forEach((section) => keywords.add(section.toLowerCase()));

    return Array.from(keywords);
};

const createSnippet = (article) => {
    const sections = [...safeArray(article.abstract), ...safeArray(article.results)];
    const text = sections.find((section) => section && section.trim().length > 0);
    if (!text) {
        return null;
    }
    return text.length > 320 ? `${text.slice(0, 317)}…` : text;
};

const toResult = (article, score) => {
    const authors = safeArray(article.authors);
    const keywords = safeArray(article.keywords).slice(0, 8);
    const id =
        (article && article._id && String(article._id)) ||
        article.pmid ||
        article.pmcid ||
        article.doi ||
        article.title ||
        article.title_pubmed ||
        randomUUID();

    return {
        id,
        title: article.title || article.title_pubmed || "Título desconocido",
        year: article.year,
        authors,
        link: typeof article.link === "string" ? article.link : null,
        abstractSnippet: createSnippet(article),
        keywords,
        score
    };
};

module.exports = {
    getAllItems,
    getItemById,
    createItem,
    updateItem,
    deleteItem,
    searchItems,
    searchItemsPreview
};
