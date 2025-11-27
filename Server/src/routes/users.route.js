const { Router } = require("express");
const { getAllUsers, getUserById, updateUserRole, getProfile, deleteUser } = require("../controllers/users.controller");
const { verifyJWT } = require("../../middlewares/verifyJWT");

const router = Router();

// Lista todos los usuarios
router.get("/", getAllUsers);

// Perfil del usuario autenticado (debe ir antes de la ruta paramétrica)
router.get("/me", [verifyJWT], getProfile);

// Detalle de un usuario
router.get("/:id", getUserById);

// Actualizar rol de usuario
router.put("/:id/role", updateUserRole);

// Eliminar usuario
router.delete("/:id", deleteUser);

module.exports = router;
