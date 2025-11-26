const { Router } = require("express");
const { getAllFilms, getFilmById, createFilm, deleteFilm, updateFilm } = require("../controllers/films.controller");
const router = Router();

router.get("/", getAllFilms);
router.get("/:id", getFilmById);
router.post("/", createFilm);
router.delete("/:id",deleteFilm);
router.put("/:id", updateFilm);

module.exports = router;
