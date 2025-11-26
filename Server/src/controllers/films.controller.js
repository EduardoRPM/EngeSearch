const { request, response } = require("express");
const film = require("../models/film.model");  



const getAllFilms =  async (req = request, res = response) => {

    const { search } = req.query;
    console.log(search);

    
    try {
        const result = await film.find({ title: RegExp(search) }); 
        res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            msg: "Error retrieving films"
        });
    }
}

const getFilmById = async (req = request, res = response) => {
    const { id } = req.params;

    try {
        const result = await film.findOne({ _id: id }); 

        if (!result) {
            return  res.status(404).json({
                msg: "Film not found"
            });
        }

        res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            msg: "Error retrieving film by ID"
        });
    }
}

const createFilm = async(req = request, res = response) => {

    const {title, image, description, url } = req.body;
    //console.log(req.body);

    if (!title || !image || !description || !url) {
        return res.status(400).json({
            msg: "Faltan datos obligatorios"
        });
    }
    try {
        const newFilm = new film({ title, image, description, url });
        await newFilm.save();
        res.status(201).json({
            msg: "Film created",
            film: newFilm
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            msg: "Error creating film"
        });
    }  
}

const deleteFilm = async(req = request, res = response) => {

    console.log(req);
    const { id } = req.params;
    try {
        const result =  await film. deleteOne({ _id: id }); 
        if (result.deletedCount === 1) {
            res.status(200).json({
                msg: "Film deleted"
            });
        } else {
            res.status(404).json({
                msg: "Film not found"
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({
            msg: "Error deleting film"
        });
    }
}

const updateFilm = async (req = request, res = response) => {
    const { id } = req.params;
    const { title, image, description, url } = req.body;

    if (!title || !image || !description || !url) {
        return res.status(400).json({
            msg: "Faltan datos obligatorios"
        });
    }

    try {
        const updatedFilm = await film.findByIdAndUpdate(
            id,
            { title, image, description, url },
            { new: true, runValidators: true }
        );

        if (!updatedFilm) {
            return res.status(404).json({
                msg: "Film not found"
            });
        }

        res.status(200).json({
            msg: "Film updated",
            film: updatedFilm
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            msg: "Error updating film"
        });
    }
}



module.exports = {
    getAllFilms,
    getFilmById,
    createFilm,
    updateFilm,
    deleteFilm
}
