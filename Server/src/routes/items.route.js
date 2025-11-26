const { Router } = require("express");
const { getAllItems, getItemById, createItem, deleteItem, updateItem, searchItems } = require("../controllers/items.controller");
const router = Router();

router.get("/", getAllItems);
router.get("/:id", getItemById);
router.post("/", createItem);
router.post("/search", searchItems);
router.delete("/:id",deleteItem);
router.put("/:id", updateItem);

module.exports = router;
