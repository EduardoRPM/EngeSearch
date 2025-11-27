const { Router } = require("express");
const { getAllUsers, getUserById, updateUserRole } = require("../controllers/users.controller");

const router = Router();

// Lista todos los usuarios
router.get("/", getAllUsers);

// Detalle de un usuario
router.get("/:id", getUserById);

// Actualizar rol de usuario
router.put("/:id/role", updateUserRole);

module.exports = router;
