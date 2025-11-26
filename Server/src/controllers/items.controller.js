const { request, response } = require("express");
const item = require("../models/item.model");  



const getAllItems =  async (req = request, res = response) => {

    const { search } = req.query;
    console.log(search);

    
    try {
        const result = await item.find({ title: RegExp(search) }); 
        res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            msg: "Error retrieving items"
        });
    }
}

const getItemById = async (req = request, res = response) => {
    const { id } = req.params;

    try {
        const result = await item.findOne({ _id: id }); 

        if (!result) {
            return  res.status(404).json({
                msg: "Item not found"
            });
        }

        res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            msg: "Error retrieving item by ID"
        });
    }
}

const createItem = async(req = request, res = response) => {

    const {
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
            formatted_citations
            } = req.body;

    //console.log(req.body);

    if (!title || !image || !description || !url) {
        return res.status(400).json({
            msg: "Faltan datos obligatorios"
        });
    }
    try {
        const newItem = new item({ title, pmcid, pmid, doi, results, conclusions, abstract, source, title_pubmed, journal, year, authors, keywords, mesh_terms, topics, link, citations, formatted_citations });
        await newItem.save();
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
}

const deleteItem = async(req = request, res = response) => {

    console.log(req);
    const { id } = req.params;
    try {
        const result =  await item.deleteOne({ _id: id }); 
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
        console.log(error);
        res.status(500).json({
            msg: "Error deleting item"
        });
    }
}

const updateItem = async (req = request, res = response) => {
    const { id } = req.params;
    const { title, pmcid, pmid, doi, results, conclusions, abstract, source, title_pubmed, journal, year, authors, keywords, mesh_terms, topics, link, citations, formatted_citations } = req.body;

    if (!title || !pmcid || !pmid || !doi || !results || !conclusions || !abstract || !source || !title_pubmed || !journal || !year || !authors || !keywords || !mesh_terms || !topics || !link) {
        return res.status(400).json({
            msg: "Faltan datos obligatorios"
        });
    }

    try {
        const updatedItem = await item.findByIdAndUpdate(
            id,
            { title, pmcid, pmid, doi, results, conclusions, abstract, source, title_pubmed, journal, year, authors, keywords, mesh_terms, topics, link, citations, formatted_citations },
            { new: true, runValidators: true }
        );

        if (!updatedItem) {
            return res.status(404).json({
                msg: "Item not found"
            });
        }

        res.status(200).json({
            msg: "Item updated",
            item: updatedItem
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            msg: "Error updating item"
        });
    }
}



module.exports = {
    getAllItems,
    getItemById,
    createItem,
    updateItem,
    deleteItem
}
