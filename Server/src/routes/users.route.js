const { Router } = require("express");
const { getAllUsers, getUserById, updateUserRole, getProfile, deleteUser } = require("../controllers/users.controller");
const { verifyJWT } = require("../../middlewares/verifyJWT");

const router = Router();

// Lista todos los usuarios
router.get("/", getAllUsers);

// Detalle de un usuario
router.get("/:id", getUserById);

// Actualizar rol de usuario
router.put("/:id/role", updateUserRole);

// Eliminar usuario
router.delete("/:id", deleteUser);

// Perfil del usuario autenticado
router.get("/me", [verifyJWT], getProfile);

module.exports = router;
