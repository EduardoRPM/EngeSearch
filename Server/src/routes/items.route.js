const { Router } = require("express");
const { getAllItems, getItemById, createItem, deleteItem, updateItem, searchItems } = require("../controllers/items.controller");
const { verifyJWT } = require("../../middlewares/verifyJWT");
const router = Router();


router.get("/", [verifyJWT], getAllItems);
router.get("/:id", [verifyJWT], getItemById);
router.post("/", [verifyJWT], createItem);
router.post("/search", [verifyJWT], searchItems);
router.delete("/:id", [verifyJWT], deleteItem);
router.put("/:id", [verifyJWT], updateItem);

module.exports = router;
